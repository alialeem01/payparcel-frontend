import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrders, resolveApiUrl, statusSlug, netOwed, SERVICE_TYPES, type Order } from '../lib/api'
import { printAddressLabels } from '../lib/addressLabel'
import { Package, Loader2, Plus, Search, ArrowRight, ArrowUp, ArrowDown, Printer } from 'lucide-react'

function formatRs(value: number): string {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)
}

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [serviceTypeFilter, setServiceTypeFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrders()
      .then((data) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    const matchesSearch = (
      (o.cn ?? '').toLowerCase().includes(q) ||
      (o.order_number ?? '').toLowerCase().includes(q) ||
      (o.consignee ?? '').toLowerCase().includes(q) ||
      (o.status ?? '').toLowerCase().includes(q) ||
      (o.city ?? '').toLowerCase().includes(q)
    )
    const matchesServiceType = !serviceTypeFilter || o.service_type === serviceTypeFilter
    return matchesSearch && matchesServiceType
  })

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((o) => o.id)))
    }
  }

  function handlePrintSelected() {
    const toPrint = filtered.filter((o) => selected.has(o.id))
    if (toPrint.length > 0) printAddressLabels(toPrint)
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1><Package size={28} /> My Parcels</h1>
        <Link to="/dashboard/book" className="btn-primary"><Plus size={18} /> Add New Parcel</Link>
      </div>

      <div className="orders-toolbar">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search by tracking number, order number, consignee, status, or city..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={serviceTypeFilter} onChange={(e) => setServiceTypeFilter(e.target.value)} className="service-type-filter">
          <option value="">All Service Types</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button type="button" className="btn-outline" onClick={handlePrintSelected} disabled={selected.size === 0}>
          <Printer size={16} /> Print Address Label{selected.size > 1 ? 's' : ''} {selected.size > 0 && `(${selected.size})`}
        </button>
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
                <th><input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length} onChange={toggleSelectAll} /></th>
                <th>Tracking Number</th>
                <th>QR</th>
                <th>Consignee</th>
                <th>Status</th>
                <th>City</th>
                <th>Weight</th>
                <th>COD</th>
                <th>Flyer</th>
                <th>GST</th>
                <th>Fuel</th>
                <th>D.C</th>
                <th>Net Total</th>
                <th>Payment</th>
                <th>Date Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const qrUrl = resolveApiUrl(o.tracking_qr_code)
                const net = netOwed(o)
                const owedToShipper = net >= 0
                return (
                  <tr key={o.id}>
                    <td><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelected(o.id)} /></td>
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
                    <td>{o.parcel_weight ?? 0} kg</td>
                    <td>Rs. {formatRs(o.cod ?? 0)}</td>
                    <td>Rs. {formatRs(o.flyer_charges ?? 0)}</td>
                    <td>Rs. {formatRs(o.total_gst ?? 0)}</td>
                    <td>Rs. {formatRs(o.total_feul_tax ?? 0)}</td>
                    <td>Rs. {formatRs(o.delivery_charge ?? 0)}</td>
                    <td className={owedToShipper ? 'net-owed-positive' : 'net-owed-negative'}>
                      Rs. {formatRs(Math.abs(net))} {owedToShipper ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    </td>
                    <td><span className={`payment-badge payment-${(o.payment_status ?? 'unpaid').toLowerCase()}`}>{o.payment_status ?? 'Unpaid'}</span></td>
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
