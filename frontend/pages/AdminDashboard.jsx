import { useEffect, useState, useCallback } from "react"
import { useAuth } from "../context/AuthContext.jsx"
import client from "../api/client.js"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ coverUrl: "", title: "", publishedAt: "", genre: "", description: "", quantity: "" })
  const [error, setError] = useState("")
  const [readOnly, setReadOnly] = useState(user?.role !== 'admin')
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ coverUrl: "", title: "", publishedAt: "", genre: "", description: "", quantity: "" })
  const [stackSavingId, setStackSavingId] = useState("")
  const [saving, setSaving] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  

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
      if (String(form.quantity).trim() !== "") {
        const q = Number(form.quantity)
        if (!Number.isFinite(q) || q < 0) { setError("Invalid stacks"); return }
        payload.quantity = q
      }
      await client.post("/books", payload)
      setReadOnly(false)
      await load()
      setForm({ coverUrl: "", title: "", publishedAt: "", genre: "", description: "", quantity: "" })
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
      description: (b.description && String(b.description)) || "",
      quantity: typeof b.quantity === "number" ? String(b.quantity) : ""
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
      if (String(editForm.quantity).trim() !== "") {
        const q = Number(editForm.quantity)
        if (!Number.isFinite(q) || q < 0) { setError("Invalid stacks"); setSaving(false); return }
        payload.quantity = q
      }
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
        <div className="stat-card"><h4>Total stacks</h4><p>{items.reduce((sum, b) => sum + (Number(b.quantity)||0), 0)}</p></div>
      </div>
      {!readOnly && (
      <form className="grid grid-2" onSubmit={create}>
        <input className="pill-input" placeholder="Link of the picture" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} />
        <input className="pill-input" placeholder="Title of the book" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="pill-input" placeholder="Genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
        <input className="pill-input" type="number" min="0" step="1" placeholder="Stacks (quantity)" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
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
                {b.coverUrl && <img src={b.coverUrl} alt="" onClick={() => setViewItem(b)} />}
              </div>
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

      {viewItem && (
        <div className="modal-backdrop" onClick={() => setViewItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {viewItem.coverUrl && (
              <img src={viewItem.coverUrl} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 12 }} />
            )}
            <div style={{ marginTop: 12 }}>
              <h3 style={{ margin: 0 }}>{viewItem.title}</h3>
              <p style={{ margin: '4px 0' }}>{viewItem.genre}</p>
              <p style={{ margin: '4px 0' }}>{viewItem.publishedAt ? new Date(viewItem.publishedAt).toLocaleDateString() : ""}</p>
              <p style={{ margin: '4px 0', fontWeight: 600 }}>Stacks: {typeof viewItem.quantity === 'number' ? viewItem.quantity : 0}</p>
              <p style={{ margin: '8px 0' }}>{(viewItem.description && String(viewItem.description).trim()) ? viewItem.description : "No description"}</p>
            </div>
            {!readOnly && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button className="stack-btn" type="button" disabled={!!stackSavingId} onClick={async () => {
                  const cur = typeof viewItem.quantity === 'number' ? viewItem.quantity : 0
                  const nextStr = window.prompt('Set stacks (quantity)', String(cur))
                  if (nextStr === null) return
                  const next = Number(nextStr)
                  if (!Number.isFinite(next) || next < 0) { alert('Invalid stacks'); return }
                  try {
                    setStackSavingId(viewItem._id)
                    const r = await client.put(`/books/${viewItem._id}`, { quantity: next })
                    setItems(items.map((i) => (i._id === viewItem._id ? r.data : i)))
                    setViewItem(r.data)
                  } finally { setStackSavingId('') }
                }}>Stacks</button>
                <button className="edit-btn" type="button" onClick={() => { openEdit(viewItem); setViewItem(null) }}>Edit</button>
                <button className="delete-btn" onClick={() => { remove(viewItem._id); setViewItem(null) }}>Delete</button>
                <button className="btn" onClick={() => setViewItem(null)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
      
    </div>
  )
}
