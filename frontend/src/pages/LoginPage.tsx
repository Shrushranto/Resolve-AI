import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, getErrorMessage } from '@/lib/api'
import { storeAuth, isStaff } from '@/lib/auth'
import { User } from '@/types'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: tokenData } = await api.post<{ access_token: string }>('/auth/login', form)
      localStorage.setItem('token', tokenData.access_token)
      const { data: userData } = await api.get<User>('/auth/me')
      storeAuth(tokenData.access_token, userData)
      navigate(isStaff(userData) ? '/admin/dashboard' : '/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/50 to-blue-100/60 px-4 py-10">
      <div className="bg-white/95 backdrop-blur rounded-3xl shadow-xl border border-slate-200/70 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white mx-auto mb-3 shadow-md">
            <Sparkles size={22} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to AuraCare</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage orders, tickets & refunds</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
            <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Signing in…' : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline font-medium">Create one</Link>
        </p>

        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Quick Demo Login</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button"
              onClick={() => setForm({ email: 'priya@example.com', password: 'password123' })}
              className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl py-2 px-3 font-medium transition">
              Customer (Priya)
            </button>
            <button type="button"
              onClick={() => setForm({ email: 'agent@supportai.com', password: 'agentpass123' })}
              className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl py-2 px-3 font-medium transition">
              Support Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
