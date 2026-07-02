import { useCallback, useEffect, useState } from 'react'
import { CalendarPlus, Edit3, FileText, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api.js'
import Spinner from '../components/Spinner.jsx'

const emptyForm = {
  employee_id: '',
  coordinator_name: '',
  event_name: '',
  event_type: '',
  academic_year: '',
  from_date: '',
  to_date: '',
  venue: '',
  budget: '',
  description: '',
  outcome: '',
  poster: null,
  one_page_report: null,
  winners_list: null,
  sample_certificate: null,
  budget_report: null,
}

const eventTypes = [
  'Workshop',
  'Seminar',
  'Conference',
  'Hackathon',
  'Guest Lecture',
  'Webinar',
  'Other',
]

const academicYears = [
  '2023-2024',
  '2024-2025',
  '2025-2026',
  '2026-2027',
]

const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:5000';

function Events() {
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    const { data } = await api.get('/events', { params: filter ? { type: filter } : {} })
    setEvents(data)
    setLoading(false)
  }, [filter])

  useEffect(() => {
    loadEvents().catch(() => {
      toast.error('Could not load events')
      setLoading(false)
    })
  }, [loadEvents])

  function startCreate() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  function startEdit(event) {
    setForm({
      employee_id: event.employee_id || '',
      coordinator_name: event.coordinator_name || '',
      event_name: event.event_name || '',
      event_type: event.event_type || '',
      academic_year: event.academic_year || '',
      from_date: event.from_date ? event.from_date.slice(0, 10) : '',
      to_date: event.to_date ? event.to_date.slice(0, 10) : '',
      venue: event.venue || '',
      budget: event.budget || '',
      description: event.description || '',
      outcome: event.outcome || '',
      poster: null,
      one_page_report: null,
      winners_list: null,
      sample_certificate: null,
      budget_report: null,
    })
    setEditingId(event.id)
    setShowForm(true)
  }

  async function saveEvent(event) {
    event.preventDefault()
    if (!editingId && !form.one_page_report) {
      toast.error('One Page Report is required.')
      return
    }
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        data.append(key, value)
      }
    })
    try {
      if (editingId) {
        await api.put(`/events/${editingId}`, data)
        toast.success('Event updated')
      } else {
        await api.post('/events', data)
        toast.success('Event added')
      }
      setShowForm(false)
      loadEvents()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed')
    }
  }

  async function deleteEvent(id) {
    if (!window.confirm('Delete this event?')) return
    await api.delete(`/events/${id}`)
    toast.success('Event deleted')
    loadEvents()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-sm text-slate-500">Manage department activities, coordinators, venues, and supporting documents.</p>
        </div>
        <button className="btn-primary cursor-pointer" onClick={startCreate}>
          <CalendarPlus size={16} /> Add Event
        </button>
      </div>

      <div className="glass-panel flex flex-wrap gap-2 p-3">
        {[['', 'All Events'], ['upcoming', 'Upcoming'], ['past', 'Past']].map(([value, label]) => (
          <button
            key={value}
            className={`cursor-pointer ${filter === value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <section className="glass-panel p-6 max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {editingId ? 'Edit Department Event' : 'New Department Event'}
            </h3>
            <button className="icon-button cursor-pointer" onClick={() => setShowForm(false)} aria-label="Close form">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={saveEvent} className="space-y-6">
            {/* Coordinator Info */}
            <div>
              <h4 className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs border-b border-emerald-100 dark:border-emerald-950 pb-1 mb-3">
                Coordinator Information
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Employee ID *"
                  placeholder="e.g. VU2021001"
                  value={form.employee_id}
                  onChange={(value) => setForm({ ...form, employee_id: value })}
                  required
                />
                <Input
                  label="Coordinator Name *"
                  placeholder="Full name"
                  value={form.coordinator_name}
                  onChange={(value) => setForm({ ...form, coordinator_name: value })}
                  required
                />
              </div>
            </div>

            {/* Event Info */}
            <div>
              <h4 className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs border-b border-emerald-100 dark:border-emerald-950 pb-1 mb-3">
                Event Information
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input
                    label="Event Name *"
                    placeholder="e.g. National Level Hackathon 2024"
                    value={form.event_name}
                    onChange={(value) => setForm({ ...form, event_name: value })}
                    required
                  />
                </div>
                
                <label className="block">
                  <span className="label">Event Type</span>
                  <select
                    className="input"
                    value={form.event_type}
                    onChange={(event) => setForm({ ...form, event_type: event.target.value })}
                  >
                    <option value="">Select type...</option>
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="label">Academic Year *</span>
                  <select
                    className="input"
                    value={form.academic_year}
                    onChange={(event) => setForm({ ...form, academic_year: event.target.value })}
                    required
                  >
                    <option value="">Select year...</option>
                    {academicYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </label>

                <Input
                  label="From Date *"
                  type="date"
                  value={form.from_date}
                  onChange={(value) => setForm({ ...form, from_date: value })}
                  required
                />

                <Input
                  label="To Date"
                  type="date"
                  value={form.to_date}
                  onChange={(value) => setForm({ ...form, to_date: value })}
                />

                <Input
                  label="Venue"
                  placeholder="e.g. Seminar Hall, Block A"
                  value={form.venue}
                  onChange={(value) => setForm({ ...form, venue: value })}
                  required
                />

                <Input
                  label="Budget (₹)"
                  type="number"
                  placeholder="e.g. 25000"
                  value={form.budget}
                  onChange={(value) => setForm({ ...form, budget: value })}
                />

                <label className="md:col-span-2 block">
                  <span className="label">Description</span>
                  <textarea
                    className="input min-h-24"
                    placeholder="Brief description of the event..."
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    required
                  />
                </label>

                <label className="md:col-span-2 block">
                  <span className="label">Outcome / Impact</span>
                  <textarea
                    className="input min-h-24"
                    placeholder="Key outcomes, number of participants, impact..."
                    value={form.outcome}
                    onChange={(event) => setForm({ ...form, outcome: event.target.value })}
                  />
                </label>
              </div>
            </div>

            {/* Supporting Documents */}
            <div>
              <h4 className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs border-b border-emerald-100 dark:border-emerald-950 pb-1 mb-3">
                Supporting Documents <span className="text-slate-400 font-normal lowercase">(Max 2MB each - JPG, PNG, PDF)</span>
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <DocumentInput
                  label="Poster"
                  file={form.poster}
                  onChange={(file) => setForm({ ...form, poster: file })}
                />
                <DocumentInput
                  label="One Page Report *"
                  file={form.one_page_report}
                  onChange={(file) => setForm({ ...form, one_page_report: file })}
                />
                <DocumentInput
                  label="Winners List"
                  file={form.winners_list}
                  onChange={(file) => setForm({ ...form, winners_list: file })}
                />
                <DocumentInput
                  label="Sample Certificate"
                  file={form.sample_certificate}
                  onChange={(file) => setForm({ ...form, sample_certificate: file })}
                />
                <div className="md:col-span-2">
                  <DocumentInput
                    label="Budget Report"
                    file={form.budget_report}
                    onChange={(file) => setForm({ ...form, budget_report: file })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button className="btn-primary cursor-pointer px-6">
                💾 {editingId ? 'Save Changes' : 'Save Event'}
              </button>
            </div>
          </form>
        </section>
      )}

      {loading ? <Spinner /> : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const isImagePoster = event.poster && !event.poster.toLowerCase().endsWith('.pdf');
            const supportingDocs = [
              { label: 'Poster', path: event.poster },
              { label: 'One Page Report', path: event.one_page_report },
              { label: 'Winners List', path: event.winners_list },
              { label: 'Sample Certificate', path: event.sample_certificate },
              { label: 'Budget Report', path: event.budget_report },
            ].filter(doc => doc.path);

            return (
              <article className="glass-panel flex flex-col overflow-hidden transition hover:-translate-y-1" key={event.id}>
                {/* Poster Display */}
                <div className="aspect-[16/9] w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-850 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
                  {event.poster ? (
                    isImagePoster ? (
                      <img src={`${apiOrigin}${event.poster}`} alt={event.event_name} className="h-full w-full object-cover" />
                    ) : (
                      <a href={`${apiOrigin}${event.poster}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-slate-500 hover:text-blue-600 transition">
                        <FileText size={48} className="text-red-500" />
                        <span className="text-xs mt-1 font-semibold">View Poster PDF</span>
                      </a>
                    )
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <CalendarPlus size={36} />
                      <span className="text-xs mt-1">No Image Poster</span>
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {event.academic_year && (
                      <span className="bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-xs">
                        {event.academic_year}
                      </span>
                    )}
                    {event.event_type && (
                      <span className="bg-blue-600/90 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-xs">
                        {event.event_type}
                      </span>
                    )}
                  </div>
                  {/* Date Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${new Date(event.from_date) >= new Date(new Date().toDateString()) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-slate-500 text-white shadow-lg shadow-slate-500/20'}`}>
                      {new Date(event.from_date) >= new Date(new Date().toDateString()) ? 'Upcoming' : 'Past'}
                    </span>
                  </div>
                </div>

                {/* Event Contents */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 line-clamp-1">{event.event_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📅 {new Date(event.from_date).toLocaleDateString()} 
                        {event.to_date && ` - ${new Date(event.to_date).toLocaleDateString()}`}
                        {event.venue && ` · 📍 ${event.venue}`}
                      </p>
                    </div>

                    <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{event.description}</p>

                    {event.outcome && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Outcome / Impact</p>
                        <p className="text-xs text-slate-600 dark:text-slate-350 line-clamp-2 mt-0.5">{event.outcome}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div>
                        <p className="font-bold text-slate-400 uppercase text-[9px]">Coordinator</p>
                        <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{event.coordinator_name}</p>
                        <p className="text-[10px]">{event.employee_id}</p>
                      </div>
                      {event.budget && (
                        <div>
                          <p className="font-bold text-slate-400 uppercase text-[9px]">Budget</p>
                          <p className="font-semibold text-slate-700 dark:text-slate-300">₹{Number(event.budget).toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Supporting Documents Badges */}
                    {supportingDocs.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-slate-850 pt-2">
                        <p className="font-bold text-slate-400 uppercase text-[9px] mb-1.5">Supporting Documents</p>
                        <div className="flex flex-wrap gap-1.5">
                          {supportingDocs.map((doc) => (
                            <a
                              key={doc.label}
                              href={`${apiOrigin}${doc.path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750 px-2 py-1 text-xs font-semibold transition"
                            >
                              <FileText size={11} /> {doc.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-850 flex gap-2">
                    <button className="btn-secondary flex-1 justify-center py-1.5 text-xs cursor-pointer" onClick={() => startEdit(event)}>
                      <Edit3 size={14} /> Edit
                    </button>
                    <button className="btn-danger py-1.5 px-3 text-xs cursor-pointer" onClick={() => deleteEvent(event.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder = '', required }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="input"
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  )
}

function DocumentInput({ label, file, onChange }) {
  return (
    <label className="block cursor-pointer">
      <span className="label">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm dark:border-slate-800 dark:bg-slate-950 transition hover:border-blue-300">
        <span className="btn-secondary py-1 px-3 text-xs flex items-center gap-1 pointer-events-none">
          Choose File
        </span>
        <span className="text-slate-500 text-xs truncate flex-1 pr-2">
          {file ? file.name : 'No file chosen'}
        </span>
      </div>
      <input
        className="hidden"
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
    </label>
  )
}

export default Events
