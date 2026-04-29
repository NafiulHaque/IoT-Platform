import { useEffect, useState } from 'react'
import { useThemeClasses } from '../context/ThemeContext'
import api from '../api/axios'
import SensorChart from '../components/SensorChart'
import { formatDateTime } from '../utils/time'
import DeviceSwitcher from '../components/energy/DeviceSwitcher'

const PER_PAGE = 15

export default function Readings() {
  const tc = useThemeClasses()

  const [devices,   setDevices]   = useState([])
  const [selected,  setSelected]  = useState('')
  const [readings,  setReadings]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState('')


// Load device list and select latest online device

  const selectLatestOnlineDevice = (devices) => {
    const onlineDevices = devices.filter(d => d.status === 'online')
    return onlineDevices.length > 0 ? onlineDevices[0].device_id : null
  }

  useEffect(() => {
    api.get('/devices').then(r => {
      setDevices(r.data)
      if (r.data.length > 0) {
          const latestOnlineDevice = selectLatestOnlineDevice(r.data)
          if (latestOnlineDevice) {
            setSelected(latestOnlineDevice)
          }
        }
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
    const header = 'device_id,Voltage (V),Current (A),Power (W),Energy (kWh),Freq (Hz),PF,Temp °C,Hum %,Heat index,Uptime (min),Received AT';
    const rows   = readings.map(r =>
      `${r.device_id},${r.voltage},${r.current},${r.power},${r.energy},${r.frequency},${r.pf},${r.temp_c},${r.humidity},${r.heat_index},${r.uptime_ms},${r.receivedAt}`
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${selected}_readings.csv`; a.click()
    URL.revokeObjectURL(url)
  }



  const filtered = readings.filter(r =>
    !search || new Date(r.receivedAt).toLocaleString().includes(search)
  )
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
 

  const COLS = ['Time', 'Volt (V)', 'Current (A)', 'Power (W)', 'Energy (kWh)', 'Freq (Hz)', 'PF', 'Temp °C', 'Hum %', 'Heat index', 'Uptime (min)']

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
      <div className="flex flex-wrap gap-2">
       <DeviceSwitcher
                 devices={devices}
                 selected={selected}
                 onSelect={setSelected}
               />
      </div>

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
                      ${r.voltage > 240 ? 'text-red-400' : r.voltage < 220 ? 'text-blue-400' : ''}`}>
                      {r.voltage}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono text-xs
                      ${r.current > 240 ? 'text-red-400' : r.current < 220 ? 'text-blue-400' : ''}`}>
                      {r.current}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono text-xs
                      ${r.power > 240 ? 'text-red-400' : r.power < 220 ? 'text-blue-400' : ''}`}>
                      {r.power}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono text-xs
                      ${r.energy > 240 ? 'text-red-400' : r.energy < 220 ? 'text-blue-400' : ''}`}>
                      {r.energy}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono text-xs
                      ${r.frequency > 50.2 ? 'text-red-400' : r.frequency < 48 ? 'text-blue-400' : ''}`}>
                      {r.frequency}
                    </td>
                    <td className={`py-2.5 pr-4 font-mono text-xs
                      ${r.pf > 0.8 ? 'text-green-400' : r.pf < 0.2 ? 'text-red-400' : ''}`}>
                      {r.pf}
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