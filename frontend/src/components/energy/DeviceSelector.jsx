import { useState, useMemo, useRef, useEffect } from 'react'
import { useThemeClasses, useChartColors } from '../../context/ThemeContext'
import { timeAgo } from '../../utils/time'

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

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
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

function DeviceChip({ device, isSelected, onSelect, tc }) {
  const isOnline = device.status === 'online'
  return (
    <button
      onClick={() => onSelect(device.device_id)}
      title={`${device.name} · ${device.location}`}
      className={`
        group relative flex items-center gap-2 rounded-lg border
        transition-all duration-150 focus:outline-none
        ${isSelected
          ? `${tc.btn} border-transparent shadow-sm`
          : `${tc.border} bg-transparent hover:opacity-90`
        }
      `}
      style={{ padding: '6px 10px' }}
    >
      <StatusDot status={device.status} pulse={isSelected && isOnline} />
      <span className={`text-xs font-medium truncate max-w-24
        ${isSelected ? 'text-white' : ''}`}>
        {device.name || device.device_id}
      </span>
    </button>
  )
}

// ── DeviceDrawer — slides down when device count > 5 ─────────────────────────

function DeviceDrawer({ devices, selected, onSelect, tc, cc, search, setSearch }) {
  const sorted   = useMemo(() => sortDevices(devices), [devices])
  const filtered = useMemo(() => {
    if (!search.trim()) return sorted
    const q = search.toLowerCase()
    return sorted.filter(d =>
      d.name?.toLowerCase().includes(q)      ||
      d.device_id?.toLowerCase().includes(q) ||
      d.location?.toLowerCase().includes(q)
    )
  }, [sorted, search])

  const onlineCount  = devices.filter(d => d.status === 'online').length
  const offlineCount = devices.length - onlineCount

  return (
    <div className={`${tc.card} overflow-hidden`} style={{ padding: 0 }}>

      {/* ── sticky header ── */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3
                    border-b ${tc.border}`}
      >
        {/* left: counts */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`text-sm font-medium`}>Devices</span>
          <span className={`inline-flex items-center gap-1.5 text-xs
                            px-2 py-0.5 rounded-full ${tc.badge}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400
                             inline-block animate-pulse" />
            {onlineCount} online
          </span>
          {offlineCount > 0 && (
            <span className={`inline-flex items-center gap-1.5 text-xs
                              px-2 py-0.5 rounded-full ${tc.badgeOff}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              {offlineCount} offline
            </span>
          )}
        </div>

        {/* right: search */}
        <div className="relative flex-shrink-0">
          <svg
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3
                        pointer-events-none ${tc.muted}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search devices..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`
              input-field text-xs py-1.5 pl-7 pr-3
              ${tc.input}
              w-36 focus:w-48 transition-all duration-200
            `}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2
                          text-xs ${tc.muted} hover:opacity-80`}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── device list ── */}
      <div
        className="overflow-y-auto"
        style={{ maxHeight: 150 }}
      >
        {filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center
                           py-10 gap-2 ${tc.muted}`}>
            <svg className="w-8 h-8 opacity-40" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15
                   10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No devices match "{search}"</p>
            <button
              onClick={() => setSearch('')}
              className={`text-xs underline underline-offset-2 hover:opacity-80`}
            >
              Clear search
            </button>
          </div>
        ) : (
          <div>
            {/* ── Online group ── */}
            {filtered.some(d => d.status === 'online') && (
              <DeviceGroup
                label="Online"
                devices={filtered.filter(d => d.status === 'online')}
                selected={selected}
                onSelect={onSelect}
                tc={tc}
                cc={cc}
                accentColor={cc.energy}
              />
            )}

            {/* ── Offline group ── */}
            {filtered.some(d => d.status !== 'online') && (
              <DeviceGroup
                label="Offline"
                devices={filtered.filter(d => d.status !== 'online')}
                selected={selected}
                onSelect={onSelect}
                tc={tc}
                cc={cc}
                accentColor="#f87171"
              />
            )}
          </div>
        )}
      </div>

      {/* ── footer hint ── */}
      {filtered.length > 0 && (
        <div className={`px-4 py-2 border-t ${tc.border} flex
                         items-center justify-between`}>
          <p className={`text-xs ${tc.muted}`}>
            {filtered.length} of {devices.length} device{devices.length !== 1 ? 's' : ''}
            {search ? ` matching "${search}"` : ''}
          </p>
          <p className={`text-xs ${tc.muted}`}>
            Online first · sorted by last seen
          </p>
        </div>
      )}
    </div>
  )
}

// ── DeviceGroup ───────────────────────────────────────────────────────────────

function DeviceGroup({ label, devices, selected, onSelect, tc, cc, accentColor }) {
  return (
    <div>
      {/* Group label */}
      {/* <div
        className={`px-4 py-1.5 border-b ${tc.border} flex items-center gap-2`}
        style={{ background: 'transparent' }}
      > */}
        {/* <span
          className="w-1 h-3 rounded-full flex-shrink-0"
          style={{ background: accentColor }}
        /> */}
        {/* <span className={`text-xs font-medium ${tc.muted} uppercase
                          tracking-wider`}
          style={{ fontSize: 10 }}
        >
          {label} · {devices.length}
        </span> */}
      {/* </div> */}

      {/* Device rows */}
      {devices.map(d => (
        <DeviceRow
          key={d.device_id}
          device={d}
          isSelected={selected === d.device_id}
          onSelect={onSelect}
          tc={tc}
          cc={cc}
        />
      ))}
    </div>
  )
}

// ── DeviceRow ─────────────────────────────────────────────────────────────────

function DeviceRow({ device, isSelected, onSelect, tc, cc }) {
  const isOnline = device.status === 'online'

  // Signal strength visual (simulated from RSSI or just decorative)
  const signalBars = isOnline
    ? device.rssi ? Math.max(0, Math.min(4, Math.ceil((device.rssi + 100) / 20))) : 4
    : 0

  return (
    <button
      onClick={() => onSelect(device.device_id)}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5
        border-b last:border-0 text-left transition-all duration-100
        focus:outline-none group
        ${tc.border}
        ${isSelected
          ? tc.active
          : `hover:opacity-90 bg-transparent`
        }
      `}
    >
      {/* Status dot */}
      <StatusDot status={device.status} pulse={isOnline} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate
            ${isSelected ? '' : ''}`}>
            {device.name || device.device_id}
          </p>
          {isSelected && (
            <span
              className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                background: cc.energy + '20',
                color:      cc.energy,
                fontSize:   10,
              }}
            >
              active
            </span>
          )}
        </div>
        <p className={`text-xs truncate mt-0.5 ${tc.muted}`}>
          <span className="font-mono">{device.device_id}</span>
          {device.location && (
            <span> · {device.location}</span>
          )}
        </p>
      </div>

      {/* Right side: signal + last seen */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {/* Signal bars */}
        {isOnline && (
          <div className="flex items-end gap-0.5">
            {[1, 2, 3, 4].map(b => (
              <div
                key={b}
                className="w-1 rounded-sm"
                style={{
                  height:     b * 3 + 2,
                  background: b <= signalBars
                    ? cc.energy
                    : (tc.gaugeTrack ? undefined : '#334155'),
                  opacity:    b <= signalBars ? 1 : 0.25,
                  backgroundColor: b <= signalBars ? cc.energy : '#334155',
                }}
              />
            ))}
          </div>
        )}

        {/* Last seen */}
        <p className={`text-xs ${isOnline ? '' : 'text-red-400'}`}
           style={{ fontSize: 10 }}>
          {isOnline
            ? timeAgo(device.lastSeen)
            : 'offline'
          }
        </p>
      </div>

      {/* Selected indicator chevron */}
      {isSelected && (
        <svg className={`w-3.5 h-3.5 flex-shrink-0`}
          style={{ color: cc.energy }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round"
            strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function DeviceSelector({ devices = [], selected, onSelect }) {
  const tc             = useThemeClasses()
  const cc             = useChartColors()
  const [search, setSearch] = useState('')

  const sorted = useMemo(() => sortDevices(devices), [devices])

  // Pill layout for ≤4 devices, drawer for 5+
  const useDrawer = devices.length > 4

  if (devices.length === 0) {
    return (
      <div className={`${tc.card} p-4 mb-4`}>
        <div className={`flex items-center gap-3 ${tc.muted}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                           border ${tc.border}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">No devices registered</p>
            <p className={`text-xs ${tc.muted} mt-0.5`}>
              Add a device from the Devices page
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (useDrawer) {
    return (
      <div className="mb-4">
        <DeviceDrawer
          devices={sorted}
          selected={selected}
          onSelect={onSelect}
          tc={tc}
          cc={cc}
          search={search}
          setSearch={setSearch}
        />
      </div>
    )
  }

  // ── Pill layout (≤4 devices) ──────────────────────────────────────────────
  return (
    <div className="mb-4 flex flex-wrap gap-2 items-center">
      {sorted.map(d => (
        <DeviceChip
          key={d.device_id}
          device={d}
          isSelected={selected === d.device_id}
          onSelect={onSelect}
          tc={tc}
        />
      ))}
    </div>
  )
}