export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export type OrderStatus =
  | 'Order'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Parcel Not Available'
  | 'Returned'

export const ORDER_STATUSES: OrderStatus[] = [
  'Order',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
  'Parcel Not Available',
  'Returned',
]

export const STATUS_PROGRESS: OrderStatus[] = [
  'Order',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
]

export const TERMINAL_STATUSES: OrderStatus[] = ['Delivered', 'Returned', 'Parcel Not Available']

// Kept in sync with the backend's PAKISTAN_CITIES choice list (parcels/models.py),
// which currently only accepts Karachi - booking with any other city is rejected.
export const CITIES = ['Karachi']

export interface Customer {
  id: string
  business_name: string
  contact_person: string
  phone: string
  address: string
  created_at: string
}

export interface Order {
  id: string
  cn: string
  customer_name: string
  consignee: string
  consignee_phone: string | null
  address: string | null
  city: string | null
  status: OrderStatus
  cod: number
  order_number: string | null
  service_type: string | null
  created_at: string
  updated_at: string
  tracking_qr_code: string | null
  instructions: string | null
}

export interface OrderStatusCount {
  count: number
  amount: number
}

export interface DashboardChartPoint {
  created_at__date: string
  count: number
}

export interface DashboardSummary {
  financial: {
    total_cod: number
    cod_delivered_return: number
    total_dc_flyer_charges: number
    delivery_flyer_charges: number
    paid_amount: number
    total_balance_payment: number
  }
  orders: {
    total_active: OrderStatusCount
    failed_attempt: OrderStatusCount
    pending: OrderStatusCount
    delivered: OrderStatusCount
    not_arrived: OrderStatusCount
    ready_for_pickup: OrderStatusCount
    out_for_delivery: OrderStatusCount
    ready_to_return: OrderStatusCount
    rts: OrderStatusCount
  }
  chart: DashboardChartPoint[]
}

export interface TrackingResult {
  cn: string | null
  status: OrderStatus
  city: string | null
  consignee: string
  consignee_phone: string | null
  address: string | null
  cod: number
  order_number: string | null
  service_type: string | null
  shipment_date: string | null
  shipper_name: string
  delivery_date: string | null
  instructions: string | null
}

export function statusSlug(status: string | null | undefined): string {
  if (!status) return 'unknown'
  return status.toLowerCase().replace(/\s+/g, '-')
}

export function safeText(value: string | null | undefined): string {
  return value ?? '—'
}

export function resolveApiUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}

// ---------------------------------------------------------------------------
// Token management (access + refresh) with automatic silent refresh
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_KEY = 'pp_access_token'
const REFRESH_TOKEN_KEY = 'pp_refresh_token'

let onAuthExpired: (() => void) | null = null

