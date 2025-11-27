import { useEffect, useState } from "react"
import client from "../api/client.js"
import { useAuth } from "../context/AuthContext.jsx"

export default function Users() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const load = () => {
    setLoading(true)
    client.get("/auth/users").then((r) => { setItems(r.data); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])
  return (
    <div className={"dashboard" + (user?.role === 'admin' ? "" : " reader")}> 
      <h2>Users</h2>
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <ul className="book-list">
          {items.map((u) => (
            <li key={u.id} className="book-item">
              <div className="item-body">
                <div className="book-meta">
                  <h3>{u.email}</h3>
                  <p>{u.name}</p>
                  <p>{u.role}</p>
                  <p>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
