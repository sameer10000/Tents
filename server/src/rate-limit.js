/**
 * Login throttling.
 *
 * Two separate problems, two mechanisms:
 *
 *   1. Guessing — a fixed number of failures per IP+username per window.
 *      Successes clear the counter, so a legitimate typo costs nothing.
 *
 *   2. Exhaustion — each verification allocates 64 MiB and holds it for the
 *      derivation. Enough simultaneous logins would take the process down on
 *      memory alone, entirely without guessing anything, so derivations are
 *      capped in flight as well.
 *
 * In-memory, therefore per-process. Correct for the single Express instance
 * this runs as; a multi-instance deployment wants Redis behind the same
 * interface.
 */

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 8

/** Bound on distinct keys, so a spray of addresses cannot grow this forever. */
const MAX_KEYS = 10_000

const buckets = new Map()

function sweep(now) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }

  // Still oversized after dropping the expired: evict oldest-first. Insertion
  // order is close enough to age for this purpose.
  if (buckets.size > MAX_KEYS) {
    const excess = buckets.size - MAX_KEYS
    let dropped = 0
    for (const key of buckets.keys()) {
      buckets.delete(key)
      if (++dropped >= excess) break
    }
  }
}

/** Null when the caller may proceed, else the seconds left on the lockout. */
export function checkLimit(key) {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) return null
  if (bucket.count < MAX_FAILURES) return null

  return Math.ceil((bucket.resetAt - now) / 1000)
}

export function recordFailure(key) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  bucket.count += 1
  // Sliding, not fixed: continued failures keep extending the lockout rather
  // than letting an attacker wait out a window that started on attempt one.
  bucket.resetAt = now + WINDOW_MS
}

export function clearFailures(key) {
  buckets.delete(key)
}

/* ── Public submissions ────────────────────────────────────────────────── */

const SUBMIT_WINDOW_MS = 60 * 60 * 1000

/**
 * Deliberately loose.
 *
 * The limit is per IP, and mobile carriers — especially in India, which is
 * most of this catalogue's traffic — put large numbers of subscribers behind
 * carrier-grade NAT. A handful of enquiries an hour would read as abuse from
 * one address while actually being several unrelated customers. The honeypot
 * is what stops bots; this only stops a flood.
 */
const SUBMIT_MAX = 20

const submissions = new Map()

/**
 * Throttles anonymous writes.
 *
 * The enquiry endpoint takes no credentials and inserts a row, which is the
 * shape every form-spam bot looks for. Six an hour is far more than a real
 * enquirer needs and far less than a script wants.
 *
 * Counts every attempt, not just failures — unlike login, a successful
 * submission is exactly what is being abused.
 */
export function checkSubmissionLimit(key) {
  const now = Date.now()

  for (const [existing, bucket] of submissions) {
    if (bucket.resetAt <= now) submissions.delete(existing)
  }
  if (submissions.size > MAX_KEYS) submissions.clear()

  const bucket = submissions.get(key)

  if (!bucket || bucket.resetAt <= now) {
    submissions.set(key, { count: 1, resetAt: now + SUBMIT_WINDOW_MS })
    return null
  }

  bucket.count += 1
  if (bucket.count <= SUBMIT_MAX) return null

  return Math.ceil((bucket.resetAt - now) / 1000)
}

/* ── Concurrency ───────────────────────────────────────────────────────── */

const MAX_CONCURRENT = 4

let inFlight = 0

/**
 * Runs a password derivation, or refuses.
 *
 * Refusing is the point — queueing would let an attacker build an unbounded
 * backlog of pending 64 MiB allocations, which is the failure this exists to
 * prevent.
 */
export async function withDerivationSlot(run) {
  if (inFlight >= MAX_CONCURRENT) return null

  inFlight += 1
  try {
    return await run()
  } finally {
    inFlight -= 1
  }
}
