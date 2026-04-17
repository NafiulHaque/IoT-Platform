import { useEffect, useState } from 'react'
import { useThemeClasses } from '../context/ThemeContext'
import api from '../api/axios'
import { formatDate } from '../utils/time'

const DEFAULT_THRESHOLDS = {
  temp_max:  45,
  temp_min:  10,
  hum_max:   90,
  hum_min:   20,
}

export default function Alerts() {
  const tc = useThemeClasses()

  const [readings,    setReadings]    = useState([])
  const [thresholds,  setThresholds]  = useState(() => {
    const saved = localStorage.getItem('iot-thresholds')
    return saved ? JSON.parse(saved) : DEFAULT_THRESHOLDS
  })
  const [editMode,    setEditMode]    = useState(false)
  const [draftT,      setDraftT]      = useState(thresholds)
  const [devices,     setDevices]     = useState([])
  const [filter,      setFilter]      = useState('all')

  useEffect(() => {
    api.get('/devices').then(r => setDevices(r.data))
    // Load last 200 readings across all devices
    Promise.all(
      (devices.length ? devices : [{ device_id: 'all' }]).map(d =>
        api.get(`/readings/${d.device_id === 'all' ? '' : d.device_id}`)
           .catch(() => ({ data: [] }))
      )
    ).then(results => {
      const all = results.flatMap(r => r.data)
      setReadings(all.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)))
    })
  }, [])

  // Load readings after devices load
  useEffect(() => {
    if (devices.length === 0) return
    Promise.all(devices.map(d =>
      api.get(`/readings/${d.device_id}`).catch(() => ({ data: [] }))
    )).then(results => {
      const all = results.flatMap(r => r.data)
      setReadings(all.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)))
    })
  }, [devices])

  const saveThresholds = () => {
    setThresholds(draftT)
    localStorage.setItem('iot-thresholds', JSON.stringify(draftT))
    setEditMode(false)
  }

  // Compute alerts from readings
  const alerts = readings.flatMap(r => {
    const list = []
    if (r.temp_c     > thresholds.temp_max) list.push({ ...r, type: 'High temperature', value: `${r.temp_c}°C`, severity: 'high' })
    if (r.temp_c     < thresholds.temp_min) list.push({ ...r, type: 'Low temperature',  value: `${r.temp_c}°C`, severity: 'low' })
    if (r.humidity   > thresholds.hum_max)  list.push({ ...r, type: 'High humidity',    value: `${r.humidity}%`, severity: 'high' })
    if (r.humidity   < thresholds.hum_min)  list.push({ ...r, type: 'Low humidity',     value: `${r.humidity}%`, severity: 'low' })
    return list
  })

  const filtered = filter === 'all'
    ? alerts
    : alerts.filter(a => a.device_id === filter)

  const severityClass = (s) =>
    s === 'high'
      ? 'bg-red-500/10 text-red-400 border-red-500/20'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Alerts</h1>
          <p className={`text-sm mt-0.5 ${tc.muted}`}>
            {alerts.length} threshold breach{alerts.length !== 1 ? 'es' : ''} detected
          </p>
        </div>
        <button
          onClick={() => { setDraftT(thresholds); setEditMode(true) }}
          className={`text-xs px-3 py-1.5 rounded-lg border ${tc.border} ${tc.muted}
                      hover:opacity-80 transition-opacity`}
        >
          Edit thresholds
        </button>
      </div>

      {/* Threshold cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Max temperature', value: thresholds.temp_max, unit: '°C', color: 'text-red-400' },
          { label: 'Min temperature', value: thresholds.temp_min, unit: '°C', color: 'text-blue-400' },
          { label: 'Max humidity',    value: thresholds.hum_max,  unit: '%',  color: 'text-red-400' },
          { label: 'Min humidity',    value: thresholds.hum_min,  unit: '%',  color: 'text-blue-400' },
        ].map(t => (
          <div key={t.label} className={`${tc.card} p-4`}>
            <p className={`text-xs ${tc.muted} mb-1`}>{t.label}</p>
            <p className={`text-2xl font-semibold ${t.color}`}>
              {t.value}<span className={`text-sm font-normal ml-1 ${tc.muted}`}>{t.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Filter by device */}
      {devices.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all
              ${filter === 'all'
                ? `${tc.btn} border-transparent`
                : `${tc.border} ${tc.muted}`}`}
          >
            All devices
          </button>
          {devices.map(d => (
            <button
              key={d.device_id}
              onClick={() => setFilter(d.device_id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                ${filter === d.device_id
                  ? `${tc.btn} border-transparent`
                  : `${tc.border} ${tc.muted}`}`}
            >
              {d.device_id}
            </button>
          ))}
        </div>
      )}

      {/* Alert list */}
      <div className={`${tc.card} p-5`}>
        <p className={`text-sm font-medium mb-4 ${tc.accent}`}>Alert log</p>
        <div className="space-y-2">
          {filtered.slice(0, 50).map((a, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-lg border
                          ${severityClass(a.severity)}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-8 rounded-full flex-shrink-0
                  ${a.severity === 'high' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <div>
                  <p className="text-sm font-medium">{a.type}</p>
                  <p className={`text-xs ${tc.muted}`}>
                    {a.device_id} · {formatDate(a.receivedAt)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-mono font-semibold">{a.value}</span>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className={`py-12 text-center`}>
              <p className="text-3xl mb-3">✓</p>
              <p className={`text-sm ${tc.muted}`}>No threshold breaches detected</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit thresholds modal */}
      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className={`${tc.card} w-full max-w-sm p-6 shadow-xl`}>
            <h2 className="text-base font-semibold mb-5">Edit thresholds</h2>
            <div className="space-y-4">
              {[
                { key: 'temp_max', label: 'Max temperature (°C)' },
                { key: 'temp_min', label: 'Min temperature (°C)' },
                { key: 'hum_max',  label: 'Max humidity (%)' },
                { key: 'hum_min',  label: 'Min humidity (%)' },
              ].map(f => (
                <div key={f.key}>
                  <label className={`block mb-1.5 ${tc.label}`}>{f.label}</label>
                  <input
                    type="number"
                    value={draftT[f.key]}
                    onChange={e => setDraftT(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                    className={`input-field ${tc.input}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditMode(false)}
                className={`flex-1 py-2.5 rounded-lg border ${tc.border} ${tc.muted} text-sm
                            hover:opacity-80 transition-opacity`}
              >
                Cancel
              </button>
              <button
                onClick={saveThresholds}
                className={`flex-1 btn-primary ${tc.btn}`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}