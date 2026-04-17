import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useThemeClasses, useTheme, THEMES } from '../context/ThemeContext'

const THEME_OPTIONS = [
  { key: THEMES.dark,       label: 'Modern Dark' },
  { key: THEMES.enterprise, label: 'Enterprise Blue' },
  { key: THEMES.graphite,   label: 'Minimalist Graphite' },
]

export default function Login() {
  const tc              = useThemeClasses()
  const { setTheme, theme } = useTheme()
  const { login }       = useAuth()
  const navigate        = useNavigate()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${tc.page} flex flex-col items-center justify-center px-4`}>

      {/* Theme switcher */}
      <div className="flex gap-2 mb-8">
        {THEME_OPTIONS.map(t => (
          <button
            key={t.key}
            onClick={() => setTheme(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
              ${theme === t.key
                ? `${tc.btn} border-transparent`
                : `${tc.border} ${tc.muted} bg-transparent hover:opacity-80`
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Login card */}
      <div className={`w-full max-w-sm ${tc.card} p-8`}>

        {/* Logo / heading */}
        <div className="mb-8 text-center">
          <div className={`inline-flex items-center gap-2 mb-3`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center
              ${theme === THEMES.dark       ? 'bg-dark-accent' :
                theme === THEMES.enterprise ? 'bg-blue-primary' : 'bg-gray-800'}`}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
              </svg>
            </div>
            <span className={`text-lg font-semibold ${tc.accent}`}>IoT Platform</span>
          </div>
          <p className={`text-sm ${tc.muted}`}>Sign in to your dashboard</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block mb-1.5 ${tc.label}`}>Email</label>
            <input
              type="email"
              required
              placeholder="admin@factory.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={`input-field ${tc.input}`}
            />
          </div>
          <div>
            <label className={`block mb-1.5 ${tc.label}`}>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={`input-field ${tc.input}`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary ${tc.btn} mt-2 flex items-center justify-center gap-2`}
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Sign in'
            }
          </button>
        </form>

        <p className={`text-center text-xs mt-6 ${tc.muted}`}>
          Industrial IoT Monitoring Platform
        </p>
      </div>
    </div>
  )
}