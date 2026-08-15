import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { sql } from './db.js'
import { COOKIE_SAMESITE, IS_PRODUCTION, SESSION_SECRET, SESSION_TTL_MS } from './config.js'

const COOKIE_NAME = 'ce_session'

/* ── Passwords ─────────────────────────────────────────────────────────── */

/**
 * Async scrypt, deliberately.
 *
 * The synchronous variant blocked the event loop for the whole derivation —
 * tolerable at Node's default cost, not at the cost below. Every other request
 * in flight would have waited on it.
 */
const scryptAsync = promisify(scrypt)

/**
 * Current cost. OWASP's floor for scrypt is N=2^16 with r=8, p=1, against
 * Node's default of N=2^14.
 *
 * Memory is 128 · N · r = 64 MiB per derivation, well over Node's 32 MiB
 * default cap, so maxmem has to be raised or the call throws.
 */
const PARAMS = { N: 65536, r: 8, p: 1 }
const KEY_LENGTH = 64
const maxmemFor = ({ N, r }) => 256 * N * r

/** Hashes carry their own parameters, so raising the cost never orphans one. */
function encode({ N, r, p }, hash) {
  return `scrypt$${N}$${r}$${p}$${hash}`
}

/**
 * Parses a stored hash.
 *
 * A bare hex string is a hash written before this format existed; it was made
 * at Node's defaults, so that is what it has to be verified at.
 */
function decode(stored) {
  if (!stored.startsWith('scrypt$')) {
    return { params: { N: 16384, r: 8, p: 1 }, hash: stored, legacy: true }
  }

  const [, N, r, p, hash] = stored.split('$')
  return { params: { N: Number(N), r: Number(r), p: Number(p) }, hash, legacy: false }
}

async function derive(password, salt, params) {
  const key = await scryptAsync(password, salt, KEY_LENGTH, {
    ...params,
    maxmem: maxmemFor(params),
  })
  return key.toString('hex')
}

export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return { hash: encode(PARAMS, await derive(password, salt, PARAMS)), salt }
}

/** Salt for derivations whose result is thrown away — see burnPassword. */
const DUMMY_SALT = randomBytes(16).toString('hex')

export async function verifyPassword(password, salt, stored) {
  const { params, hash, legacy } = decode(stored)

  const actual = Buffer.from(await derive(password, salt, params))
  const expected = Buffer.from(hash)

  // A legacy hash is cheaper to verify than the burn below costs, which turns
  // the timing back into an oracle — an inverted one, but readable all the
  // same: fast means "exists, not yet upgraded", slow means "no such user".
  // Paying the current cost as well closes most of that gap, and the account
  // stops being legacy the moment this login succeeds.
  if (legacy) await derive(password, DUMMY_SALT, PARAMS)

  // Length check first — timingSafeEqual throws on a mismatch.
  const ok = actual.length === expected.length && timingSafeEqual(actual, expected)
  return { ok, needsUpgrade: ok && legacy }
}

/**
 * Burns the same work as a real verification, then fails.
 *
 * Without this the login route short-circuits on an unknown username and
 * answers in about a millisecond, while a known one costs a full derivation —
 * a clean oracle for discovering which usernames exist.
 */
export async function burnPassword(password) {
  await derive(password, DUMMY_SALT, PARAMS)
  return { ok: false, needsUpgrade: false }
}

/* ── Session tokens ────────────────────────────────────────────────────── */

const b64 = (value) => Buffer.from(value).toString('base64url')

function sign(payload) {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url')
}

export function createToken(user) {
  const payload = b64(
    JSON.stringify({ id: user.id, username: user.username, exp: Date.now() + SESSION_TTL_MS }),
  )
  return `${payload}.${sign(payload)}`
}

export function readToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null

  const [payload, signature] = token.split('.')
  const expected = sign(payload)

  // Constant-time compare so a forged signature cannot be probed byte by byte.
  const a = Buffer.from(signature ?? '')
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof claims.exp !== 'number' || claims.exp < Date.now()) return null
    return claims
  } catch {
    return null
  }
}

/* ── Cookies ───────────────────────────────────────────────────────────── */

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=')
        return index === -1
          ? [part, '']
          : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))]
      }),
  )
}

/**
 * Cookie attributes.
 *
 * Secure is conditional only because a plain-HTTP origin would otherwise
 * refuse the cookie in development; localhost counts as a secure context, so
 * this could be unconditional for most setups but breaks a LAN-IP dev server.
 *
 * SameSite defaults to Strict: this cookie only ever authenticates the admin
 * portal, which is never linked to from elsewhere, so there is nothing to lose
 * and it removes the subdomain-is-same-site gap that Lax leaves open. It is
 * configurable because a front end on a different registrable domain needs
 * None, which the browser will only honour alongside Secure.
 */
function attributes() {
  return [
    'HttpOnly',
    `SameSite=${COOKIE_SAMESITE}`,
    'Path=/',
    IS_PRODUCTION || COOKIE_SAMESITE === 'None' ? 'Secure' : null,
  ].filter(Boolean)
}

export function setSessionCookie(res, token) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  // append, not setHeader — setHeader would drop any cookie already staged on
  // this response.
  res.append('Set-Cookie', `${COOKIE_NAME}=${token}; ${attributes().join('; ')}; Max-Age=${maxAge}`)
}

export function clearSessionCookie(res) {
  res.append('Set-Cookie', `${COOKIE_NAME}=; ${attributes().join('; ')}; Max-Age=0`)
}

/* ── Middleware ────────────────────────────────────────────────────────── */

/** Attaches `req.user` when a valid session cookie is present. Never rejects. */
export async function attachUser(req, _res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie)
    const claims = readToken(cookies[COOKIE_NAME])

    if (!claims) {
      req.user = null
      return next()
    }

    // Re-read every request, so deleting a user revokes their session at once
    // rather than at the token's twelve-hour expiry.
    const [user] = await sql`SELECT id, username FROM users WHERE id = ${claims.id}`
    req.user = user ?? null
    next()
  } catch (error) {
    next(error)
  }
}

/** Gate for everything that writes. */
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in to continue.' })
  next()
}

/* ── Queries ───────────────────────────────────────────────────────────── */

export async function findUser(username) {
  const [user] = await sql`SELECT * FROM users WHERE username = ${username}`
  return user ?? null
}

export async function createUser(username, password) {
  const { hash, salt } = await hashPassword(password)
  await sql`
    INSERT INTO users (username, password_hash, salt)
    VALUES (${username}, ${hash}, ${salt})
  `
  return findUser(username)
}

/**
 * Re-hashes at the current cost.
 *
 * Called after a successful login against a legacy hash. A cost increase
 * cannot be applied to a stored hash — the plaintext only exists during the
 * login that just proved it, so that is the one moment it can happen.
 */
export async function upgradeHash(user, password) {
  const { hash, salt } = await hashPassword(password)
  await sql`
    UPDATE users SET password_hash = ${hash}, salt = ${salt} WHERE id = ${user.id}
  `
}
