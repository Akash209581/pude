import { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BookOpen, CalendarClock, FileText, GraduationCap, LibraryBig, Users } from 'lucide-react'
import api from '../services/api.js'
import Spinner from '../components/Spinner.jsx'

const statConfig = [
  ['Total Publications', 'total_publications', LibraryBig],
  ['Total Students', 'total_students', Users],
  ['Conference Papers', 'total_conference_papers', FileText],
  ['Journal Papers', 'total_journal_papers', BookOpen],
  ['Faculty Publications', 'total_faculty_publications', GraduationCap],
  ['Publications This Year', 'publications_this_year', CalendarClock],
]

function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!data) return null

  const pieColors = ['#2563eb', '#0ea5e9']

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statConfig.map(([label, key, Icon]) => (
          <article className="stat-card" key={key}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-bold">{data?.stats?.[key] || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Icon /></div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
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
          <h3 className="mb-4 text-lg font-bold">Monthly Publications</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area dataKey="count" stroke="#0ea5e9" fill="#bae6fd" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel p-5">
          <h3 className="mb-4 text-lg font-bold">Recent Publications</h3>
          <div className="table-wrapper overflow-x-auto">
            <table className="table">
              <thead><tr><th>Authors</th><th>Title</th><th>Type</th><th>Year</th></tr></thead>
              <tbody>{data.recentPublications.map((item) => <tr key={item.id}><td>{item.authors_text}</td><td>{item.paper_title}</td><td>{item.conference_or_journal}</td><td>{item.year}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="glass-panel p-5">
          <h3 className="mb-4 text-lg font-bold">Recent Events</h3>
          <div className="space-y-3">{data.recentEvents.map((event) => <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800" key={event.id}><p className="font-semibold">{event.event_name}</p><p className="text-sm text-slate-500">{new Date(event.from_date).toLocaleDateString()} · {event.venue}</p></div>)}</div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
