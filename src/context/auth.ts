import { createContext, useContext } from 'react'

export interface AdminUser {
  id: number
  username: string
}

export interface AuthValue {
  user: AdminUser | null
  /** False until the initial `/auth/me` check has settled. */
  ready: boolean
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
