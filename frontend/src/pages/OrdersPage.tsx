import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorAlert from '@/components/ui/ErrorAlert'
import { statusBadge } from '@/components/ui/Badge'
import { api, getErrorMessage } from '@/lib/api'
import { Order } from '@/types'
import { format, differenceInDays } from 'date-fns'
import { Package, LifeBuoy, CheckCircle, AlertCircle } from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Order[]>('/orders/')
      .then(r => setOrders(r.data))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const getReturnWindowInfo = (order: Order) => {
    if (order.status !== 'delivered' || !order.delivery_date) return null
    const days = differenceInDays(new Date(), new Date(order.delivery_date))
    const remaining = 30 - days
    if (remaining >= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
          <CheckCircle size={12} /> {remaining} days left in return window
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
        <AlertCircle size={12} /> Return window expired ({days} days ago)
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-sm text-slate-500 mt-1">View your order details, return eligibility, or start a support ticket.</p>
        </div>
        {error && <ErrorAlert message={error} />}
        {loading ? <LoadingSpinner /> : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 text-center py-16 text-slate-400">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="font-semibold text-slate-900 text-base">
                        {(order.item_details as { name?: string }).name || 'Order'}
                      </h2>
                      {statusBadge(order.status)}
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {order.id}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Category: <span className="capitalize font-medium text-slate-700">{order.category}</span>
                      {order.delivery_date && (
                        <> · Delivered {format(new Date(order.delivery_date), 'MMM d, yyyy')}</>
                      )}
                    </p>
                    <div className="pt-1">{getReturnWindowInfo(order)}</div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <p className="text-2xl font-bold text-slate-900">₹{order.total_amount.toLocaleString()}</p>
                    <Link
                      to={`/tickets/new?order_id=${order.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 px-3.5 py-2 rounded-xl transition"
                    >
                      <LifeBuoy size={14} /> Request Help / Refund
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
