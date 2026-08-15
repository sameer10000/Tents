import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/auth'
import { ApiError } from '../../lib/api'
import { Monogram } from '../../components/BrandMark'
import { HeroScene } from '../../components/HeroScene'
import { Banner, inputClass } from '../../components/admin/fields'
import { ArrowIcon, LockIcon } from '../../components/icons'

export function AdminLogin() {
  const { user, ready, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  if (ready && user) return <Navigate to={from} replace />

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    try {
      await signIn(username.trim(), password)
      navigate(from, { replace: true })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      {/* Left — the form */}
      <div className="flex items-center justify-center px-5 py-16 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          <Link to="/" className="inline-flex items-center gap-3 text-ink">
            <Monogram className="h-8 w-8 text-accent" />
            <span className="font-display text-xl font-light tracking-[0.16em]">
              CANVAS
            </span>
          </Link>

          <p className="eyebrow eyebrow-accent mt-12">Staff portal</p>
          <h1 className="mt-4 font-display text-[clamp(2.2rem,4vw,3rem)] leading-tight font-light">
            Sign in to the catalogue.
          </h1>
          <p className="mt-4 text-sm leading-relaxed font-light text-muted">
            Add pieces, open new lineups, upload photography and set pricing. Changes
            appear on the storefront immediately.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <label className="block">
              <span className="eyebrow">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={`${inputClass} mt-2`}
                autoComplete="username"
                autoFocus
                required
              />
            </label>

            <label className="block">
              <span className="eyebrow">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${inputClass} mt-2`}
                autoComplete="current-password"
                required
              />
            </label>

            {error ? <Banner tone="error">{error}</Banner> : null}

            <button type="submit" disabled={busy} className="btn-luxe btn-solid w-full">
              {busy ? 'Signing in…' : 'Sign in'}
              <ArrowIcon className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 flex items-start gap-2.5 text-[0.7rem] leading-relaxed font-light text-muted">
            <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            The admin account is created the first time the API starts. Its password is
            printed to that terminal once, or set with ADMIN_PASSWORD before the first
            run.
          </p>
        </motion.div>
      </div>

      {/* Right — the scene */}
      <div className="grain relative hidden overflow-hidden bg-ink-950 lg:block">
        <HeroScene className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/40" />
        <div className="grain-layer" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="eyebrow text-brass-300">Canvas Emporium</p>
          <p className="mt-4 max-w-[28ch] font-display text-3xl leading-tight font-light text-ivory-100">
            Shelter, drawn before it is sewn.
          </p>
        </div>
      </div>
    </div>
  )
}
