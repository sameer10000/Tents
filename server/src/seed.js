import { randomBytes } from 'node:crypto'
import { sql, countRows } from './db.js'
import { createUser } from './auth.js'
import { IS_PRODUCTION, PROJECT_ROOT } from './config.js'

/**
 * Loads the bundled TypeScript catalogue through Vite, which transpiles it and
 * resolves the extensionless imports exactly as the app does. Only ever called
 * when the database is empty.
 */
async function loadStaticCatalogue() {
  const { createServer } = await import('vite')

  const vite = await createServer({
    root: PROJECT_ROOT,
    // Skip the app's own config — the seed needs no plugins, and loading
    // Tailwind here would be pure overhead.
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  })

  try {
    const mod = await vite.ssrLoadModule('/src/data/seed-entry.ts')
    return {
      families: mod.families ?? [],
      categories: mod.categories ?? [],
      products: mod.products ?? [],
    }
  } finally {
    await vite.close()
  }
}

/**
 * Inserts the whole catalogue in one transaction.
 *
 * Rows go in as arrays rather than one statement each: 175 products over a
 * network round trip apiece is the difference between a second and a minute.
 */
async function seedCatalogue({ families, categories, products }) {
  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO families ${tx(
        families.map((family, index) => ({
          id: family.id,
          name: family.name,
          slug: family.slug,
          kicker: family.kicker ?? '',
          blurb: family.blurb ?? '',
          position: index,
        })),
      )}
    `

    await tx`
      INSERT INTO categories ${tx(
        categories.map((category, index) => ({
          id: category.id,
          name: category.name,
          family_id: category.family,
          slug: category.slug,
          blurb: category.blurb ?? '',
          plate: category.plate ?? 'project',
          position: index,
        })),
      )}
    `

    await tx`
      INSERT INTO products ${tx(
        products.map((product, index) => ({
          sku: product.sku,
          name: product.name,
          family_id: product.family,
          category_id: product.category,
          tagline: product.tagline ?? '',
          description: product.description ?? '',
          price: product.price ?? 0,
          unit: product.unit ?? null,
          cogs: product.cogs ?? 0,
          channel: product.channel ?? 'D2C',
          moq: product.moq ?? 1,
          capacity: product.capacity ?? null,
          weight: product.weight ?? null,
          waterproof: product.waterproof ?? null,
          dimensions: product.dimensions ?? null,
          packed: product.packed ?? null,
          temperature: product.temperature ?? null,
          materials: tx.json(product.materials ?? []),
          colors: tx.json(product.colors ?? []),
          details: tx.json(product.details ?? []),
          images: tx.json(product.images ?? []),
          plate: product.plate ?? 'project',
          badge: product.badge ?? null,
          featured: Boolean(product.featured),
          hero: Boolean(product.hero),
          position: index,
        })),
      )}
    `
  })
}

async function ensureAdmin() {
  if ((await countRows('users')) > 0) return

  const username = process.env.ADMIN_USERNAME ?? 'admin'
  const supplied = process.env.ADMIN_PASSWORD
  const password = supplied ?? randomBytes(9).toString('base64url')

  await createUser(username, password)

  if (supplied) {
    console.log(`\n  Admin account "${username}" created from ADMIN_PASSWORD.\n`)
    return
  }

  // Printed once, and only once — it is not stored anywhere in plain text.
  console.log('\n  ┌──────────────────────────────────────────────┐')
  console.log('  │  Admin account created                       │')
  console.log('  ├──────────────────────────────────────────────┤')
  console.log(`  │  username   ${username.padEnd(33)}│`)
  console.log(`  │  password   ${password.padEnd(33)}│`)
  console.log('  ├──────────────────────────────────────────────┤')
  console.log('  │  Shown once. Set ADMIN_PASSWORD to choose     │')
  console.log('  │  your own before the first run.               │')
  console.log('  └──────────────────────────────────────────────┘\n')
}

export async function ensureSeeded() {
  await ensureAdmin()

  if ((await countRows('products')) > 0) return

  // Seeding transpiles src/data through Vite, which is a devDependency and is
  // pruned from a production install. Say so plainly rather than dying on a
  // module-not-found six frames down.
  if (IS_PRODUCTION) {
    console.warn(
      '\n  ! The catalogue is empty and cannot be seeded in production —\n' +
        '    seeding needs Vite, which is not installed here.\n' +
        '    Run `npm run db:migrate` against this database from a development\n' +
        '    checkout, then restart.\n',
    )
    return
  }

  console.log('  Seeding catalogue from src/data …')
  const catalogue = await loadStaticCatalogue()
  await seedCatalogue(catalogue)
  console.log(
    `  Seeded ${catalogue.products.length} pieces, ${catalogue.categories.length} sections, ${catalogue.families.length} houses.`,
  )
}
