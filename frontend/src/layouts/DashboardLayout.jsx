import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UploadCloud, LogOut, Menu, X, User, ShieldCheck, Sun, Moon } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/upload', label: 'Upload Dataset', icon: UploadCloud },
  { to: '/app/profile', label: 'Profile', icon: User },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItems = user?.role === 'admin'
    ? [...NAV_ITEMS, { to: '/app/admin', label: 'Admin Panel', icon: ShieldCheck }]
    : NAV_ITEMS

  return (
    <div className="min-h-screen bg-ink-900 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static z-40 h-screen w-64 bg-ink-800 border-r border-ink-700 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 py-5 border-b border-ink-700 flex items-center justify-between">
          <Logo />
          <button className="lg:hidden text-mist-500" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-scan-500/10 text-scan-400 font-medium'
                    : 'text-mist-300 hover:bg-ink-700 hover:text-mist-100'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-ink-700">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-mist-300 hover:bg-ink-700 hover:text-mist-100 transition-colors mb-1"
          >
            {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
            {theme === 'dark' ? 'Dark mode' : 'Light mode'}
          </button>

          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-scan-500/15 text-scan-400 flex items-center justify-center text-sm font-medium shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-mist-100 truncate">{user?.name}</p>
              <p className="text-xs text-mist-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-mist-300 hover:bg-ink-700 hover:text-quality-bad transition-colors"
          >
            <LogOut size={17} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-ink-700 bg-ink-800">
          <Logo />
          <button className="text-mist-300" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
        </header>
        <main className="p-5 sm:p-8 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
