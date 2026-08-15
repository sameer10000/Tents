import express from 'express'
import cors from 'cors'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { PORT, IS_PRODUCTION, CORS_ORIGINS, PROJECT_ROOT, MISSING_CONFIG } from './config.js'
import { attachUser } from './auth.js'
import { authRouter } from './routes/auth.js'
import { catalogueRouter } from './routes/catalogue.js'
import { customTentsRouter } from './routes/custom-tents.js'
import { enquiriesRouter } from './routes/enquiries.js'
import { uploadsRouter } from './routes/uploads.js'
import { closeDb, countRows } from './db.js'
import { ensureSeeded } from './seed.js'

const app = express()

// Rate limiting keys on req.ip, which is the proxy's address unless Express is
// told to read X-Forwarded-For. One hop — a single load balancer or tunnel.
if (IS_PRODUCTION) app.set('trust proxy', 1)

/**
 * Cross-origin access, only when configured.
 *
 * An allow-list rather than a reflector: the session cookie travels on these
 * requests, so echoing back whatever Origin arrives would let any site on the
 * internet make authenticated calls on a signed-in administrator's behalf.
 */
if (CORS_ORIGINS.length) {
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header means a same-origin or non-browser caller.
        if (!origin || CORS_ORIGINS.includes(origin)) return callback(null, true)
        callback(new Error(`Origin ${origin} is not allowed.`))
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  )
}

app.use(express.json({ limit: '1mb' }))
app.use(attachUser)

// Imagery is served by Cloudinary now; nothing is stored on this filesystem.

app.use('/api', authRouter)
app.use('/api', catalogueRouter)
app.use('/api', customTentsRouter)
app.use('/api', enquiriesRouter)
app.use('/api', uploadsRouter)

/**
 * Liveness, not readiness.
 *
 * Answers 200 whenever the process is up, and reports the database state in
 * the body rather than failing the whole response. A healthcheck that goes
 * unavailable the moment Postgres hiccups causes the platform to roll the
 * deployment back and destroy the container — taking the logs that would have
 * explained the problem with it.
 */
app.get('/api/health', async (_req, res) => {
  // Reported before anything is attempted: with a variable missing the
  // database call below would fail anyway, and "connection refused" hides the
  // real answer, which is that nobody set DATABASE_URL.
  if (MISSING_CONFIG.length) {
    return res.json({
      ok: false,
      configured: false,
      missing: MISSING_CONFIG,
      hint: 'Set these on the service and redeploy. See server/.env.example.',
    })
  }

  try {
    const [families, categories, products, customTents] = await Promise.all([
      countRows('families'),
      countRows('categories'),
      countRows('products'),
      countRows('custom_tents'),
    ])
    res.json({ ok: true, database: 'connected', families, categories, products, customTents })
  } catch (error) {
    console.error('Health check could not reach the database:', error)
    res.json({ ok: false, database: 'unreachable', error: error.message })
  }
})

app.use('/api', (_req, res) => res.status(404).json({ error: 'No such endpoint.' }))

/* ── Static front end ──────────────────────────────────────────────────── */

/**
 * Serves the built storefront from the same origin as the API.
 *
 * That co-location is what keeps the session cookie simple: no CORS, and
 * SameSite=Strict with nothing third-party about it. In development this block
 * is skipped — there is no dist/ — and Vite proxies /api instead.
 */
const DIST = join(PROJECT_ROOT, 'dist')

if (existsSync(DIST)) {
  app.use(
    express.static(DIST, {
      // Vite fingerprints asset filenames, so they can be cached indefinitely.
      // index.html must not be, or a deploy strands clients on stale bundles.
      setHeaders(res, filePath) {
        const served = filePath.replaceAll('\\', '/')
        if (served.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache')
        } else if (served.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        }
      },
    }),
  )

  // Client-side routing: anything that is not a file and not /api is the shell.
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    // sendFile bypasses the static handler above, so the shell needs its
    // no-cache header set here too — otherwise a deploy strands clients on
    // an index.html pointing at asset URLs that no longer exist.
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(join(DIST, 'index.html'))
  })
} else {
  console.warn('  No dist/ found — run `npm run build` to serve the front end from here.\n')
}

// Single error funnel. Express 5 forwards rejected promises here too, which is
// what keeps the awaited route handlers free of try/catch.
app.use((error, _req, res, _next) => {
  const status = error.status ?? (error.code === 'LIMIT_FILE_SIZE' ? 413 : 500)
  if (status >= 500) console.error(error)
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong on the server.' : error.message,
  })
})

/**
 * Open the port first, seed second.
 *
 * Seeding talks to the database, and this used to be awaited before
 * listen() — so anything wrong with the connection meant the process never
 * bound a port at all. A platform healthcheck cannot distinguish that from a
 * crash: it just sees nothing listening and reports the service as
 * unavailable, with the actual cause nowhere in the deploy log.
 *
 * Listening immediately means the failure surfaces as a health response that
 * says what broke, instead of silence.
 */
const server = app.listen(PORT, () => {
  console.log(`\n  Canvas Emporium API listening on ${PORT}`)
  console.log(`  Health · /api/health`)
})

if (MISSING_CONFIG.length) {
  console.error('\n  ┌──────────────────────────────────────────────┐')
  console.error('  │  NOT CONFIGURED — these are missing:         │')
  for (const name of MISSING_CONFIG) {
    console.error(`  │    ${name.padEnd(42)}│`)
  }
  console.error('  ├──────────────────────────────────────────────┤')
  console.error('  │  Set them on the service and redeploy.       │')
  console.error('  │  The full list is in server/.env.example.    │')
  console.error('  └──────────────────────────────────────────────┘\n')
} else {
  try {
    await ensureSeeded()
    console.log('  Database reachable, catalogue present.\n')
  } catch (error) {
    // Deliberately not fatal. The port stays open so /api/health can report
    // the problem rather than the container looking simply dead.
    console.error('\n  ! Could not reach the database at startup.')
    console.error(`  ! ${error.message}\n`)
  }
}

/**
 * Close the pool on the way out.
 *
 * Supabase counts connections against the project's budget, so a restart loop
 * that leaves them open will start refusing to connect.
 */
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => {
      await closeDb()
      process.exit(0)
    })
  })
}
