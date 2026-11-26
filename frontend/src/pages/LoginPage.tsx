import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { api, getErrorMessage } from '@/lib/api'
import { storeAuth, isStaff } from '@/lib/auth'
import { User } from '@/types'
import {
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  MessageSquareText,
  Zap,
  CheckCircle2,
} from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const justRegistered = searchParams.get('registered') === '1'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Left Brand / Value Panel (Desktop) */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-950 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_48%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.2),_transparent_48%)] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">AuraCare</span>
        </div>

        <div className="relative z-10 max-w-md space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-400/20 px-3 py-1 rounded-full">
              AI-Powered Customer Resolution
            </span>
            <h2 className="text-4xl font-bold tracking-tight leading-tight">
              Support that resolves, not just replies.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Track orders in real time, get instant policy-backed answers, and manage returns or escalations in one unified workspace.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              {
                icon: MessageSquareText,
                title: 'Context-aware AI assistant',
                desc: 'Checks your order status and return policy before taking action.',
              },
              {
                icon: Zap,
                title: 'Instant refund eligibility',
                desc: 'Automated verification with seamless human escalation when needed.',
              },
              {
                icon: ShieldCheck,
                title: 'Verified & auditable',
                desc: 'Role-based access and full transparency across every ticket.',
              },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} AuraCare Support Platform
        </p>
      </div>

      {/* Right Sign-In Form Panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">AuraCare</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-7 sm:p-9">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h1>
              <p className="text-slate-500 text-sm mt-1.5">
                Enter your credentials to access your dashboard and tickets.
              </p>
            </div>

            {justRegistered && !error && (
              <div className="mb-5 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm">
                <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                <span>Account created! Sign in with your email and password.</span>
              </div>
            )}

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 px-4 rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6 pt-6 border-t border-slate-100">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 hover:underline font-semibold">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
