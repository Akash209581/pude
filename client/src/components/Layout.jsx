import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, CalendarDays, FileSpreadsheet, LibraryBig, LogOut, Menu, Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/useAuth.js'

const links = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/publications', label: 'Publications', icon: LibraryBig },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/upload-publications', label: 'Upload Publications', icon: FileSpreadsheet },
]

function Layout() {
  const { logout, user } = useAuth()
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('cse_theme') === 'dark')
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('cse_theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-white/50 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl transition-transform dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Admin</p>
            <h1 className="text-xl font-bold">CSE Portal</h1>
          </div>
          <button className="icon-button lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white/70 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/50">
            <p className="font-semibold">{user?.username}</p>
            <p className="text-slate-500">Administrator</p>
          </div>
          <button className="btn-secondary w-full justify-center" onClick={logout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      {open && <button aria-label="Close overlay" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/75 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="icon-button lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Computer Science & Engineering</p>
                <h2 className="text-lg font-bold sm:text-2xl">Department Portal</h2>
              </div>
            </div>
            <button className="icon-button" onClick={() => setDark((value) => !value)} aria-label="Toggle dark mode">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
