import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { clearAuth, getStoredUser, isStaff } from '@/lib/auth'
import { LogOut, Sparkles, Menu, X } from 'lucide-react'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getStoredUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const links = user && isStaff(user)
    ? [
        { to: '/admin/dashboard', label: 'Dashboard' },
        { to: '/admin/tickets', label: 'Tickets' },
        { to: '/admin/escalations', label: 'Escalations' },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/orders', label: 'My Orders' },
        { to: '/tickets', label: 'Support Tickets' },
      ]

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && path !== '/admin/dashboard' && location.pathname.startsWith(path))

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <nav className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={user && isStaff(user) ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm group-hover:shadow transition">
            <Sparkles size={18} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-lg tracking-tight">AuraCare</span>
            {user && (
              <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-medium capitalize">
                {user.role.replace('_', ' ')}
              </span>
            )}
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                isActive(l.to)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* User & Logout */}
        <div className="hidden md:flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-xs font-semibold flex items-center justify-center">
                {initials}
              </div>
              <span className="text-sm font-medium text-slate-700">{user.name}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                isActive(l.to) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={15} /> Logout ({user?.name})
          </button>
        </div>
      )}
    </nav>
  )
}
