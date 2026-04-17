import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useThemeClasses, useTheme, THEMES } from '../context/ThemeContext'
import api from '../api/axios'

export default function Setup() {
  const tc       = useThemeClasses()
  const { theme } = useTheme()
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm)
      return setError('Passwords do not match')
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      await api.post('/auth/setup', {
        name:     form.name,
        email:    form.email,
        password: form.password,
      })
      // Log in immediately with the new credentials
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${tc.page} flex flex-col items-center justify-center px-4 min-h-screen`}>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['Create admin', 'Dashboard ready'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
              ${i === 0
                ? `${theme === THEMES.dark ? 'bg-dark-accent' :
                    theme === THEMES.enterprise ? 'bg-blue-primary' : 'bg-gray-800'} text-white`
                : `border ${tc.border} ${tc.muted}`}`}>
              {i + 1}
            </div>
            <span className={`text-xs ${i === 0 ? '' : tc.muted}`}>{s}</span>
            {i === 0 && <span className={`text-xs ${tc.muted}`}>→</span>}
          </div>
        ))}
      </div>

      <div className={`w-full max-w-sm ${tc.card} p-8`}>

        {/* Heading */}
        <div className="mb-7 text-center">
          <div className={`inline-flex w-12 h-12 rounded-xl items-center justify-center mb-3
            ${theme === THEMES.dark       ? 'bg-dark-accent/20' :
              theme === THEMES.enterprise ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <svg className={`w-6 h-6 ${tc.accent}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold">First-time setup</h1>
          <p className={`text-sm mt-1 ${tc.muted}`}>
            Create your admin account to get started
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border
                          border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name',     label: 'Full name',        type: 'text',     placeholder: 'Nafiul Haque' },
            { key: 'email',    label: 'Email address',    type: 'email',    placeholder: 'admin@factory.com' },
            { key: 'password', label: 'Password',         type: 'password', placeholder: '••••••••' },
            { key: 'confirm',  label: 'Confirm password', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label className={`block mb-1.5 ${tc.label}`}>{f.label}</label>
              <input
                type={f.type}
                required
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className={`input-field ${tc.input}`}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary ${tc.btn} mt-2 flex items-center justify-center gap-2`}
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                 rounded-full animate-spin" />
              : 'Create admin & continue'
            }
          </button>
        </form>
      </div>

      <p className={`text-xs mt-6 ${tc.muted} text-center max-w-xs`}>
        This screen only appears once. Additional users can be managed from the
        Settings → Users panel after login.
      </p>
    </div>
  )
}