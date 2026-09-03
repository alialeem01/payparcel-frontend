import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Package, LayoutDashboard, PackagePlus, Layers, List, Search,
  CreditCard, Settings, BarChart3, LogOut,
} from 'lucide-react'

export default function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/book', label: 'Add New Parcel', icon: PackagePlus, end: false },
    { to: '/dashboard/bulk-booking', label: 'Bulk Booking', icon: Layers, end: false },
    { to: '/dashboard/orders', label: 'My Parcels', icon: List, end: false },
    { to: '/dashboard/track', label: 'Tracker', icon: Search, end: false },
    { to: '/dashboard/billing', label: 'Billing', icon: CreditCard, end: false },
    { to: '/dashboard/edit-info', label: 'Edit Info', icon: Settings, end: false },
    { to: '/dashboard/reports', label: 'Reports', icon: BarChart3, end: false },
  ]

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Package size={28} />
          <span>Pay Parcel</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={20} /> {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{profile?.business_name?.[0]?.toUpperCase() ?? 'U'}</div>
            <span className="user-email">{profile?.business_name ?? ''}</span>
          </div>
          <button className="signout-btn" onClick={handleSignOut}>
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  )
}
