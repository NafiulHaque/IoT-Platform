import { useThemeClasses } from '../../context/ThemeContext'

export default function SecondaryCard({ label, value, unit, gaugePct, gaugeCssVar, gaugeMin, gaugeMax }) {
  const tc = useThemeClasses()

  return (
    <div className={`col-span-2 ${tc.card} ${tc.cardHover} p-4 h-30`}>
      <p className={tc.label}>{label}</p>
      <p className="text-xl font-medium mt-1" style={{ color: `var(${gaugeCssVar})` }}>
        {value ?? '—'}
        <span className={`text-xs font-normal ml-1 ${tc.muted}`}>{unit}</span>
      </p>
      <div className={`h-1 rounded-full mt-2 mb-1 ${tc.gaugeTrack}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, gaugePct)).toFixed(1)}%`,
                   background: `var(${gaugeCssVar})` }}
        />
      </div>
      <div className={`flex justify-between text-xs ${tc.muted}`}>
        <span>{gaugeMin}</span><span>{gaugeMax}</span>
      </div>
    </div>
  )
}