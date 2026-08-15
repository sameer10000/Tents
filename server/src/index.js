import express from 'express'
import { PORT, IS_PRODUCTION } from './config.js'
import { attachUser } from './auth.js'
import { authRouter } from './routes/auth.js'
import { catalogueRouter } from './routes/catalogue.js'
import { customTentsRouter } from './routes/custom-tents.js'
import { uploadsRouter } from './routes/uploads.js'
import { closeDb, countRows } from './db.js'
import { ensureSeeded } from './seed.js'

const app = express()

// Rate limiting keys on req.ip, which is the proxy's address unless Express is
// told to read X-Forwarded-For. One hop — a single load balancer or tunnel.
if (IS_PRODUCTION) app.set('trust proxy', 1)

app.use(express.json({ limit: '1mb' }))
app.use(attachUser)

// Imagery is served by Cloudinary now; nothing is stored on this filesystem.

app.use('/api', authRouter)
app.use('/api', catalogueRouter)
app.use('/api', customTentsRouter)
app.use('/api', uploadsRouter)

app.get('/api/health', async (_req, res) => {
  const [families, categories, products, customTents] = await Promise.all([
    countRows('families'),
    countRows('categories'),
    countRows('products'),
    countRows('custom_tents'),
  ])
  res.json({ ok: true, families, categories, products, customTents })
})

app.use('/api', (_req, res) => res.status(404).json({ error: 'No such endpoint.' }))

// Single error funnel. Express 5 forwards rejected promises here too, which is
// what keeps the awaited route handlers free of try/catch.
app.use((error, _req, res, _next) => {
  const status = error.status ?? (error.code === 'LIMIT_FILE_SIZE' ? 413 : 500)
  if (status >= 500) console.error(error)
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong on the server.' : error.message,
  })
})

await ensureSeeded()

const server = app.listen(PORT, () => {
  console.log(`\n  Canvas Emporium API  ·  http://localhost:${PORT}`)
  console.log(`  Catalogue            ·  http://localhost:${PORT}/api/catalogue`)
  console.log(`  Admin portal         ·  http://localhost:5173/admin\n`)
})

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
