import { useEffect, useState, useCallback } from "react"
import { useAuth } from "../context/AuthContext.jsx"
import client from "../api/client.js"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ coverUrl: "", title: "", publishedAt: "", genre: "", description: "" })
  const [error, setError] = useState("")
  const [readOnly, setReadOnly] = useState(user?.role !== 'admin')
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ coverUrl: "", title: "", publishedAt: "", genre: "", description: "" })
  const [saving, setSaving] = useState(false)
  

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (user?.role === 'admin') {
        const r = await client.get("/books")
        setItems(r.data)
        setReadOnly(false)
      } else {
        const pr = await client.get("/public/books?limit=50")
        setItems(pr.data)
        setReadOnly(true)
      }
    } catch {
      setError("Failed to load")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const create = async (e) => {
    e.preventDefault()
    setError("")
    try {
      if (readOnly) {
        setError("Read-only mode for readers")
        return
      }
      if (!form.coverUrl || !form.title || !form.publishedAt || !form.genre || !form.description) {
        setError("Please fill all fields")
        return
      }
      const toIso = (v) => {
        if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
          const [y, m, d] = v.split('-').map(Number)
          const local = new Date(y, m - 1, d, 12)
          return local.toISOString()
        }
        const dt = new Date(v)
        return isNaN(dt.getTime()) ? null : dt.toISOString()
      }
      const iso = toIso(form.publishedAt)
      if (!iso) {
        setError("Invalid date")
        return
      }
      const payload = { ...form, publishedAt: iso }
      await client.post("/books", payload)
      setReadOnly(false)
      await load()
      setForm({ coverUrl: "", title: "", publishedAt: "", genre: "", description: "" })
    } catch (err) {
      const data = err?.response?.data || {}
      const msg = data.error === "missing_fields" && Array.isArray(data.missing)
        ? `Missing: ${data.missing.join(', ')}`
        : (data.error || "Create failed")
      setError(msg)
    }
  }

  const remove = async (id) => {
    if (readOnly) return
    await client.delete(`/books/${id}`)
    setItems(items.filter((i) => i._id !== id))
  }

  const toDateInput = (v) => {
    if (!v) return ""
    const d = new Date(v)
    if (isNaN(d.getTime())) return ""
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  const openEdit = (b) => {
    if (readOnly) return
    setEditId(b._id)
    setEditForm({
      coverUrl: b.coverUrl || "",
      title: b.title || "",
      publishedAt: toDateInput(b.publishedAt),
      genre: b.genre || "",
      description: (b.description && String(b.description)) || ""
    })
  }

  const saveEdit = async () => {
    if (!editId) return
    setSaving(true)
    try {
      const toIso = (v) => {
        if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
          const [y, m, d] = v.split('-').map(Number)
          const local = new Date(y, m - 1, d, 12)
          return local.toISOString()
        }
        const dt = new Date(v)
        return isNaN(dt.getTime()) ? null : dt.toISOString()
      }
      const iso = toIso(editForm.publishedAt)
      if (!iso) { setError("Invalid date"); setSaving(false); return }
      const payload = { ...editForm, publishedAt: iso }
      const r = await client.put(`/books/${editId}`, payload)
      setItems(items.map((i) => (i._id === editId ? r.data : i)))
      setEditId(null)
    } catch (err) {
      setError(err?.response?.data?.error || "Update failed")
    } finally {
      setSaving(false)
    }
  }

  

  return (
    <div className={"dashboard" + (readOnly ? " reader" : "")}>
      <h2>Admin Books Management</h2>
      <div className="stats">
        <div className="stat-card"><h4>Total books</h4><p>{items.length}</p></div>
      </div>
      {!readOnly && (
      <form className="grid grid-2" onSubmit={create}>
        <input className="pill-input" placeholder="Link of the picture" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} />
        <input className="pill-input" placeholder="Title of the book" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="pill-input" placeholder="Genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
        <input
          className="pill-input"
          type="date"
          placeholder="Published date"
          value={form.publishedAt || ""}
          onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
          onFocus={(e) => { if (e.target.showPicker) e.target.showPicker() }}
          onClick={(e) => { if (e.target.showPicker) e.target.showPicker() }}
        />
        
        <textarea className="pill-input" placeholder="Description of the book" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {error && <div className="error">{error}</div>}
        <button className="btn primary" type="submit">Add</button>
      </form>
      )}
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <ul className="book-list">
          {items.map((b) => (
            <li key={b._id} className="book-item">
              <div className="item-body">
                {b.coverUrl && <img src={b.coverUrl} alt="" />}
                <div className="book-meta">
                  <h3>{b.title}</h3>
                  <p>{b.genre}</p>
                  <p>{b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : ""}</p>
                  <p>{(b.description && String(b.description).trim()) ? b.description : "No description"}</p>
                </div>
              </div>
              {!readOnly && (
                <div className="item-actions">
                  <button className="edit-btn" type="button" onClick={() => openEdit(b)}>Edit</button>
                  <button className="delete-btn" onClick={() => remove(b._id)}>Delete</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {!readOnly && editId && (
        <div className="modal-backdrop" onClick={() => !saving && setEditId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Book</h3>
            <div className="grid">
              <input className="pill-input" placeholder="Link of the picture" value={editForm.coverUrl} onChange={(e) => setEditForm({ ...editForm, coverUrl: e.target.value })} />
              <input className="pill-input" placeholder="Genre" value={editForm.genre} onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })} />
              <input className="pill-input" placeholder="Title of the book" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              <input className="pill-input" type="date" value={editForm.publishedAt || ""} onChange={(e) => setEditForm({ ...editForm, publishedAt: e.target.value })} />
              <textarea className="pill-input span-2" placeholder="Description of the book" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              {error && <div className="error">{error}</div>}
              <button className="btn" type="button" onClick={() => setEditId(null)} disabled={saving}>Cancel</button>
              <button className="btn primary" type="button" onClick={saveEdit} disabled={saving}>Save</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}
