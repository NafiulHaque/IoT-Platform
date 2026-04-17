import { useThemeClasses } from '../context/ThemeContext'

export default function StatCard({ label, value, unit, sub, subColor = 'text-green-400', icon }) {
  const tc = useThemeClasses()
  return (
    <div className={`${tc.card} ${tc.cardHover} p-5`}>
      <div className="flex items-start justify-between mb-3">
        <p className={tc.label}>{label}</p>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tc.active}`}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold">
        {value ?? '—'}
        {unit && <span className={`text-sm font-normal ml-1 ${tc.muted}`}>{unit}</span>}
      </p>
      {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
    </div>
  )
}