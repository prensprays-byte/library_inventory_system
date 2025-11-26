import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import client from "../api/client.js"
import { useAuth } from "../context/AuthContext.jsx"

export default function BookDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  
  const mainRef = useRef(null)

  useEffect(() => {
    const run = async () => {
      const r = await client.get(`/public/books/${id}`)
      setBook(r.data)
      setLoading(false)
    }
    run()
  }, [id])

  const goBack = () => {
    if (window.history.length > 2) {
      nav(-1)
      return
    }
    if (user?.role === 'admin') {
      nav('/admin')
    } else {
      nav('/')
    }
  }

  

  const read = () => {
    const el = mainRef.current
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) return <div className="loading">Loading…</div>
  if (!book) return <div className="error">Not found</div>


  return (
    <div className="dashboard detail-page">
      <div className="detail-grid">
        <aside className="detail-sidebar">
          {book.coverUrl && (
            <img src={book.coverUrl} alt="" className="detail-cover" />
          )}
            <div className="detail-actions">
              <button className="btn primary" onClick={goBack}>Back</button>
              <button className="btn" type="button" onClick={read}>Read</button>
              
            </div>
          <div className="detail-meta">
            
          </div>
        </aside>
        <main className="detail-main" ref={mainRef}>
          <h1 className="detail-title">{book.title}</h1>
          <div className="detail-desc">{book.description}</div>
          <div className="info-cards">
            <div className="info-card">
              <div className="label">Publish Date</div>
              <div className="value">{book.publishedAt ? new Date(book.publishedAt).toLocaleDateString() : ""}</div>
            </div>
            <div className="info-card">
              <div className="label">Genre</div>
              <div className="value">{book.genre || ""}</div>
            </div>
          </div>
          
        </main>
      </div>
    </div>
  )
}
