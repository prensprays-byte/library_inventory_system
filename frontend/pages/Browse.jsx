import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import client from "../api/client.js"

export default function Browse() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [author] = useState("")
  
  const [limit] = useState(24)
  
  const [selected, setSelected] = useState(null)
  const [scrollEl, setScrollEl] = useState(null)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (author) params.set("author", author)
    
    params.set("limit", String(limit))
    const r = await client.get(`/public/books?${params.toString()}`)
    setItems(r.data)
    setLoading(false)
  }

  

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (author) params.set("author", author)
    
    params.set("limit", String(limit))
    client.get(`/public/books?${params.toString()}`).then((r) => {
      setItems(r.data)
      setLoading(false)
    })
  }, [q, author, limit])

  return (
    <div className="dashboard">
      <h2>Browse books</h2>
      {/* stats removed from Browse; visible in dashboard only */}
      <div className="grid">
        <div className="search-row">
          <input className="search-input" placeholder="Search by book title" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="search-btn" onClick={load}>Search</button>
        </div>
        {user?.role === 'admin' && (
          <Link className="btn primary" to="/admin">Add Book</Link>
        )}
      </div>
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <div className="carousel-section">
          <div className="section-header">
            <h3>Books We Love</h3>
          </div>
          <div className="carousel">
            <button className="carousel-arrow left" onClick={() => { if (scrollEl) scrollEl.scrollBy({ left: -((scrollEl.clientWidth) - 60), behavior: 'smooth' }) }}>
              ◀
            </button>
            <div className="carousel-track" ref={(el) => setScrollEl(el)}>
              {items.map((b) => (
                <div key={b._id || b.id} className="carousel-card">
                  {b.coverUrl && (
                    <img src={b.coverUrl} alt="" onClick={() => nav(`/books/${b._id || b.id}`)} />
                  )}
                  <div className="carousel-meta">
                    <div className="title">{b.title}</div>
                    
                    <button className="btn primary" type="button" onClick={() => nav(`/books/${b._id || b.id}`)}>Read</button>
                    
                  </div>
                </div>
              ))}
            </div>
            <button className="carousel-arrow right" onClick={() => { if (scrollEl) scrollEl.scrollBy({ left: (scrollEl.clientWidth) - 60, behavior: 'smooth' }) }}>
              ▶
            </button>
          </div>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {selected.coverUrl && (
              <img src={selected.coverUrl} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 12 }} />
            )}
            <div style={{ marginTop: 12 }}>
              <h3 style={{ margin: 0 }}>{selected.title}</h3>
              <p style={{ margin: '4px 0' }}>{selected.genre}</p>
              <p style={{ margin: '4px 0' }}>{selected.publishedAt ? new Date(selected.publishedAt).toLocaleDateString() : ""}</p>
              <p style={{ margin: '8px 0' }}>{selected.description}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
