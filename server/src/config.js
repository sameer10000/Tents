import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const here = dirname(fileURLToPath(import.meta.url))

export const SERVER_ROOT = join(here, '..')
export const PROJECT_ROOT = join(SERVER_ROOT, '..')

export const DATA_DIR = join(SERVER_ROOT, 'data')
/** Legacy local imagery. Read by the migration, written by nothing. */
export const UPLOADS_DIR = join(SERVER_ROOT, 'uploads')
/** Legacy SQLite database. Read by the migration, written by nothing. */
export const LEGACY_DB_PATH = join(DATA_DIR, 'canvas.db')

mkdirSync(DATA_DIR, { recursive: true })

export const PORT = Number(process.env.PORT ?? 4000)
export const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Reads a required variable, or explains exactly how to supply it.
 *
 * Credentials arrive through `node --env-file=server/.env`, so a missing one
 * almost always means the file was never created — worth saying outright
 * rather than surfacing a connection error twelve frames deep.
 */
function required(name) {
  const value = process.env[name]
  if (value) return value

  throw new Error(
    `${name} is not set.\n\n` +
      `  Copy server/.env.example to server/.env and fill it in, then start with\n` +
      `  npm run server (which passes --env-file=server/.env).\n`,
  )
}

/* ── Supabase ───────────────────────────────────────────────────────────── */

export const DATABASE_URL = required('DATABASE_URL')

/* ── Cloudinary ─────────────────────────────────────────────────────────── */

export const CLOUDINARY = {
  cloud_name: required('CLOUDINARY_CLOUD_NAME'),
  api_key: required('CLOUDINARY_API_KEY'),
  api_secret: required('CLOUDINARY_API_SECRET'),
}

export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER ?? 'canvas-emporium'

/* ── Sessions ───────────────────────────────────────────────────────────── */

/**
 * Signing key for session cookies.
 *
 * Generated on first run and kept in server/data so restarts do not log
 * everybody out. Set SESSION_SECRET in any real deployment — server/data is
 * machine-local, so a redeploy without it invalidates every session.
 */
function resolveSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET

  if (IS_PRODUCTION) {
    throw new Error('SESSION_SECRET must be set in production.')
  }

  const secretPath = join(DATA_DIR, '.session-secret')
  if (existsSync(secretPath)) return readFileSync(secretPath, 'utf8').trim()

  const generated = randomBytes(32).toString('hex')
  writeFileSync(secretPath, generated, { mode: 0o600 })
  return generated
}

export const SESSION_SECRET = resolveSecret()

/** Session lifetime. */
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
