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
 * Names of variables that are required and absent.
 *
 * Collected rather than thrown. This module is imported at the top of the
 * server, so throwing here killed the process before it could open a port —
 * and a platform health check reads "nothing listening" as an unavailable
 * service, rolls the deployment back, and takes the explaining log with it.
 *
 * The server starts misconfigured instead, refuses to pretend it is healthy,
 * and says exactly which variables are missing.
 */
export const MISSING_CONFIG = []

function required(name) {
  const value = process.env[name]
  if (value) return value

  MISSING_CONFIG.push(name)
  return ''
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

const SAMESITE_OK = ['Strict', 'Lax', 'None'].includes(SAMESITE)

if (!SAMESITE_OK) {
  console.error(`COOKIE_SAMESITE must be Strict, Lax or None — got "${SAMESITE}". Using Strict.`)
}

export const COOKIE_SAMESITE = SAMESITE_OK ? SAMESITE : 'Strict'

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
    // Recorded, not thrown — see MISSING_CONFIG. An ephemeral key lets the
    // process boot and report itself; it just cannot outlive a restart, which
    // is exactly why the variable is required.
    MISSING_CONFIG.push('SESSION_SECRET')
    return randomBytes(32).toString('hex')
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
