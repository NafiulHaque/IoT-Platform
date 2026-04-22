import { useThemeClasses, useChartColors } from '../../context/ThemeContext'

const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

// Intensity → colour using 5-stop ramp from CSS vars
function intensityToColor(intensity, heatmapColors) {
  if (intensity <= 0) return heatmapColors[0]
  const idx = Math.min(4, Math.floor(intensity * 5))
  return heatmapColors[idx]
}

export default function EnergyHeatmap({ data }) {
  const tc = useThemeClasses()
  const cc = useChartColors()

  if (!data?.grid) {
    return (
      <div className={`${tc.card} p-4`}>
        <p className={`text-xs uppercase tracking-wider mb-2 ${tc.muted}`}>
          Weekly energy heatmap
        </p>
        <div className={`flex items-center justify-center h-24 ${tc.muted} text-sm`}>
          Loading heatmap data...
        </div>
      </div>
    )
  }

  const { grid } = data

  // Find min/max across entire grid for normalisation
  const allVals  = grid.flat().filter(v => v > 0)
  const maxVal   = allVals.length ? Math.max(...allVals) : 1
  const minVal   = 0                                        // always start from 0

  // Today's BST day index (0=Mon…6=Sun) to highlight current column
  const nowBST     = new Date(Date.now() + 6 * 3600 * 1000)
  const todayDow   = nowBST.getUTCDay()                    // 0=Sun,1=Mon…6=Sat
  // Remap to our grid: 0=Mon…6=Sun
  const todayGrid  = todayDow === 0 ? 6 : todayDow - 1
  const currentH   = nowBST.getUTCHours()

  return (
    <div className={`${tc.card} p-4`}>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className={`text-xs uppercase tracking-wider ${tc.muted}`}>
            Weekly energy heatmap
          </p>
          <p className={`text-xs mt-0.5 ${tc.muted}`}>
            kWh per hour · Bangladesh Standard Time (UTC+6)
          </p>
        </div>
        <div className={`text-xs ${tc.muted} text-right`}>
          <p>Last 4 weeks</p>
          <p className="mt-0.5">Darker = higher usage</p>
        </div>
      </div>

      {/* Grid wrapper — horizontal scroll on very small screens */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 520 }}>

          {/* Hour column headers — 0 to 23 */}
          <div
            className="grid mb-1"
            style={{ gridTemplateColumns: '36px repeat(24, 1fr)', gap: 2 }}
          >
            <div />
            {HOURS.map(h => (
              <div
                key={h}
                className={`text-center ${tc.muted}`}
                style={{ fontSize: 8 }}
              >
                {/* Show label every 4 hours: 0,4,8,12,16,20 */}
                {h % 4 === 0 ? h.toString().padStart(2, '0') : ''}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {DAYS.map((day, di) => (
            <div
              key={day}
              className="grid mb-0.5"
              style={{ gridTemplateColumns: '36px repeat(24, 1fr)', gap: 2 }}
            >
              {/* Day label */}
              <div
                className={`flex items-center justify-end pr-1.5 text-xs font-medium
                  ${di === todayGrid ? '' : tc.muted}`}
                style={{
                  fontSize: 10,
                  color: di === todayGrid
                    ? cc.energy
                    : undefined
                }}
              >
                {day}
              </div>

              {/* Hour cells */}
              {HOURS.map(h => {
                const kwh       = grid[di]?.[h] ?? 0
                const intensity = maxVal > 0 ? kwh / maxVal : 0
                const color     = intensityToColor(intensity, cc.heatmap)

                // Highlight current hour in today's row
                const isNow     = di === todayGrid && h === currentH
                // Future hours today — slightly different treatment
                const isFuture  = di === todayGrid && h > currentH

                return (
                  <div
                    key={h}
                    title={`${day} ${h.toString().padStart(2,'0')}:00 BST — ${kwh.toFixed(3)} kWh`}
                    style={{
                      height:       14,
                      borderRadius: 2,
                      background:   isFuture ? cc.heatmap[0] : color,
                      opacity:      isFuture ? 0.4 : 1,
                      outline:      isNow
                        ? `2px solid ${cc.energy}`
                        : 'none',
                      outlineOffset: 1,
                      cursor:       'default',
                      transition:   'opacity .2s',
                    }}
                  />
                )
              })}
            </div>
          ))}

          {/* Hour axis footer — full 00 to 23 */}
          <div
            className="grid mt-2"
            style={{ gridTemplateColumns: '36px repeat(24, 1fr)', gap: 2 }}
          >
            <div />
            {HOURS.map(h => (
              <div
                key={h}
                className={tc.muted}
                style={{ fontSize: 8, textAlign: 'center' }}
              >
                {h % 4 === 0 ? h.toString().padStart(2, '0') : ''}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Legend + stats row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">

        {/* Colour ramp legend */}
        <div className={`flex items-center gap-2 text-xs ${tc.muted}`}>
          <span>Low</span>
          <div className="flex gap-0.5">
            {cc.heatmap.map((c, i) => (
              <div
                key={i}
                style={{
                  width:        18,
                  height:       10,
                  borderRadius: 2,
                  background:   c,
                }}
              />
            ))}
          </div>
          <span>High</span>
        </div>

        {/* Peak hour callout */}
        <PeakCallout grid={grid} cc={cc} tc={tc} />

      </div>
    </div>
  )
}

// Finds and displays the single peak hour across the whole week
function PeakCallout({ grid, cc, tc }) {
  let peak = { day: 0, hour: 0, kwh: 0 }

  grid.forEach((row, di) => {
    row.forEach((kwh, h) => {
      if (kwh > peak.kwh) peak = { day: di, hour: h, kwh }
    })
  })

  if (peak.kwh === 0) return null

  return (
    <div className={`flex items-center gap-2 text-xs ${tc.muted}`}>
      <div
        className="w-2 h-2 rounded-sm flex-shrink-0"
        style={{ background: cc.heatmap[4] }}
      />
      <span>
        Peak: <span className="font-medium" style={{ color: cc.energy }}>
          {DAYS[peak.day]} {peak.hour.toString().padStart(2,'0')}:00 BST
        </span>
        {' '}— {peak.kwh.toFixed(3)} kWh
      </span>
    </div>
  )
}