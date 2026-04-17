import { useEffect, useState } from 'react'
import { useThemeClasses } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { formatDate } from '../utils/time'

const EMPTY = { name: '', email: '', password: '', role: 'operator' }

const ROLE_BADGE = {
  admin:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  operator: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export default function Users() {
  const tc       = useThemeClasses()
  const { user } = useAuth()

  const [users,    setUsers]    = useState([])
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = () => api.get('/auth/users').then(r => setUsers(r.data))
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null); setForm(EMPTY); setError(''); setModal(true)
  }

  const openEdit = (u) => {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setError(''); setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role }
        if (form.password) payload.password = form.password
        await api.put(`/auth/users/${editing._id}`, payload)
      } else {
        if (form.password.length < 6)
          return setError('Password must be at least 6 characters')
        await api.post('/auth/users', form)
      }
      await load(); setModal(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try { await api.delete(`/auth/users/${id}`); await load() }
    catch (err) { alert(err.response?.data?.message || 'Delete failed') }
    finally { setDeleting(null) }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className={`text-sm mt-0.5 ${tc.muted}`}>
            {users.length} user{users.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button onClick={openAdd} className={`btn-primary ${tc.btn} w-auto px-4 py-2 text-sm`}>
          + Add user
        </button>
      </div>

      {/* Users table */}
      <div className={`${tc.card} p-5`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${tc.border}`}>
                {['Name', 'Email', 'Role', 'Created', 'Actions'].map(h => (
                  <th key={h} className={`text-left pb-3 pr-4 text-xs font-medium ${tc.muted}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id}
                  className={`border-b ${tc.border} last:border-0`}>

                  {/* Avatar + name */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center
                        text-xs font-medium flex-shrink-0
                        ${u.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'}`}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        {u._id === user?.id && (
                          <p className={`text-xs ${tc.muted}`}>You</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className={`py-3 pr-4 text-xs ${tc.muted}`}>{u.email}</td>

                  {/* Role badge */}
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border
                      ${ROLE_BADGE[u.role] ?? tc.badge}`}>
                      {u.role}
                    </span>
                  </td>

                  <td className={`py-3 pr-4 text-xs ${tc.muted} whitespace-nowrap`}>
                    {formatDate(u.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className={`text-xs px-3 py-1.5 rounded-lg border ${tc.border}
                                    ${tc.muted} hover:opacity-80 transition-opacity`}
                      >
                        Edit
                      </button>
                      <button
                        disabled={u._id === user?.id || deleting === u._id}
                        onClick={() => handleDelete(u._id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400
                                   border border-red-500/20 hover:bg-red-500/20
                                   transition-colors disabled:opacity-30"
                      >
                        {deleting === u._id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className={`py-10 text-center text-sm ${tc.muted}`}>
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center
                        bg-black/50 px-4">
          <div className={`${tc.card} w-full max-w-sm p-6 shadow-xl`}>
            <h2 className="text-base font-semibold mb-5">
              {editing ? `Edit — ${editing.name}` : 'Add new user'}
            </h2>

            {error && (
              <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10
                              border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}
              <div>
                <label className={`block mb-1.5 ${tc.label}`}>Full name</label>
                <input
                  required type="text" placeholder="Nafiul Haque"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className={`input-field ${tc.input}`}
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block mb-1.5 ${tc.label}`}>Email</label>
                <input
                  required type="email" placeholder="operator@factory.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className={`input-field ${tc.input}`}
                />
              </div>

              {/* Password */}
              <div>
                <label className={`block mb-1.5 ${tc.label}`}>
                  {editing ? 'New password (leave blank to keep)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editing}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className={`input-field ${tc.input}`}
                />
              </div>

              {/* Role */}
              <div>
                <label className={`block mb-1.5 ${tc.label}`}>Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className={`input-field ${tc.input}`}
                >
                  <option value="operator">Operator — view only</option>
                  <option value="admin">Admin — full access</option>
                </select>
              </div>

              {/* Role description */}
              <div className={`text-xs px-3 py-2 rounded-lg border ${tc.border} ${tc.muted}`}>
                {form.role === 'admin'
                  ? 'Admin can add/edit/delete devices and users.'
                  : 'Operator can view dashboards and readings only.'}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className={`flex-1 py-2.5 rounded-lg border ${tc.border} ${tc.muted}
                              text-sm hover:opacity-80 transition-opacity`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 btn-primary ${tc.btn}
                              flex items-center justify-center gap-2`}
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                       rounded-full animate-spin" />
                    : editing ? 'Save changes' : 'Create user'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}