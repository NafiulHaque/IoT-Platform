import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user,       setUser]       = useState(null)
  const [token,      setToken]      = useState(() => sessionStorage.getItem('iot-token'))
  const [loading,    setLoading]    = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Check if first-run setup is needed
      try {
        const { data } = await api.get('/auth/check-setup')
        if (data.needsSetup) { setNeedsSetup(true); setLoading(false); return }
      } catch { /* server unreachable — proceed normally */ }

      // Verify existing token
      if (!token) { setLoading(false); return }
      try {
        const { data } = await api.get('/auth/me')
        setUser(data)
      } catch {
        logout()
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [token])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    sessionStorage.setItem('iot-token', data.token)
    setToken(data.token)
    setUser(data.user)
    setNeedsSetup(false)
    return data
  }

  const logout = () => {
    sessionStorage.removeItem('iot-token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, needsSetup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)