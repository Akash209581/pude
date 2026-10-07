import { useEffect, useState } from 'react'
import { Plus, Trash2, UserPlus, Shield, UserCheck, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api.js'
import Spinner from '../components/Spinner.jsx'
import { useAuth } from '../contexts/useAuth.js'

function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', role: 'ta' })
  const [creating, setCreating] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users')
      setUsers(data)
    } catch (error) {
      toast.error('Failed to load users list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    setCreating(true)
    try {
      await api.post('/users', form)
      toast.success(`User '${form.username}' created successfully!`)
      setForm({ username: '', password: '', role: 'ta' })
      setShowForm(false)
      loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.id === currentUser?.id) {
      toast.error('You cannot delete your own account.')
      return
    }

    if (!window.confirm(`Are you sure you want to delete user "${userToDelete.username}"?`)) {
      return
    }

    try {
      await api.delete(`/users/${userToDelete.id}`)
      toast.success(`User '${userToDelete.username}' deleted.`)
      loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="text-blue-600" size={24} /> User Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create and manage accounts for Teaching Assistants (TAs) and Administrators.
          </p>
        </div>
        <button
          className="btn-primary cursor-pointer flex items-center gap-2"
          onClick={() => setShowForm(true)}
        >
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {showForm && (
        <section className="glass-panel p-5 border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-slate-900/90 rounded-2xl shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <UserCheck size={20} className="text-blue-600" /> Add New Portal User
            </h3>
            <button
              className="icon-button cursor-pointer"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-3 items-end">
            <div>
              <label className="label" htmlFor="new-username">Username</label>
              <input
                id="new-username"
                className="input"
                placeholder="e.g. ta_john"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="new-password">Password</label>
              <input
                id="new-password"
                type="password"
                className="input"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="new-role">Role Permissions</label>
              <select
                id="new-role"
                className="input cursor-pointer"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="ta">Teaching Assistant (Upload/Edit Only)</option>
                <option value="admin">Administrator (Full Access & User Management)</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-secondary cursor-pointer"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button className="btn-primary cursor-pointer" disabled={creating}>
                {creating ? 'Creating...' : 'Create User Account'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="table-wrapper overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner /></div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No users found.</div>
        ) : (
          <table className="table w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {u.username}
                      {isSelf && (
                        <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {u.role === 'admin' ? 'Administrator' : 'Teaching Assistant (TA)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isSelf ? (
                        <button
                          className="btn-danger cursor-pointer text-xs"
                          onClick={() => handleDeleteUser(u)}
                          title="Delete User"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default UserManagement
