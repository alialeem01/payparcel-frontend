import { useEffect, useState, type FormEvent } from 'react'
import { trackOrder, STATUS_PROGRESS, TERMINAL_STATUSES, statusSlug, safeText, type TrackingResult } from '../lib/api'
import { Loader2, CheckCircle2, Clock, MapPin, Phone, Calendar, Building2, Package, Wallet, Hash, Truck, FileText } from 'lucide-react'

export default function TrackForm({ initialTrackingId = '' }: { initialTrackingId?: string }) {
  const [trackingId, setTrackingId] = useState(initialTrackingId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TrackingResult | null>(null)

  async function runTrack(id: string) {
    if (!id.trim()) return
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const data = await trackOrder(id.trim())
      setResult(data)
    } catch (err) {
      setError(err instanceof Error && err.message === 'Tracking ID not found'
        ? 'No order found with that tracking ID.'
        : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-run the search when arriving with a tracking id already in the URL
  // (e.g. the "Public Tracking Page" link from the dashboard's order detail view).
  useEffect(() => {
    if (initialTrackingId) runTrack(initialTrackingId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await runTrack(trackingId)
  }

  const isTerminal = result ? (TERMINAL_STATUSES as string[]).includes(result.status) : false
  const currentStepIndex = result
    ? STATUS_PROGRESS.indexOf(result.status as (typeof STATUS_PROGRESS)[number])
    : -1

  return (
    <>
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
              <span className="track-value">{result.cn}</span>
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
            <div><Phone size={16} /> <span className="track-label">Consignee Phone</span> {safeText(result.consignee_phone)}</div>
            <div><Building2 size={16} /> <span className="track-label">Address</span> {safeText(result.address)}</div>
            <div><Building2 size={16} /> <span className="track-label">Shipper</span> {safeText(result.shipper_name)}</div>
            <div><Wallet size={16} /> <span className="track-label">COD Amount</span> Rs. {result.cod ?? 0}</div>
            <div><Hash size={16} /> <span className="track-label">Order Number</span> {safeText(result.order_number)}</div>
            <div><Truck size={16} /> <span className="track-label">Service Type</span> {safeText(result.service_type)}</div>
            <div><Calendar size={16} /> <span className="track-label">Shipment Date</span> {result.shipment_date ? new Date(result.shipment_date).toLocaleString() : '—'}</div>
            <div><Package size={16} /> <span className="track-label">Delivery Date</span> {result.delivery_date ? new Date(result.delivery_date).toLocaleString() : '—'}</div>
            <div><FileText size={16} /> <span className="track-label">Instructions</span> {safeText(result.instructions)}</div>
          </div>
        </div>
      )}
    </>
  )
}
