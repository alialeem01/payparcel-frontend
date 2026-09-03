import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../lib/api'
import { Loader2, Settings, CheckCircle2 } from 'lucide-react'

export default function EditInfoPage() {
  const { profile, refreshProfile } = useAuth()
  const [businessName, setBusinessName] = useState(profile?.business_name ?? '')
  const [contactPerson, setContactPerson] = useState(profile?.contact_person ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [address, setAddress] = useState(profile?.address ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      await updateProfile({
        business_name: businessName,
        contact_person: contactPerson,
        phone,
        address,
      })
      await refreshProfile()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1><Settings size={28} /> Edit Info</h1>
        <p>Update your business and contact details.</p>
      </div>

      <form onSubmit={handleSubmit} className="book-form" style={{ maxWidth: 600 }}>
        <fieldset>
          <legend>Business Details</legend>
          <div className="form-grid">
            <label className="form-field form-field-full">
              <span>Business Name</span>
              <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business name" />
            </label>
            <label className="form-field">
              <span>Contact Person</span>
              <input required value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Your full name" />
            </label>
            <label className="form-field">
              <span>Phone Number</span>
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XX XXXXXXX" />
            </label>
            <label className="form-field form-field-full">
              <span>Business Address</span>
              <textarea required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your business address" />
            </label>
          </div>
        </fieldset>

        {success && (
          <div className="form-success">
            <CheckCircle2 size={18} /> Profile updated successfully.
          </div>
        )}
        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn-primary btn-lg" disabled={loading}>
          {loading && <Loader2 size={18} className="spin" />}
          Save Changes
        </button>
      </form>
    </div>
  )
}
