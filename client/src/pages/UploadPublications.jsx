import { useState } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api.js'

function UploadPublications() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function handleUpload(event) {
    event.preventDefault()
    if (!file) {
      toast.error('Choose an Excel file first')
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    setLoading(true)
    try {
      const { data } = await api.post('/upload-excel', formData)
      setResult(data)
      toast.success(`${data.insertedRows} rows inserted`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload Publications</h2>
        <p className="text-sm text-slate-500">Put publication details on the first row, then add co-author rows below with only Student Name and Regd.No filled.</p>
      </div>
      <form onSubmit={handleUpload} className="glass-panel p-6">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/70 p-10 text-center transition hover:border-blue-400 dark:border-blue-900 dark:bg-blue-950/30">
          <FileSpreadsheet className="mb-3 text-blue-700 dark:text-blue-300" size={42} />
          <span className="font-semibold">{file ? file.name : 'Choose Excel file'}</span>
          <span className="mt-1 text-sm text-slate-500">xlsx, xls, or csv up to 8 MB</span>
          <input
            className="hidden"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] || null;
              if (selectedFile) {
                toast.success('File uploaded');
              }
              setFile(selectedFile);
            }}
          />
        </label>
        <button className="btn-primary mt-5" disabled={loading}><Upload size={16} /> {loading ? 'Uploading...' : 'Upload and Import'}</button>
      </form>
      {result && (
        <section className="grid gap-4 md:grid-cols-3">
          <Summary title="Inserted Rows" value={result.insertedRows} />
          <Summary title="Duplicate Rows" value={result.duplicateRows.length} />
          <Summary title="Failed Rows" value={result.failedRows.length} />
        </section>
      )}
      {result && (result.duplicateRows.length > 0 || result.failedRows.length > 0) && (
        <section className="glass-panel p-5">
          <h3 className="mb-4 text-lg font-bold">Import Details</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <DetailList title="Duplicates" rows={result.duplicateRows} />
            <DetailList title="Failed" rows={result.failedRows} />
          </div>
        </section>
      )}
    </div>
  )
}

function Summary({ title, value }) {
  return <div className="stat-card"><p className="text-sm font-semibold text-slate-500">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>
}

function DetailList({ title, rows }) {
  return <div><h4 className="mb-2 font-semibold">{title}</h4><div className="max-h-72 space-y-2 overflow-auto">{rows.length ? rows.map((row, index) => <pre className="rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-950" key={index}>{JSON.stringify(row, null, 2)}</pre>) : <p className="text-sm text-slate-500">None</p>}</div></div>
}

export default UploadPublications
