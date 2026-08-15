import { Router } from 'express'
import {
  burnPassword,
  clearSessionCookie,
  createToken,
  findUser,
  setSessionCookie,
  upgradeHash,
  verifyPassword,
} from '../auth.js'
import { checkLimit, clearFailures, recordFailure, withDerivationSlot } from '../rate-limit.js'
import { HttpError } from '../validate.js'

export const authRouter = Router()

authRouter.post('/auth/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const password = String(req.body?.password ?? '')

  if (!username || !password) {
    throw new HttpError(400, 'Enter a username and a password.')
  }

  // Keyed on both, so one attacker cannot lock a real administrator out by
  // failing against their username from elsewhere.
  const key = `${req.ip}:${username.toLowerCase()}`

  const retryAfter = checkLimit(key)
  if (retryAfter !== null) {
    res.setHeader('Retry-After', String(retryAfter))
    throw new HttpError(429, 'Too many attempts. Try again in a few minutes.')
  }

  const user = await findUser(username)

  // Runs either way, so the response time does not reveal whether the username
  // exists. Returns null when the server is already saturated with derivations.
  const result = await withDerivationSlot(() =>
    user ? verifyPassword(password, user.salt, user.password_hash) : burnPassword(password),
  )

  if (result === null) {
    res.setHeader('Retry-After', '2')
    throw new HttpError(503, 'The server is busy. Try again in a moment.')
  }

  if (!user || !result.ok) {
    recordFailure(key)
    throw new HttpError(401, 'Those details were not recognised.')
  }

  clearFailures(key)

  // The one moment the plaintext is available to re-hash at the current cost.
  // Failing here must not fail the login — the credentials were correct.
  if (result.needsUpgrade) {
    try {
      await upgradeHash(user, password)
    } catch (error) {
      console.error('Could not upgrade password hash:', error)
    }
  }

  setSessionCookie(res, createToken(user))
  res.json({ user: { id: user.id, username: user.username } })
})

authRouter.post('/auth/logout', (_req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

authRouter.get('/auth/me', (req, res) => {
  res.json({ user: req.user ?? null })
})
