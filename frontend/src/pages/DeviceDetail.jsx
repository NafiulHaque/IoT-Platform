import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useThemeClasses } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import StatCard from '../components/StatCard'
import SensorChart from '../components/SensorChart'
import { formatDateTime, formatTime, timeAgo } from '../utils/time'

let socket

export default function DeviceDetail() {
  const { device_id } = useParams()
  const tc             = useThemeClasses()
  const { token }      = useAuth()
  const navigate       = useNavigate()

  const [device,   setDevice]   = useState(null)
  const [readings, setReadings] = useState([])
  const [latest,   setLatest]   = useState(null)
  const [page,     setPage]     = useState(1)
  const [live,     setLive]     = useState(true)
  const PER_PAGE = 10

  useEffect(() => {
    api.get(`/devices`).then(r => {
      const d = r.data.find(x => x.device_id === device_id)
      setDevice(d)
    })
    api.get(`/readings/${device_id}`).then(r => {
      const sorted = r.data.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
      setReadings(sorted)
      setLatest(sorted[0])
    })
  }, [device_id])

  useEffect(() => {
    socket = io('http://localhost:5000', { auth: { token } })
    socket.on('sensor_update', ({ device_id: did, reading }) => {
      if (did !== device_id) return
      setLatest(reading)
      setReadings(prev => [reading, ...prev].slice(0, 100))
    })
    return () => socket.disconnect()
  }, [token, device_id])

  // CSV export
  const exportCSV = () => {
    const header = 'device_id,temp_c,humidity,heat_index,uptime_ms,receivedAt'
    const rows   = readings.map(r =>
      `${r.device_id},${r.temp_c},${r.humidity},${r.heat_index},${r.uptime_ms},${r.receivedAt}`
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${device_id}_readings.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const chartData   = [...readings].reverse().slice(-30)
  const paginated   = readings.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages  = Math.ceil(readings.length / PER_PAGE)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/devices')}
          className={`p-1.5 rounded-lg border ${tc.border} ${tc.muted} hover:opacity-80`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{device?.name || device_id}</h1>
          <p className={`text-sm mt-0.5 ${tc.muted}`}>
            {device?.location} · <span className="font-mono text-xs">{device_id}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLive(l => !l)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all
              ${live ? tc.badge + ' border-transparent' : `${tc.border} ${tc.muted}`}`}
          >
            {live ? '● Live' : '○ Paused'}
          </button>
          <button
            onClick={exportCSV}
            className={`text-xs px-3 py-1.5 rounded-lg border ${tc.border} ${tc.muted}
                        hover:opacity-80 transition-opacity`}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Temperature" value={latest?.temp_c}    unit="°C" sub="Latest reading" />
        <StatCard label="Humidity"    value={latest?.humidity}   unit="%"  sub="Latest reading" />
        <StatCard label="Heat index"  value={latest?.heat_index} unit="°C" sub="Feels like" subColor={tc.muted} />
       
        <StatCard
          label="Last reading"
          value={latest ? formatTime(latest.receivedAt) : '—'}
          sub={latest ? `BD time · ${timeAgo(latest.receivedAt)}` : 'Waiting...'}
          subColor={tc.muted}
        />
      </div>

      {/* Chart */}
      <SensorChart
        data={chartData}
        title={`Sensor trend — last ${chartData.length} readings`}
      />

      {/* Data table */}
      <div className={`${tc.card} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <p className={`text-sm font-medium ${tc.accent}`}>Reading history</p>
          <span className={`text-xs ${tc.muted}`}>{readings.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${tc.border}`}>
                {['Time', 'Temp °C', 'Humidity %', 'Heat index', 'Uptime (min)'].map(h => (
                  <th key={h} className={`text-left pb-2 pr-4 text-xs font-medium ${tc.muted}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {paginated.map((r, i) => (
                <tr key={i} className={`border-b ${tc.border} last:border-0`}>
                  <td className={`py-2.5 pr-4 text-xs ${tc.muted} whitespace-nowrap`}>
                    {formatDateTime(r.receivedAt)}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{r.temp_c}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{r.humidity}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{r.heat_index}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">
                    {r.uptime_ms ? Math.floor(r.uptime_ms / 60000) : '—'}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={5} className={`py-8 text-center text-sm ${tc.muted}`}>
                    No readings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between mt-4 pt-4 border-t ${tc.border}`}>
            <span className={`text-xs ${tc.muted}`}>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className={`text-xs px-3 py-1.5 rounded-lg border ${tc.border} ${tc.muted}
                            disabled:opacity-30 hover:opacity-80 transition-opacity`}
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className={`text-xs px-3 py-1.5 rounded-lg border ${tc.border} ${tc.muted}
                            disabled:opacity-30 hover:opacity-80 transition-opacity`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}