export function setAuthExpiredHandler(handler: (() => void) | null): void {
  onAuthExpired = handler
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(access: string, refresh?: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// Backwards-compatible aliases used by AuthContext
export const getToken = getAccessToken
export const setToken = (token: string) => setTokens(token)
export const clearToken = clearTokens

let refreshPromise: Promise<string | null> | null = null

async function doRefresh(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null
  try {
    const res = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) throw new Error('refresh failed')
    const data = await res.json()
    const newAccess: string = data.access
    const newRefresh: string | undefined = data.refresh
    setTokens(newAccess, newRefresh)
    scheduleRefresh()
    return newAccess
  } catch {
    clearTokens()
    // Notify the app that auth has fully expired — will redirect to login
    // Use setTimeout so this doesn't fire synchronously inside initial load
    setTimeout(() => onAuthExpired?.(), 0)
    return null
  }
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

// Proactive refresh: schedule a refresh ~60s before the access token expires.
let refreshTimer: ReturnType<typeof setTimeout> | null = null

function decodeTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function scheduleRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  const token = getAccessToken()
  if (!token) return
  const exp = decodeTokenExp(token)
  if (!exp) {
    // Can't decode expiry — schedule a periodic refresh as fallback
    refreshTimer = setTimeout(() => refreshAccessToken(), 5 * 60_000)
    return
  }
  const delay = exp - Date.now() - 60_000
  if (delay <= 0) {
    refreshAccessToken()
  } else {
    refreshTimer = setTimeout(() => refreshAccessToken(), delay)
  }
}

/**
 * Check if the access token is expired (or about to expire) and refresh if needed.
 * Called on visibility change and periodically to keep sessions alive.
 */
export async function ensureFreshToken(): Promise<void> {
  const token = getAccessToken()
  if (!token) return
  const exp = decodeTokenExp(token)
  if (!exp) return
  // If token expires within the next 2 minutes, refresh now
  if (exp - Date.now() < 120_000) {
    await refreshAccessToken()
  }
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Central fetch wrapper that:
 *  - attaches the JWT auth header
 *  - on 401, silently refreshes the access token and retries once
 *  - if refresh fails, clears tokens and triggers redirect to login
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const merged: RequestInit = {
    ...options,
    headers: { ...authHeaders(), ...(options.headers ?? {}) },
  }
  const res = await fetch(url, merged)

  if (res.status !== 401) return res

  // Try silent refresh + retry once
  const newToken = await refreshAccessToken()
  if (!newToken) {
    // Return a synthetic 401 response so callers see an error;
    // onAuthExpired will fire asynchronously via doRefresh's setTimeout
    return new Response(JSON.stringify({ detail: 'Session expired. Please log in again.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers ?? {}) },
  })
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = body.error ?? body.detail ?? body.message ?? 'Request failed'
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

interface RegisterPayload {
  business_name: string
  contact_person: string
  email: string
  phone: string
  password: string
  address: string
}

export async function registerCustomer(payload: RegisterPayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/customers/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  await handleResponse(res)
}

interface LoginResponse {
  access: string
  refresh?: string
}

export async function loginCustomer(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/customers/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await handleResponse<LoginResponse>(res)
  setTokens(data.access, data.refresh)
  scheduleRefresh()
}

export async function fetchProfile(): Promise<Customer> {
  const res = await apiFetch('/api/customers/me/')
  return handleResponse<Customer>(res)
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await apiFetch('/api/orders/')
  return handleResponse<Order[]>(res)
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await apiFetch(`/api/orders/${id}/`)
  return handleResponse<Order>(res)
}

export interface BookOrderPayload {
  consignee: string
  consignee_phone: string
  alternate_phone: string
  address: string
  city: string
  cod: number
  parcel_weight: number
  number_of_pieces: number
  service_type: string
  product: string
  instructions: string
  flyer_size: string
}

export interface BookOrderResponse {
  cn: string
}

export async function bookOrder(payload: BookOrderPayload): Promise<BookOrderResponse> {
  const res = await apiFetch('/api/orders/book/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<BookOrderResponse>(res)
}

export interface BulkBookError {
  row: number
  error: string
}

export interface BulkBookResponse {
  created: string[]
  errors: BulkBookError[]
}

export async function bulkBookOrders(file: File): Promise<BulkBookResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiFetch('/api/orders/bulk-book/', {
    method: 'POST',
    body: formData,
  })
  return handleResponse<BulkBookResponse>(res)
}

export async function trackOrder(trackingId: string): Promise<TrackingResult> {
  const res = await fetch(`${API_BASE_URL}/api/track/${encodeURIComponent(trackingId.trim())}/`)
  if (res.status === 404) {
    throw new Error('Tracking ID not found')
  }
  return handleResponse<TrackingResult>(res)
}

export async function fetchDashboardSummary(from?: string, to?: string): Promise<DashboardSummary> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await apiFetch(`/api/dashboard-summary/${query}`)
  return handleResponse<DashboardSummary>(res)
}

interface UpdateProfilePayload {
  business_name: string
  contact_person: string
  phone: string
  address: string
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<Customer> {
  const res = await apiFetch('/api/customers/update-profile/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<Customer>(res)
}

export function generateTrackingId(): string {
  const prefix = 'PP'
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `${prefix}${y}${m}${d}${rand}`
}

export interface DeliverySheetParcel {
  cn: string
  consignee: string
  consignee_phone: string | null
  address: string | null
  city: string | null
  instructions: string | null
  qr_url: string | null
  cod: number
}

export interface DeliverySheet {
  ds_number: string
  tracking_number: string
  qr_url: string | null
  date: string
  status: string
  rider_name: string | null
  rider_contact: string | null
  rider_vehicle: string | null
  total_parcels: number
  total_weight: number
  total_cod: number
  print_url: string | null
  parcels: DeliverySheetParcel[] | null
}

export async function fetchDeliverySheets(): Promise<DeliverySheet[]> {
  const res = await apiFetch('/api/customers/delivery-sheets/')
  return handleResponse<DeliverySheet[]>(res)
}
