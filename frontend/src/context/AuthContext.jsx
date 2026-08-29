import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { loginUser, registerUser, fetchMe } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('datalens_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('datalens_token')
    if (!token) {
      setLoading(false)
      return
    }
    fetchMe()
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('datalens_user', JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem('datalens_token')
        localStorage.removeItem('datalens_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const persistSession = (data) => {
    localStorage.setItem('datalens_token', data.access_token)
    localStorage.setItem('datalens_user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const login = useCallback(async (email, password) => {
    const res = await loginUser({ email, password })
    persistSession(res.data)
    return res.data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const res = await registerUser({ name, email, password })
    persistSession(res.data)
    return res.data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('datalens_token')
    localStorage.removeItem('datalens_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
