import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const onLogout = () => {
    logout()
    nav("/")
  }
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">Library Inventory</Link>
        <nav className="nav-links">
          
          {!user && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="primary">Register</Link>
            </>
          )}
          {user && user.role === 'admin' && (
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/users">Users</Link>
              <button className="ghost" onClick={onLogout}>Logout</button>
            </>
          )}
          {user && user.role !== 'admin' && (
            <button className="ghost" onClick={onLogout}>Logout</button>
          )}
        </nav>
      </div>
    </header>
  )
}
