import { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BookOpen, CalendarClock, FileText, LibraryBig, Users, Search, X, Moon, Sun, ArrowUpRight, Sparkles, Trophy, Calendar, MapPin, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api.js'
import Spinner from '../components/Spinner.jsx'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/50 backdrop-blur-md rounded-xl p-3 shadow-xl text-white">
        {label && <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>}
        {payload.map((item, idx) => (
          <p key={idx} className="text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
            <span className="text-slate-250">{item.name || item.payload?.name}:</span>
            <span className="text-white">{item.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

function DetailModal({ isOpen, onClose, statType, isPublic, subFilter }) {
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
    // Apply subFilter for event stats if present
    if (subFilter && statType === 'total_events') {
      if (subFilter.type === 'event_type' && item.event_type !== subFilter.value) {
        return false
      }
      if (subFilter.type === 'academic_year' && item.academic_year !== subFilter.value) {
        return false
      }
    }

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
      case 'total_events':
        if (subFilter) {
          if (subFilter.type === 'event_type') {
            return `Events - ${subFilter.value}`
          }
          if (subFilter.type === 'academic_year') {
            return `Events - Academic Year ${subFilter.value}`
          }
        }
        return 'All Events'
      default: return 'Details'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            {getTitle()}
          </h2>
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
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
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
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
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
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
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
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3 w-[8%] pr-2">S.No</th>
                      <th className="pb-3 w-[36%] pr-4">Title</th>
                      <th className="pb-3 w-[28%] pr-4">Venue / Journal</th>
                      <th className="pb-3 w-[10%] pr-2">Type</th>
                      <th className="pb-3 w-[12%] pr-4">Authors</th>
                      <th className="pb-3 w-[6%] text-right">Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                    {filteredData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                        <td className="py-3 text-slate-500 dark:text-slate-400 pr-2">{item.serial_no || '-'}</td>
                        <td className="py-3 pr-4" title={item.paper_title}>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 break-words">
                            {item.paper_title}
                          </div>
                        </td>
                        <td className="py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate pr-4" title={item.paper_name}>{item.paper_name}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400 pr-2">{item.conference_or_journal}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate pr-4" title={item.authors_text}>{item.authors_text}</td>
                        <td className="py-3 text-right font-semibold text-slate-800 dark:text-slate-200">{item.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Dashboard({ isPublic = false }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStat, setSelectedStat] = useState('')
  const [selectedSubFilter, setSelectedSubFilter] = useState(null)
  const [dark, setDark] = useState(() => localStorage.getItem('cse_theme') === 'dark')
  const [isDarkTheme, setIsDarkTheme] = useState(() => document.documentElement.classList.contains('dark'))

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
    setIsDarkTheme(dark)
  }, [dark, isPublic])

  // Theme mutation listener
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  if (loading) return <Spinner />
  if (!data) return null

  // Fetch counts from endpoints
  const totalPublications = data?.stats?.total_publications || 0
  const totalStudents = data?.stats?.total_students || 0
  const confCount = data?.stats?.total_conference_papers || 0
  const journalCount = data?.stats?.total_journal_papers || 0
  const eventsCount = data?.eventAnalytics?.totalEvents || 0

  const pieColors = ['#2563eb', '#ea580c']
  const eventPieColors = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4']

  const confPercent = totalPublications > 0 ? Math.round((confCount / totalPublications) * 100) : 0
  const journalPercent = totalPublications > 0 ? Math.round((journalCount / totalPublications) * 100) : 0

  // Sparkline data generators
  const getSparkData = (val) => {
    const base = Number(val) || 0
    return [
      { value: Math.round(base * 0.72) },
      { value: Math.round(base * 0.81) },
      { value: Math.round(base * 0.78) },
      { value: Math.round(base * 0.90) },
      { value: base }
    ]
  }

  const calculateTrend = (yearlyData) => {
    if (!yearlyData || yearlyData.length < 2) {
      return { trend: '─ 0% vs last year', trendColor: 'text-slate-400' }
    }
    const sorted = [...yearlyData].sort((a, b) => {
      const yA = String(a.year || '')
      const yB = String(b.year || '')
      return yA.localeCompare(yB)
    })
    const latest = sorted[sorted.length - 1].count
    const prev = sorted[sorted.length - 2].count
    if (prev <= 0) {
      return { trend: '─ 0% vs last year', trendColor: 'text-slate-400' }
    }
    const pct = Math.round(((latest - prev) / prev) * 100)
    const trendText = pct > 0 ? `↑ ${pct}% vs last year` : pct < 0 ? `↓ ${Math.abs(pct)}% vs last year` : `─ 0% vs last year`
    const trendColor = pct > 0 ? 'text-emerald-500' : pct < 0 ? 'text-rose-500' : 'text-slate-400'
    return { trend: trendText, trendColor }
  }

  const getTrendData = (statKey) => {
    switch (statKey) {
      case 'total_publications':
        return calculateTrend(data.byYear)
      case 'total_students':
        return calculateTrend(data.studentsByYear)
      case 'total_conference_papers':
        return calculateTrend(data.confByYear)
      case 'total_journal_papers':
        return calculateTrend(data.journalByYear)
      case 'total_events':
        return calculateTrend(data?.eventAnalytics?.eventsByYear)
      default:
        return { trend: '─ 0% vs last year', trendColor: 'text-slate-400' }
    }
  }

  const cardsConfig = [
    {
      label: 'Total Publications',
      value: totalPublications,
      icon: LibraryBig,
      ...getTrendData('total_publications'),
      lineColor: '#2563eb',
      iconBg: 'bg-blue-600 text-white',
      sparkKey: 'pubs',
      statKey: 'total_publications'
    },
    {
      label: 'Total Students',
      value: totalStudents,
      icon: Users,
      ...getTrendData('total_students'),
      lineColor: '#10b981',
      iconBg: 'bg-emerald-600 text-white',
      sparkKey: 'students',
      statKey: 'total_students'
    },
    {
      label: 'Conference Papers',
      value: confCount,
      icon: FileText,
      ...getTrendData('total_conference_papers'),
      lineColor: '#ec4899',
      iconBg: 'bg-pink-600 text-white',
      sparkKey: 'conf',
      statKey: 'total_conference_papers'
    },
    {
      label: 'Journal Papers',
      value: journalCount,
      icon: BookOpen,
      ...getTrendData('total_journal_papers'),
      lineColor: '#f59e0b',
      iconBg: 'bg-amber-600 text-white',
      sparkKey: 'journals',
      statKey: 'total_journal_papers'
    },
    {
      label: 'Total Events',
      value: eventsCount,
      icon: CalendarClock,
      ...getTrendData('total_events'),
      lineColor: '#8b5cf6',
      iconBg: 'bg-purple-600 text-white',
      sparkKey: 'events',
      statKey: 'total_events'
    }
  ]

  const recentPubsList = data?.recentPublications || []
  const recentEventsList = data?.recentEvents || []

  // Formatting dates for upcoming events list
  const formatEventDate = (dateStr) => {
    if (!dateStr) return { day: '00', month: '---' }
    const date = new Date(dateStr)
    const day = String(date.getDate()).padStart(2, '0')
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase()
    return { day, month }
  }

  // Horizontal Timeline event formatters
  const timelineEvents = [...recentEventsList]
    .sort((a, b) => new Date(a.from_date) - new Date(b.from_date))
    .slice(0, 5)

  const formatTimelineDate = (dateStr) => {
    if (!dateStr) return '---'
    const date = new Date(dateStr)
    return date.toLocaleString('default', { month: 'short', year: 'numeric' })
  }

  const formatYear = (yearStr) => {
    if (!yearStr) return ''
    const parts = yearStr.split('-')
    if (parts.length === 2) {
      const y1 = parts[0].slice(-2)
      const y2 = parts[1].slice(-2)
      return `${y1}-${y2}`
    }
    return yearStr
  }

  const timelineStepColors = [
    'bg-emerald-500 text-white border-emerald-400',
    'bg-purple-500 text-white border-purple-400',
    'bg-amber-500 text-white border-amber-400',
    'bg-blue-500 text-white border-blue-400',
    'bg-rose-500 text-white border-rose-400'
  ]

  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-black shadow select-none">1</div>
      case 1:
        return <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-black shadow select-none">2</div>
      case 2:
        return <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-black shadow select-none">3</div>
      default:
        return <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-semibold select-none">{index + 1}</div>
    }
  }

  const dashboardContent = (
    <div className="space-y-8">
      {/* 1. Stat Cards Row (5 columns) */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        {cardsConfig.map(({ label, value, icon: Icon, trend, trendColor, lineColor, iconBg, sparkKey, statKey }) => (
          <motion.article
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
            key={sparkKey}
            onClick={() => {
              setSelectedStat(statKey)
              setModalOpen(true)
            }}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
                  <p className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${iconBg}`}>
                  <Icon size={18} className="stroke-[2.5]" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className={`text-xs font-black ${trendColor}`}>{trend.split(' ')[0]}</span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{trend.split(' ').slice(1).join(' ')}</span>
              </div>
            </div>

            {/* Sparkline line graph */}
            <div className="h-9 w-full mt-4 overflow-hidden pointer-events-none">
              <ResponsiveContainer width="108%" height="100%">
                <AreaChart data={getSparkData(value)} margin={{ top: 2, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`spark-${sparkKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={lineColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={lineColor}
                    strokeWidth={2}
                    fill={`url(#spark-${sparkKey})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.article>
        ))}
      </motion.section>

      {/* 2. Analytical Charts Row (3 Columns) */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 lg:grid-cols-3"
      >
        {/* Publications by Year AreaChart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Publications by Year</h3>
            <select className="text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 px-2 py-1 rounded font-medium focus:outline-none text-slate-600 dark:text-slate-300">
              <option>Yearly</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.byYear} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="yearAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? "#334155" : "#e2e8f0"} opacity={isDarkTheme ? 0.3 : 0.6} />
                <XAxis dataKey="year" tick={{ fill: isDarkTheme ? '#94a3b8' : '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: isDarkTheme ? '#94a3b8' : '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  dataKey="count"
                  name="Publications"
                  type="monotone"
                  stroke="#2563eb"
                  fill="url(#yearAreaGrad)"
                  strokeWidth={2.5}
                  dot={{ stroke: '#2563eb', strokeWidth: 1.5, r: 3.5, fill: '#fff' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Conference vs Journal DonutChart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Conference vs Journal</h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-40 h-40 relative flex items-center justify-center flex-shrink-0">
              {/* Total overlay */}
              <div className="absolute flex flex-col items-center justify-center pointer-events-none mb-0.5">
                <span className="text-2xl font-black tracking-tight text-slate-850 dark:text-white">
                  {totalPublications}
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                  Total
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    cornerRadius={4}
                  >
                    {data.byCategory.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Mockup matching legend layout */}
            <div className="space-y-4 flex-1 min-w-[120px] select-none">
              <div className="flex items-start gap-2.5 text-xs">
                <span className="w-3 h-3 rounded bg-[#6366f1] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Conference Papers</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{confCount} ({confPercent}%)</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <span className="w-3 h-3 rounded bg-[#ec4899] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Journal Papers</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{journalCount} ({journalPercent}%)</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Publishing Students List */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Top Publishing Students</h3>
            <button
              onClick={() => {
                setSelectedStat('total_students')
                setModalOpen(true)
              }}
              className="text-xs text-blue-600 hover:text-blue-750 font-bold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3.5 my-auto">
            {data.topStudents.map((student, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRankBadge(idx)}
                  {/* Initials avatar */}
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                    {student.student_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]" title={student.student_name}>
                    {student.student_name}
                  </span>
                </div>
                <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                  {student.publications} {student.publications === 1 ? 'Publication' : 'Publications'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* 3. Monthly Events & Department Events Analytics (3 Columns) */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 lg:grid-cols-3"
      >
        {/* Monthly Events AreaChart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Monthly Events</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.eventAnalytics?.eventsByMonth || []} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="monthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? "#334155" : "#e2e8f0"} opacity={isDarkTheme ? 0.3 : 0.6} />
                <XAxis dataKey="month" tick={{ fill: isDarkTheme ? '#94a3b8' : '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: isDarkTheme ? '#94a3b8' : '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  dataKey="count"
                  name="Events Count"
                  type="monotone"
                  stroke="#10b981"
                  fill="url(#monthAreaGrad)"
                  strokeWidth={2.5}
                  dot={{ stroke: '#10b981', strokeWidth: 1.5, r: 3.5, fill: '#fff' }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Department Events Analytics (Budget Card Removed!) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Department Events Analytics</h3>
          
          <div className="flex flex-col gap-4 flex-1 justify-center">
            {/* Events by Type donut and Events by Year bar chart side by side */}
            <div className="grid grid-cols-2 gap-4 h-64">
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex flex-col items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedStat('total_events')
                    setSelectedSubFilter(null)
                    setModalOpen(true)
                  }}
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition flex items-center gap-1 focus:outline-none"
                >
                  Events by Type
                  <ArrowUpRight size={10} className="opacity-60" />
                </button>
                <div className="w-full h-32 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.eventAnalytics?.eventsByType || []}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={2}
                        onClick={(entry) => {
                          if (entry && entry.name) {
                            setSelectedStat('total_events')
                            setSelectedSubFilter({ type: 'event_type', value: entry.name })
                            setModalOpen(true)
                          }
                        }}
                        className="cursor-pointer"
                      >
                        {(data?.eventAnalytics?.eventsByType || []).map((entry, index) => (
                          <Cell key={entry.name} fill={eventPieColors[index % eventPieColors.length]} className="cursor-pointer" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="w-full flex flex-wrap justify-center gap-x-2 gap-y-1 mt-2 px-1 max-h-16 overflow-y-auto">
                  {(data?.eventAnalytics?.eventsByType || []).map((entry, index) => (
                    <div 
                      key={entry.name} 
                      onClick={() => {
                        setSelectedStat('total_events')
                        setSelectedSubFilter({ type: 'event_type', value: entry.name })
                        setModalOpen(true)
                      }}
                      className="flex items-center gap-1 text-[9px] font-bold text-slate-650 dark:text-slate-350 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                      <span 
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: eventPieColors[index % eventPieColors.length] }} 
                      />
                      <span className="truncate max-w-[50px]" title={entry.name}>{entry.name}</span>
                      <span className="text-slate-400 dark:text-slate-500 font-extrabold">({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex flex-col items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedStat('total_events')
                    setSelectedSubFilter(null)
                    setModalOpen(true)
                  }}
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition flex items-center gap-1 focus:outline-none"
                >
                  Events by Year
                  <ArrowUpRight size={10} className="opacity-60" />
                </button>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.eventAnalytics?.eventsByYear || []} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? "#334155" : "#e2e8f0"} opacity={isDarkTheme ? 0.3 : 0.6} />
                      <XAxis 
                        dataKey="year" 
                        tickFormatter={formatYear}
                        tick={{ fill: isDarkTheme ? '#94a3b8' : '#64748b', fontSize: 8, fontWeight: 700 }} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tick={{ fill: isDarkTheme ? '#94a3b8' : '#64748b', fontSize: 8, fontWeight: 700 }} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="count" 
                        name="Events Count" 
                        fill="#10b981" 
                        radius={[3, 3, 0, 0]} 
                        maxBarSize={20} 
                        className="cursor-pointer"
                        onClick={(entry) => {
                          if (entry && entry.year) {
                            setSelectedStat('total_events')
                            setSelectedSubFilter({ type: 'academic_year', value: entry.year })
                            setModalOpen(true)
                          }
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Publications List */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Publications</h3>
            <button
              onClick={() => {
                setSelectedStat('total_publications')
                setModalOpen(true)
              }}
              className="text-xs text-blue-600 hover:text-blue-750 font-bold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-4 my-auto">
            {recentPubsList.slice(0, 4).map((pub, idx) => (
              <div key={idx} className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-650 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate pr-1" title={pub.paper_title}>
                      {pub.paper_title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5" title={pub.paper_name}>
                      {pub.paper_name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 gap-1 select-none">
                  <span className="text-[9px] text-slate-400 font-bold">20{String(pub.year).slice(-2)}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                    pub.conference_or_journal === 'Journal'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                  }`}>
                    {pub.conference_or_journal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* 4. Department Events Timeline (Horizontal Full Width) */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6"
      >
        {/* Department Events Timeline (Horizontal Stepper) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6">Department Events Timeline</h3>
          
          <div className="relative flex items-center justify-between my-auto py-2">
            {/* Stepper gray track line */}
            <div className="timeline-track" />

            {timelineEvents.map((event, idx) => (
              <div key={idx} className="flex flex-col items-center text-center relative z-10 w-1/5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 ${timelineStepColors[idx % timelineStepColors.length]}`}>
                  <Calendar size={14} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-slate-850 dark:text-slate-200 mt-2 truncate max-w-[120px]" title={formatTimelineDate(event.from_date)}>
                  {formatTimelineDate(event.from_date)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[120px]" title={event.event_name || 'Event'}>
                  {event.event_name || 'Event'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* 5. Detail Modal */}
      <AnimatePresence>
        {modalOpen && (
          <DetailModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setSelectedSubFilter(null)
            }}
            statType={selectedStat}
            isPublic={isPublic}
            subFilter={selectedSubFilter}
          />
        )}
      </AnimatePresence>
    </div>
  )

  if (isPublic) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors relative overflow-hidden bg-grid-pattern pb-12">
        <header className="sticky top-0 z-20 border-b border-slate-200/50 bg-white/60 dark:border-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center">
          <div className="max-w-7xl mx-auto flex items-center justify-between w-full gap-4">
            {/* Left Logo (increased size) */}
            <img src={`${import.meta.env.BASE_URL}vignan.png`} alt="Vignan Logo" className="h-14 sm:h-20 w-auto object-contain flex-shrink-0" />
            
            {/* Centered Heading */}
            <div className="flex-1 text-center min-w-0">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-blue-650 dark:text-blue-400 truncate">Computer Science &amp; Engineering</p>
              <h2 className="text-xs sm:text-lg md:text-xl font-black tracking-tight leading-tight uppercase text-slate-800 dark:text-white mt-1">Department Events &amp; Publications Dashboard</h2>
            </div>

            {/* Right Side Items */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <img src={`${import.meta.env.BASE_URL}cse.png`} alt="CSE Logo" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
              <button className="w-10 h-10 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition dark:border-slate-850 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800" onClick={() => setDark((value) => !value)} aria-label="Toggle dark mode">
                {dark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 sm:p-8 relative z-10">
          {dashboardContent}
        </main>
      </div>
    )
  }

  return dashboardContent
}

export default Dashboard
