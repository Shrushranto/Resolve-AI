import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorAlert from '@/components/ui/ErrorAlert'
import { statusBadge } from '@/components/ui/Badge'
import { api, getErrorMessage } from '@/lib/api'
import { getStoredUser } from '@/lib/auth'
import { Order, Ticket, Refund, User } from '@/types'
import { Plus, ShoppingBag, Ticket as TicketIcon, CheckCircle2, Clock, ArrowRight, ShieldCheck, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const u = getStoredUser()
    if (!u) { navigate('/login'); return }
    if (u.role !== 'customer') { navigate('/admin/dashboard'); return }
    setUser(u)
    Promise.all([api.get('/orders/'), api.get('/tickets/'), api.get('/refunds/')])
      .then(([o, t, r]) => {
        setOrders(o.data)
        setTickets(t.data)
        setRefunds(r.data)
      })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) return (<><Navbar /><LoadingSpinner /></>)

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, bg: 'bg-blue-50 text-blue-600' },
    { label: 'Open Tickets', value: tickets.filter(t => t.status === 'open').length, icon: TicketIcon, bg: 'bg-amber-50 text-amber-600' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, icon: Clock, bg: 'bg-purple-50 text-purple-600' },
    { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, icon: CheckCircle2, bg: 'bg-emerald-50 text-emerald-600' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Hero Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Customer Portal</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">Welcome back, {user?.name}</h1>
            <p className="text-blue-100 text-sm mt-1.5 max-w-xl">
              Track your orders, chat with our AI assistant, or request a refund in seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition"
            >
              <Plus size={16} /> New Support Ticket
            </Link>
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-medium text-sm px-4 py-2.5 rounded-xl backdrop-blur transition"
            >
              View Orders <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {error && <ErrorAlert message={error} />}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-3">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Main 2-column grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-slate-900">Recent Orders</h2>
                <p className="text-xs text-slate-400">Your latest purchases</p>
              </div>
              <Link to="/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">No orders yet</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.slice(0, 4).map(order => (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {(order.item_details as { name?: string }).name || order.category}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-400">{order.id}</span> · ₹{order.total_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      {statusBadge(order.status)}
                      <Link
                        to={`/tickets/new?order_id=${order.id}`}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Get help
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Tickets */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-slate-900">Support Tickets</h2>
                <p className="text-xs text-slate-400">Continue a conversation</p>
              </div>
              <Link to="/tickets" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {tickets.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-slate-400 text-sm mb-3">No support tickets yet</p>
                <Link to="/tickets/new" className="text-sm font-medium text-indigo-600 hover:underline">
                  + Create your first ticket
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.slice(0, 4).map(ticket => (
                  <Link
                    key={ticket.id}
                    to={`/tickets/${ticket.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <MessageSquare size={12} /> {format(new Date(ticket.created_at), 'MMM d, yyyy')} · <span className="capitalize">{ticket.category}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      {statusBadge(ticket.status)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Refund Tracker & Return Policy Info */}
        <div className="grid lg:grid-cols-3 gap-6">
          {refunds.length > 0 && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-3">Active Refund Requests</h2>
              <div className="space-y-3">
                {refunds.slice(0, 3).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">₹{r.amount.toLocaleString()} <span className="font-normal text-slate-500">for {r.order_id}</span></p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{r.reason}</p>
                    </div>
                    {statusBadge(r.status)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`${refunds.length > 0 ? '' : 'lg:col-span-3'} bg-indigo-50/70 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4`}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">30-Day Hassle-Free Return Policy</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Delivered items can be returned within 30 days. Refunds up to ₹5,000 are processed directly; requests above ₹5,000 are fast-tracked to a support specialist for review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
