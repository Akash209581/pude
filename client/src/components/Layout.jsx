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

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/50 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl transition-transform dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Admin</p>
            <h1 className="text-xl font-bold">CSE Portal</h1>
          </div>
          <button className="icon-button md:!hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
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

      {/* Mobile overlay */}
      {open && <button aria-label="Close overlay" className="fixed inset-0 z-30 bg-slate-950/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main content */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/75 px-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75 sm:px-6 flex items-center"
          style={{ minHeight: '4rem' }}>
          <div className="flex items-center gap-2 sm:gap-4 w-full py-2">

            {/* Hamburger — mobile only */}
            <button className="icon-button md:!hidden flex-shrink-0" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>

            {/* Vignan Logo */}
            <img
              src={`${import.meta.env.BASE_URL}vignan.png`}
              alt="Vignan Logo"
              className="h-10 w-auto object-contain flex-shrink-0 sm:h-16 md:h-20 lg:h-24"
            />

            {/* Title — centered */}
            <div className="flex-1 text-center min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-blue-600 truncate">
                Computer Science &amp; Engineering
              </p>
              <h2 className="text-sm sm:text-lg font-bold md:text-2xl leading-tight truncate">
                Department Portal
              </h2>
            </div>

            {/* CSE Logo + dark toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <img
                src={`${import.meta.env.BASE_URL}cse.png`}
                alt="CSE Logo"
                className="h-10 w-auto object-contain flex-shrink-0 sm:h-14 md:h-16 lg:h-20"
              />
              <button className="icon-button" onClick={() => setDark(v => !v)} aria-label="Toggle dark mode">
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

          </div>
        </header>

        <main className="p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
