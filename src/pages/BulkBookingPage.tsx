import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { bulkBookOrders, type BulkBookError } from '../lib/api'
import { Loader2, Layers, FileSpreadsheet, Upload, CheckCircle2, AlertCircle, X } from 'lucide-react'
import * as XLSX from 'xlsx'

const TEMPLATE_HEADERS = [
  'Receiver Name', 'Receiver Phone', 'Alt Receiver Phone', 'Order ID',
  'Service Type', 'City', 'Address', 'COD Amount', 'Product', 'Instructions',
  'Parcel Weight', 'Pcs',
]

const MAX_ROWS = 100

export default function BulkBookingPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string[] | null>(null)
  const [errors, setErrors] = useState<BulkBookError[] | null>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleDownloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS])
    ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 18 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bulk Booking')
    XLSX.writeFile(wb, 'bulk_booking_template.xlsx')
  }

  function handleFileSelected(selected: File | null) {
    setError(null)
    setCreated(null)
    setErrors(null)

    if (!selected) return

    const name = selected.name.toLowerCase()
    if (!name.endsWith('.xlsx')) {
      setError('Please upload an .xlsx file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })
        const dataRows = rows.slice(1).filter((r) => Array.isArray(r) && r.some((c) => c !== null && c !== ''))
        if (dataRows.length > MAX_ROWS) {
          setError(`File contains ${dataRows.length} data rows. Maximum allowed is ${MAX_ROWS}.`)
          setFile(null)
          return
        }
        setFile(selected)
      } catch {
        setError('Could not read the file. Please ensure it is a valid .xlsx file.')
        setFile(null)
      }
    }
    reader.readAsArrayBuffer(selected)
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    handleFileSelected(selected)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelected(dropped)
  }

  function handleRemoveFile() {
    setFile(null)
    setError(null)
    setCreated(null)
    setErrors(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit() {
    if (!file) return
    setLoading(true)
    setError(null)
    setCreated(null)
    setErrors(null)
    try {
      const res = await bulkBookOrders(file)
      setCreated(res.created ?? [])
      setErrors(res.errors ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process bulk booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    handleRemoveFile()
  }

  const hasResults = created !== null || errors !== null

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1><Layers size={28} /> Bulk Booking</h1>
          <p>Upload an Excel file to create multiple parcel orders at once.</p>
        </div>
        <button className="btn-outline" onClick={handleDownloadTemplate}>
          <FileSpreadsheet size={18} /> Download Template
        </button>
      </div>

      <div className="bulk-instructions">
        <h3>How it works</h3>
        <ol>
          <li>Download the template using the button above.</li>
          <li>Fill in your parcel details (up to {MAX_ROWS} rows). Do not change the header row.</li>
          <li>Upload the completed file below and submit.</li>
        </ol>
      </div>

      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        {file ? (
          <div className="upload-file-info">
            <FileSpreadsheet size={32} />
            <div>
              <span className="upload-file-name">{file.name}</span>
              <span className="upload-file-size">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button
              className="upload-remove-btn"
              onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <Upload size={32} />
            <span>Click to browse or drag an .xlsx file here</span>
            <span className="upload-hint">Max {MAX_ROWS} rows</span>
          </div>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      {!hasResults && (
        <button className="btn-primary btn-lg" onClick={handleSubmit} disabled={!file || loading}>
          {loading && <Loader2 size={18} className="spin" />}
          Upload &amp; Process
        </button>
      )}

      {hasResults && (
        <div className="bulk-results">
          {created !== null && created.length > 0 && (
            <div className="bulk-result-section bulk-success">
              <div className="bulk-result-header">
                <CheckCircle2 size={20} />
                <h3>{created.length} Order{created.length !== 1 ? 's' : ''} Created</h3>
              </div>
              <div className="bulk-cn-list">
                {created.map((cn, i) => (
                  <span key={`${cn}-${i}`} className="bulk-cn-chip">{cn}</span>
                ))}
              </div>
            </div>
          )}

          {errors !== null && errors.length > 0 && (
            <div className="bulk-result-section bulk-errors">
              <div className="bulk-result-header">
                <AlertCircle size={20} />
                <h3>{errors.length} Error{errors.length !== 1 ? 's' : ''}</h3>
              </div>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((err, i) => (
                    <tr key={i}>
                      <td className="tracking-cell">{err.row}</td>
                      <td>{err.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {created !== null && created.length === 0 && errors !== null && errors.length === 0 && (
            <div className="bulk-result-section">
              <p>No orders were created and no errors were reported.</p>
            </div>
          )}

          <button className="btn-outline" onClick={handleReset}>
            Upload Another File
          </button>
        </div>
      )}
    </div>
  )
}
