import { useEffect, useState } from 'react'
import { fetchBillingSummary, safeText, type BillingSummary, type Invoice } from '../lib/api'
import { CreditCard, Loader2, Search, Wallet } from 'lucide-react'

function formatRs(value: number): string {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

export default function BillingPage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchBillingSummary()
      .then((data) => setSummary(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load billing data.'))
      .finally(() => setLoading(false))
  }, [])

  const invoices: Invoice[] = summary?.invoices ?? []

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase()
    const matchesSearch = (
      (inv.invoice_number ?? '').toLowerCase().includes(q) ||
      (inv.account_name ?? '').toLowerCase().includes(q)
    )
    const matchesStatus = !statusFilter || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const summaryCards = summary ? [
    { label: 'Balance Payment', value: summary.balance_payment, color: 'red' },
    { label: 'COD Amount (Delivered/Return)', value: summary.cod_delivered_return, color: 'green' },
    { label: 'Delivery & Flyer Charges', value: summary.delivery_flyer_charges, color: 'orange' },
  ] : []

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1><CreditCard size={28} /> Billing</h1>
          <p>View your invoices and outstanding balance.</p>
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading ? (
        <div className="loading-state"><Loader2 size={32} className="spin" /></div>
      ) : summary ? (
        <>
          <h2 className="section-heading"><Wallet size={20} /> Financial Summary</h2>
          <div className="financial-grid">
            {summaryCards.map((card) => (
              <div key={card.label} className={`summary-card card-${card.color}`}>
                <div className="summary-card-header" />
                <div className="summary-card-body">
                  <span className="summary-card-label">{card.label}</span>
                  <span className="summary-card-value">Rs. {formatRs(card.value)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="orders-toolbar">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by invoice number or account..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="service-type-filter">
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <CreditCard size={48} />
              <h3>{invoices.length === 0 ? 'No invoices yet' : 'No matching invoices'}</h3>
              <p>{invoices.length === 0 ? 'Invoices will appear here once generated.' : 'Try a different search.'}</p>
            </div>
          ) : (
            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Account</th>
                    <th>Parcels</th>
                    <th>COD</th>
                    <th>Flyer</th>
                    <th>Tax</th>
                    <th>D.C</th>
                    <th>Net Amount</th>
                    <th>Period</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.invoice_number}>
                      <td className="tracking-cell">{inv.invoice_number}</td>
                      <td className="date-cell">{formatDate(inv.date)}</td>
                      <td><span className={`payment-badge payment-${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                      <td>{safeText(inv.account_name)}</td>
                      <td>{inv.total_parcel}</td>
                      <td>Rs. {formatRs(inv.cod)}</td>
                      <td>Rs. {formatRs(inv.flyer_charges)}</td>
                      <td>Rs. {formatRs(inv.total_tax)}</td>
                      <td>Rs. {formatRs(inv.delivery_charges)}</td>
                      <td>Rs. {formatRs(inv.net_amount)}</td>
                      <td>{safeText(inv.parcel_from)} – {safeText(inv.parcel_to)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : !error ? (
        <div className="empty-state">
          <CreditCard size={48} />
          <p>No billing data available yet.</p>
        </div>
      ) : null}
    </div>
  )
}
