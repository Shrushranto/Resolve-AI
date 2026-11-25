import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorAlert from '@/components/ui/ErrorAlert'
import { statusBadge } from '@/components/ui/Badge'
import { api, getErrorMessage } from '@/lib/api'
import { getStoredUser, isStaff } from '@/lib/auth'
import { Ticket, Escalation, Refund } from '@/types'
import { AlertTriangle, TicketIcon } from 'lucide-react'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const user = getStoredUser()
    if (!user) { navigate('/login'); return }
    if (!isStaff(user)) { navigate('/dashboard'); return }
    Promise.all([api.get('/tickets/'), api.get('/escalations/'), api.get('/refunds/')])
      .then(([t, e, r]) => { setTickets(t.data); setEscalations(e.data); setRefunds(r.data) })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) return (<><Navbar /><LoadingSpinner /></>)

  const pendingEscalations = escalations.filter(e => e.decision === 'pending')
  const pendingRefunds = refunds.filter(r => r.status === 'pending' || r.status === 'escalated')
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Support Dashboard</h1>
        {error && <ErrorAlert message={error} />}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Open Tickets', value: openTickets.length, color: 'bg-blue-50 text-blue-700' },
            { label: 'Pending Escalations', value: pendingEscalations.length, color: 'bg-red-50 text-red-700' },
            { label: 'Pending Refunds', value: pendingRefunds.length, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Total Tickets', value: tickets.length, color: 'bg-gray-50 text-gray-700' },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl border border-gray-200 p-5 ${stat.color} bg-opacity-50`}>
              <p className="text-sm font-medium opacity-80">{stat.label}</p>
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {pendingEscalations.length > 0 && (
          <div className="bg-white rounded-xl border border-red-200 mb-6">
            <div className="flex items-center gap-2 p-5 border-b border-red-100">
              <AlertTriangle size={18} className="text-red-500" />
              <h2 className="font-semibold text-gray-900">Pending Escalations ({pendingEscalations.length})</h2>
              <Link to="/admin/escalations" className="ml-auto text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingEscalations.slice(0, 5).map(esc => (
                <Link key={esc.id} to="/admin/escalations"
                  className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{esc.summary.slice(0, 80)}…</p>
                  </div>
                  <div className="flex gap-2 ml-4">{statusBadge(esc.priority)}{statusBadge(esc.decision)}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 p-5 border-b border-gray-100">
            <TicketIcon size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
            <Link to="/admin/tickets" className="ml-auto text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {openTickets.slice(0, 8).map(ticket => (
              <Link key={ticket.id} to={`/admin/tickets/${ticket.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{ticket.subject}</p>
                  <p className="text-xs text-gray-400">{ticket.category}</p>
                </div>
                <div className="flex gap-2">{statusBadge(ticket.status)}{statusBadge(ticket.priority)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
