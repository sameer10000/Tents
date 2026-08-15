import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../auth.js'
import { MAX_UPLOAD_BYTES } from '../config.js'
import { destroyAsset, uploadBuffer } from '../cloudinary.js'
import { HttpError } from '../validate.js'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

/**
 * Memory, not disk.
 *
 * Files are forwarded straight to Cloudinary, so writing them to the server's
 * filesystem first would only create something to clean up. Bounded by the
 * multer limits below: 8 files at 8 MB is 64 MB worst case per request, which
 * is why the upload route is behind requireAuth.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new HttpError(415, 'Images must be JPEG, PNG, WebP or AVIF.'))
      return
    }
    cb(null, true)
  },
})

export const uploadsRouter = Router()

uploadsRouter.post(
  '/uploads',
  requireAuth,
  upload.array('images', 8),
  async (req, res) => {
    const files = req.files ?? []
    if (files.length === 0) throw new HttpError(400, 'No images were received.')

    // Sequential, not Promise.all: parallel uploads of eight 8 MB buffers put
    // the whole batch in flight at once for no useful gain here.
    const urls = []
    for (const file of files) {
      const { url } = await uploadBuffer(file.buffer)
      urls.push(url)
    }

    // Same response shape as the local-disk version, so ImageUploader.tsx is
    // unchanged — only the URLs it stores are different.
    res.status(201).json({ urls })
  },
)

/**
 * Removes an asset from Cloudinary.
 *
 * Note that the admin UI does not call this: removing an image there drops the
 * URL from the product and leaves the asset in place. That is deliberate —
 * an undo should not have to re-upload — but it does mean orphans accumulate,
 * and this endpoint is how one is cleared deliberately.
 *
 * The id is a path, e.g. canvas-emporium/abc123, so it arrives as a wildcard
 * segment rather than a single parameter.
 */
uploadsRouter.delete('/uploads/*publicId', requireAuth, async (req, res) => {
  const publicId = Array.isArray(req.params.publicId)
    ? req.params.publicId.join('/')
    : String(req.params.publicId ?? '')

  // Cloudinary public ids are folder-ish; anything else is not one of ours.
  if (!publicId || !/^[\w./-]+$/.test(publicId) || publicId.includes('..')) {
    throw new HttpError(400, 'Bad asset id.')
  }

  // A public id is the path without the version prefix or file extension, e.g.
  // canvas-emporium/legacy/abc123 — not the tail of a delivery URL, which also
  // carries /v1/ and a query string.
  if (!(await destroyAsset(publicId))) {
    throw new HttpError(404, `No asset stored as "${publicId}".`)
  }

  res.json({ ok: true })
})
