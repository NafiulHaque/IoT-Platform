import { useEffect, useState } from 'react'
import { useThemeClasses } from '../context/ThemeContext'
import api from '../api/axios'
import SensorChart from '../components/SensorChart'
import { formatDateTime } from '../utils/time'

const PER_PAGE = 15

export default function Readings() {
  const tc = useThemeClasses()

  const [devices,   setDevices]   = useState([])
  const [selected,  setSelected]  = useState('')
  const [readings,  setReadings]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState('')

  useEffect(() => {
    api.get('/devices').then(r => {
      setDevices(r.data)
      if (r.data.length > 0) setSelected(r.data[0].device_id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    setPage(1)
    api.get(`/readings/${selected}`)
      .then(r => {
        const sorted = r.data.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
        setReadings(sorted)
      })
      .finally(() => setLoading(false))
  }, [selected])

  const exportCSV = () => {
    const header = 'device_id,temp_c,humidity,heat_index,uptime_ms,receivedAt'
    const rows   = readings.map(r =>
      `${r.device_id},${r.temp_c},${r.humidity},${r.heat_index},${r.uptime_ms},${r.receivedAt}`
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${selected}_readings.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // Stats summary
  const temps = readings.map(r => r.temp_c).filter(Boolean)
  const hums  = readings.map(r => r.humidity).filter(Boolean)
  const stats = {
    tempAvg: temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '—',
    tempMax: temps.length ? Math.max(...temps).toFixed(1) : '—',
    tempMin: temps.length ? Math.min(...temps).toFixed(1) : '—',
    humAvg:  hums.length  ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1) : '—',
  }

  const filtered = readings.filter(r =>
    !search || new Date(r.receivedAt).toLocaleString().includes(search)
  )
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const chartData  = [...readings].reverse().slice(-30)

  const COLS = ['Time', 'Temp °C', 'Humidity %', 'Heat index', 'Uptime (min)']

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Readings</h1>
          <p className={`text-sm mt-0.5 ${tc.muted}`}>Full sensor history per device</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={readings.length === 0}
          className={`text-xs px-4 py-2 rounded-lg border ${tc.border} ${tc.muted}
                      hover:opacity-80 transition-opacity disabled:opacity-30`}
        >
          Export CSV
        </button>
      </div>

      {/* Device tabs */}
      <div className={`flex flex-wrap gap-2 pb-4 border-b ${tc.border}`}>
        {devices.map(d => (
          <button
            key={d.device_id}
            onClick={() => setSelected(d.device_id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-all
              ${selected === d.device_id
                ? `${tc.btn} border-transparent`
                : `${tc.border} ${tc.muted}`}`}
          >
            {d.name || d.device_id}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg temperature', value: stats.tempAvg, unit: '°C' },
          { label: 'Max temperature', value: stats.tempMax, unit: '°C' },
          { label: 'Min temperature', value: stats.tempMin, unit: '°C' },
          { label: 'Avg humidity',    value: stats.humAvg,  unit: '%' },
        ].map(s => (
          <div key={s.label} className={`${tc.card} p-4`}>
            <p className={`text-xs ${tc.muted} mb-1`}>{s.label}</p>
            <p className="text-2xl font-semibold">
              {s.value}
              <span className={`text-sm font-normal ml-1 ${tc.muted}`}>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <SensorChart
        data={chartData}
        title={`Last 30 readings — ${selected}`}
      />

      {/* Table */}
      <div className={`${tc.card} p-5`}>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <p className={`text-sm font-medium ${tc.accent}`}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </p>
          <input
            placeholder="Filter by date/time..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className={`input-field ${tc.input} w-52 text-xs py-1.5`}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin
              ${tc.accent.replace('text-', 'border-')}`} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${tc.border}`}>
                  {COLS.map(h => (
                    <th key={h} className={`text-left pb-2 pr-4 text-xs font-medium ${tc.muted}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={i} className={`border-b ${tc.border} last:border-0
                    ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                    <td className={`py-2.5 pr-4 text-xs ${tc.muted} whitespace-nowrap`}>
                      {formatDateTime(r.receivedAt)}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono text-xs
                      ${r.temp_c > 40 ? 'text-red-400' : r.temp_c < 15 ? 'text-blue-400' : ''}`}>
                      {r.temp_c}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono text-xs
                      ${r.humidity > 80 ? 'text-red-400' : ''}`}>
                      {r.humidity}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{r.heat_index ?? '—'}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">
                      {r.uptime_ms ? Math.floor(r.uptime_ms / 60000) : '—'}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={5} className={`py-10 text-center text-sm ${tc.muted}`}>
                      No readings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between mt-4 pt-4 border-t ${tc.border}`}>
            <span className={`text-xs ${tc.muted}`}>
              Page {page} of {totalPages} · {filtered.length} records
            </span>
            <div className="flex gap-2">
              {[
                { label: '«', action: () => setPage(1),            disabled: page === 1 },
                { label: '‹', action: () => setPage(p => p - 1),  disabled: page === 1 },
                { label: '›', action: () => setPage(p => p + 1),  disabled: page === totalPages },
                { label: '»', action: () => setPage(totalPages),   disabled: page === totalPages },
              ].map((btn, i) => (
                <button
                  key={i}
                  disabled={btn.disabled}
                  onClick={btn.action}
                  className={`text-xs w-7 h-7 rounded-lg border ${tc.border} ${tc.muted}
                              disabled:opacity-30 hover:opacity-80 transition-opacity`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}