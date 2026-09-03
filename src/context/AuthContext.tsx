import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  fetchProfile,
  loginCustomer,
  registerCustomer,
  clearToken,
  getToken,
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
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const data = await fetchProfile()
      setUser({ id: data.id })
      setProfile(data)
    } catch {
      clearToken()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
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
      clearToken()
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
