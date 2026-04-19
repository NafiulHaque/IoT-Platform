import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import { useThemeClasses } from '../../context/ThemeContext'
import { useChartColors, buildTooltip } from '../../context/ThemeContext'
import { getDaily } from '../../api/energy'

export default function ConsumptionChart({ deviceId }) {
  const tc = useThemeClasses()
  const cc = useChartColors()

  const [range, setRange]   = useState(7)
  const [daily, setDaily]   = useState([])

  useEffect(() => {
    getDaily(deviceId, range).then(setDaily)
  }, [deviceId, range])

  const avg = daily.length
    ? +(daily.reduce((s, d) => s + d.totalKwh, 0) / daily.length).toFixed(2)
    : 0

  const chartData = {
    labels: daily.map(d => d._id),
    datasets: [
      {
        label: 'kWh',
        data:  daily.map(d => +d.totalKwh.toFixed(3)),
        backgroundColor: daily.map(d => d.totalKwh > avg ? cc.energy : cc.energy + '80'),
        borderRadius: 3, borderSkipped: false,
      },
      {
        label: 'Avg', data: daily.map(() => avg),
        type: 'line', borderColor: cc.power,
        borderWidth: 1.5, borderDash: [4, 3],
        pointRadius: 0, fill: false,
      },
    ],
  }

  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: buildTooltip(cc),
    },
    scales: {
      x: { ticks: { color: cc.tick, font: { size: range > 14 ? 8 : 10 },
                    autoSkip: false, maxRotation: range > 14 ? 45 : 0 },
           grid: { color: cc.grid } },
      y: { ticks: { color: cc.tick, font: { size: 9 },
                    callback: v => v + ' kWh' },
           grid: { color: cc.grid } },
    },
  }

  return (
    <div className={`${tc.card} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs uppercase tracking-wider ${tc.muted}`}>Unit consumption / day</p>
        <select
          value={range}
          onChange={e => setRange(Number(e.target.value))}
          className={`text-xs px-2 py-1 rounded-md border ${tc.border} ${tc.muted}
                      bg-transparent focus:outline-none`}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>
      <div className="flex gap-3 text-xs mb-3" style={{ color: tc.muted }}>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: cc.energy }} />
          kWh
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 border-t border-dashed inline-block" style={{ borderColor: cc.power }} />
          Avg {avg} kWh
        </span>
      </div>
      <div className="relative" style={{ height: range > 14 ? 220 : 180 }}>
        <Bar data={chartData} options={opts}
          aria-label="Bar chart showing daily energy consumption in kWh" />
      </div>
    </div>
  )
}