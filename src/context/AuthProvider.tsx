import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'
import { setCatalogue } from '../data/catalogue'
import { fetchCatalogue } from '../data/sync'
import { AuthContext } from './auth'
import type { AdminUser, AuthValue } from './auth'

/**
 * Owns the admin session and the initial catalogue hydration.
 *
 * Both happen once on mount. If the API is unreachable the storefront simply
 * carries on with the bundled data — only the admin portal needs the server.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      const [session, catalogue] = await Promise.allSettled([
        api.get<{ user: AdminUser | null }>('/auth/me'),
        fetchCatalogue(),
      ])

      if (cancelled) return

      if (session.status === 'fulfilled') setUser(session.value.user)

      // Only replace the seed if the payload actually holds a catalogue —
      // an empty database should not blank the storefront.
      if (catalogue.status === 'fulfilled' && catalogue.value.products.length > 0) {
        setCatalogue(catalogue.value)
      }

      setReady(true)
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (username: string, password: string) => {
    const result = await api.post<{ user: AdminUser }>('/auth/login', {
      username,
      password,
    })
    setUser(result.user)
  }, [])

  const signOut = useCallback(async () => {
    await api.post('/auth/logout')
    setUser(null)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ user, ready, signIn, signOut }),
    [user, ready, signIn, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
