import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorAlert from '@/components/ui/ErrorAlert'
import { statusBadge } from '@/components/ui/Badge'
import { api, getErrorMessage } from '@/lib/api'
import { getStoredUser } from '@/lib/auth'
import { Ticket, Message, Refund, User as UserType } from '@/types'
import { format } from 'date-fns'
import { Send, Bot, User, Headphones, ArrowLeft } from 'lucide-react'

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<UserType | null>(null)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    setUser(getStoredUser())
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessageText = async (text: string) => {
    if (!id || !text.trim() || sending) return
    const clean = text.trim()
    setInput('')
    setSending(true)
    setError('')
    const tempMsg: Message = { id: 'temp', ticket_id: id, sender_type: 'customer', content: clean, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])
    try {
      const { data } = await api.post<Message>(`/tickets/${id}/chat`, { message: clean })
      setMessages(prev => [...prev.filter(m => m.id !== 'temp'), { ...tempMsg, id: 'sent-' + Date.now() }, data])
      const r = await api.get<Refund[]>('/refunds/')
      setRefunds(r.data.filter(rf => rf.ticket_id === id))
    } catch (err) {
      setError(getErrorMessage(err))
      setMessages(prev => prev.filter(m => m.id !== 'temp'))
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessageText(input)
  }

  if (loading) return (<><Navbar /><LoadingSpinner /></>)
  if (error && !ticket) return (<><Navbar /><div className="p-8"><ErrorAlert message={error} /></div></>)

  const senderIcon = (type: string) => {
    if (type === 'ai_agent') return <Bot size={16} className="text-indigo-600" />
    if (type === 'support_agent') return <Headphones size={16} className="text-purple-600" />
    return <User size={16} className="text-slate-600" />
  }

  const isCustomer = user?.role === 'customer'
  const orderRef = ticket?.order_id || 'order-001'
  const quickPrompts = [
    `What is the status of ${orderRef}?`,
    'What is your return policy?',
    `I want a refund for ${orderRef}`,
    'Please escalate this to a human agent',
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 py-6 flex-1 flex flex-col gap-4">
        <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 w-fit">
          <ArrowLeft size={15} /> Back to tickets
        </Link>

        {error && <ErrorAlert message={error} />}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{ticket?.subject}</h1>
              <p className="text-sm text-slate-500 mt-1">{ticket?.description}</p>
              <p className="text-xs text-slate-400 mt-2">
                Created {ticket && format(new Date(ticket.created_at), 'MMM d, yyyy')}
                {ticket?.order_id && <> · Order <span className="font-mono text-slate-500">{ticket.order_id}</span></>}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ticket && statusBadge(ticket.status)}
              {ticket && statusBadge(ticket.priority)}
              {ticket && statusBadge(ticket.category)}
            </div>
          </div>

          {refunds.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Refund Progress</p>
              <div className="space-y-2">
                {refunds.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm bg-slate-50 px-3.5 py-2.5 rounded-xl">
                    <span className="text-slate-700 font-medium">₹{r.amount.toLocaleString()} — <span className="font-normal text-slate-500">{r.reason.slice(0, 60)}</span></span>
                    {statusBadge(r.status)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col flex-1 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 font-semibold text-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <span className="text-sm">AuraCare AI Assistant</span>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Online</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[460px]">
            {messages.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">No messages yet. Ask a question or pick a quick prompt below!</p>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender_type === 'customer' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender_type === 'customer' ? 'bg-indigo-100' : msg.sender_type === 'ai_agent' ? 'bg-blue-50' : 'bg-purple-100'
                }`}>
                  {senderIcon(msg.sender_type)}
                </div>
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
                  msg.sender_type === 'customer'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={`text-[11px] mt-1.5 ${msg.sender_type === 'customer' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {format(new Date(msg.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Bot size={16} className="text-indigo-600" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {isCustomer && ticket?.status !== 'closed' && (
            <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                {quickPrompts.map(q => (
                  <button
                    key={q}
                    type="button"
                    disabled={sending}
                    onClick={() => sendMessageText(q)}
                    className="text-xs bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 px-3 py-1.5 rounded-full transition disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2.5">
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder="Type your message…" disabled={sending}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button type="submit" disabled={sending || !input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition disabled:opacity-40 flex items-center gap-2">
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
          {ticket?.status === 'closed' && (
            <div className="border-t border-slate-100 p-4 text-center text-sm text-slate-400">This ticket is closed.</div>
          )}
        </div>
      </div>
    </div>
  )
}
