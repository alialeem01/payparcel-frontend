import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchOrder, resolveApiUrl, STATUS_PROGRESS, TERMINAL_STATUSES, statusSlug, safeText, type Order } from '../lib/api'
import { Loader2, ArrowLeft, Package, CheckCircle2, Clock } from 'lucide-react'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchOrder(id)
      .then((data) => setOrder(data))
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page-center"><Loader2 size={32} className="spin" /></div>

  if (error || !order) {
    return (
      <div className="page-center">
        <div className="empty-state">
          <Package size={48} />
          <h3>{error ?? 'Order not found'}</h3>
          <Link to="/dashboard/orders" className="btn-primary">Back to Orders</Link>
        </div>
      </div>
    )
  }

  const isTerminal = (TERMINAL_STATUSES as string[]).includes(order.status)
  const currentStepIndex = STATUS_PROGRESS.indexOf(order.status as (typeof STATUS_PROGRESS)[number])
  const showProgress = !isTerminal && currentStepIndex >= 0
  const trackingNumber = order.cn ?? '—'
  const qrUrl = resolveApiUrl(order.tracking_qr_code)

  return (
    <div className="page-wrap">
      <button className="back-btn" onClick={() => navigate('/dashboard/orders')}>
        <ArrowLeft size={18} /> Back to Orders
      </button>

      <div className="detail-header">
        <div>
          <h1>{trackingNumber}</h1>
          <span className={`status-badge status-${statusSlug(order.status)}`}>{order.status ?? '—'}</span>
        </div>
        <Link to={`/track?t=${trackingNumber}`} className="btn-outline btn-sm">Public Tracking Page</Link>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Order Info</h3>
          <dl>
            <dt>Tracking Number</dt><dd>{trackingNumber}</dd>
            <dt>Consignee</dt><dd>{order.consignee ?? order.customer_name ?? '—'}</dd>
            <dt>Consignee Phone</dt><dd>{safeText(order.consignee_phone)}</dd>
            <dt>City</dt><dd>{order.city ?? '—'}</dd>
            <dt>Address</dt><dd>{safeText(order.address)}</dd>
            <dt>COD Amount</dt><dd>Rs. {order.cod ?? 0}</dd>
            <dt>Order Number</dt><dd>{safeText(order.order_number)}</dd>
            <dt>Service Type</dt><dd>{safeText(order.service_type)}</dd>
            <dt>Instructions</dt><dd>{safeText(order.instructions)}</dd>
            <dt>Created</dt><dd>{new Date(order.created_at).toLocaleString()}</dd>
            <dt>Last Updated</dt><dd>{new Date(order.updated_at).toLocaleString()}</dd>
          </dl>
        </div>

        {qrUrl && (
          <div className="detail-card">
            <h3>QR Code</h3>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
              <img src={qrUrl} alt="QR code" style={{ width: 160, height: 160, borderRadius: 8, border: '1px solid var(--slate-200)' }} />
            </div>
          </div>
        )}
      </div>

      <div className="detail-section">
        <h3>Delivery Progress</h3>
        {showProgress ? (
          <div className="track-progress">
            {STATUS_PROGRESS.map((status, i) => {
              const done = i <= currentStepIndex
              const current = i === currentStepIndex
              return (
                <div key={status} className={`progress-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                  <div className="progress-dot">{done ? <CheckCircle2 size={20} /> : <Clock size={20} />}</div>
                  <span className="progress-label">{status}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="cancelled-notice">Status: {order.status ?? 'Unknown'}</div>
        )}
      </div>
    </div>
  )
}
