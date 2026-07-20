import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Edit3, Plus, Search, Trash2, UserPlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api.js'
import Spinner from '../components/Spinner.jsx'

const emptyForm = {
  serial_no: '',
  authors: [{ student_name: '', registration_number: '' }],
  paper_title: '',
  conference_or_journal: 'Conference',
  paper_name: '',
  paper_type: '',
  year: new Date().getFullYear(),
  faculty_guide: '',
}

function Publications() {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 })
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState({ search: '', category: '', paper_type: '', year: '', sortBy: 'created_at', order: 'desc', page: 1 })
  const [selectedIds, setSelectedIds] = useState([])

  const totalPages = Math.max(Math.ceil(meta.total / meta.limit), 1)

  const loadPublications = useCallback(async () => {
    setLoading(true)
    const { data } = await api.get('/publications', { params: { ...query, limit: meta.limit } })
    setRows(data.rows)
    setMeta({ total: data.total, page: data.page, limit: data.limit })
    setLoading(false)
  }, [query, meta.limit])

  useEffect(() => {
    loadPublications().catch(() => {
      toast.error('Could not load publications')
      setLoading(false)
    })
  }, [loadPublications])

  // Clear page selections when rows change
  useEffect(() => {
    setSelectedIds([])
  }, [rows])

  const paperTypes = useMemo(() => [...new Set(rows.map((row) => row.paper_type).filter(Boolean))], [rows])

  const yearsList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= 2018; y--) {
      years.push(y);
    }
    return years;
  }, []);

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const pageAllSelected = useMemo(() => {
    if (rows.length === 0) return false
    return rows.every((row) => selectedIds.includes(row.id))
  }, [rows, selectedIds])

  function toggleSelectAll() {
    if (pageAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !rows.some((row) => row.id === id)))
    } else {
      const toAdd = rows.filter((row) => !selectedIds.includes(row.id)).map((row) => row.id)
      setSelectedIds((prev) => [...prev, ...toAdd])
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateAuthor(index, key, value) {
    setForm((current) => ({
      ...current,
      authors: current.authors.map((author, authorIndex) => (authorIndex === index ? { ...author, [key]: value } : author)),
    }))
  }

  function removeAuthor(index) {
    setForm((current) => ({
      ...current,
      authors: current.authors.filter((author, authorIndex) => authorIndex !== index),
    }))
  }

  function startCreate() {
    setForm({ ...emptyForm, authors: [{ student_name: '', registration_number: '' }] })
    setEditingId(null)
    setShowForm(true)
  }

  function startEdit(row) {
    setForm({
      ...row,
      serial_no: row.serial_no || '',
      faculty_guide: row.faculty_guide || '',
      authors: row.authors?.length ? row.authors.map(({ student_name, registration_number }) => ({ student_name, registration_number })) : [{ student_name: '', registration_number: '' }],
    })
    setEditingId(row.id)
    setShowForm(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      if (editingId) {
        await api.put(`/publications/${editingId}`, form)
        toast.success('Publication updated')
      } else {
        await api.post('/publications', form)
        toast.success('Publication added')
      }
      setShowForm(false)
      loadPublications()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed')
    }
  }

  async function deletePublication(id) {
    if (!window.confirm('Delete this publication?')) return
    await api.delete(`/publications/${id}`)
    toast.success('Publication deleted')
    loadPublications()
  }

  async function exportCSV() {
    setLoading(true)
    try {
      let dataToExport = []
      if (selectedIds.length > 0) {
        const { data } = await api.get('/publications', { params: { ...query, all: true } })
        dataToExport = data.rows.filter((row) => selectedIds.includes(row.id))
      } else {
        const { data } = await api.get('/publications', { params: { ...query, all: true } })
        dataToExport = data.rows
      }

      const headers = ['S.No', 'Authors', 'Registration Numbers', 'Title of the Paper', 'Conference/Journal', 'Name of the Paper', 'Type of Paper', 'Year', 'Faculty Guide']
      const body = dataToExport.map((row, index) => [
        index + 1,
        row.authors?.map((author) => author.student_name).join('; '),
        row.authors?.map((author) => author.registration_number).join('; '),
        row.paper_title,
        row.conference_or_journal,
        row.paper_name,
        row.paper_type,
        row.year,
        row.faculty_guide,
      ])

      const bom = '\uFEFF';
      const csvContent = [headers, ...body].map((line) => line.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');

      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `publications_export.csv`
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('CSV downloaded')
      setSelectedIds([])
    } catch (error) {
      toast.error('Failed to export publications')
    } finally {
      setLoading(false)
    }
  }

  function exportSingle(row) {
    const headers = ['S.No', 'Authors', 'Registration Numbers', 'Title of the Paper', 'Conference/Journal', 'Name of the Paper', 'Type of Paper', 'Year', 'Faculty Guide']
    const body = [[
      1,
      row.authors?.map((author) => author.student_name).join('; '),
      row.authors?.map((author) => author.registration_number).join('; '),
      row.paper_title,
      row.conference_or_journal,
      row.paper_name,
      row.paper_type,
      row.year,
      row.faculty_guide,
    ]]

    const bom = '\uFEFF';
    const csvContent = [headers, ...body].map((line) => line.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');

    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `publication_${row.id}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('Individual CSV downloaded')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Publications</h2>
          <p className="text-sm text-slate-500">Search, filter, sort, export, and maintain department publication records.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {selectedIds.length > 0 && (
            <span className="inline-flex items-center text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg border border-blue-200">
              Selected: {selectedIds.length}
            </span>
          )}
          <button className="btn-secondary cursor-pointer" onClick={exportCSV}>
            <Download size={16} /> {selectedIds.length > 0 ? 'Export Selected (CSV)' : 'Export CSV'}
          </button>
          <button className="btn-primary cursor-pointer" onClick={startCreate}><Plus size={16} /> Add</button>
        </div>
      </div>

      <section className="glass-panel grid gap-3 p-4 grid-cols-1 md:grid-cols-5">
        <label className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input className="input pl-10" placeholder="Search author, reg no, title, conference, year" value={query.search} onChange={(event) => setQuery({ ...query, search: event.target.value, page: 1 })} />
        </label>
        <select className="input" value={query.category} onChange={(event) => setQuery({ ...query, category: event.target.value, page: 1 })}>
          <option value="">All categories</option><option>Conference</option><option>Journal</option>
        </select>
        <select className="input" value={query.paper_type} onChange={(event) => setQuery({ ...query, paper_type: event.target.value, page: 1 })}>
          <option value="">All paper types</option>{paperTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select className="input" value={query.year} onChange={(event) => setQuery({ ...query, year: event.target.value, page: 1 })}>
          <option value="">All years</option>{yearsList.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="input md:col-span-5" value={`${query.sortBy}:${query.order}`} onChange={(event) => { const [sortBy, order] = event.target.value.split(':'); setQuery({ ...query, sortBy, order }) }}>
          <option value="created_at:desc">Newest</option><option value="year:desc">Year desc</option><option value="year:asc">Year asc</option><option value="student_name:asc">First author A-Z</option>
        </select>
      </section>

      {showForm && (
        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">{editingId ? 'Edit Publication' : 'Add Publication'}</h3>
            <button className="icon-button cursor-pointer" onClick={() => setShowForm(false)} aria-label="Close form"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Input label="S.No" value={form.serial_no} onChange={(value) => updateField('serial_no', value)} />
            <div className="md:col-span-2"><Input label="Title of the Paper" value={form.paper_title} onChange={(value) => updateField('paper_title', value)} required /></div>
            <label><span className="label">Conference / Journal</span><select className="input" value={form.conference_or_journal} onChange={(event) => updateField('conference_or_journal', event.target.value)}><option>Conference</option><option>Journal</option></select></label>
            <Input label="Name of the Conference/Journal" value={form.paper_name} onChange={(value) => updateField('paper_name', value)} required />
            <Input label="Type of Paper" value={form.paper_type} onChange={(value) => updateField('paper_type', value)} required />
            <Input label="Year" type="number" value={form.year} onChange={(value) => updateField('year', value)} required />
            <Input label="Faculty Guide" value={form.faculty_guide} onChange={(value) => updateField('faculty_guide', value)} />
            <div className="md:col-span-2 xl:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold">Authors</h4>
                <button type="button" className="btn-secondary cursor-pointer" onClick={() => updateField('authors', [...form.authors, { student_name: '', registration_number: '' }])}><UserPlus size={16} /> Add Author</button>
              </div>
              <div className="space-y-3">
                {form.authors.map((author, index) => (
                  <div className="grid gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[1fr_1fr_auto]" key={index}>
                    <Input label={`Student ${index + 1}`} value={author.student_name} onChange={(value) => updateAuthor(index, 'student_name', value)} required />
                    <Input label="Registration Number" value={author.registration_number} onChange={(value) => updateAuthor(index, 'registration_number', value)} required />
                    <button type="button" className="btn-danger cursor-pointer self-end" disabled={form.authors.length === 1} onClick={() => removeAuthor(index)}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 xl:col-span-3"><button className="btn-primary cursor-pointer">{editingId ? 'Update Publication' : 'Create Publication'}</button></div>
          </form>
        </section>
      )}

      <section className="table-wrapper overflow-x-auto">
        {loading ? <div className="p-10"><Spinner /></div> : (
          <table className="table">
            <thead>
              <tr>
                <th className="w-12 text-center">
                  <input
                    type="checkbox"
                    checked={pageAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th>S.No</th>
                <th>Authors</th>
                <th>Title</th>
                <th>Category</th>
                <th>Paper Type</th>
                <th>Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td>{(query.page - 1) * meta.limit + index + 1}</td>
                  <td className="min-w-64">{row.authors?.map((author) => <p key={author.registration_number}>{author.student_name}<span className="text-xs text-slate-500"> ({author.registration_number})</span></p>)}</td>
                  <td className="min-w-72">{row.paper_title}<p className="text-xs text-slate-500">{row.paper_name}</p></td>
                  <td>{row.conference_or_journal}</td><td>{row.paper_type}</td><td>{row.year}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="icon-button cursor-pointer" onClick={() => exportSingle(row)} title="Download CSV" aria-label="Download CSV"><Download size={14} /></button>
                      <button className="icon-button cursor-pointer" onClick={() => startEdit(row)} aria-label="Edit"><Edit3 size={16} /></button>
                      <button className="btn-danger cursor-pointer" onClick={() => deletePublication(row.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Page {meta.page} of {totalPages} · {meta.total} records</p>
        <div className="flex gap-2">
          <button className="btn-secondary cursor-pointer" disabled={query.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Previous</button>
          <button className="btn-secondary cursor-pointer" disabled={query.page >= totalPages} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Next</button>
        </div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', required }) {
  return <label><span className="label">{label}</span><input className="input" type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={required} /></label>
}

export default Publications
