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

  // Two very different fixes depending on where this is running, and the
  // wrong one wastes real time — a container has no .env file to copy.
  throw new Error(
    IS_PRODUCTION
      ? `${name} is not set.\n\n` +
        `  Add it to this service's environment variables and redeploy.\n` +
        `  The full list is in server/.env.example.\n`
      : `${name} is not set.\n\n` +
        `  Copy server/.env.example to server/.env and fill it in, then start\n` +
        `  with npm run server.\n`,
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

/* ── Browser origins ────────────────────────────────────────────────────── */

/**
 * Origins allowed to call the API with credentials.
 *
 * Empty in development, where Vite proxies /api and everything is same-origin.
 * Set once the storefront is served from somewhere other than this process —
 * comma separated, scheme and host, no trailing slash.
 */
export const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

/**
 * SameSite policy for the session cookie.
 *
 * The correct value follows from where the two halves are deployed:
 *
 *   Strict  one origin, or api.example.com beside www.example.com. Both are
 *           "same site", so the cookie rides along and nothing is third-party.
 *   None    different registrable domains, e.g. a .web.app front end calling
 *           a .up.railway.app API. The browser then treats the cookie as
 *           third-party — it requires Secure, and browsers phasing out
 *           third-party cookies will eventually refuse it regardless.
 *
 * Defaulting to Strict means an accidental cross-site deployment fails at
 * login rather than silently relying on a cookie that is being deprecated.
 */
const SAMESITE = process.env.COOKIE_SAMESITE ?? 'Strict'

if (!['Strict', 'Lax', 'None'].includes(SAMESITE)) {
  throw new Error(`COOKIE_SAMESITE must be Strict, Lax or None — got "${SAMESITE}".`)
}

if (SAMESITE === 'None' && !IS_PRODUCTION) {
  throw new Error('COOKIE_SAMESITE=None requires HTTPS, so it only works with NODE_ENV=production.')
}

export const COOKIE_SAMESITE = SAMESITE

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
