import { useMemo, useState } from 'react'
import api from '../services/api.js'
import { AuthContext } from './AuthContextBase.js'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cse_portal_token'))
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('cse_portal_user')
    return stored ? JSON.parse(stored) : null
  })

  async function login(credentials) {
    const { data } = await api.post('/login', credentials)
    localStorage.setItem('cse_portal_token', data.token)
    localStorage.setItem('cse_portal_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }

  function logout() {
    localStorage.removeItem('cse_portal_token')
    localStorage.removeItem('cse_portal_user')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(() => ({ token, user, login, logout }), [token, user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
