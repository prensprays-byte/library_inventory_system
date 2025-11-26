import { useEffect, useState } from "react"
import client from "../api/client.js"

export default function Dashboard() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: "", author: "", isbn: "", quantity: 1, description: "", coverUrl: "" })
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const r = await client.get("/books")
      setItems(r.data)
    } catch {
      setError("Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    setError("")
    try {
      const r = await client.post("/books", form)
      setItems([r.data, ...items])
      setForm({ title: "", author: "", isbn: "", quantity: 1, description: "", coverUrl: "" })
    } catch {
      setError("Create failed")
    }
  }

  const remove = async (id) => {
    await client.delete(`/books/${id}`)
    setItems(items.filter((i) => i._id !== id))
  }

  return (
    <div className="dashboard">
      <h2>Your books</h2>
      <form className="grid" onSubmit={create}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        <input placeholder="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
        <input type="number" min="0" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        <input placeholder="Cover URL" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {error && <div className="error">{error}</div>}
        <button className="btn primary" type="submit">Add</button>
      </form>
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <ul className="book-list">
          {items.map((b) => (
            <li key={b._id} className="book-item">
              {b.coverUrl && <img src={b.coverUrl} alt="" />}
              <div className="book-meta">
                <h3>{b.title}</h3>
                <p>{(b.description && String(b.description).trim()) ? b.description : "No description"}</p>
                <p>{b.author}</p>
                <p>Qty: {b.quantity}</p>
              </div>
              <button className="ghost" onClick={() => remove(b._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
