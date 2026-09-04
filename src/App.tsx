import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import TrackPage from './pages/TrackPage'
import DashboardLayout from './pages/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import BookOrderPage from './pages/BookOrderPage'
import ComingSoonPage from './pages/ComingSoonPage'
import OrdersListPage from './pages/OrdersListPage'
import OrderDetailPage from './pages/OrderDetailPage'
import DashboardTrackPage from './pages/DashboardTrackPage'
import EditInfoPage from './pages/EditInfoPage'
import DeliverySheetsPage from './pages/DeliverySheetsPage'
import PublicHeader from './components/PublicHeader'
import { Loader2, Layers, CreditCard, BarChart3 } from 'lucide-react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="full-center"><Loader2 size={32} className="spin" /></div>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      {children}
    </>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
      <Route path="/track" element={<PublicLayout><TrackPage /></PublicLayout>} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="book" element={<BookOrderPage />} />
        <Route path="bulk-booking" element={<ComingSoonPage title="Bulk Booking" icon={Layers} />} />
        <Route path="orders" element={<OrdersListPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="track" element={<DashboardTrackPage />} />
        <Route path="delivery-sheets" element={<DeliverySheetsPage />} />
        <Route path="billing" element={<ComingSoonPage title="Billing" icon={CreditCard} />} />
        <Route path="edit-info" element={<EditInfoPage />} />
        <Route path="reports" element={<ComingSoonPage title="Reports" icon={BarChart3} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
