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

export const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
  'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur',
  'Sargodha', 'Sukkur', 'Larkana', 'Sheikhupura', 'Rahim Yar Khan', 'Jhang',
  'Gujrat', 'Mardan', 'Kasur', 'Dera Ghazi Khan', 'Sahiwal', 'Nawabshah',
  'Mingora', 'Okara', 'Mirpur Khas', 'Chiniot', 'Kamoke', 'Mandi Bahauddin',
  'Jhelum', 'Sadiqabad', 'Jacobabad', 'Shikarpur', 'Khanewal', 'Hafizabad',
  'Kohat', 'Muzaffargarh', 'Khanpur', 'Gojra', 'Abbottabad', 'Turbat',
  'Dadu', 'Bahawalnagar', 'Muridke', 'Pakpattan', 'Attock', 'Vehari',
  'Nowshera', 'Chakwal', 'Swabi', 'Dera Ismail Khan', 'Chishtian', 'Daska',
  'Mansehra', 'Nankana Sahib', 'Wah Cantt', 'Kot Addu', 'Toba Tek Singh',
  'Ahmedpur East', 'Khairpur', 'Chaman', 'Zhob', 'Gwadar', 'Khuzdar',
  'Muzaffarabad', 'Mirpur (AJK)', 'Gilgit', 'Skardu', 'Charsadda', 'Hangu',
  'Ferozwala', 'Burewala', 'Jaranwala', 'Kabirwala',
]

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
  tracking_id: string
  customer_name: string
  consignee: string
  status: OrderStatus
  city: string | null
  cod: number
  created_at: string
  updated_at: string
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
    arrived: OrderStatusCount
    ready_to_return: OrderStatusCount
    rts: OrderStatusCount
  }
  chart: DashboardChartPoint[]
}

export interface TrackingResult {
  tracking_id: string
  status: OrderStatus
  city: string | null
  consignee: string
  shipment_date: string | null
  shipper_name: string
  delivery_date: string | null
}

export function statusSlug(status: string | null | undefined): string {
  if (!status) return 'unknown'
  return status.toLowerCase().replace(/\s+/g, '-')
}

export function safeText(value: string | null | undefined): string {
  return value ?? '—'
}

const TOKEN_KEY = 'pp_access_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = body.error ?? body.detail ?? body.message ?? 'Request failed'
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

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
}

export async function loginCustomer(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/customers/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await handleResponse<LoginResponse>(res)
  setToken(data.access)
}

export async function fetchProfile(): Promise<Customer> {
  const res = await fetch(`${API_BASE_URL}/api/customers/me/`, {
    headers: { ...authHeaders() },
  })
  return handleResponse<Customer>(res)
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE_URL}/api/orders/`, {
    headers: { ...authHeaders() },
  })
  return handleResponse<Order[]>(res)
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await fetch(`${API_BASE_URL}/api/orders/${id}/`, {
    headers: { ...authHeaders() },
  })
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
  const res = await fetch(`${API_BASE_URL}/api/orders/book/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return handleResponse<BookOrderResponse>(res)
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/orders/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  })
  await handleResponse(res)
}

export async function trackOrder(trackingId: string): Promise<TrackingResult> {
  const res = await fetch(`${API_BASE_URL}/api/track/${trackingId}/`)
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
  const res = await fetch(`${API_BASE_URL}/api/dashboard-summary/${query}`, {
    headers: { ...authHeaders() },
  })
  return handleResponse<DashboardSummary>(res)
}

interface UpdateProfilePayload {
  business_name: string
  contact_person: string
  phone: string
  address: string
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<Customer> {
  const res = await fetch(`${API_BASE_URL}/api/customers/update-profile/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
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

export interface DeliverySheet {
  ds_number: string
  tracking_number: string
  date: string
  status: string
  rider_name: string | null
  rider_contact: string | null
  rider_vehicle: string | null
  total_parcels: number
  total_weight: number
  total_cod: number
  print_url: string | null
}

export async function fetchDeliverySheets(): Promise<DeliverySheet[]> {
  const res = await fetch(`${API_BASE_URL}/api/customers/delivery-sheets/`, {
    headers: { ...authHeaders() },
  })
  return handleResponse<DeliverySheet[]>(res)
}
