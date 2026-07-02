import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LockKeyhole, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/useAuth.js'

function Login() {
  const { login, token } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      await login(form)
      toast.success('Welcome back')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#f8fafc,#eff6ff_55%,#ffffff)] p-4 dark:bg-[radial-gradient(circle_at_top_left,#1e3a8a,transparent_32%),linear-gradient(135deg,#020617,#0f172a)]">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-white/70 bg-white/70 shadow-2xl shadow-blue-950/10 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 md:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-blue-700 p-10 text-white md:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">CSE Department</p>
              <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight">Publication analytics, events, and student research records.</h1>
            </div>

          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 sm:p-10">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <LockKeyhole />
          </div>
          <h2 className="text-3xl font-bold text-slate-950 dark:text-white">Admin Login</h2>
          <p className="mt-2 text-sm text-slate-500">Use the seeded administrator account to continue.</p>
          <div className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input id="username" className="input" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" className="input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
            </div>
          </div>
          <button className="btn-primary mt-6 w-full justify-center" disabled={loading}>
            <LogIn size={16} /> {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login
