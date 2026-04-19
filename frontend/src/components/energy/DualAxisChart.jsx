import { Line } from 'react-chartjs-2'
import { useThemeClasses } from '../../context/ThemeContext'
import { useChartColors, buildTooltip } from '../../context/ThemeContext'
import { formatChartTime } from '../../utils/time'

export default function DualAxisChart({ history }) {
  const tc = useThemeClasses()
  const cc = useChartColors()

  const data = {
    labels: history.map(r => formatChartTime(r.receivedAt)),
    datasets: [
      {
        label: 'Voltage (V)', yAxisID: 'yV',
        data: history.map(r => r.voltage),
        borderColor: cc.voltage, borderWidth: 1.5,
        pointRadius: 0, tension: 0.3, fill: false,
      },
      {
        label: 'Current (A)', yAxisID: 'yA',
        data: history.map(r => r.current),
        borderColor: cc.current, borderWidth: 1.5,
        pointRadius: 0, tension: 0.3,
        borderDash: [4, 2], fill: false,
      },
    ],
  }

  const opts = {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: {
      legend:  { display: false },
      tooltip: buildTooltip(cc),
    },
    scales: {
      x:  { ticks: { color: cc.tick, font: { size: 9 }, maxTicksLimit: 8 },
            grid:  { color: cc.grid } },
      yV: { position: 'left',  ticks: { color: cc.voltage, font: { size: 9 } },
            grid:  { color: cc.grid } },
      yA: { position: 'right', ticks: { color: cc.current, font: { size: 9 } },
            grid:  { drawOnChartArea: false } },
    },
  }

  return (
    <div className={`${tc.card} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs uppercase tracking-wider ${tc.muted}`}>Voltage & current — dual axis</p>
        <div className="flex gap-3 text-xs" style={{ color: tc.muted }}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block rounded" style={{ background: cc.voltage }} />
            Voltage · left
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 border-t border-dashed inline-block" style={{ borderColor: cc.current }} />
            Current · right
          </span>
        </div>
      </div>
      <div className="relative h-40">
        <Line data={data} options={opts}
          aria-label="Dual axis chart overlaying voltage and current" />
      </div>
    </div>
  )
}