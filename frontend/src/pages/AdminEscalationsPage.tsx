import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorAlert from '@/components/ui/ErrorAlert'
import { statusBadge } from '@/components/ui/Badge'
import { api, getErrorMessage } from '@/lib/api'
import { Escalation } from '@/types'
import { format } from 'date-fns'
import { AlertTriangle } from 'lucide-react'

export default function AdminEscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [deciding, setDeciding] = useState<string | null>(null)

  useEffect(() => {
    api.get<Escalation[]>('/escalations/')
      .then(r => setEscalations(r.data))
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const decide = async (escId: string, decision: string) => {
    setDeciding(escId)
    try {
      const { data } = await api.patch<Escalation>(`/escalations/${escId}/decision`, {
        decision, internal_note: notes[escId] || null
      })
      setEscalations(prev => prev.map(e => e.id === escId ? data : e))
    } catch (e) {
      setError(getErrorMessage(e))
    } finally { setDeciding(null) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="text-red-500" size={22} />
          <h1 className="text-2xl font-bold text-gray-900">Escalations Review</h1>
        </div>
        {error && <ErrorAlert message={error} />}
        {loading ? <LoadingSpinner /> : escalations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No escalations</div>
        ) : (
          <div className="space-y-4">
            {escalations.map(esc => (
              <div key={esc.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{esc.summary}</p>
                    <p className="text-xs text-gray-400 mt-1">Created {format(new Date(esc.created_at), 'MMM d, yyyy · h:mm a')}</p>
                  </div>
                  <div className="flex gap-2">{statusBadge(esc.priority)}{statusBadge(esc.decision)}</div>
                </div>
                {esc.internal_note && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                    📝 Note: {esc.internal_note}
                  </div>
                )}
                {esc.decision === 'pending' && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <textarea
                      placeholder="Add an internal note (optional)…"
                      value={notes[esc.id] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [esc.id]: e.target.value }))}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-3 flex-wrap">
                      <button onClick={() => decide(esc.id, 'approved')} disabled={deciding === esc.id}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm px-5 py-2 rounded-lg transition disabled:opacity-50">
                        ✓ Approve Refund
                      </button>
                      <button onClick={() => decide(esc.id, 'rejected')} disabled={deciding === esc.id}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm px-5 py-2 rounded-lg transition disabled:opacity-50">
                        ✗ Reject
                      </button>
                      <button onClick={() => decide(esc.id, 'more_info')} disabled={deciding === esc.id}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-5 py-2 rounded-lg transition disabled:opacity-50">
                        ? Need More Info
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
