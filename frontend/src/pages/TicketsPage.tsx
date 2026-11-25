import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorAlert from '@/components/ui/ErrorAlert'
import { statusBadge } from '@/components/ui/Badge'
import { api, getErrorMessage } from '@/lib/api'
import { Ticket } from '@/types'
import { format } from 'date-fns'
import { Plus, TicketIcon, Search, ArrowRight } from 'lucide-react'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')

  useEffect(() => {
    api.get<Ticket[]>('/tickets/')
      .then(r => setTickets(r.data))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tickets.filter(t => {
    const matchesStatus = filter === 'all' || t.status === filter
    const matchesQuery = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesQuery
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
            <p className="text-sm text-slate-500 mt-1">Chat with AuraCare AI or track resolution status.</p>
          </div>
          <Link to="/tickets/new"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition">
            <Plus size={16} /> New Ticket
          </Link>
        </div>

        {/* Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your tickets…"
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-1.5 bg-white border border-slate-200 p-1 rounded-xl">
            {(['all', 'open', 'in_progress', 'resolved'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  filter === tab ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorAlert message={error} />}
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 text-center py-16 text-slate-400">
            <TicketIcon size={48} className="mx-auto mb-3 opacity-30" />
            <p>No tickets match your filter. <Link to="/tickets/new" className="text-indigo-600 hover:underline font-medium">Create one</Link></p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ticket => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`}
                className="block bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition truncate">{ticket.subject}</p>
                      {ticket.order_id && (
                        <span className="text-[11px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{ticket.order_id}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{ticket.description}</p>
                    <p className="text-xs text-slate-400 mt-2.5">{format(new Date(ticket.created_at), 'MMM d, yyyy · h:mm a')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex gap-1.5">
                      {statusBadge(ticket.status)}
                      {statusBadge(ticket.priority)}
                    </div>
                    <span className="text-xs font-medium text-indigo-600 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      Open Chat <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
