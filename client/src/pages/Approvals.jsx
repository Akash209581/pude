import { useEffect, useState } from 'react'
import { Check, X, ShieldAlert, FileText, Calendar, ArrowRight, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api.js'
import Spinner from '../components/Spinner.jsx'

function Approvals() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/pending-edits')
      setRequests(data)
    } catch (error) {
      toast.error('Failed to load pending edit requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleApprove = async (id) => {
    setProcessingId(id)
    try {
      const { data } = await api.post(`/pending-edits/${id}/approve`)
      toast.success(data.message || 'Edit request approved successfully!')
      loadRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve edit.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this edit request?')) return
    setProcessingId(id)
    try {
      const { data } = await api.post(`/pending-edits/${id}/reject`)
      toast.success(data.message || 'Edit request rejected.')
      loadRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject edit.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <UserCheck className="text-blue-600" size={24} /> Admin Verification &amp; Approvals
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review and approve TA requested edits for existing publications and department events.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-3.5 py-1.5 rounded-full text-xs font-bold w-fit">
          <ShieldAlert size={16} /> Pending Verification: {requests.length}
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><Spinner /></div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Check className="mx-auto text-emerald-500" size={40} />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Pending Approvals</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            All TA edit requests have been reviewed and verified.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => {
            const isEvent = req.target_type === 'event'
            const changes = req.changes_data || {}
            const orig = req.originalItem || {}

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 ${isEvent ? 'bg-purple-600' : 'bg-blue-600'}`}>
                      {isEvent ? <Calendar size={16} /> : <FileText size={16} />}
                      {isEvent ? 'Event Edit' : 'Publication Edit'}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {isEvent ? (orig.event_name || 'Event') : (orig.paper_title || 'Publication')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Requested by: <strong className="text-slate-700 dark:text-slate-300">{req.requested_by_username || 'TA User'}</strong></span>
                        <span>·</span>
                        <span>{new Date(req.created_at).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      className="btn-secondary text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900 dark:hover:bg-rose-950 cursor-pointer text-xs flex items-center gap-1.5"
                      onClick={() => handleReject(req.id)}
                      disabled={processingId === req.id}
                    >
                      <X size={16} /> Reject
                    </button>
                    <button
                      className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer text-xs flex items-center gap-1.5"
                      onClick={() => handleApprove(req.id)}
                      disabled={processingId === req.id}
                    >
                      <Check size={16} /> Approve &amp; Publish
                    </button>
                  </div>
                </div>

                {/* Diff Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Current Original Item */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">Current Live Item</p>
                    {isEvent ? (
                      <>
                        <p><strong className="text-slate-600 dark:text-slate-400">Name:</strong> {orig.event_name}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Coordinator:</strong> {orig.coordinator_name} ({orig.employee_id})</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Type / Year:</strong> {orig.event_type} · {orig.academic_year}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Venue:</strong> {orig.venue}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Budget:</strong> ₹{orig.budget || 0}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Description:</strong> {orig.description}</p>
                      </>
                    ) : (
                      <>
                        <p><strong className="text-slate-600 dark:text-slate-400">Title:</strong> {orig.paper_title}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Category / Year:</strong> {orig.conference_or_journal} · {orig.year}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Venue / Journal:</strong> {orig.paper_name}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Paper Type:</strong> {orig.paper_type}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Guide:</strong> {orig.faculty_guide || '-'}</p>
                      </>
                    )}
                  </div>

                  {/* Proposed Edits */}
                  <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2">
                    <p className="font-bold text-blue-600 dark:text-blue-400 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1">
                      Proposed Changes <ArrowRight size={12} />
                    </p>
                    {isEvent ? (
                      <>
                        <p><strong className="text-slate-600 dark:text-slate-400">Name:</strong> {changes.event_name}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Coordinator:</strong> {changes.coordinator_name} ({changes.employee_id})</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Type / Year:</strong> {changes.event_type} · {changes.academic_year}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Venue:</strong> {changes.venue}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Budget:</strong> ₹{changes.budget || 0}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Description:</strong> {changes.description}</p>
                      </>
                    ) : (
                      <>
                        <p><strong className="text-slate-600 dark:text-slate-400">Title:</strong> {changes.paper_title}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Category / Year:</strong> {changes.conference_or_journal} · {changes.year}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Venue / Journal:</strong> {changes.paper_name}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Paper Type:</strong> {changes.paper_type}</p>
                        <p><strong className="text-slate-600 dark:text-slate-400">Guide:</strong> {changes.faculty_guide || '-'}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Approvals
