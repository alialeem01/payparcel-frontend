import { useEffect, useState } from 'react'
import { fetchDeliverySheets, resolveApiUrl, statusSlug, safeText, type DeliverySheet, type DeliverySheetParcel } from '../lib/api'
import { escapeHtml, openPrintDocument } from '../lib/print'
import { ClipboardList, Loader2, Printer, Search } from 'lucide-react'

function formatRs(value: number): string {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

function openPrintWindow(sheet: DeliverySheet) {
  const qrUrl = resolveApiUrl(sheet.qr_url)
  const tracking = escapeHtml(sheet.tracking_number ?? '—')
  const dsNum = escapeHtml(sheet.ds_number ?? '—')
  const date = escapeHtml(formatDate(sheet.date))
  const status = escapeHtml(safeText(sheet.status))
  const rider = escapeHtml(safeText(sheet.rider_name))
  const contact = escapeHtml(safeText(sheet.rider_contact))
  const vehicle = escapeHtml(safeText(sheet.rider_vehicle))
  const parcels = sheet.total_parcels ?? 0
  const weight = sheet.total_weight ?? 0
  const cod = formatRs(sheet.total_cod)

  const parcelList: DeliverySheetParcel[] = sheet.parcels ?? []

  const parcelRows = parcelList.map((p) => {
    const pQr = resolveApiUrl(p.qr_url)
    const pTracking = escapeHtml(p.cn ?? '—')
    const pName = escapeHtml(p.consignee ?? '—')
    const pPhone = escapeHtml(safeText(p.consignee_phone))
    const pAddress = escapeHtml(safeText(p.address))
    const pCity = escapeHtml(safeText(p.city))
    const pInstructions = escapeHtml(safeText(p.instructions))
    const pCod = formatRs(p.cod ?? 0)

    return `
    <tr>
      <td class="parcel-qr">${pQr ? `<img src="${pQr}" alt="QR" />` : '—'}</td>
      <td class="parcel-cn">${pTracking}</td>
      <td>${pName}</td>
      <td>${pPhone}</td>
      <td>${pAddress}${pCity !== '—' ? `, ${pCity}` : ''}</td>
      <td>${pInstructions}</td>
      <td class="parcel-cod">Rs. ${pCod}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Delivery Sheet ${dsNum}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 32px; }
  .ds-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }
  .ds-header h1 { font-size: 22px; }
  .ds-header .ds-num { font-size: 14px; color: #64748b; margin-top: 4px; }
  .ds-qr { text-align: center; }
  .ds-qr img { width: 100px; height: 100px; }
  .ds-qr .qr-label { font-size: 11px; color: #64748b; margin-top: 4px; }
  .ds-tracking { text-align: center; margin-bottom: 24px; }
  .ds-tracking .tracking-label { font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
  .ds-tracking .tracking-value { font-size: 28px; font-weight: 700; letter-spacing: 2px; }
  .ds-info { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 32px; margin-bottom: 24px; }
  .ds-info-item { display: flex; flex-direction: column; gap: 2px; }
  .ds-info-label { font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
  .ds-info-value { font-size: 15px; font-weight: 500; }
  .ds-totals { display: flex; gap: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-bottom: 28px; }
  .ds-totals .total-item { display: flex; flex-direction: column; gap: 2px; }
  .ds-totals .total-label { font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
  .ds-totals .total-value { font-size: 18px; font-weight: 700; }
  .ds-parcels h2 { font-size: 16px; margin-bottom: 12px; }
  .parcel-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .parcel-table th { text-align: left; padding: 8px 10px; background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 11px; }
  .parcel-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .parcel-table img { width: 50px; height: 50px; }
  .parcel-qr { text-align: center; }
  .parcel-cn { font-weight: 700; white-space: nowrap; }
  .parcel-cod { white-space: nowrap; text-align: right; }
  @media print { body { padding: 16px; } .parcel-table th { background: #f1f5f9 !important; } }
</style>
</head>
<body>
  <div class="ds-header">
    <div>
      <h1>Delivery Sheet</h1>
      <div class="ds-num">DS #: ${dsNum}</div>
    </div>
    <div class="ds-qr">
      ${qrUrl ? `<img src="${qrUrl}" alt="QR Code" />` : ''}
      <div class="qr-label">Scan to track</div>
    </div>
  </div>
  <div class="ds-tracking">
    <div class="tracking-label">Tracking Number</div>
    <div class="tracking-value">${tracking}</div>
  </div>
  <div class="ds-info">
    <div class="ds-info-item"><span class="ds-info-label">Date</span><span class="ds-info-value">${date}</span></div>
    <div class="ds-info-item"><span class="ds-info-label">Status</span><span class="ds-info-value">${status}</span></div>
    <div class="ds-info-item"><span class="ds-info-label">Rider</span><span class="ds-info-value">${rider}</span></div>
    <div class="ds-info-item"><span class="ds-info-label">Contact</span><span class="ds-info-value">${contact}</span></div>
    <div class="ds-info-item"><span class="ds-info-label">Vehicle</span><span class="ds-info-value">${vehicle}</span></div>
  </div>
  <div class="ds-totals">
    <div class="total-item"><span class="total-label">Total Parcels</span><span class="total-value">${parcels}</span></div>
    <div class="total-item"><span class="total-label">Total Weight</span><span class="total-value">${weight} kg</span></div>
    <div class="total-item"><span class="total-label">Total COD</span><span class="total-value">Rs. ${cod}</span></div>
  </div>
  ${parcelList.length > 0 ? `
  <div class="ds-parcels">
    <h2>Parcels in this Delivery Sheet</h2>
    <table class="parcel-table">
      <thead>
        <tr>
          <th>QR</th>
          <th>Tracking #</th>
          <th>Recipient</th>
          <th>Phone</th>
          <th>Address</th>
          <th>Instructions</th>
          <th>COD</th>
        </tr>
      </thead>
      <tbody>${parcelRows}</tbody>
    </table>
  </div>` : ''}
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`

  openPrintDocument(html)
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
                <th>Tracking Number</th>
                <th>QR</th>
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
              {filtered.map((s) => {
                const qrUrl = resolveApiUrl(s.qr_url)
                return (
                  <tr key={s.ds_number}>
                    <td className="tracking-cell">{s.ds_number}</td>
                    <td>{safeText(s.tracking_number)}</td>
                    <td>
                      {qrUrl ? (
                        <img src={qrUrl} alt="QR code" className="qr-thumb" />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
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
                        onClick={() => openPrintWindow(s)}
                      >
                        <Printer size={14} /> Print
                      </button>
                    </td>
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
