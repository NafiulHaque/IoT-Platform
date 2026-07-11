import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip
} from 'chart.js'
import { useThemeClasses, useChartColors } from '../../context/ThemeContext'
import { formatChartTime } from '../../utils/time'
import api from '../../api/axios'

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip
)

// ── helpers ───────────────────────────────────────────────────────────────────

function formatBSTDate(utcDate) {
  return new Date(utcDate).toLocaleDateString('en-BD', {
    timeZone: 'Asia/Dhaka',
    weekday:  'long',
    year:     'numeric',
    month:    'long',
    day:      'numeric',
  })
}

function formatBSTTime(utcDate) {
  return new Date(utcDate).toLocaleTimeString('en-BD', {
    timeZone: 'Asia/Dhaka',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  })
}

function buildDayList(daysBack = 14) {
  const now  = new Date()
  const days = []
  for (let d = 0; d < daysBack; d++) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)
    const label = d === 0 ? 'Today'
                : d === 1 ? 'Yesterday'
                : date.toLocaleDateString('en-BD', {
                    timeZone: 'Asia/Dhaka', weekday: 'short'
                  })
    const dateStr = date.toLocaleDateString('en-BD', {
      timeZone: 'Asia/Dhaka', month: 'short', day: 'numeric'
    })
    // ISO date string in BST for API query
    const bstDate = new Date(date.getTime() + 6 * 3600 * 1000)
    const isoDate = bstDate.toISOString().slice(0, 10)
    days.push({ d, label, dateStr, isoDate, isToday: d === 0 })
  }
  return days
}

const HOUR_OPTIONS = [
  { h: 24, label: '24h' },
  { h: 12, label: '12h' },
  { h: 6,  label: '6h'  },
  { h: 3,  label: '3h'  },
]

// ── Stats helpers ─────────────────────────────────────────────────────────────

