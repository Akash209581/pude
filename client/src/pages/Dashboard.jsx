import { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BookOpen, CalendarClock, FileText, GraduationCap, LibraryBig, Users, Search, X, Moon, Sun } from 'lucide-react'
import api from '../services/api.js'
import Spinner from '../components/Spinner.jsx'

const statConfig = [
  ['Total Publications', 'total_publications', LibraryBig],
  ['Total Students', 'total_students', Users],
  ['Conference Papers', 'total_conference_papers', FileText],
  ['Journal Papers', 'total_journal_papers', BookOpen],
  ['Faculty Publications', 'total_faculty_publications', GraduationCap],
  ['Total Events', 'total_events', CalendarClock],
]

function DetailModal({ isOpen, onClose, statType, isPublic }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    let url = ''
    if (statType === 'total_students') {
      url = '/public/students'
    } else if (statType === 'total_events') {
      url = isPublic ? '/public/events' : '/events'
    } else {
      url = isPublic ? '/public/publications?all=true' : '/publications?all=true'
    }

    api.get(url)
      .then(({ data }) => {
        if (statType === 'total_conference_papers') {
          setData(data.rows.filter(p => p.conference_or_journal === 'Conference'))
        } else if (statType === 'total_journal_papers') {
          setData(data.rows.filter(p => p.conference_or_journal === 'Journal'))
        } else if (statType === 'total_faculty_publications') {
          const counts = {}
          const rows = data.rows || []
          rows.forEach(p => {
            if (p.faculty_guide && p.faculty_guide.trim() !== '') {
              const name = p.faculty_guide.trim()
              counts[name] = (counts[name] || 0) + 1
            }
          })
          const list = Object.keys(counts).map(name => ({
            faculty_name: name,
            publications: counts[name]
          })).sort((a, b) => b.publications - a.publications)
          setData(list)
        } else if (statType === 'total_publications') {
          setData(data.rows || [])
        } else {
          setData(data || [])
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [isOpen, statType, isPublic])

  if (!isOpen) return null

  const filteredData = data.filter(item => {
    const term = searchTerm.toLowerCase()
    if (statType === 'total_students') {
      return (
        item.student_name?.toLowerCase().includes(term) ||
        item.registration_number?.toLowerCase().includes(term)
      )
    } else if (statType === 'total_faculty_publications') {
      return item.faculty_name?.toLowerCase().includes(term)
    } else if (statType === 'total_events') {
      return (
        item.event_name?.toLowerCase().includes(term) ||
        item.coordinator_name?.toLowerCase().includes(term) ||
        item.venue?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      )
    } else {
      return (
        item.paper_title?.toLowerCase().includes(term) ||
        item.paper_name?.toLowerCase().includes(term) ||
        item.authors_text?.toLowerCase().includes(term) ||
        item.faculty_guide?.toLowerCase().includes(term) ||
        String(item.year).includes(term)
      )
    }
  })

  const getTitle = () => {
    switch (statType) {
      case 'total_publications': return 'All Publications'
      case 'total_students': return 'All Students & Publications Count'
      case 'total_conference_papers': return 'Conference Papers'
      case 'total_journal_papers': return 'Journal Papers'
      case 'total_faculty_publications': return 'Faculty Members & Publications Count'
      case 'total_events': return 'All Events'
      default: return 'Details'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{getTitle()}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500">
            {filteredData.length} records found
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 flex justify-center"><Spinner /></div>
          ) : filteredData.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No matching records found.</div>
          ) : (
            <div className="overflow-x-auto">
              {statType === 'total_students' && (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3 w-[45%]">Student Name</th>
                      <th className="pb-3 w-[35%]">Registration Number</th>
                      <th className="pb-3 w-[20%] text-right">Publications Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                    {filteredData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{item.student_name}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">{item.registration_number}</td>
                        <td className="py-3 text-right font-bold text-blue-600 dark:text-blue-400">{item.publications}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {statType === 'total_faculty_publications' && (
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3 w-[75%]">Faculty Name</th>
                      <th className="pb-3 w-[25%] text-right">Publications Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                    {filteredData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{item.faculty_name}</td>
                        <td className="py-3 text-right font-bold text-blue-600 dark:text-blue-400">{item.publications}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {statType === 'total_events' && (
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3 w-[35%]">Event Name</th>
                      <th className="pb-3 w-[20%]">Coordinator</th>
                      <th className="pb-3 w-[20%]">Date</th>
                      <th className="pb-3 w-[15%]">Venue</th>
                      <th className="pb-3 w-[10%] text-right">Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                    {filteredData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate" title={item.event_name}>{item.event_name}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">{item.coordinator_name}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">
                          {new Date(item.from_date).toLocaleDateString()}
                          {item.to_date && item.to_date !== item.from_date && ` - ${new Date(item.to_date).toLocaleDateString()}`}
                        </td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">{item.venue}</td>
                        <td className="py-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                          {item.budget ? `₹${Number(item.budget).toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {['total_publications', 'total_conference_papers', 'total_journal_papers'].includes(statType) && (
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3 w-[6%] pr-2">S.No</th>
                      <th className="pb-3 w-[30%] pr-4">Title</th>
                      <th className="pb-3 w-[25%] pr-4">Venue / Journal</th>
                      <th className="pb-3 w-[10%] pr-2">Type</th>
                      <th className="pb-3 w-[18%] pr-4">Authors</th>
                      <th className="pb-3 w-[14%] pr-2">Faculty Guide</th>
                      <th className="pb-3 w-[7%] text-right">Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                    {filteredData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                        <td className="py-3 text-slate-500 dark:text-slate-400 pr-2">{item.serial_no || '-'}</td>
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate pr-4" title={item.paper_title}>{item.paper_title}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate pr-4" title={item.paper_name}>{item.paper_name}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400 pr-2">{item.conference_or_journal}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate pr-4" title={item.authors_text}>{item.authors_text}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400 pr-2">{item.faculty_guide || '-'}</td>
                        <td className="py-3 text-right font-semibold text-slate-800 dark:text-slate-200">{item.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Dashboard({ isPublic = false }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStat, setSelectedStat] = useState('')
  const [dark, setDark] = useState(() => localStorage.getItem('cse_theme') === 'dark')

  useEffect(() => {
    const endpoint = isPublic ? '/public/dashboard' : '/dashboard'
    api.get(endpoint)
      .then(({ data }) => setData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [isPublic])

  useEffect(() => {
    if (!isPublic) return
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('cse_theme', dark ? 'dark' : 'light')
  }, [dark, isPublic])

  if (loading) return <Spinner />
  if (!data) return null

  const pieColors = ['#2563eb', '#0ea5e9']
  const eventPieColors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b']

  const getValue = (key) => {
    if (key === 'total_events') {
      return data?.eventAnalytics?.totalEvents || 0
    }
    return data?.stats?.[key] || 0
  }

  const dashboardContent = (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statConfig.map(([label, key, Icon]) => (
          <article 
            className="stat-card cursor-pointer hover:shadow-md hover:border-blue-500/50 dark:hover:border-blue-500/50 transition duration-200" 
            key={key}
            onClick={() => {
              setSelectedStat(key)
              setModalOpen(true)
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-bold">{getValue(key)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Icon /></div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-panel p-5">
          <h3 className="mb-4 text-lg font-bold">Publications by Year</h3>
          <div className="h-80">
            <ResponsiveContainer>
              <AreaChart data={data.byYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area dataKey="count" stroke="#2563eb" fill="#bfdbfe" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-panel p-5">
          <h3 className="mb-4 text-lg font-bold">Conference vs Journal</h3>
          <div className="h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.byCategory} dataKey="value" nameKey="name" outerRadius={96} label>
                  {data.byCategory.map((entry, index) => <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-panel p-5">
          <h3 className="mb-4 text-lg font-bold">Top Publishing Students</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.topStudents}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="student_name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="publications" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-panel p-5">
          <h3 className="mb-4 text-lg font-bold">Monthly Events</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={data?.eventAnalytics?.eventsByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area dataKey="count" name="Events Count" stroke="#10b981" fill="#a7f3d0" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Event Analytics Section */}
      <div className="border-t border-slate-100 dark:border-slate-850 pt-6">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Department Events Analytics</h2>
        <section className="grid gap-4 sm:grid-cols-2 mb-6">
          <article 
            className="stat-card cursor-pointer hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition duration-200"
            onClick={() => {
              setSelectedStat('total_events')
              setModalOpen(true)
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Department Events</p>
                <p className="mt-2 text-3xl font-bold">{data?.eventAnalytics?.totalEvents || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CalendarClock />
              </div>
            </div>
          </article>
          <article className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Budget Allocated</p>
                <p className="mt-2 text-3xl font-bold">₹{(data?.eventAnalytics?.totalBudget || 0).toLocaleString()}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <span className="font-bold text-lg">₹</span>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="glass-panel p-5">
            <h3 className="mb-4 text-lg font-bold">Events by Type</h3>
            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data?.eventAnalytics?.eventsByType || []} dataKey="value" nameKey="name" outerRadius={96} label>
                    {(data?.eventAnalytics?.eventsByType || []).map((entry, index) => <Cell key={entry.name} fill={eventPieColors[index % eventPieColors.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-panel p-5">
            <h3 className="mb-4 text-lg font-bold">Events by Academic Year</h3>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={data?.eventAnalytics?.eventsByYear || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Event Count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      <DetailModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        statType={selectedStat} 
        isPublic={isPublic} 
      />
    </div>
  )

  if (isPublic) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/75 px-4 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Computer Science & Engineering</p>
              <h2 className="text-lg font-bold sm:text-2xl">Department Events & Publications Dashboard</h2>
            </div>
            <button className="icon-button" onClick={() => setDark((value) => !value)} aria-label="Toggle dark mode">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-4 sm:p-6">
          {dashboardContent}
        </main>
      </div>
    )
  }

  return dashboardContent
}

export default Dashboard
