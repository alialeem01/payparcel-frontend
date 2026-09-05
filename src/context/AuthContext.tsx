import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  fetchProfile,
  loginCustomer,
  registerCustomer,
  clearTokens,
  getAccessToken,
  setAuthExpiredHandler,
  scheduleRefresh,
  type Customer,
} from '../lib/api'

interface AuthContextType {
  user: { id: string } | null
  profile: Customer | null
  loading: boolean
  signUp: (email: string, password: string, details: {
    business_name: string
    contact_person: string
    phone: string
    address: string
  }) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile() {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      const data = await fetchProfile()
      setUser({ id: data.id })
      setProfile(data)
      scheduleRefresh()
    } catch (err) {
      // Only clear tokens for definitive auth failures.
      // Transient errors (network, 5xx) should not log the user out.
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('session expired') || msg.toLowerCase().includes('unauthorized')) {
        clearTokens()
        setUser(null)
        setProfile(null)
      }
      // Otherwise leave existing state as-is; the user stays logged in
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setAuthExpiredHandler(() => {
      clearTokens()
      setUser(null)
      setProfile(null)
      window.location.href = '/login'
    })
    loadProfile()
    return () => setAuthExpiredHandler(null)
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    loading,
    async signUp(email, password, details) {
      try {
        await registerCustomer({
          business_name: details.business_name,
          contact_person: details.contact_person,
          email,
          phone: details.phone,
          password,
          address: details.address,
        })
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Registration failed.' }
      }
    },
    async signIn(email, password) {
      try {
        await loginCustomer(email, password)
        await loadProfile()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Login failed.' }
      }
    },
    async signOut() {
      clearTokens()
      setUser(null)
      setProfile(null)
    },
    async refreshProfile() {
      await loadProfile()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
