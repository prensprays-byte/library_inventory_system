import { Link } from "react-router-dom"

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <h1 className="hero-title">Organize your library beautifully</h1>
          <p className="hero-sub">Track books, authors, and quantities in one place</p>
          <div className="hero-actions">
            <Link className="btn primary" to="/register">Get Started</Link>
            <Link className="btn" to="/login">Sign In</Link>
          </div>
        </div>
      </section>
      <section className="features">
        <div className="feature-card">
          <h3>Browse</h3>
          <p>Find titles fast with a focused search.</p>
        </div>
        <div className="feature-card">
          <h3>Manage</h3>
          <p>Admins add books and track stacks remaining.</p>
        </div>
      </section>
    </>
  )
}
