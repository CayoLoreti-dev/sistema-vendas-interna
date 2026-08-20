import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, AUTH_STORAGE_KEY } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!storedAuth) {
      setCarregando(false)
      return
    }

    try {
      const auth = JSON.parse(storedAuth)
      setUsuario(auth.usuario || null)
      setToken(auth.token || null)
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } finally {
      setCarregando(false)
    }
  }, [])

  async function login(telefone, pin) {
    const auth = await api.post('/auth/login', { telefone, pin })

    setUsuario(auth.usuario)
    setToken(auth.token)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))

    return auth
  }

  function logout() {
    setUsuario(null)
    setToken(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const value = useMemo(() => ({
    usuario,
    token,
    carregando,
    login,
    logout,
  }), [usuario, token, carregando])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }

  return context
}
