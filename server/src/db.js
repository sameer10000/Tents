import postgres from 'postgres'
import { DATABASE_URL } from './config.js'

/**
 * Supabase Postgres connection.
 *
 * Every query is async now — `node:sqlite`'s DatabaseSync was synchronous, so
 * the whole server had been written as straight-line code. Express 5 forwards
 * rejected promises to the error funnel in index.js, which is what makes the
 * awaited handlers safe without try/catch in every route.
 */
export const sql = postgres(DATABASE_URL, {
  // Supabase terminates the connection itself; keep the pool modest so a
  // restart loop cannot exhaust the project's connection budget.
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
  // Supabase requires TLS but presents a certificate this client cannot chain
  // to a bundled root, which is the documented configuration for the pooler.
  ssl: 'require',
  // Never coerce JSONB or timestamps to strings — the row helpers below rely
  // on getting real arrays, objects and Dates back.
  transform: { undefined: null },
})

export async function closeDb() {
  await sql.end({ timeout: 5 })
}

/**
 * Row → the exact `Product` shape the front end already consumes.
 *
 * JSONB means materials/colors/details/images arrive as real arrays, so the
 * defensive JSON.parse wrapper this file used to carry is gone. The Array
 * check survives only because a hand-edited row could hold an object.
 */
const list = (value) => (Array.isArray(value) ? value : [])

export function rowToProduct(row) {
  const product = {
    sku: row.sku,
    name: row.name,
    family: row.family_id,
    category: row.category_id,
    tagline: row.tagline,
    description: row.description,
    price: row.price,
    cogs: row.cogs,
    channel: row.channel,
    moq: row.moq,
    materials: list(row.materials),
    colors: list(row.colors),
    details: list(row.details),
    images: list(row.images),
    plate: row.plate,
  }

  // Optional fields are omitted rather than sent as null, so the client's
  // `field ? … : null` checks behave the same as they do for static data.
  const optional = {
    unit: row.unit,
    capacity: row.capacity,
    weight: row.weight,
    waterproof: row.waterproof,
    dimensions: row.dimensions,
    packed: row.packed,
    temperature: row.temperature,
    badge: row.badge,
  }
  for (const [key, value] of Object.entries(optional)) {
    if (value !== null && value !== undefined && value !== '') product[key] = value
  }

  if (row.featured) product.featured = true
  if (row.hero) product.hero = true

  return product
}

export function rowToCategory(row) {
  return {
    id: row.id,
    name: row.name,
    family: row.family_id,
    slug: row.slug,
    blurb: row.blurb,
    plate: row.plate,
  }
}

/**
 * Row → family.
 *
 * Takes the category ids it needs rather than fetching them. This used to run
 * its own query per family — eleven round trips to build one catalogue, which
 * was free against local SQLite and is not free against Supabase.
 */
export function rowToFamily(row, categoryIds = []) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    kicker: row.kicker,
    blurb: row.blurb,
    // Category order is owned by the categories table, not duplicated here.
    categories: categoryIds,
  }
}

/** Single family, for the routes that return one after a write. */
export async function readFamily(id) {
  const [row] = await sql`SELECT * FROM families WHERE id = ${id}`
  if (!row) return null

  const categories = await sql`
    SELECT id FROM categories WHERE family_id = ${id} ORDER BY position, name
  `
  return rowToFamily(row, categories.map((c) => c.id))
}

/**
 * The whole catalogue in three queries.
 *
 * Category ids are grouped in memory rather than with a lateral join — the
 * categories are already being fetched in full for their own array, so a
 * second pass over 32 rows is cheaper than asking Postgres twice.
 */
export async function readCatalogue() {
  const [familyRows, categoryRows, productRows] = await Promise.all([
    sql`SELECT * FROM families ORDER BY position, name`,
    sql`SELECT * FROM categories ORDER BY position, name`,
    sql`SELECT * FROM products ORDER BY position, sku`,
  ])

  const idsByFamily = new Map()
  for (const category of categoryRows) {
    const ids = idsByFamily.get(category.family_id)
    if (ids) ids.push(category.id)
    else idsByFamily.set(category.family_id, [category.id])
  }

  return {
    families: familyRows.map((row) => rowToFamily(row, idsByFamily.get(row.id) ?? [])),
    categories: categoryRows.map(rowToCategory),
    products: productRows.map(rowToProduct),
  }
}

/**
 * Row → custom tent.
 *
 * The public share link and the admin inbox read the same table, so the
 * contact details are only attached when the caller is trusted.
 */
export function rowToCustomTent(row, { includeContact = false } = {}) {
  const record = {
    id: row.id,
    family: row.family,
    headline: row.headline,
    spec: row.spec && typeof row.spec === 'object' ? row.spec : {},
    quantity: row.quantity,
    submitted: row.submitted,
    // TIMESTAMPTZ arrives as a Date; the client has always seen ISO strings.
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }

  if (includeContact) {
    record.name = row.name ?? ''
    record.email = row.email ?? ''
    record.phone = row.phone ?? ''
    record.basket = list(row.basket)
    record.status = row.status
    record.notes = row.notes
  }

  return record
}

/** Table names are never user-supplied here — the callers pass literals. */
export async function countRows(table) {
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM ${sql(table)}`
  return n
}
