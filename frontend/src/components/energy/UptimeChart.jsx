import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, Tooltip, Legend
} from 'chart.js'
import { useThemeClasses, useChartColors } from '../../context/ThemeContext'
import { buildTooltip } from '../../utils/energy'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function UptimeChart({ data = [] }) {
  const tc = useThemeClasses()
  const cc = useChartColors()

  // data is the 24-item array from backend, ordered BST 0–23
  // Separate into three visual states:
  //   online  → solid green/blue/gray (theme accent)
  //   offline → faint red
  //   future  → very faint border only (not yet reached)

  const labels = data.map(d => d.label)           // "00:00" … "23:00"

  const onlineData  = data.map(d => d.future ? 0 : d.online  ? (d.pct ?? 100) : 0)
  const offlineData = data.map(d => d.future ? 0 : !d.online ? 100 : 0)
  const futureData  = data.map(d => d.future ? 100 : 0)

  // Pick colours from theme
  const onlineColor  = cc.energy
  const offlineColor = '#f87171'
  const futureColor  = cc.gridLine

  const chartData = {
    labels,
    datasets: [
      {
        label:           'Online',
        data:             onlineData,
        backgroundColor:  onlineColor,
        borderRadius:     { topLeft: 3, topRight: 3 },
        borderSkipped:    false,
        stack:           'uptime',
      },
      {
        label:           'Offline',
        data:             offlineData,
        backgroundColor:  offlineColor + 'aa',
        borderRadius:     { topLeft: 3, topRight: 3 },
        borderSkipped:    false,
        stack:           'uptime',
      },
      {
        label:           'Not yet',
        data:             futureData,
        backgroundColor:  futureColor,
        borderRadius:     { topLeft: 3, topRight: 3 },
        borderSkipped:    false,
        stack:           'uptime',
      },
    ],
  }

  const opts = {
    responsive:          true,
    maintainAspectRatio: false,
    animation:           { duration: 400 },
    plugins: {
      legend:  { display: false },
      tooltip: {
        ...buildTooltip(cc),
        callbacks: {
          title: (items) => {
            const idx = items[0].dataIndex
            return data[idx]?.label + ' BST'
          },
          label: (ctx) => {
            const idx  = ctx.dataIndex
            const row  = data[idx]
            if (row.future)  return 'Not yet reached'
            if (!row.online) return 'Offline — no data'
            return `Online — ${row.count} readings · ${row.pct}% uptime`
          },
          // Hide zero-value dataset lines from tooltip
          filter: (item) => item.raw > 0,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color:        cc.tick,
          font:         { size: 9 },
          maxRotation:  0,
          autoSkip:     false,
          // Only label every 4 hours to avoid crowding (0,4,8,12,16,20)
          callback: (val, idx) => idx % 4 === 0 ? labels[idx] : '',
        },
        grid: { color: cc.gridLine },
      },
      y: {
        stacked: true,
        min: 0,
        max: 100,
        ticks: {
          color:    cc.tick,
          font:     { size: 9 },
          callback: v => v + '%',
          stepSize: 25,
        },
        grid: { color: cc.gridLine },
      },
    },
  }

  // Summary stats
  const onlineHours  = data.filter(d => !d.future && d.online).length
  const offlineHours = data.filter(d => !d.future && !d.online).length
  const futureHours  = data.filter(d => d.future).length
  const uptimePct    = onlineHours + offlineHours > 0
    ? Math.round((onlineHours / (onlineHours + offlineHours)) * 100)
    : 0

  return (
    <div className={`${tc.card} p-4`}>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className={`text-xs uppercase tracking-wider ${tc.muted}`}>
            24h device uptime
          </p>
          {/* <p className={`text-xs mt-0.5 ${tc.muted}`}>
            Bangladesh Standard Time (UTC+6)
          </p> */}
        </div>
        <div className="text-right flex items-center gap-2">
             <p className={`text-xs ${tc.muted}`}>today uptime -</p>
          <p className="text-lg font-medium" style={{ color: cc.energy }}>
            {uptimePct}%
          </p>
         
        </div>
      </div>

      {/* Legend */}
      <div className={`flex flex-wrap gap-3 text-xs mb-3 ${tc.muted}`}>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm inline-block"
            style={{ background: onlineColor }} />
          Online ({onlineHours}h)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm inline-block"
            style={{ background: offlineColor + 'aa' }} />
          Offline ({offlineHours}h)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm inline-block"
            style={{ background: futureColor }} />
          Not yet ({futureHours}h)
        </span>
      </div>

      {/* Chart */}
      <div className="relative h-40">
        <Bar
          data={chartData}
          options={opts}
          aria-label="24 hour device uptime chart in Bangladesh Standard Time"
        />
      </div>

      {/* Hour axis footnote
      <p className={`text-xs mt-2 ${tc.muted} text-right`}>
        00:00 → 23:00 BST
      </p> */}

    </div>
  )
}