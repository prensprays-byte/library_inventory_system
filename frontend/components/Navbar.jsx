import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const onUsersPage = location.pathname.startsWith("/admin/users")
  const onLogout = () => {
    logout()
    nav("/")
  }
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="brand"><img src="/logo.webp" alt="" className="brand-logo" /> Library Inventory</div>
        <nav className="nav-links">
          
          {!user && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="primary">Register</Link>
            </>
          )}
          {user && user.role === 'admin' && (
            <>
              {onUsersPage && <Link to="/admin">Back</Link>}
              <Link to="/admin/users">Dashboard</Link>
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
