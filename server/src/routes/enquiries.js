import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { rowToEnquiry, sql } from '../db.js'
import { requireAuth } from '../auth.js'
import { checkSubmissionLimit } from '../rate-limit.js'
import { HttpError, bad, str, strList } from '../validate.js'

export const enquiriesRouter = Router()

const KINDS = new Set(['contact', 'product'])
const STATUSES = ['new', 'pending', 'talked', 'closed']
const STATUS_SET = new Set(STATUSES)

const EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/

/**
 * Human-quotable reference, e.g. CE-7K2P9M.
 *
 * Crockford's alphabet, so a customer reading it back over the phone cannot
 * confuse O with 0 or I with 1. Issued here rather than on the client, which
 * used to invent one that corresponded to nothing.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

async function freshReference() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const body = Array.from(randomBytes(6))
      .map((byte) => ALPHABET[byte % ALPHABET.length])
      .join('')
    const id = `CE-${body}`

    const [taken] = await sql`SELECT 1 FROM enquiries WHERE id = ${id}`
    if (!taken) return id
  }
  throw new HttpError(500, 'Could not allocate a reference.')
}

/* ── Public ────────────────────────────────────────────────────────────── */

enquiriesRouter.post('/enquiries', async (req, res) => {
  const retryAfter = checkSubmissionLimit(String(req.ip))
  if (retryAfter !== null) {
    res.setHeader('Retry-After', String(retryAfter))
    throw new HttpError(429, 'That is a lot of enquiries. Please try again later.')
  }

  // Honeypot: a field hidden from people and irresistible to bots. Answered
  // with the same 201 a real submission gets, so a crawler learns nothing.
  if (str(req.body?.website, 'Website', { max: 200 })) {
    return res.status(201).json({ reference: `CE-${'0'.repeat(6)}` })
  }

  const kind = str(req.body?.kind, 'Kind', { max: 20 }) ?? 'contact'
  if (!KINDS.has(kind)) throw bad('Unknown enquiry type.')

  const email = str(req.body?.email, 'Email', { required: true, max: 160 })
  if (!EMAIL.test(email)) throw bad('That email address looks wrong.')

  const enquiry = {
    id: await freshReference(),
    kind,
    name: str(req.body?.name, 'Name', { required: true, max: 120 }),
    email,
    phone: str(req.body?.phone, 'Phone', { max: 40 }) ?? '',
    organisation: str(req.body?.organisation, 'Organisation', { max: 160 }) ?? '',
    role: str(req.body?.role, 'Role', { max: 120 }) ?? '',
    city: str(req.body?.city, 'Location', { max: 120 }) ?? '',
    units: str(req.body?.units, 'Units required', { max: 60 }) ?? '',
    timeline: str(req.body?.timeline, 'Timeline', { max: 60 }) ?? '',
    message: str(req.body?.message, 'Message', { max: 4000 }) ?? '',
    interest: sql.json(strList(req.body?.interest, 'Interest', { max: 20 })),
    subject_sku: str(req.body?.subjectSku, 'Piece', { max: 16 }),
    saved_skus: sql.json(strList(req.body?.savedSkus, 'Saved pieces', { max: 60 })),
  }

  const [row] = await sql`INSERT INTO enquiries ${sql(enquiry)} RETURNING *`

  // No mail is sent — the admin inbox is the delivery mechanism. Logged so a
  // tail of the server output shows enquiries arriving live.
  console.info(
    `[Canvas Emporium] ${row.kind} enquiry ${row.id} from ${row.name} <${row.email}>`,
  )

  // Only the reference goes back. The stored record is not public.
  res.status(201).json({ reference: row.id })
})

/* ── Admin ─────────────────────────────────────────────────────────────── */

enquiriesRouter.get('/enquiries', requireAuth, async (req, res) => {
  const status = STATUS_SET.has(String(req.query.status)) ? String(req.query.status) : null

  const [rows, counts] = await Promise.all([
    sql`
      SELECT * FROM enquiries
       WHERE (${status}::text IS NULL OR status = ${status})
       ORDER BY created_at DESC
       LIMIT 500
    `,
    sql`SELECT status, COUNT(*)::int AS n FROM enquiries GROUP BY status`,
  ])

  const byStatus = new Map(counts.map((row) => [row.status, row.n]))

  res.json({
    enquiries: rows.map(rowToEnquiry),
    counts: Object.fromEntries(STATUSES.map((value) => [value, byStatus.get(value) ?? 0])),
    total: counts.reduce((sum, row) => sum + row.n, 0),
  })
})

enquiriesRouter.patch('/enquiries/:id/status', requireAuth, async (req, res) => {
  const [row] = await sql`SELECT * FROM enquiries WHERE id = ${req.params.id}`
  if (!row) throw new HttpError(404, 'That enquiry could not be found.')

  const status = str(req.body?.status, 'Status', { required: true, max: 20 })
  if (!STATUS_SET.has(status)) throw bad(`Status must be one of ${STATUSES.join(', ')}.`)

  const notes = str(req.body?.notes, 'Notes', { max: 2000 }) ?? row.notes

  const [next] = await sql`
    UPDATE enquiries
       SET status = ${status}, notes = ${notes}, updated_at = now()
     WHERE id = ${req.params.id}
     RETURNING *
  `

  res.json(rowToEnquiry(next))
})

enquiriesRouter.delete('/enquiries/:id', requireAuth, async (req, res) => {
  const result = await sql`DELETE FROM enquiries WHERE id = ${req.params.id}`
  if (!result.count) throw new HttpError(404, 'That enquiry could not be found.')
  res.status(204).end()
})
