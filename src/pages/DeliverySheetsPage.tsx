import { useEffect, useState } from 'react'
import { fetchDeliverySheets, statusSlug, safeText, type DeliverySheet } from '../lib/api'
import { ClipboardList, Loader2, Printer, Search } from 'lucide-react'

function formatRs(value: number): string {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

export default function DeliverySheetsPage() {
  const [sheets, setSheets] = useState<DeliverySheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchDeliverySheets()
      .then((data) => setSheets(Array.isArray(data) ? data : []))
      .catch(() => setError('Could not load delivery sheets. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = sheets.filter((s) => {
    const q = search.toLowerCase()
    return (
      (s.ds_number ?? '').toLowerCase().includes(q) ||
      (s.tracking_number ?? '').toLowerCase().includes(q) ||
      (s.status ?? '').toLowerCase().includes(q) ||
      (s.rider_name ?? '').toLowerCase().includes(q)
    )
  })

  function handlePrint(sheet: DeliverySheet) {
    if (sheet.print_url) {
      window.open(sheet.print_url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1><ClipboardList size={28} /> Delivery Sheets</h1>
          <p>View and print your delivery sheets.</p>
        </div>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by DS number, tracking, status, or rider..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 size={32} className="spin" /></div>
      ) : error ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>{sheets.length === 0 ? 'No delivery sheets yet' : 'No matching sheets'}</h3>
          <p>{sheets.length === 0 ? 'Delivery sheets will appear here once created.' : 'Try a different search.'}</p>
        </div>
      ) : (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>DS Number</th>
                <th>Tracking</th>
                <th>Date</th>
                <th>Status</th>
                <th>Rider</th>
                <th>Contact</th>
                <th>Vehicle</th>
                <th>Parcels</th>
                <th>Weight</th>
                <th>COD</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.ds_number}>
                  <td className="tracking-cell">{s.ds_number}</td>
                  <td>{safeText(s.tracking_number)}</td>
                  <td className="date-cell">{formatDate(s.date)}</td>
                  <td>
                    <span className={`status-badge status-${statusSlug(s.status)}`}>
                      {safeText(s.status)}
                    </span>
                  </td>
                  <td>{safeText(s.rider_name)}</td>
                  <td>{safeText(s.rider_contact)}</td>
                  <td>{safeText(s.rider_vehicle)}</td>
                  <td>{s.total_parcels ?? 0}</td>
                  <td>{(s.total_weight ?? 0)} kg</td>
                  <td>Rs. {formatRs(s.total_cod)}</td>
                  <td>
                    <button
                      className="row-link"
                      onClick={() => handlePrint(s)}
                      disabled={!s.print_url}
                      style={!s.print_url ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                    >
                      <Printer size={14} /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
