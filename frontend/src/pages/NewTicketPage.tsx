import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import ErrorAlert from '@/components/ui/ErrorAlert'
import { api, getErrorMessage } from '@/lib/api'
import { Order } from '@/types'

export default function NewTicketPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedOrder = searchParams.get('order_id') || ''

  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: preselectedOrder ? 'refund' : 'general',
    priority: 'medium',
    order_id: preselectedOrder,
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<Order[]>('/orders/').then(r => setOrders(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form, order_id: form.order_id || undefined }
      const { data } = await api.post('/tickets/', payload)
      navigate(`/tickets/${data.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create Support Ticket</h1>
          <p className="text-sm text-slate-500 mt-1">Tell us what happened and chat immediately with AuraCare AI.</p>
        </div>
        {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
            <input required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Wireless earbuds stopped working" maxLength={500} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Describe your issue in detail…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {['general', 'refund', 'delivery', 'technical', 'billing'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {['low', 'medium', 'high', 'urgent'].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Related Order (optional)</label>
            <select value={form.order_id} onChange={e => setForm(f => ({ ...f, order_id: e.target.value }))}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">— Select an order —</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.id} · {(order.item_details as { name?: string }).name || order.category} — ₹{order.total_amount} ({order.status})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition shadow-sm disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Ticket & Start Chat'}
          </button>
        </form>
      </div>
    </div>
  )
}
