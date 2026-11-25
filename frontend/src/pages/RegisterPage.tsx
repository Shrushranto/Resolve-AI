import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, getErrorMessage } from '@/lib/api'
import { Sparkles } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password, role: 'customer' })
      navigate('/login?registered=1')
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your AuraCare account</h1>
          <p className="text-slate-500 text-sm mt-1">Fast support for your orders & returns</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
          {['name', 'email', 'password', 'confirmPassword'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 capitalize">
                {field === 'confirmPassword' ? 'Confirm Password' : field}
              </label>
              <input
                type={field.includes('assword') ? 'password' : field === 'email' ? 'email' : 'text'}
                required
                value={form[field as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-sm disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
