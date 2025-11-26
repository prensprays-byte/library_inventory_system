import { createContext, useContext, useEffect, useMemo, useState } from "react"
import client from "../api/client.js"

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "")
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!token) return
    client.get("/auth/me").then((r) => setUser(r.data)).catch(() => {})
  }, [token])

  const login = async (email, password) => {
    const r = await client.post("/auth/login", { email, password })
    setToken(r.data.token)
    localStorage.setItem("token", r.data.token)
    setUser(r.data.user)
    return r.data.user
  }

  const register = async (name, email, password) => {
    const r = await client.post("/auth/register", { name, email, password })
    setToken(r.data.token)
    localStorage.setItem("token", r.data.token)
    setUser(r.data.user)
    return r.data.user
  }

  const logout = () => {
    setToken("")
    setUser(null)
    localStorage.removeItem("token")
  }

  const value = useMemo(() => ({ token, user, login, register, logout }), [token, user])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}
