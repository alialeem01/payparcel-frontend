import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchDashboardSummary, type DashboardSummary } from '../lib/api'
import { Loader2, Calendar, TrendingUp, Wallet, Truck, PackageCheck, Clock, AlertCircle, CheckCircle2, PackageX, Package, RotateCcw } from 'lucide-react'

function formatRs(value: number): string {
  return new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)
}

export default function DashboardHome() {
  const { profile } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const loadData = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchDashboardSummary(fromDate || undefined, toDate || undefined)
      .then((data) => setSummary(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [fromDate, toDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleFilter(e: React.FormEvent) {
    e.preventDefault()
    loadData()
  }

  function clearFilter() {
    setFromDate('')
    setToDate('')
  }

  const financialCards = summary ? [
    { label: 'Total COD Amount', value: summary.financial.total_cod, color: 'blue' },
    { label: 'COD Amount (Delivered/Return)', value: summary.financial.cod_delivered_return, color: 'green' },
    { label: 'Total D.C & Flyer Charges', value: summary.financial.total_dc_flyer_charges, color: 'orange' },
    { label: 'Delivery & Flyer Charges', value: summary.financial.delivery_flyer_charges, color: 'amber' },
    { label: 'Paid Amount', value: summary.financial.paid_amount, color: 'teal' },
    { label: 'Total Balance Payment', value: summary.financial.total_balance_payment, color: 'red' },
  ] : []

  const statusCards = summary ? [
    { label: 'Total Active Orders', data: summary.orders.total_active, icon: Truck, color: 'blue' },
    { label: 'Failed Attempt Orders', data: summary.orders.failed_attempt, icon: AlertCircle, color: 'red' },
    { label: 'Pending Order', data: summary.orders.pending, icon: Clock, color: 'amber' },
    { label: 'Delivered', data: summary.orders.delivered, icon: CheckCircle2, color: 'green' },
    { label: 'Not Arrived Orders', data: summary.orders.not_arrived, icon: PackageX, color: 'orange' },
    { label: 'Arrived Orders', data: summary.orders.arrived, icon: PackageCheck, color: 'teal' },
    { label: 'Ready to Return Orders', data: summary.orders.ready_to_return, icon: RotateCcw, color: 'purple' },
    { label: 'RTS Orders', data: summary.orders.rts, icon: Package, color: 'slate' },
  ] : []

  const chartData = summary?.chart ?? []
  const maxCount = Math.max(...chartData.map((d) => d.count), 1)

  return (
    <div className="page-wrap dashboard-page">
      <div className="page-header">
        <div>
          <h1>Welcome, {profile?.business_name ?? 'Customer'}</h1>
          <p>Here's an overview of your account.</p>
        </div>
      </div>

      <form onSubmit={handleFilter} className="date-filter-bar">
        <div className="date-filter-field">
          <label><Calendar size={14} /> From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="date-filter-field">
          <label><Calendar size={14} /> To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary btn-sm">Filter</button>
        {(fromDate || toDate) && (
          <button type="button" className="btn-outline btn-sm" onClick={clearFilter}>Clear</button>
        )}
      </form>

      {error && <div className="form-error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading ? (
        <div className="loading-state"><Loader2 size={32} className="spin" /></div>
      ) : summary ? (
        <>
          <div className="dashboard-body">
            <div className="dashboard-main-col">
              <h2 className="section-heading"><Wallet size={20} /> Financial Summary</h2>
              <div className="financial-grid">
                {financialCards.map((card) => (
                  <div key={card.label} className={`summary-card card-${card.color}`}>
                    <div className="summary-card-header" />
                    <div className="summary-card-body">
                      <span className="summary-card-label">{card.label}</span>
                      <span className="summary-card-value">Rs. {formatRs(card.value)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="section-heading"><TrendingUp size={20} /> Order Volume Over Time</h2>
              <div className="chart-card">
                {chartData.length === 0 ? (
                  <div className="empty-state"><p>No chart data available.</p></div>
                ) : (
                  <div className="chart-bars">
                    {chartData.map((point) => (
                      <div key={point.created_at__date} className="chart-bar-item" title={`${point.created_at__date}: ${point.count} orders`}>
                        <div className="chart-bar-track">
                          <div className="chart-bar-fill" style={{ height: `${(point.count / maxCount) * 100}%` }} />
                        </div>
                        <span className="chart-bar-value">{point.count}</span>
                        <span className="chart-bar-label">{point.created_at__date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-side-col">
              <h2 className="section-heading"><Package size={20} /> Order Status</h2>
              <div className="status-cards-grid">
                {statusCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <div key={card.label} className={`summary-card card-${card.color}`}>
                      <div className="summary-card-header" />
                      <div className="summary-card-body">
                        <div className="status-card-top">
                          <Icon size={18} />
                          <span className="summary-card-label">{card.label}</span>
                        </div>
                        <span className="summary-card-value status-count">{card.data.count}</span>
                        <span className="summary-card-amount">Rs. {formatRs(card.data.amount)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
