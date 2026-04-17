import { useThemeClasses, useTheme, THEMES } from '../context/ThemeContext'

const THEME_OPTIONS = [
  {
    key:     THEMES.dark,
    label:   'Modern Dark',
    desc:    'Indigo accent on deep navy — best for low-light environments',
    preview: 'bg-slate-900 border-indigo-500/40',
  },
  {
    key:     THEMES.enterprise,
    label:   'Enterprise Blue',
    desc:    'Navy and corporate blue — professional, report-ready',
    preview: 'bg-blue-900 border-blue-300/40',
  },
  {
    key:     THEMES.graphite,
    label:   'Minimalist Graphite',
    desc:    'Clean white and gray — minimal distraction, maximum focus',
    preview: 'bg-gray-100 border-gray-400/40',
  },
]

export default function Settings() {
  const tc              = useThemeClasses()
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className={`text-sm mt-0.5 ${tc.muted}`}>Customize your dashboard appearance</p>
      </div>

      <div className={`${tc.card} p-5`}>
        <p className={`text-sm font-medium mb-4 ${tc.accent}`}>Dashboard theme</p>
        <div className="space-y-3">
          {THEME_OPTIONS.map(t => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left
                ${theme === t.key
                  ? `${tc.border} ${tc.active}`
                  : `${tc.border} hover:opacity-80`
                }`}
            >
              <div className={`w-10 h-10 rounded-lg border-2 shrink-0 ${t.preview}`} />
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className={`text-xs mt-0.5 ${tc.muted}`}>{t.desc}</p>
              </div>
              {theme === t.key && (
                <svg className={`w-4 h-4 ml-auto shrink-0 ${tc.accent}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}