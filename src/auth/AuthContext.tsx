import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from '../api/client'

export type User = {
  id: number
  name: string
  phone: string
  city: string | null
  locale: string
  avatar_url?: string | null
  password_set?: boolean
  roles: string[]
  worker_profile: Record<string, unknown> | null
  caterer_profile?: Record<string, unknown> | null
  subscription?: { id: number; status: string; ends_at?: string; plan?: { name: string } } | null
}

type AuthState = {
  user: User | null
  loading: boolean
  login: (phone: string, code: string) => Promise<User>
  loginWithPassword: (phone: string, password: string) => Promise<User>
  register: (input: {
    phone: string
    name: string
    role: 'customer' | 'caterer' | 'worker' | 'agency' | 'driver' | 'home_pro'
    city?: string
    password: string
    company_name?: string
  }) => Promise<User>
  requestOtp: (phone: string, intent?: 'login') => Promise<string | undefined>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  applyUser: (user: User) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await api<User>('/me')
      setUser(me)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  function applyUser(next: User) {
    setUser(next)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    async requestOtp(phone, intent = 'login') {
      const res = await api<{ otp?: string }>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone, intent }),
      })
      return res.otp
    },
    async login(phone, code) {
      const res = await api<{ token: string; user: User }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      })
      setToken(res.token)
      setUser(res.user)
      return res.user
    },
    async register(input) {
      const res = await api<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      setToken(res.token)
      setUser(res.user)
      return res.user
    },
    async loginWithPassword(phone, password) {
      const res = await api<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      })
      setToken(res.token)
      setUser(res.user)
      return res.user
    },
    async logout() {
      try {
        await api('/auth/logout', { method: 'POST' })
      } finally {
        setToken(null)
        setUser(null)
      }
    },
    refresh,
    applyUser,
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}
