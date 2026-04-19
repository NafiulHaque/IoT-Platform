import { useThemeClasses } from '../../context/ThemeContext'
import { useChartColors } from '../../context/ThemeContext'

const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function EnergyHeatmap({ data }) {
  const tc = useThemeClasses()
  const cc = useChartColors()

  if (!data) return (
    <div className={`${tc.card} p-4`}>
      <p className={`text-xs ${tc.muted}`}>Loading heatmap...</p>
    </div>
  )

  const { grid } = data
  const allVals  = grid.flat()
  const mn = Math.min(...allVals), mx = Math.max(...allVals) || 1

  const getColor = (v) => {
    const t   = (v - mn) / (mx - mn)
    const idx = Math.min(4, Math.floor(t * 5))
    return cc.heatmap[idx]
  }

  return (
    <div className={`${tc.card} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs uppercase tracking-wider ${tc.muted}`}>
          Weekly energy heatmap — kWh / hour
        </p>
        <p className={`text-xs ${tc.muted}`}>darker = higher usage</p>
      </div>

      {/* Column hour labels */}
      <div className="grid gap-0.5 mb-0.5"
        style={{ gridTemplateColumns: '28px repeat(24, 1fr)' }}>
        <div />
        {HOURS.map(h => (
          <div key={h} className={`text-center text-xs ${tc.muted}`}
            style={{ fontSize: 8 }}>
            {h % 6 === 0 ? h : ''}
          </div>
        ))}
      </div>

      {/* Rows */}
      {DAYS.map((day, di) => (
        <div key={day} className="grid gap-0.5 mb-0.5"
          style={{ gridTemplateColumns: '28px repeat(24, 1fr)' }}>
          <div className={`text-xs ${tc.muted} flex items-center justify-end pr-1`}
            style={{ fontSize: 9 }}>
            {day}
          </div>
          {HOURS.map(h => {
            const v = grid[di]?.[h] ?? 0
            return (
              <div key={h}
                title={`${day} ${h}:00 BST — ${v.toFixed(2)} kWh`}
                className="h-3 rounded-sm"
                style={{ background: getColor(v) }}
              />
            )
          })}
        </div>
      ))}

      {/* Legend */}
      <div className={`flex items-center gap-1.5 mt-2 text-xs ${tc.muted}`}>
        <span>Low</span>
        {cc.heatmap.map((c, i) => (
          <span key={i} className="w-3.5 h-2.5 rounded-sm inline-block"
            style={{ background: c }} />
        ))}
        <span>High</span>
      </div>
    </div>
  )
}