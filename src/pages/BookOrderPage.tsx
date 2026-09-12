import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookOrder, calculateOrderCharges, CITIES, SERVICE_TYPES, type BookOrderPayload, type CalculatedCharges } from '../lib/api'
import { Loader2, PackagePlus, CheckCircle2, Calculator } from 'lucide-react'

function formatRs(value: number): string {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 }).format(value)
}

export default function BookOrderPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<BookOrderPayload>({
    consignee: '',
    consignee_phone: '',
    alternate_phone: '',
    address: '',
    city: '',
    cod: 0,
    parcel_weight: 0,
    number_of_pieces: 1,
    service_type: 'COD',
    product: '',
    instructions: '',
    flyer_size: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null)
  const [charges, setCharges] = useState<CalculatedCharges | null>(null)
  const [chargesLoading, setChargesLoading] = useState(false)

  function updateField<K extends keyof BookOrderPayload>(key: K, value: BookOrderPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Live delivery-charge/tax preview - recalculates as weight or service type
  // change, mirroring the reference booking form's behavior. Debounced so it
  // doesn't fire on every keystroke.
  useEffect(() => {
    if (!form.service_type || !form.parcel_weight) {
      setCharges(null)
      return
    }
    setChargesLoading(true)
    const timer = setTimeout(() => {
      calculateOrderCharges(form.service_type, form.parcel_weight)
        .then(setCharges)
        .catch(() => setCharges(null))
        .finally(() => setChargesLoading(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [form.service_type, form.parcel_weight])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.city) {
      setError('Please select a city before creating the order.')
      return
    }

    setLoading(true)

    try {
      const res = await bookOrder(form)
      setTrackingNumber(res.cn)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setTrackingNumber(null)
    setCharges(null)
    setForm({
      consignee: '',
      consignee_phone: '',
      alternate_phone: '',
      address: '',
      city: '',
      cod: 0,
      parcel_weight: 0,
      number_of_pieces: 1,
      service_type: 'COD',
      product: '',
      instructions: '',
      flyer_size: '',
    })
  }

  if (trackingNumber) {
    return (
      <div className="page-center">
        <div className="success-card">
          <CheckCircle2 size={56} className="success-icon" />
          <h2>Order Created Successfully!</h2>
          <p>Your order has been registered. Share this tracking number with your customer.</p>
          <div className="success-tracking">
            <span>Tracking Number</span>
            <strong>{trackingNumber}</strong>
          </div>
          <div className="success-actions">
            <button className="btn-primary" onClick={() => navigate('/dashboard/orders')}>View My Orders</button>
            <button className="btn-outline" onClick={resetForm}>Create Another</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1><PackagePlus size={28} /> Book a New Order</h1>
        <p>Fill in the delivery details below to create a new parcel order.</p>
      </div>

      <form onSubmit={handleSubmit} className="book-form">
        <fieldset>
          <legend>Consignee Details</legend>
          <div className="form-grid">
            <label className="form-field">
              <span>Consignee Name</span>
              <input required value={form.consignee} onChange={(e) => updateField('consignee', e.target.value)} placeholder="Name of the person receiving the parcel" />
            </label>
            <label className="form-field">
              <span>Consignee Phone</span>
              <input required value={form.consignee_phone} onChange={(e) => updateField('consignee_phone', e.target.value)} placeholder="03XX XXXXXXX" />
            </label>
            <label className="form-field">
              <span>Alternate Phone</span>
              <input value={form.alternate_phone} onChange={(e) => updateField('alternate_phone', e.target.value)} placeholder="Optional" />
            </label>
            <label className="form-field">
              <span>City</span>
              <select required value={form.city} onChange={(e) => updateField('city', e.target.value)}>
                <option value="" disabled>Select city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="form-field form-field-full">
              <span>Delivery Address</span>
              <textarea required rows={3} value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Full delivery address" />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Parcel Details</legend>
          <div className="form-grid">
            <label className="form-field">
              <span>COD Amount (Rs.)</span>
              <input type="number" min={0} step="0.01" value={form.cod} onChange={(e) => updateField('cod', parseFloat(e.target.value) || 0)} placeholder="0" />
            </label>
            <label className="form-field">
              <span>Parcel Weight (kg)</span>
              <input type="number" required min={0} step="0.01" value={form.parcel_weight} onChange={(e) => updateField('parcel_weight', parseFloat(e.target.value) || 0)} placeholder="e.g. 1.5" />
            </label>
            <label className="form-field">
              <span>Number of Pieces</span>
              <input type="number" min={1} value={form.number_of_pieces} onChange={(e) => updateField('number_of_pieces', parseInt(e.target.value) || 1)} placeholder="1" />
            </label>
            <label className="form-field">
              <span>Service Type</span>
              <select value={form.service_type} onChange={(e) => updateField('service_type', e.target.value)}>
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Flyer Size</span>
              <input value={form.flyer_size} onChange={(e) => updateField('flyer_size', e.target.value)} placeholder="Optional, e.g. Small" />
            </label>
            <label className="form-field form-field-full">
              <span>Product Details</span>
              <textarea rows={2} value={form.product} onChange={(e) => updateField('product', e.target.value)} placeholder="Optional, e.g. 2x T-shirts, 1x Jeans" />
            </label>
            <label className="form-field form-field-full">
              <span>Instructions</span>
              <input value={form.instructions} onChange={(e) => updateField('instructions', e.target.value)} placeholder="Handle with Care" />
            </label>
          </div>
        </fieldset>

        {form.parcel_weight > 0 && (
          <div className="charge-preview">
            <div className="charge-preview-header">
              <Calculator size={16} />
              <span>Estimated Delivery Charges</span>
              {chargesLoading && <Loader2 size={14} className="spin" />}
            </div>
            <div className="charge-preview-grid">
              <div>
                <span className="track-label">Delivery Charge</span>
                <span>Rs. {formatRs(charges?.delivery_charge ?? 0)}</span>
              </div>
              <div>
                <span className="track-label">GST</span>
                <span>Rs. {formatRs(charges?.gst ?? 0)}</span>
              </div>
              <div>
                <span className="track-label">Fuel Charge</span>
                <span>Rs. {formatRs(charges?.fuel ?? 0)}</span>
              </div>
              <div className="charge-preview-total">
                <span className="track-label">D.C Total</span>
                <span>Rs. {formatRs(charges?.total ?? 0)}</span>
              </div>
            </div>
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn-primary btn-lg" disabled={loading}>
          {loading && <Loader2 size={18} className="spin" />}
          Create Order
        </button>
      </form>
    </div>
  )
}
