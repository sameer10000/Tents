import { Router } from 'express'
import { readCatalogue, readFamily, rowToCategory, rowToProduct, sql } from '../db.js'
import { requireAuth } from '../auth.js'
import {
  HttpError,
  bad,
  channel,
  colourList,
  int,
  skuOf,
  slugify,
  str,
  strList,
} from '../validate.js'

export const catalogueRouter = Router()

/* ── Read (public) ─────────────────────────────────────────────────────── */

catalogueRouter.get('/catalogue', async (_req, res) => {
  res.json(await readCatalogue())
})

/* ── Families ──────────────────────────────────────────────────────────── */

function familyBody(body, { existingId } = {}) {
  const name = str(body.name, 'Name', { required: true, max: 60 })
  const id = existingId ?? slugify(body.id || name)
  if (!id) throw bad('Could not derive an id from that name.')

  return {
    id,
    name,
    slug: slugify(body.slug || name) || id,
    kicker: str(body.kicker, 'Kicker', { max: 80 }) ?? '',
    blurb: str(body.blurb, 'Blurb', { max: 600 }) ?? '',
    position: int(body.position, 'Position', { fallback: 100 }),
  }
}

catalogueRouter.post('/families', requireAuth, async (req, res) => {
  const family = familyBody(req.body)

  const [clash] = await sql`
    SELECT id, slug FROM families WHERE id = ${family.id} OR slug = ${family.slug} LIMIT 1
  `
  if (clash) {
    throw new HttpError(
      409,
      clash.id === family.id
        ? `A house with the id "${family.id}" already exists.`
        : `A house with the slug "${family.slug}" already exists.`,
    )
  }

  await sql`
    INSERT INTO families (id, name, slug, kicker, blurb, position)
    VALUES (${family.id}, ${family.name}, ${family.slug}, ${family.kicker},
            ${family.blurb}, ${family.position})
  `

  res.status(201).json(await readFamily(family.id))
})

catalogueRouter.patch('/families/:id', requireAuth, async (req, res) => {
  const [existing] = await sql`SELECT * FROM families WHERE id = ${req.params.id}`
  if (!existing) throw new HttpError(404, 'House not found.')

  const family = familyBody({ ...existing, ...req.body }, { existingId: existing.id })

  const [slugTaken] = await sql`
    SELECT 1 FROM families WHERE slug = ${family.slug} AND id != ${existing.id}
  `
  if (slugTaken) throw new HttpError(409, `The slug "${family.slug}" is already in use.`)

  await sql`
    UPDATE families
       SET name = ${family.name}, slug = ${family.slug}, kicker = ${family.kicker},
           blurb = ${family.blurb}, position = ${family.position}
     WHERE id = ${existing.id}
  `

  res.json(await readFamily(existing.id))
})

catalogueRouter.delete('/families/:id', requireAuth, async (req, res) => {
  const [{ n }] = await sql`
    SELECT COUNT(*)::int AS n FROM products WHERE family_id = ${req.params.id}
  `

  // Deleting would cascade to categories and products. Make that an explicit
  // decision rather than a surprise.
  if (n > 0 && req.query.force !== 'true') {
    throw new HttpError(
      409,
      `That house still holds ${n} ${n === 1 ? 'piece' : 'pieces'}. Move them first, or repeat with ?force=true.`,
    )
  }

  await sql`DELETE FROM families WHERE id = ${req.params.id}`
  res.json({ ok: true })
})

/* ── Categories ────────────────────────────────────────────────────────── */

async function categoryBody(body, { existingId } = {}) {
  const name = str(body.name, 'Name', { required: true, max: 80 })
  const familyId = str(body.family, 'House', { required: true, max: 60 })

  const [family] = await sql`SELECT 1 FROM families WHERE id = ${familyId}`
  if (!family) throw bad(`No house with the id "${familyId}".`)

  const id = existingId ?? slugify(body.id || name)
  if (!id) throw bad('Could not derive an id from that name.')

  return {
    id,
    name,
    family: familyId,
    // Slug and id are kept in step — the client routes on /catalogue/:slug.
    slug: existingId ? slugify(body.slug || id) : id,
    blurb: str(body.blurb, 'Blurb', { max: 600 }) ?? '',
    plate: str(body.plate, 'Plate', { max: 40 }) ?? 'project',
    position: int(body.position, 'Position', { fallback: 100 }),
  }
}

catalogueRouter.post('/categories', requireAuth, async (req, res) => {
  const category = await categoryBody(req.body)

  const [clash] = await sql`
    SELECT id, slug FROM categories
     WHERE id = ${category.id} OR slug = ${category.slug} LIMIT 1
  `
  if (clash) {
    throw new HttpError(
      409,
      clash.id === category.id
        ? `A section with the id "${category.id}" already exists.`
        : `A section with the slug "${category.slug}" already exists.`,
    )
  }

  const [row] = await sql`
    INSERT INTO categories (id, name, family_id, slug, blurb, plate, position)
    VALUES (${category.id}, ${category.name}, ${category.family}, ${category.slug},
            ${category.blurb}, ${category.plate}, ${category.position})
    RETURNING *
  `

  res.status(201).json(rowToCategory(row))
})

