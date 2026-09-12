import { resolveApiUrl, safeText, type Order } from './api'
import { escapeHtml, openPrintDocument } from './print'

function formatRs(value: number): string {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

function labelHtml(order: Order): string {
  const qrUrl = resolveApiUrl(order.tracking_qr_code)
  const cn = escapeHtml(order.cn ?? '—')
  const destination = escapeHtml(safeText(order.city))
  const date = escapeHtml(formatDate(order.created_at))
  const serviceType = escapeHtml(safeText(order.service_type))
  const pieces = order.number_of_pieces ?? 1
  const weight = order.parcel_weight ?? 0
  const name = escapeHtml(safeText(order.consignee))
  const address = escapeHtml(safeText(order.address))
  const phone = escapeHtml(safeText(order.consignee_phone))
  const orderNumber = escapeHtml(order.order_number || 'N/A')
  const remarks = escapeHtml(safeText(order.instructions))
  const product = escapeHtml(safeText(order.product))
  const cod = formatRs(order.cod ?? 0)

  return `
  <div class="label-page">
    <div class="label">
      <div class="label-header">
        <div class="brand-name">PAY PARCEL</div>
        <div class="id-block">
          <span>ID: <strong>${cn}</strong></span>
          ${qrUrl ? `<img class="qr" src="${qrUrl}" alt="QR" />` : ''}
        </div>
        <div class="meta-table">
          <div><span>Origin</span><strong>Karachi</strong></div>
          <div><span>Destination</span><strong>${destination}</strong></div>
        </div>
        <div class="meta-table">
          <div><span>Date</span><strong>${date}</strong></div>
          <div><span>Type</span><strong>${serviceType}</strong></div>
          <div><span>Piece</span><strong>${pieces} Pcs</strong></div>
          <div><span>Weight</span><strong>${weight} Kg</strong></div>
        </div>
      </div>

      <div class="section-title">Consignee Details</div>
      <div class="consignee">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Mobile:</strong> ${phone}</p>
        <p><strong>Order ID:</strong> ${orderNumber}</p>
        <p><strong>Remarks:</strong> ${remarks}</p>
        <p><strong>Product:</strong> ${product}</p>
      </div>

      <div class="section-title">Payment Details</div>
      <div class="payment">
        ${qrUrl ? `<img class="qr" src="${qrUrl}" alt="QR" />` : ''}
        <p class="amount-label">Amount Payable</p>
        <p class="amount">Rs.${cod}/-</p>
        <p class="cod-label">Cash on Delivery</p>
      </div>

      <div class="section-title">Shipper Details / Return Address</div>
      <div class="shipper">
        <p><strong>${escapeHtml(order.customer_name || 'Pay Parcel')}</strong></p>
      </div>
    </div>
  </div>`
}

export function printAddressLabels(orders: Order[]): void {
  if (orders.length === 0) return

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Address Label${orders.length > 1 ? 's' : ''}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; }
  .label-page { padding: 16px; page-break-after: always; }
  .label-page:last-child { page-break-after: auto; }
  .label { border: 1px solid #1e293b; max-width: 640px; }
  .label-header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; padding: 10px 14px; border-bottom: 2px solid #1e293b; }
  .brand-name { font-weight: 800; font-size: 16px; letter-spacing: 1px; }
  .id-block { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .id-block .qr { width: 44px; height: 44px; }
  .meta-table { display: flex; gap: 16px; font-size: 12px; }
  .meta-table div { display: flex; flex-direction: column; gap: 2px; }
  .meta-table span { color: #64748b; font-size: 10px; text-transform: uppercase; }
  .section-title { background: #f1f5f9; font-weight: 700; font-size: 12px; text-transform: uppercase; padding: 4px 14px; border-bottom: 1px solid #cbd5e1; border-top: 1px solid #cbd5e1; }
  .consignee, .shipper { padding: 10px 14px; font-size: 13px; }
  .consignee p, .shipper p { margin-bottom: 3px; }
  .payment { padding: 10px 14px; text-align: center; }
  .payment .qr { width: 70px; height: 70px; margin-bottom: 6px; }
  .amount-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
  .amount { font-size: 20px; font-weight: 800; }
  .cod-label { font-size: 12px; font-weight: 600; }
  @media print { .label-page { padding: 8px; } }
</style>
</head>
<body onload="window.print()">
  ${orders.map(labelHtml).join('')}
</body>
</html>`

  openPrintDocument(html)
}
