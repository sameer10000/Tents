import { v2 as cloudinary } from 'cloudinary'
import { CLOUDINARY, CLOUDINARY_FOLDER } from './config.js'

cloudinary.config({ ...CLOUDINARY, secure: true })

export { cloudinary }

/**
 * Delivery URL for a stored asset.
 *
 * `f_auto,q_auto` is applied at delivery rather than baked into the stored
 * file: Cloudinary then serves AVIF or WebP to browsers that accept them and
 * the original elsewhere, from one upload. Product photography on a storefront
 * is the case this exists for.
 */
export function deliveryUrl(publicId, format) {
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
    format,
  })
}

/**
 * Uploads a buffer and resolves to its delivery URL.
 *
 * upload_stream is the only Cloudinary entry point that takes a buffer, and it
 * is callback-based, hence the wrapper.
 */
export function uploadBuffer(
  buffer,
  { folder = CLOUDINARY_FOLDER, publicId, overwrite = false } = {},
) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        // Uploads from the admin get a random name and must never collide.
        // The migration passes a deterministic id and overwrite, so re-running
        // it lands on the same asset instead of duplicating the library.
        overwrite,
        unique_filename: !publicId,
      },
      (error, result) => {
        if (error) return reject(error)
        if (!result) return reject(new Error('Cloudinary returned no result.'))

        resolve({
          url: deliveryUrl(result.public_id, result.format),
          publicId: result.public_id,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
        })
      },
    )

    stream.end(buffer)
  })
}

/**
 * Deletes an asset. Reports whether it was actually there.
 *
 * The two outcomes are kept apart deliberately: collapsing "not found" into
 * success makes a mistyped public id look like a completed deletion, which
 * hides the mistake at exactly the moment it matters.
 */
export async function destroyAsset(publicId) {
  const { result } = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
  return result === 'ok'
}
