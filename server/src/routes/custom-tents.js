import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { rowToCustomTent, sql } from '../db.js'
import { requireAuth } from '../auth.js'
import { HttpError, bad, int, str } from '../validate.js'

export const customTentsRouter = Router()

const FAMILIES = new Set(['bell', 'medieval', 'safari'])
const STATUSES = ['new', 'contacted', 'quoted', 'closed']
const STATUS_SET = new Set(STATUSES)

/** Well past any real specification, well short of anything abusive. */
const MAX_SPEC_BYTES = 8_000

/**
 * A short, unguessable, URL-friendly id.
 *
 * It is the share link, so it has to be short enough to paste into a message
 * and random enough that nobody can walk the table by incrementing it.
 */
async function freshId() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const id = randomBytes(5).toString('hex')
    const [taken] = await sql`SELECT 1 FROM custom_tents WHERE id = ${id}`
    if (!taken) return id
  }
  throw new HttpError(500, 'Could not allocate an id.')
}

function specBody(body) {
  const family = str(body.family, 'Tent type', { required: true, max: 20 })
  if (!FAMILIES.has(family)) throw bad('That is not a tent type we build.')

  if (!body.spec || typeof body.spec !== 'object' || Array.isArray(body.spec)) {
    throw bad('The specification is missing.')
  }

  // Measured as JSON because that is how it is stored and how it could be
  // abused; the column is JSONB, so the object itself is what gets written.
  if (JSON.stringify(body.spec).length > MAX_SPEC_BYTES) {
    throw bad('That specification is too large.')
  }
  if (body.spec.family !== family) throw bad('The specification does not match the tent type.')

  return {
    family,
    spec: body.spec,
    headline: str(body.headline, 'Summary', { max: 160 }) ?? '',
    quantity: int(body.quantity, 'Quantity', { min: 1, max: 10_000, fallback: 1 }),
  }
}

/* ── Public ────────────────────────────────────────────────────────────── */

/** Saves a design. Called when a tent is bagged or a share link is wanted. */
customTentsRouter.post('/custom-tents', async (req, res) => {
  const { family, spec, headline, quantity } = specBody(req.body)
  const id = await freshId()

  const [row] = await sql`
    INSERT INTO custom_tents (id, family, headline, spec, quantity)
    VALUES (${id}, ${family}, ${headline}, ${sql.json(spec)}, ${quantity})
    RETURNING *
  `

  res.status(201).json(rowToCustomTent(row))
})

/** Reopens a saved design. Deliberately returns no contact details. */
customTentsRouter.get('/custom-tents/:id', async (req, res) => {
  const [row] = await sql`SELECT * FROM custom_tents WHERE id = ${req.params.id}`
  if (!row) throw new HttpError(404, 'That design could not be found.')
  res.json(rowToCustomTent(row))
})

/** Replaces the stored specification behind an existing share link. */
customTentsRouter.patch('/custom-tents/:id', async (req, res) => {
  const [row] = await sql`SELECT * FROM custom_tents WHERE id = ${req.params.id}`
  if (!row) throw new HttpError(404, 'That design could not be found.')
  if (row.submitted) {
    throw new HttpError(409, 'That design has already been sent to us and is now fixed.')
  }

  const { family, spec, headline, quantity } = specBody(req.body)

  const [next] = await sql`
    UPDATE custom_tents
       SET family = ${family}, spec = ${sql.json(spec)}, headline = ${headline},
           quantity = ${quantity}, updated_at = now()
     WHERE id = ${req.params.id}
     RETURNING *
  `

  res.json(rowToCustomTent(next))
})

/**
 * Turns saved designs into an enquiry.
 *
 * The whole bag arrives at once: every custom tent in it gets the contact
 * details, and the catalogue lines alongside them are recorded on each so the
 * inbox shows what the customer was actually asking about.
 */
customTentsRouter.post('/custom-tents/enquiry', async (req, res) => {
  const ids = Array.isArray(req.body.ids)
    ? req.body.ids.filter((id) => typeof id === 'string')
    : []
  if (!ids.length) throw bad('No design was included in that enquiry.')

  const name = str(req.body.name, 'Name', { required: true, max: 120 })
  const email = str(req.body.email, 'Email', { required: true, max: 160 })
  const phone = str(req.body.phone, 'Phone', { required: true, max: 40 })
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) throw bad('That email address looks wrong.')

  const basket = (Array.isArray(req.body.basket) ? req.body.basket : [])
    .slice(0, 60)
    .map((line) => ({ sku: String(line?.sku ?? '').slice(0, 16), qty: Number(line?.qty) || 1 }))

  // One statement instead of a loop — the whole bag is stamped together, so a
  // failure part-way cannot leave some designs submitted and others not.
  const updated = await sql`
    UPDATE custom_tents
       SET name = ${name}, email = ${email}, phone = ${phone}, basket = ${sql.json(basket)},
           submitted = true, status = 'new', updated_at = now()
     WHERE id = ANY(${ids}) AND submitted = false
     RETURNING id
  `

  if (!updated.length) throw new HttpError(404, 'Those designs could not be found.')

  // No mail is sent — the portal inbox is the delivery mechanism. Logged so a
  // tail of the server output still shows enquiries arriving live.
  console.info(
    `[Canvas Emporium] custom tent enquiry from ${name} <${email}> · ${updated.length} design(s)`,
  )

  res.status(201).json({ recorded: updated.length, ids })
})

/* ── Admin ─────────────────────────────────────────────────────────────── */

customTentsRouter.get('/custom-tents', requireAuth, async (req, res) => {
  const status = STATUS_SET.has(String(req.query.status)) ? String(req.query.status) : null
  const onlySubmitted = req.query.all !== 'true'

  const [rows, counts] = await Promise.all([
    sql`
      SELECT * FROM custom_tents
       WHERE (${onlySubmitted}::boolean = false OR submitted = true)
         AND (${status}::text IS NULL OR status = ${status})
       ORDER BY created_at DESC
       LIMIT 500
    `,
    // One grouped query rather than one per status.
    sql`
      SELECT status, COUNT(*)::int AS n FROM custom_tents
       WHERE submitted = true GROUP BY status
    `,
  ])

  const byStatus = new Map(counts.map((row) => [row.status, row.n]))

  res.json({
    enquiries: rows.map((row) => rowToCustomTent(row, { includeContact: true })),
    counts: Object.fromEntries(STATUSES.map((value) => [value, byStatus.get(value) ?? 0])),
  })
})

customTentsRouter.patch('/custom-tents/:id/status', requireAuth, async (req, res) => {
  const [row] = await sql`SELECT * FROM custom_tents WHERE id = ${req.params.id}`
  if (!row) throw new HttpError(404, 'That enquiry could not be found.')

  const status = str(req.body.status, 'Status', { required: true, max: 20 })
  if (!STATUS_SET.has(status)) throw bad(`Status must be one of ${STATUSES.join(', ')}.`)

  const notes = str(req.body.notes, 'Notes', { max: 2000 }) ?? row.notes

  const [next] = await sql`
    UPDATE custom_tents
       SET status = ${status}, notes = ${notes}, updated_at = now()
     WHERE id = ${req.params.id}
     RETURNING *
  `

  res.json(rowToCustomTent(next, { includeContact: true }))
})

customTentsRouter.delete('/custom-tents/:id', requireAuth, async (req, res) => {
  const result = await sql`DELETE FROM custom_tents WHERE id = ${req.params.id}`
  if (!result.count) throw new HttpError(404, 'That enquiry could not be found.')
  res.status(204).end()
})
