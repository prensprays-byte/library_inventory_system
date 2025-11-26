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
      
    </>
  )
}
