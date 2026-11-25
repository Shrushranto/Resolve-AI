import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorAlert from '@/components/ui/ErrorAlert'
import { statusBadge } from '@/components/ui/Badge'
import { api, getErrorMessage } from '@/lib/api'
import { Ticket, Message, Refund } from '@/types'
import { format } from 'date-fns'
import { Bot, User, Headphones } from 'lucide-react'

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusUpdate, setStatusUpdate] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get<Ticket>(`/tickets/${id}`),
      api.get<Message[]>(`/tickets/${id}/messages`),
      api.get<Refund[]>('/refunds/'),
    ]).then(([t, m, r]) => {
      setTicket(t.data)
      setMessages(m.data)
      setRefunds(r.data.filter(rf => rf.ticket_id === id))
    }).catch(e => setError(getErrorMessage(e)))
    .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async () => {
    if (!id || !statusUpdate) return
    setUpdating(true)
    try {
      const { data } = await api.patch<Ticket>(`/tickets/${id}/status`, { status: statusUpdate })
      setTicket(data)
      setStatusUpdate('')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally { setUpdating(false) }
  }

  const reviewRefund = async (refundId: string, decision: string) => {
    try {
      await api.patch(`/refunds/${refundId}/review`, { decision })
      setRefunds(prev => prev.map(r => r.id === refundId ? { ...r, status: decision as 'approved' | 'rejected' } : r))
    } catch (e) { setError(getErrorMessage(e)) }
  }

  if (loading) return (<><Navbar /><LoadingSpinner /></>)

  const senderIcon = (type: string) => {
    if (type === 'ai_agent') return <Bot size={16} className="text-blue-600" />
    if (type === 'support_agent') return <Headphones size={16} className="text-purple-600" />
    return <User size={16} className="text-gray-600" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {error && <ErrorAlert message={error} />}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{ticket?.subject}</h1>
              <p className="text-gray-500 text-sm mt-1">{ticket?.description}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ticket && statusBadge(ticket.status)}
              {ticket && statusBadge(ticket.priority)}
            </div>
          </div>
          <div className="mt-4 flex gap-3 items-center border-t border-gray-100 pt-4">
            <select value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Update status…</option>
              {['open', 'in_progress', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <button onClick={updateStatus} disabled={!statusUpdate || updating}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40 transition">
              Update
            </button>
          </div>
        </div>

        {refunds.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Refund Requests</h2>
            {refunds.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
                <div>
                  <p className="text-sm font-medium">₹{r.amount.toLocaleString()} — {r.reason.slice(0,60)}</p>
                  <p className="text-xs text-gray-400">{format(new Date(r.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex gap-2 items-center">
                  {statusBadge(r.status)}
                  {(r.status === 'pending' || r.status === 'escalated') && (
                    <>
                      <button onClick={() => reviewRefund(r.id, 'approved')}
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700">Approve</button>
                      <button onClick={() => reviewRefund(r.id, 'rejected')}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded-full hover:bg-red-700">Reject</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Conversation History</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? <p className="text-gray-400 text-sm">No messages</p> : messages.map(msg => (
              <div key={msg.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gray-100">{senderIcon(msg.sender_type)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700 capitalize">{msg.sender_type.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-400">{format(new Date(msg.created_at), 'h:mm a')}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
