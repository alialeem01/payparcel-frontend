import { useState, type FormEvent } from 'react'
import { trackOrder, STATUS_PROGRESS, TERMINAL_STATUSES, statusSlug, safeText, type TrackingResult } from '../lib/api'
import { Search, Loader2, CheckCircle2, Clock, MapPin, User, Calendar, Building2, Package } from 'lucide-react'

export default function DashboardTrackPage() {
  const [trackingId, setTrackingId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TrackingResult | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!trackingId.trim()) return

    setLoading(true)
    try {
      const data = await trackOrder(trackingId.trim().toUpperCase())
      setResult(data)
    } catch {
      setError('No order found with that tracking ID.')
    } finally {
      setLoading(false)
    }
  }

  const isTerminal = result ? (TERMINAL_STATUSES as string[]).includes(result.status) : false
  const currentStepIndex = result
    ? STATUS_PROGRESS.indexOf(result.status as (typeof STATUS_PROGRESS)[number])
    : -1

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1><Search size={28} /> Tracker</h1>
        <p>Track any parcel by entering its tracking number.</p>
      </div>

      <form onSubmit={handleSubmit} className="track-form">
        <input
          type="text"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="e.g. PP2608AB12"
          className="track-input"
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" /> : 'Track'}
        </button>
      </form>

      {error && <div className="form-error">{error}</div>}

      {result && (
        <div className="track-result">
          <div className="track-result-header">
            <div>
              <span className="track-label">Tracking ID</span>
              <span className="track-value">{result.tracking_id}</span>
            </div>
            <div>
              <span className="track-label">Status</span>
              <span className={`status-badge status-${statusSlug(result.status)}`}>
                {result.status}
              </span>
            </div>
          </div>

          <div className="track-customer">
            <span className="track-label">Consignee</span>
            <span className="track-customer-name">{result.consignee}</span>
          </div>

          {!isTerminal && currentStepIndex >= 0 ? (
            <div className="track-progress">
              {STATUS_PROGRESS.map((status, i) => {
                const done = i <= currentStepIndex
                const current = i === currentStepIndex
                return (
                  <div key={status} className={`progress-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                    <div className="progress-dot">
                      {done ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>
                    <span className="progress-label">{status}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="cancelled-notice">Status: {safeText(result.status)}</div>
          )}

          <div className="track-meta">
            <div><MapPin size={16} /> <span className="track-label">City</span> {safeText(result.city)}</div>
            <div><User size={16} /> <span className="track-label">Consignee</span> {safeText(result.consignee)}</div>
            <div><Building2 size={16} /> <span className="track-label">Shipper</span> {safeText(result.shipper_name)}</div>
            <div><Calendar size={16} /> <span className="track-label">Shipment Date</span> {result.shipment_date ? new Date(result.shipment_date).toLocaleString() : '—'}</div>
            <div><Package size={16} /> <span className="track-label">Delivery Date</span> {result.delivery_date ? new Date(result.delivery_date).toLocaleString() : '—'}</div>
          </div>
        </div>
      )}
    </div>
  )
}
