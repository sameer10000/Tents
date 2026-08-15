/**
 * One-off migration: local SQLite + local uploads → Supabase + Cloudinary.
 *
 *   npm run db:migrate            insert what is missing, leave the rest
 *   npm run db:migrate -- --force empty the Supabase tables first
 *
 * Applies the schema, uploads every referenced image to Cloudinary, rewrites
 * products.images to the delivery URLs, then inserts everything inside one
 * transaction — so a failure at any point leaves Supabase exactly as it was.
 *
 * Reads canvas.db and never writes to it. The SQLite file stays on disk as the
 * rollback, and can be deleted once the site has been verified against
 * Supabase.
 */
import { DatabaseSync } from 'node:sqlite'
import { existsSync, readFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { LEGACY_DB_PATH, UPLOADS_DIR, CLOUDINARY_FOLDER } from './config.js'
import { uploadBuffer } from './cloudinary.js'
import { sql, closeDb } from './db.js'
import { applySchema } from './schema.js'

const FORCE = process.argv.includes('--force')

const parse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

const parseObject = (value) => {
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/* ── Imagery ───────────────────────────────────────────────────────────── */

/**
 * Uploads every local file referenced by a product.
 *
 * Keyed on the original `/uploads/<name>` string so the rewrite below is a map
 * lookup. Anything already absolute — an http(s) URL someone pasted in by hand
 * — is passed through untouched rather than treated as a missing file.
 */
async function migrateImages(products) {
  const referenced = new Set()
  for (const product of products) {
    for (const url of parse(product.images, [])) {
      if (typeof url === 'string' && url.startsWith('/uploads/')) referenced.add(url)
    }
  }

  const mapping = new Map()
  const missing = []

  for (const url of referenced) {
    const filename = basename(url)
    const path = join(UPLOADS_DIR, filename)

    if (!existsSync(path)) {
      missing.push(url)
      continue
    }

    // Deterministic id from the local stem, which is already random and
    // unique. Re-running the migration overwrites rather than duplicates.
    const stem = basename(filename, extname(filename))
    const { url: delivered } = await uploadBuffer(readFileSync(path), {
      folder: `${CLOUDINARY_FOLDER}/legacy`,
      publicId: stem,
      overwrite: true,
    })

    mapping.set(url, delivered)
    console.log(`    ${filename}  →  ${delivered}`)
  }

  return { mapping, missing }
}

/* ── Safety ────────────────────────────────────────────────────────────── */

/** Everything this application owns. Anything else in public is not ours. */
const OWNED = new Set([
  'users',
  'families',
  'categories',
  'products',
  'custom_tents',
  'enquiries',
])

/**
 * Refuses to touch a database that belongs to something else.
 *
 * This script assumed an empty schema, which is a bad assumption to hold
 * silently: pointed at a populated database it would have enabled RLS on a
 * stranger's `users` table, and --force would have truncated it. A connection
 * string is easy to paste wrongly, so the check belongs here rather than in
 * the operator's memory.
 */
async function assertSchemaIsOurs() {
  const rows = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  const foreign = rows.map((row) => row.tablename).filter((name) => !OWNED.has(name))

  if (!foreign.length) return

  throw new Error(
    `The public schema of this database holds ${foreign.length} table(s) this ` +
      `application does not own:\n\n      ${foreign.join(', ')}\n\n` +
      `  DATABASE_URL is probably pointing at the wrong project. Nothing has been\n` +
      `  changed. Point it at an empty database, or drop those tables deliberately\n` +
      `  if they really are disposable.\n`,
  )
}

/* ── Main ──────────────────────────────────────────────────────────────── */

async function migrate() {
  if (!existsSync(LEGACY_DB_PATH)) {
    console.log(`\n  No SQLite database at ${LEGACY_DB_PATH} — nothing to migrate.\n`)
    return
  }

  const legacy = new DatabaseSync(LEGACY_DB_PATH, { readOnly: true })

  const users = legacy.prepare('SELECT * FROM users ORDER BY id').all()
  const families = legacy.prepare('SELECT * FROM families ORDER BY position, name').all()
  const categories = legacy.prepare('SELECT * FROM categories ORDER BY position, name').all()
  const products = legacy.prepare('SELECT * FROM products ORDER BY position, sku').all()
  const customTents = legacy.prepare('SELECT * FROM custom_tents ORDER BY created_at').all()

  legacy.close()

  console.log(
    `\n  Read from SQLite: ${families.length} houses, ${categories.length} sections, ` +
      `${products.length} pieces, ${users.length} user(s), ${customTents.length} enquiries.`,
  )

  await assertSchemaIsOurs()

  console.log('\n  Applying schema …')
  await applySchema()

  console.log('\n  Uploading imagery to Cloudinary …')
  const { mapping, missing } = await migrateImages(products)
  console.log(`  ${mapping.size} image(s) uploaded.`)

  if (missing.length) {
    console.warn(
      `\n  ! ${missing.length} referenced image(s) were not on disk and are dropped:\n` +
        missing.map((url) => `      ${url}`).join('\n'),
    )
  }

  console.log('\n  Writing to Supabase …')

  await sql.begin(async (tx) => {
    if (FORCE) {
      // Order matters even with CASCADE — being explicit documents the graph.
      await tx`TRUNCATE products, categories, families, custom_tents, users RESTART IDENTITY CASCADE`
      console.log('    Existing rows cleared (--force).')
    }

    if (users.length) {
      await tx`
        INSERT INTO users ${tx(
          users.map((user) => ({
            id: user.id,
            username: user.username,
            // scrypt hash and salt move verbatim — the existing password keeps
            // working, and auth.js re-hashes it at the current cost on the next
            // successful login.
            password_hash: user.password_hash,
            salt: user.salt,
            created_at: user.created_at,
          })),
        )}
        ON CONFLICT (id) DO NOTHING
      `

      // Explicit ids were inserted, so the identity sequence is still at 1 and
      // the next created user would collide.
      await tx`
        SELECT setval(
          pg_get_serial_sequence('users', 'id'),
          GREATEST((SELECT MAX(id) FROM users), 1)
        )
      `
    }

    if (families.length) {
      await tx`
        INSERT INTO families ${tx(
          families.map((family) => ({
            id: family.id,
            name: family.name,
            slug: family.slug,
            kicker: family.kicker,
            blurb: family.blurb,
            position: family.position,
          })),
        )}
        ON CONFLICT (id) DO NOTHING
      `
    }

    if (categories.length) {
      await tx`
        INSERT INTO categories ${tx(
          categories.map((category) => ({
            id: category.id,
            name: category.name,
            family_id: category.family_id,
            slug: category.slug,
            blurb: category.blurb,
            plate: category.plate,
            position: category.position,
          })),
        )}
        ON CONFLICT (id) DO NOTHING
      `
    }

    if (products.length) {
      await tx`
        INSERT INTO products ${tx(
          products.map((product) => ({
            sku: product.sku,
            name: product.name,
            family_id: product.family_id,
            category_id: product.category_id,
            tagline: product.tagline,
            description: product.description,
            price: product.price,
            unit: product.unit,
            cogs: product.cogs,
            channel: product.channel,
            moq: product.moq,
            capacity: product.capacity,
            weight: product.weight,
            waterproof: product.waterproof,
            dimensions: product.dimensions,
            packed: product.packed,
            temperature: product.temperature,
            materials: tx.json(parse(product.materials, [])),
            colors: tx.json(parse(product.colors, [])),
            details: tx.json(parse(product.details, [])),
            // Local paths become Cloudinary URLs; anything already absolute is
            // kept, anything that went missing is dropped.
            images: tx.json(
              parse(product.images, [])
                .map((url) => mapping.get(url) ?? (url.startsWith('/uploads/') ? null : url))
                .filter(Boolean),
            ),
            plate: product.plate,
            badge: product.badge,
            featured: Boolean(product.featured),
            hero: Boolean(product.hero),
            position: product.position,
            created_at: product.created_at,
            updated_at: product.updated_at,
          })),
        )}
        ON CONFLICT (sku) DO NOTHING
      `
    }

    if (customTents.length) {
      await tx`
        INSERT INTO custom_tents ${tx(
          customTents.map((tent) => ({
            id: tent.id,
            family: tent.family,
            headline: tent.headline,
            spec: tx.json(parseObject(tent.spec)),
            quantity: tent.quantity,
            name: tent.name,
            email: tent.email,
            phone: tent.phone,
            basket: tx.json(parse(tent.basket, [])),
            submitted: Boolean(tent.submitted),
            status: tent.status,
            notes: tent.notes,
            created_at: tent.created_at,
            updated_at: tent.updated_at,
          })),
        )}
        ON CONFLICT (id) DO NOTHING
      `
    }
  })

  /* ── Verify ──────────────────────────────────────────────────────────── */

  const [counts] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM families)     AS families,
      (SELECT COUNT(*)::int FROM categories)   AS categories,
      (SELECT COUNT(*)::int FROM products)     AS products,
      (SELECT COUNT(*)::int FROM users)        AS users,
      (SELECT COUNT(*)::int FROM custom_tents) AS custom_tents
  `

  const withImages = await sql`
    SELECT sku, jsonb_array_length(images) AS n FROM products
     WHERE jsonb_array_length(images) > 0 ORDER BY sku
  `

  console.log('\n  In Supabase now:')
  console.log(`    families      ${counts.families}  (from ${families.length})`)
  console.log(`    categories    ${counts.categories}  (from ${categories.length})`)
  console.log(`    products      ${counts.products}  (from ${products.length})`)
  console.log(`    users         ${counts.users}  (from ${users.length})`)
  console.log(`    custom_tents  ${counts.custom_tents}  (from ${customTents.length})`)

  console.log('\n  Products carrying imagery:')
  for (const row of withImages) console.log(`    ${row.sku}  ${row.n} image(s)`)

  const shortfall =
    counts.families < families.length ||
    counts.categories < categories.length ||
    counts.products < products.length

  if (shortfall) {
    console.warn(
      '\n  ! Some rows were already present and were left alone.' +
        '\n    Re-run with --force to replace what is in Supabase.\n',
    )
  } else {
    console.log('\n  Migration complete.\n')
  }
}

try {
  await migrate()
} finally {
  await closeDb()
}
