import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Loader2 } from 'lucide-react'

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  const [businessName, setBusinessName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const result = isLogin
      ? await signIn(email, password)
      : await signUp(email, password, {
          business_name: businessName,
          contact_person: contactPerson,
          phone,
          address,
        })

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    navigate(isLogin ? '/dashboard' : '/login')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Package size={40} />
          <span>Pay Parcel</span>
        </div>
        <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Sign in to manage your orders' : 'Start booking and tracking parcels'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <label className="form-field">
                <span>Business Name</span>
                <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business name" />
              </label>
              <label className="form-field">
                <span>Contact Person Name</span>
                <input required value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Your full name" />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </label>
              <label className="form-field">
                <span>Phone Number</span>
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XX XXXXXXX" />
              </label>
              <label className="form-field">
                <span>Password</span>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </label>
              <label className="form-field">
                <span>Confirm Password</span>
                <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </label>
              <label className="form-field">
                <span>Business Address</span>
                <input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your business address" />
              </label>
            </>
          )}
          {isLogin && (
            <>
              <label className="form-field">
                <span>Email</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </label>
              <label className="form-field">
                <span>Password</span>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </label>
            </>
          )}

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Loader2 size={18} className="spin" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link to={isLogin ? '/signup' : '/login'}>{isLogin ? 'Sign up' : 'Sign in'}</Link>
        </p>
        <p className="auth-back"><Link to="/">← Back to home</Link></p>
      </div>
    </div>
  )
}
