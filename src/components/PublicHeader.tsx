import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'

export default function PublicHeader() {
  return (
    <header className="public-header">
      <Link to="/" className="header-brand">
        <Package size={28} />
        <span>Pay Parcel</span>
      </Link>
      <nav className="header-nav">
        <a href="/#services">Services</a>
        <a href="/#about">About</a>
        <Link to="/track">Track Parcel</Link>
        <Link to="/login" className="btn-outline btn-sm">Sign In</Link>
        <Link to="/signup" className="btn-primary btn-sm">Get Started</Link>
      </nav>
    </header>
  )
}
