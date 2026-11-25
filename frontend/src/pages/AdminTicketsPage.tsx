import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorAlert from '@/components/ui/ErrorAlert'
import { statusBadge } from '@/components/ui/Badge'
import { api, getErrorMessage } from '@/lib/api'
import { Ticket } from '@/types'
import { format } from 'date-fns'
import { Search } from 'lucide-react'

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filtered, setFiltered] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    api.get<Ticket[]>('/tickets/')
      .then(r => { setTickets(r.data); setFiltered(r.data) })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = tickets
    if (search) result = result.filter(t => t.subject.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter) result = result.filter(t => t.status === statusFilter)
    setFiltered(result)
  }, [search, statusFilter, tickets])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">All Tickets</h1>
        {error && <ErrorAlert message={error} />}

        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All statuses</option>
            {['open', 'in_progress', 'resolved', 'closed'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Subject', 'Category', 'Status', 'Priority', 'Created'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <Link to={`/admin/tickets/${ticket.id}`} className="font-medium text-blue-600 hover:underline truncate block max-w-xs">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-5 py-4 capitalize text-gray-600">{ticket.category}</td>
                    <td className="px-5 py-4">{statusBadge(ticket.status)}</td>
                    <td className="px-5 py-4">{statusBadge(ticket.priority)}</td>
                    <td className="px-5 py-4 text-gray-400">{format(new Date(ticket.created_at), 'MMM d')}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No tickets found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
