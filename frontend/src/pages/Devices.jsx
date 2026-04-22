import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeClasses,useChartColors } from '../context/ThemeContext'
import api from '../api/axios'
import {formatDateTime,timeAgo} from '../utils/time'

const EMPTY = { device_id: '', name: '', location: '', topic: '' }


// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_ORDER = { online: 0, offline: 1 }

function sortDevices(devices) {
  return [...devices].sort((a, b) => {
    const so = (STATUS_ORDER[a.status] ?? 1) - (STATUS_ORDER[b.status] ?? 1)
    if (so !== 0) return so
    // within same status: sort by lastSeen descending (most recent first)
    return new Date(b.lastSeen ?? 0) - new Date(a.lastSeen ?? 0)
  })
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status, pulse = true }) {
  const isOnline = status === 'online'
  return (
    <span className="relative flex-shrink-0" style={{ width: 8, height: 8 }}>
      {isOnline && pulse && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: '#4ade80', opacity: 0.4 }}
        />
      )}
      <span
        className="relative block rounded-full"
        style={{
          width: 8, height: 8,
          background: isOnline ? '#4ade80' : '#f87171',
        }}
      />
    </span>
  )
}



export default function Devices() {


  const tc       = useThemeClasses()
  const cc       =useChartColors()
  const navigate = useNavigate()

  const [devices,  setDevices]  = useState([])
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)   // null = add, obj = edit
  const [form,     setForm]     = useState(EMPTY)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [deleting, setDeleting] = useState(null)


  const load = () => api.get('/devices').then(r => setDevices(r.data))
  useEffect(() => { load() }, [])


 const isOnline = devices.status === 'online'

 function sigBars(rssi) {
  if (!rssi || rssi === 0) return 0
  if (rssi >= -50) return 4
  if (rssi >= -60) return 3
  if (rssi >= -70) return 2
  return 1
}

// ── SignalBars ────────────────────────────────────────────────────────────────

function SignalBars({ rssi, online, cc }) {
  if (!online) return null
  const bars = sigBars(rssi)
  return (
    <div className="flex items-end gap-px">
      {[1, 2, 3, 4].map(b => (
        <div
          key={b}
          className="w-1 rounded-sm"
          style={{
            height:     b * 3 + 2,
            background: b <= bars ? cc.energy : 'var(--color-dark-border, #334155)',
            opacity:    b <= bars ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  )
}
 
function OfflineStatus({ lastSeen, tc }) {
  const isOffline = true
  return (
    <span className={`text-xs ${tc.muted}`}
      style={{
       display: 'inline-block',
        padding: '0.125rem 0.375rem',
        borderRadius: 9999,
           borderColor: isOffline ? '#fecaca' : 'inherit',
      }}
    >
      {timeAgo(lastSeen)}
    </span>
  )
}


  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModal(true)
  }

  const openEdit = (d) => {
    setEditing(d)
    setForm({ device_id: d.device_id, name: d.name, location: d.location, topic: d.topic })
    setError('')
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/devices/${editing._id}`, form)
      } else {
        await api.post('/devices', {
          ...form,
          topic: form.topic || `factory/line1/${form.device_id}/dht`
        })
      }
      await load()
      setModal(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save device')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await api.delete(`/devices/${id}`)
      await load()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Devices</h1>
          <p className={`text-sm mt-0.5 ${tc.muted}`}>
            {devices.length} registered device{devices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openAdd} className={`btn-primary ${tc.btn} w-auto px-4 py-2 text-sm`}>
          + Add device
        </button>
      </div>

      {/* Device grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {devices.map(d => (
          <div key={d._id} className={`${tc.card} ${tc.cardHover} p-5 flex flex-col gap-3`}>

            {/* Top row */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{d.name}</p>
                <p className={`text-xs mt-0.5 font-mono ${tc.muted}`}>{d.device_id}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={d.status} />
                <span className={`text-xs ${tc.muted}`}>{d.status || 'unknown'}</span>
              </div>
              <div className="flex items-end gap-0.5">
               {d.status=== 'online'?<SignalBars rssi={d.rssi} online={d.status === 'online'} cc={cc} />: <OfflineStatus lastSeen={d.lastSeen} tc={tc} />}
                 
              </div>
             </div> 
  

            {/* Info rows */}
            <div className="space-y-1.5">
              <Row label="Location" value={d.location || '—'} tc={tc} />
              <Row label="Topic"    value={d.topic}           tc={tc} mono />
              <Row label="Last seen"
                value={d.lastSeen
                  ? `${timeAgo(d.lastSeen)}.${formatDateTime(d.lastSeen)}`
                  : 'Never'}
                tc={tc}
              />
            </div>

            {/* Actions */}
            <div className={`flex gap-2 pt-2 border-t ${tc.border}`}>
              <button
                onClick={() => navigate(`/devices/${d.device_id}`)}
                className={`flex-1 text-xs py-1.5 rounded-lg border ${tc.border} ${tc.muted}
                            hover:opacity-80 transition-opacity`}
              >
                View readings
              </button>
              <button
                onClick={() => openEdit(d)}
                className={`text-xs py-1.5 px-3 rounded-lg border ${tc.border} ${tc.muted}
                            hover:opacity-80 transition-opacity`}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(d._id)}
                disabled={deleting === d._id}
                className="text-xs py-1.5 px-3 rounded-lg bg-red-500/10 text-red-400
                           border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                {deleting === d._id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}

        {devices.length === 0 && (
          <div className={`col-span-3 ${tc.card} p-12 text-center`}>
            <p className={`text-sm ${tc.muted}`}>No devices yet. Add your first ESP32.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className={`${tc.card} w-full max-w-md p-6 shadow-xl`}>
            <h2 className="text-base font-semibold mb-5">
              {editing ? 'Edit device' : 'Add new device'}
            </h2>

            {error && (
              <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border
                              border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'device_id', label: 'Device ID',  placeholder: 'esp32_01', disabled: !!editing },
                { key: 'name',      label: 'Name',        placeholder: 'Line 1 — Temp sensor' },
                { key: 'location',  label: 'Location',    placeholder: 'Factory Line 1' },
                { key: 'topic',     label: 'MQTT topic',  placeholder: 'factory/line1/esp32_01/dht' },
              ].map(f => (
                <div key={f.key}>
                  <label className={`block mb-1.5 ${tc.label}`}>{f.label}</label>
                  <input
                    required={f.key !== 'topic'}
                    disabled={f.disabled}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className={`input-field ${tc.input} ${f.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className={`flex-1 py-2.5 rounded-lg border ${tc.border} ${tc.muted}
                              text-sm hover:opacity-80 transition-opacity`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 btn-primary ${tc.btn} flex items-center justify-center gap-2`}
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : editing ? 'Save changes' : 'Add device'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, tc, mono }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-xs ${tc.muted}`}>{label}</span>
      <span className={`text-xs truncate max-w-[180px] ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}