function calcStats(pts) {
  if (!pts.length) return null
  const volts  = pts.map(p => p.voltage).filter(Boolean)
  const currs  = pts.map(p => p.current).filter(Boolean)
  const powers = pts.map(p => p.power).filter(Boolean)
  if (!volts.length) return null

  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length
  const peakPwr = Math.max(...powers)
  const peakPt  = pts[powers.indexOf(peakPwr)]

  const vAvg = avg(volts)
  const hasAnomaly = volts.some(v => v < vAvg - 8)

  return {
    vAvg:     avg(volts).toFixed(1),
    vMin:     Math.min(...volts).toFixed(1),
    vMax:     Math.max(...volts).toFixed(1),
    cAvg:     avg(currs).toFixed(2),
    cMin:     Math.min(...currs).toFixed(2),
    cMax:     Math.max(...currs).toFixed(2),
    peakW:    (peakPwr).toFixed(0),
    peakTime: peakPt ? formatBSTTime(peakPt.receivedAt) : '—',
    count:    pts.length,
    hasAnomaly,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatItem({ label, value, range, color, tc }) {
  return (
    <div className="flex flex-col gap-px">
      <span className={`text-xs uppercase tracking-wider ${tc.muted}`}
        style={{ fontSize: 10, letterSpacing: '.06em' }}>
        {label}
      </span>
      <span className="text-base font-semibold font-mono" style={{ color }}>
        {value ?? '—'}
      </span>
      {range && (
        <span className={`text-xs ${tc.muted}`} style={{ fontSize: 10 }}>
          {range}
        </span>
      )}
    </div>
  )
}

function DaySidebar({ days, selDay, dailyKwh, onSelect, tc, cc }) {
  return (
    <div
      className={`border-r ${tc.border} overflow-y-auto shrink-0  scrollbar-thin 
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-gray-700
              [&::-webkit-scrollbar-thumb]:rounded-full
              hover:[&::-webkit-scrollbar-thumb]:bg-gray-500`}
      style={{ width: 112, maxHeight: 380 }}
    >
      <p className={`px-3 py-2 text-xs uppercase tracking-wider ${tc.muted}`}
        style={{ fontSize: 9, letterSpacing: '.07em' }}>
        Select day
      </p>

      {days.map(day => {
        const isActive = day.d === selDay
        const kwh      = dailyKwh[day.isoDate]

        return (
          <button
            key={day.d}
            onClick={() => onSelect(day.d)}
            className={`
              relative w-full flex flex-col text-left px-3 py-2 mb-0.5
              rounded-none transition-all duration-100 
              focus:outline-none
              ${isActive
                ? `${tc.active}`
                : `hover:bg-gray-600/10 ${tc.muted} ${tc.border} border-l-0 border-r-0`
              }
            `}
          >
            {/* Active accent bar */}
            {isActive && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r"
                style={{ height: '55%', background: cc.voltage }}
              />
            )}

            <span className="text-xs font-semibold">{day.dateStr}</span>
            <span className={`text-xs mt-px ${tc.muted}`}>{day.label}</span>

            {kwh != null && (
              <span
                className="text-xs mt-1 font-mono"
                style={{ fontSize: 10, color: cc.energy }}
              >
                {kwh} kWh
              </span>
            )}

            {day.isToday && (
              <span
                className="text-xs mt-0.5 font-semibold px-1 rounded"
                style={{
                  fontSize: 8,
                  letterSpacing: '.04em',
                  background: `${cc.voltage}20`,
                  color: cc.voltage,
                }}
              >
                LIVE
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DualAxisChart24h({ deviceId, liveReading = null }) {
  const tc          = useThemeClasses()
  const cc          = useChartColors()

  const [selDay,    setSelDay]    = useState(0)
  const [selHours,  setSelHours]  = useState(24)
  const [allData,   setAllData]   = useState({})   // { isoDate: [readings] }
  const [dailyKwh,  setDailyKwh]  = useState({})   // { isoDate: kwh }
  const [loading,   setLoading]   = useState(false)
  const [hoverInfo, setHoverInfo] = useState(null)

  const days     = useMemo(() => buildDayList(14), [])
  const selDayObj= days[selDay]
  const chartRef = useRef(null)

  // ── Fetch readings for selected day ───────────────────────────────────────
  const fetchDay = useCallback(async (isoDate) => {
    if (!deviceId || !isoDate) return
    if (allData[isoDate]) return   // already cached

    setLoading(true)
    try {
      const { data } = await api.get(
        `/analytics/${deviceId}/day?date=${isoDate}`
      )
      setAllData(prev => ({ ...prev, [isoDate]: data.readings ?? [] }))
      setDailyKwh(prev => ({ ...prev, [isoDate]: data.totalKwh?.toFixed(2) }))
    } catch (err) {
      if (!err.blocked) console.error('[DualAxisChart24h] fetch error:', err.message)
      setAllData(prev => ({ ...prev, [isoDate]: [] }))
    } finally {
      setLoading(false)
    }
  }, [deviceId, allData])

  useEffect(() => {
    if (selDayObj) fetchDay(selDayObj.isoDate)
  }, [selDay, selDayObj, fetchDay])

  // ── Append live reading to today's data ───────────────────────────────────
  useEffect(() => {
    if (!liveReading || selDay !== 0) return
    const todayKey = days[0].isoDate
    setAllData(prev => {
      const existing = prev[todayKey] ?? []
      return { ...prev, [todayKey]: [...existing, liveReading].slice(-8640) }
    })
  }, [liveReading])

  // ── Compute visible points based on hour zoom ─────────────────────────────
  const visiblePts = useMemo(() => {
    const key = selDayObj?.isoDate
    if (!key) return []
    const pts = allData[key] ?? []

    if (selDay === 0) {
      // Today — show last N hours from now
      const cutoff = Date.now() - selHours * 3600 * 1000
      return pts.filter(p => new Date(p.receivedAt).getTime() >= cutoff)
    } else {
      // Past day — slice last N hours of that day's data
      const slice = Math.round((selHours / 24) * pts.length)
      return pts.slice(Math.max(0, pts.length - slice))
    }
  }, [allData, selDay, selDayObj, selHours])

  const stats = useMemo(() => calcStats(visiblePts), [visiblePts])

  // ── Chart data ────────────────────────────────────────────────────────────
  const labels = useMemo(
    () => visiblePts.map(p => formatBSTTime(p.receivedAt)),
    [visiblePts]
  )

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label:           'Voltage (V)',
        data:             visiblePts.map(p => p.voltage),
        yAxisID:         'yV',
        borderColor:      cc.voltage,
        borderWidth:      1.5,
        pointRadius:      0,
        pointHoverRadius: 4,
        tension:          0.3,
        fill:             false,
        borderDash:       [],
      },
      {
        label:           'Current (A)',
        data:             visiblePts.map(p => p.current),
        yAxisID:         'yA',
        borderColor:      cc.current,
        borderWidth:      1.5,
        pointRadius:      0,
        pointHoverRadius: 4,
        tension:          0.3,
        fill:             false,
        borderDash:       [5, 3],
      },
    ],
  }), [visiblePts, labels, cc])

  const chartOptions = useMemo(() => ({
    responsive:          true,
    maintainAspectRatio: false,
    animation:           { duration: selDay === 0 ? 0 : 350 },
    interaction:         { mode: 'index', intersect: false },
    plugins: {
      legend:  { display: false },
      tooltip: {
        enabled:  false,
        external: ({ tooltip }) => {
          if (tooltip.opacity === 0) { setHoverInfo(null); return }
          const idx = tooltip.dataPoints?.[0]?.dataIndex
          if (idx == null || !visiblePts[idx]) return
          const pt = visiblePts[idx]
          setHoverInfo({
            time:  formatBSTTime(pt.receivedAt),
            volt:  pt.voltage?.toFixed(1),
            curr:  pt.current?.toFixed(2),
            power: pt.power != null ? (pt.power * 1000).toFixed(0) : null,
          })
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color:        cc.tick,
          font:         { size: 9, family: "'JetBrains Mono', monospace" },
          maxTicksLimit: selHours <= 3 ? 7 : selHours <= 6 ? 8 : 10,
          maxRotation:   0,
        },
        grid: { color: cc.gridLine },
      },
      yV: {
        position: 'left',
        title: {
          display: true,
          text:    'Voltage (V)',
          color:   cc.voltage,
          font:    { size: 10 },
        },
        ticks: {
          color:    cc.voltage,
          font:     { size: 9, family: "'JetBrains Mono', monospace" },
          callback: v => v.toFixed(0) + 'V',
        },
        grid: { color: cc.gridLine },
      },
      yA: {
        position: 'right',
        title: {
          display: true,
          text:    'Current (A)',
          color:   cc.current,
          font:    { size: 10 },
        },
        ticks: {
          color:    cc.current,
          font:     { size: 9, family: "'JetBrains Mono', monospace" },
          callback: v => v.toFixed(1) + 'A',
        },
        grid: { drawOnChartArea: false },
      },
    },
  }), [cc, selHours, visiblePts, selDay])

  return (
    <div className={`${tc.card} overflow-hidden`}>

      {/* ── Header ── */}
      <div className={`flex items-start justify-between
                       px-4 pt-4 pb-0 gap-3 flex-wrap`}>
        <div>
          <p className={`text-sm font-semibold ${tc.label}`}style={{ letterSpacing: '-.01em' }}>
            Voltage &amp; Current — 24h Dual Axis
          </p>
          <p className={`text-xs mt-0.5 font-mono ${tc.muted}`}>
            {selDayObj ? formatBSTDate(
              new Date(new Date().setDate(new Date().getDate() - selDay))
            ) : '—'} · BST
          </p>
        </div>
        {selDay > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${tc.badgeOff}`}>
            {selDay === 1 ? 'Yesterday' : `${selDay} days ago`}
          </span>
        )}
        {selDay === 0 && (
          <span className={`text-xs px-2 py-1 pb-1 rounded-full ${tc.badge}`}>
            <span className="inline-block w-1.5 h-1.5 rounded-full
                             bg-green-400 animate-pulse mr-1 mb-0.5" />
            Live
          </span>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className={`flex flex-wrap gap-5 px-4 py-3 border-b justify-between ${tc.border}`}>
        <div className='flex flex-wrap gap-5'>
            <StatItem
          label="Avg Voltage"
          value={stats ? `${stats.vAvg} V` : '—'}
          range={stats ? `${stats.vMin}–${stats.vMax} V` : null}
          color={cc.voltage}
          tc={tc}
        />
        <StatItem
          label="Avg Current"
          value={stats ? `${stats.cAvg} A` : '—'}
          range={stats ? `${stats.cMin}–${stats.cMax} A` : null}
          color={cc.current}
          tc={tc}
        />
        <StatItem
          label="Peak Power"
          value={stats ? `${stats.peakW} W` : '—'}
          range={stats ? `${stats.peakTime} BST` : null}
          color={cc.power}
          tc={tc}
        />
        </div>
        <StatItem
          label="Data points"
          value={stats?.count?.toLocaleString() ?? '—'}
          range="10s interval"
          color={cc.tick}
          tc={tc}
        />
        {stats?.hasAnomaly && (
          <span
            className="self-center text-xs px-2.5 py-1 rounded-full ml-auto"
            style={{
              background:   'rgba(251,146,60,.1)',
              color:         cc.power,
              border:        '1px solid rgba(251,146,60,.2)',
            }}
          >
            ⚠ Voltage anomaly detected
          </span>
        )}
      </div>

      {/* ── Body: sidebar + chart ── */}
      <div className='overflow-x-auto'>
      <div className="flex" style={{ minHeight: 0, minWidth: 720 }}>

        {/* Day sidebar */}
        <DaySidebar
          days={days}
          selDay={selDay}
          dailyKwh={dailyKwh}
          onSelect={d => { setSelDay(d) }}
          tc={tc}
          cc={cc}
        />

        {/* Chart panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 p-4">

          {/* Legend + hour pills */}
          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-4 text-xs flex-wrap"
              style={{ color: cc.tick }}>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-0.5 rounded"
                  style={{ background: cc.voltage }} />
                Voltage (V) · left
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 border-t-2 border-dashed"
                  style={{ borderColor: cc.current }} />
                Current (A) · right
              </span>
            </div>

            {/* Hour zoom pills */}
            <div className="flex gap-1.5 ml-auto">
              {HOUR_OPTIONS.map(opt => (
                <button
                  key={opt.h}
                  onClick={() => setSelHours(opt.h)}
                  className={`
                    px-2.5 py-1 rounded-full text-xs border
                    transition-all duration-120 focus:outline-none
                    ${selHours === opt.h
                      ? `${tc.btn} border-transparent`
                      : `${tc.border} ${tc.muted} bg-transparent hover:opacity-80`
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="relative" style={{ height: 260 }}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center
                              z-10 rounded-lg"
                style={{ background: 'rgba(0,0,0,.1)' }}>
                <div className="w-5 h-5 border-2 border-t-transparent
                                rounded-full animate-spin"
                  style={{ borderColor: cc.voltage,
                           borderTopColor: 'transparent' }} />
              </div>
            )}

            {visiblePts.length === 0 && !loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className={`text-sm ${tc.muted}`}>
                  No data for this time range
                </p>
              </div>
            )}

            {visiblePts.length > 0 && (
              <Line
                ref={chartRef}
                data={chartData}
                options={chartOptions}
                aria-label="Dual axis chart showing voltage and current over 24 hours in BST"
              />
            )}

            {/* Custom hover tooltip */}
            {hoverInfo && (
              <div
                className={`absolute top-2 right-2 ${tc.card} px-3 py-2
                             pointer-events-none text-xs font-mono`}
                style={{ minWidth: 120, zIndex: 10 }}
              >
                <p className={`${tc.muted} mb-1.5`} style={{ fontSize: 10 }}>
                  {hoverInfo.time} BST
                </p>
                <div className="flex justify-between gap-3 mb-1">
                  <span className={tc.muted}>Voltage</span>
                  <span style={{ color: cc.voltage }}>{hoverInfo.volt} V</span>
                </div>
                <div className="flex justify-between gap-3 mb-1">
                  <span className={tc.muted}>Current</span>
                  <span style={{ color: cc.current }}>{hoverInfo.curr} A</span>
                </div>
                {hoverInfo.power && (
                  <div className="flex justify-between gap-3">
                    <span className={tc.muted}>Power</span>
                    <span style={{ color: cc.power }}>{hoverInfo.power} W</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
      {/* ── Footer ── */}
      <div className={`flex items-center justify-between px-4 py-2.5
                       border-t ${tc.border}`}>
        <p className={`text-xs font-mono ${tc.muted}`}>
          All times in Bangladesh Standard Time (UTC+6)
        </p>
        <p className={`text-xs ${tc.muted}`}>
          {visiblePts.length > 0
            ? `${formatBSTTime(visiblePts[0].receivedAt)} → ${formatBSTTime(visiblePts[visiblePts.length - 1].receivedAt)}`
            : '—'
          }
        </p>
      </div>

    </div>
  )
}