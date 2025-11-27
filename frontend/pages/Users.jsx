import { useEffect, useState } from "react"
import client from "../api/client.js"
import { useAuth } from "../context/AuthContext.jsx"

export default function Users() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState("")
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
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.name}</td>
                  <td>
                    <div className="user-actions">
                      <span className="role-pill">{u.role}</span>
                      <button
                        className="user-rename-btn"
                        disabled={savingId === u.id}
                        onClick={async () => {
                          const next = window.prompt("Rename user", u.name)
                          if (!next || !next.trim()) return
                          try {
                            setSavingId(u.id)
                            await client.put(`/auth/users/${u.id}`, { name: next.trim() })
                            setItems(items.map((it) => it.id === u.id ? { ...it, name: next.trim() } : it))
                          } finally { setSavingId("") }
                        }}
                      >Rename</button>
                      <button
                        className="user-delete-btn"
                        disabled={savingId === u.id}
                        onClick={async () => {
                          if (!window.confirm(`Delete ${u.email}?`)) return
                          try {
                            setSavingId(u.id)
                            await client.delete(`/auth/users/${u.id}`)
                            setItems(items.filter((it) => it.id !== u.id))
                          } finally { setSavingId("") }
                        }}
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
