import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    try {
      const u = await login(email, password)
      nav(u?.role === 'admin' ? "/admin" : "/browse")
    } catch {
      setError("Invalid credentials")
    }
  }
  return (
    <div className="signin-page">
      <div className="signin-panel">
        <h2>Sign In</h2>
        <form onSubmit={onSubmit} className="form">
          <label>Email Address</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
          <label>Password</label>
          <div className="password-row">
            <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} placeholder="••••••••" />
            <button type="button" className="ghost toggle" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn primary" type="submit">Continue</button>
        </form>
        <div className="split-actions">
          <button className="btn" onClick={() => nav("/register")}>Register</button>
        </div>
      </div>
    </div>
  )
}