catalogueRouter.patch('/categories/:id', requireAuth, async (req, res) => {
  const [row] = await sql`SELECT * FROM categories WHERE id = ${req.params.id}`
  if (!row) throw new HttpError(404, 'Section not found.')

  const merged = { ...rowToCategory(row), ...req.body }
  const category = await categoryBody(merged, { existingId: row.id })

  const [slugTaken] = await sql`
    SELECT 1 FROM categories WHERE slug = ${category.slug} AND id != ${row.id}
  `
  if (slugTaken) throw new HttpError(409, `The slug "${category.slug}" is already in use.`)

  // A section that moves house takes its products with it, otherwise the two
  // would disagree about where a product lives. Both writes or neither.
  const updated = await sql.begin(async (tx) => {
    const [next] = await tx`
      UPDATE categories
         SET name = ${category.name}, family_id = ${category.family}, slug = ${category.slug},
             blurb = ${category.blurb}, plate = ${category.plate}, position = ${category.position}
       WHERE id = ${row.id}
       RETURNING *
    `

    if (category.family !== row.family_id) {
      await tx`UPDATE products SET family_id = ${category.family} WHERE category_id = ${row.id}`
    }

    return next
  })

  res.json(rowToCategory(updated))
})

catalogueRouter.delete('/categories/:id', requireAuth, async (req, res) => {
  const [{ n }] = await sql`
    SELECT COUNT(*)::int AS n FROM products WHERE category_id = ${req.params.id}
  `

  if (n > 0 && req.query.force !== 'true') {
    throw new HttpError(
      409,
      `That section still holds ${n} ${n === 1 ? 'piece' : 'pieces'}. Move them first, or repeat with ?force=true.`,
    )
  }

  await sql`DELETE FROM categories WHERE id = ${req.params.id}`
  res.json({ ok: true })
})

/* ── Products ──────────────────────────────────────────────────────────── */

async function productBody(body, { existingSku } = {}) {
  const categoryId = str(body.category, 'Section', { required: true, max: 60 })
  const [category] = await sql`SELECT * FROM categories WHERE id = ${categoryId}`
  if (!category) throw bad(`No section with the id "${categoryId}".`)

  return {
    sku: existingSku ?? skuOf(body.sku),
    name: str(body.name, 'Name', { required: true, max: 120 }),
    // The house always follows the section — one source of truth.
    family: category.family_id,
    category: categoryId,
    tagline: str(body.tagline, 'Tagline', { max: 240 }) ?? '',
    description: str(body.description, 'Description', { max: 4000 }) ?? '',
    price: int(body.price, 'Price', { fallback: 0 }),
    unit: str(body.unit, 'Unit', { max: 12 }),
    cogs: int(body.cogs, 'Cost', { fallback: 0 }),
    channel: channel(body.channel ?? 'D2C'),
    moq: int(body.moq, 'Minimum order', { min: 1, fallback: 1 }),
    capacity: str(body.capacity, 'Capacity', { max: 80 }),
    weight: str(body.weight, 'Weight', { max: 80 }),
    waterproof: str(body.waterproof, 'Weather rating', { max: 120 }),
    dimensions: str(body.dimensions, 'Dimensions', { max: 160 }),
    packed: str(body.packed, 'Packed size', { max: 120 }),
    temperature: str(body.temperature, 'Temperature', { max: 80 }),
    materials: strList(body.materials, 'Materials'),
    colors: colourList(body.colors, 'Colours'),
    details: strList(body.details, 'Details'),
    images: strList(body.images, 'Images'),
    plate: str(body.plate, 'Plate', { max: 40 }) ?? category.plate,
    badge: str(body.badge, 'Badge', { max: 40 }),
    // Booleans now, rather than the 0/1 SQLite required.
    featured: Boolean(body.featured),
    hero: Boolean(body.hero),
    position: int(body.position, 'Position', { fallback: 500 }),
  }
}

/**
 * The column list is shared between insert and update.
 *
 * postgres.js builds the statement from the object's keys, so this maps the
 * API's names onto the table's — `family` → `family_id` — and JSONB columns
 * are passed through `sql.json` rather than stringified by hand.
 */
function productRow(p) {
  return {
    sku: p.sku,
    name: p.name,
    family_id: p.family,
    category_id: p.category,
    tagline: p.tagline,
    description: p.description,
    price: p.price,
    unit: p.unit,
    cogs: p.cogs,
    channel: p.channel,
    moq: p.moq,
    capacity: p.capacity,
    weight: p.weight,
    waterproof: p.waterproof,
    dimensions: p.dimensions,
    packed: p.packed,
    temperature: p.temperature,
    materials: sql.json(p.materials),
    colors: sql.json(p.colors),
    details: sql.json(p.details),
    images: sql.json(p.images),
    plate: p.plate,
    badge: p.badge,
    featured: p.featured,
    hero: p.hero,
    position: p.position,
  }
}

catalogueRouter.post('/products', requireAuth, async (req, res) => {
  const product = await productBody(req.body)

  const [clash] = await sql`SELECT 1 FROM products WHERE sku = ${product.sku}`
  if (clash) throw new HttpError(409, `SKU ${product.sku} is already in the catalogue.`)

  const [row] = await sql`
    INSERT INTO products ${sql(productRow(product))} RETURNING *
  `

  res.status(201).json(rowToProduct(row))
})

catalogueRouter.patch('/products/:sku', requireAuth, async (req, res) => {
  const sku = req.params.sku.toUpperCase()

  const [row] = await sql`SELECT * FROM products WHERE sku = ${sku}`
  if (!row) throw new HttpError(404, 'Piece not found.')

  const merged = { ...rowToProduct(row), ...req.body }
  const product = await productBody(merged, { existingSku: row.sku })

  // sku is the key, so it is written out of the update set rather than into it.
  const { sku: _ignored, ...changes } = productRow(product)

  const [next] = await sql`
    UPDATE products SET ${sql(changes)}, updated_at = now()
     WHERE sku = ${row.sku}
     RETURNING *
  `

  res.json(rowToProduct(next))
})

catalogueRouter.delete('/products/:sku', requireAuth, async (req, res) => {
  const result = await sql`DELETE FROM products WHERE sku = ${req.params.sku.toUpperCase()}`
  if (result.count === 0) throw new HttpError(404, 'Piece not found.')
  res.json({ ok: true })
})
