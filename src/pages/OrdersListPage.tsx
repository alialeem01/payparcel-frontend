import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrders, resolveApiUrl, statusSlug, type Order } from '../lib/api'
import { Package, Loader2, Plus, Search, ArrowRight } from 'lucide-react'

function formatRs(value: number): string {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)
}

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchOrders()
      .then((data) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    return (
      (o.cn ?? '').toLowerCase().includes(q) ||
      (o.consignee ?? '').toLowerCase().includes(q) ||
      (o.status ?? '').toLowerCase().includes(q) ||
      (o.city ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1><Package size={28} /> My Parcels</h1>
        <Link to="/dashboard/book" className="btn-primary"><Plus size={18} /> Add New Parcel</Link>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input type="text" placeholder="Search by tracking number, consignee, status, or city..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 size={32} className="spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>{orders.length === 0 ? 'No parcels yet' : 'No matching parcels'}</h3>
          <p>{orders.length === 0 ? 'Book your first parcel to get started.' : 'Try a different search.'}</p>
          {orders.length === 0 && <Link to="/dashboard/book" className="btn-primary"><Plus size={18} /> Add New Parcel</Link>}
        </div>
      ) : (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Tracking Number</th>
                <th>QR</th>
                <th>Consignee</th>
                <th>Status</th>
                <th>City</th>
                <th>COD</th>
                <th>Date Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const qrUrl = resolveApiUrl(o.tracking_qr_code)
                return (
                  <tr key={o.id}>
                    <td className="tracking-cell">{o.cn ?? '—'}</td>
                    <td>
                      {qrUrl ? (
                        <img src={qrUrl} alt="QR code" className="qr-thumb" />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>{o.consignee ?? o.customer_name ?? '—'}</td>
                    <td><span className={`status-badge status-${statusSlug(o.status)}`}>{o.status ?? '—'}</span></td>
                    <td>{o.city ?? '—'}</td>
                    <td>Rs. {formatRs(o.cod ?? 0)}</td>
                    <td className="date-cell">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td><Link to={`/dashboard/orders/${o.id ?? o.cn}`} className="row-link">Details <ArrowRight size={14} /></Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
