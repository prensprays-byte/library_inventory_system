import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    try {
      const u = await register(name, email, password)
      nav(u?.role === 'admin' ? "/admin" : "/browse")
    } catch {
      setError("Registration failed")
    }
  }
  return (
    <div className="auth-card">
      <h2>Create account</h2>
      <form onSubmit={onSubmit} className="form">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Your name" />
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
        <label>Password</label>
        <div className="password-row">
          <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} placeholder="At least 6 characters" />
          <button type="button" className="ghost toggle" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn primary" type="submit">Register</button>
      </form>
    </div>
  )
}
