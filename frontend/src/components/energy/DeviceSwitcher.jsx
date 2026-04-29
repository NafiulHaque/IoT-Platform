import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useThemeClasses, useChartColors } from '../../context/ThemeContext'
import { timeAgo } from '../../utils/time'

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_ORDER = { online: 0, warning: 1, offline: 2 }

function sortDevices(devices) {
  return [...devices].sort((a, b) => {
    const so = (STATUS_ORDER[a.status] ?? 2) - (STATUS_ORDER[b.status] ?? 2)
    return so !== 0 ? so : (b.lastSeen ?? 0) - (a.lastSeen ?? 0)
  })
}

function sigBars(rssi) {
  if (!rssi || rssi === 0) return 0
  if (rssi >= -50) return 4
  if (rssi >= -60) return 3
  if (rssi >= -70) return 2
  return 1
}

//select latest online device on initial load
const selectLatestOnlineDevice = (devices) => {
  const onlineDevices = devices.filter(d => d.status === 'online')
  return onlineDevices.length > 0 ? onlineDevices[0].device_id : null
}




// ── StatusDot ─────────────────────────────────────────────────────────────────

function StatusDot({ status, size = 8 }) {
  const color = status === 'online'  ? '#22c55e'
              : status === 'warning' ? '#f59e0b'
              : '#6b7280'
  const auraColor = status === 'online'  ? 'rgba(34,197,94,.25)'
                  : status === 'warning' ? 'rgba(245,158,11,.25)'
                  : 'transparent'

  return (
    <span className="relative flex-shrink-0"
      style={{ width: size, height: size, display: 'inline-flex' }}>
      {status !== 'offline' && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: auraColor, animationDuration: '2s' }}
        />
      )}
      <span
        className="relative rounded-full"
        style={{ width: size, height: size, background: color, zIndex: 1 }}
      />
    </span>
  )
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

// ── TriggerButton ─────────────────────────────────────────────────────────────

function TriggerButton({ device, onClick, tc }) {
  const statusColor = device?.status === 'online'  ? '#22c55e'
                    : device?.status === 'warning' ? '#f59e0b'
                    : '#6b7280'

  return (
    <button
      onClick={onClick}
      title="Switch device (Ctrl+K)"
      className={`
        inline-flex items-center gap-2.5 rounded-xl border
        transition-all duration-150 focus:outline-none focus:ring-2
        relative overflow-hidden group px-3 py-2
        ${tc.border} ${tc.cardInner}
      `}
      style={{ padding: '7px 12px 7px 10px', maxWidth: 280 }}
    >
      {/* hover glow */}
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100
                       transition-opacity duration-200"
        style={{ background: 'var(--color-dark-accent, rgba(99,102,241,.08))' }}
      />

      {/* status dot */}
      <StatusDot status={device?.status ?? 'offline'} size={9} />

      {/* name + sub */}
      <span className="flex-1 min-w-0 relative gap-2 flex flex-row">
        <span className="text-sm font-semibold truncate leading-tight"
          style={{ letterSpacing: '-.01em' }}>
          {device?.name ?? 'Select device'}
        </span>
        <span className={`text-xs truncate mt-px ${tc.muted}`}>
            {device?.location ? `${device.location}` : '—'}
        </span>
        {/* <span className={`text-xs truncate mt-px ${tc.muted}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {device ? `${device.device_id} · ${device.location?.split('—')[0].trim()}` : '—'}
        </span> */}
      </span>

      {/* chevron */}
      <svg className={`w-4 h-4 flex-shrink-0 transition-transform duration-200
                       relative ${tc.muted}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round"
          strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>

      {/* kbd hint */}
      {/* <span className={`text-xs flex items-center gap-0.5 flex-shrink-0
                        relative ${tc.muted} hidden sm:flex`}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          padding: '2px 5px', borderRadius: 4,
          background: 'var(--modal-bg, transparent)',
          border: '1px solid',
          borderColor: 'inherit',
          fontSize: 9,
        }}>
        Ctrl+K
      </span> */}
    </button>
  )
}

// ── FilterTabs ────────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'online',  label: 'Active' },
  // { key: 'warning', label: 'Warning' },
  { key: 'offline', label: 'Offline' },
]

function FilterTabs({ active, setActive, counts, tc }) {
  return (
    <div className={`flex gap-1 px-3 py-2.5 border-b ${tc.border}`}>
      {FILTERS.map(f => (
        <button
          key={f.key}
          onClick={() => setActive(f.key)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            font-semibold transition-all duration-150 focus:outline-none
            ${active === f.key ? `${tc.btn} shadow-sm` : `${tc.muted} hover:opacity-80`}
          `}
        >
          {f.label}
          <span className={`text-xs px-1.5 py-px rounded-full
            ${active === f.key
              ? 'bg-white/20 text-white'
              : `${tc.cardInner} ${tc.muted}`
            }`}
            style={{ fontSize: 10, minWidth: 18, textAlign: 'center' }}>
            {counts[f.key] ?? 0}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── DeviceRow ─────────────────────────────────────────────────────────────────

function DeviceRow({ device, isSelected, isFocused, onSelect, cc, tc }) {
  const isOnline  = device.status === 'online'
  const isWarning = device.status === 'warning'
  const isOffline = device.status === 'offline'

  return (
    <button
      onClick={() => onSelect(device.device_id)}
      aria-selected={isSelected}
      role="option"
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
        border transition-all duration-100 text-left
        focus:outline-none mb-0.5
        ${isSelected
          ? `${tc.active} border-current`
          : isFocused
            ? `${tc.border} opacity-100`
            : `border-transparent hover:opacity-90`
        }
      `}
      style={{
        borderColor: isSelected
          ? 'var(--color-dark-accent, #6366f1)'
          : isFocused
            ? 'var(--color-dark-border, #334155)'
            : 'transparent',
        background: isFocused && !isSelected ? 'var(--row-hover)' : undefined,
      }}
    >
      {/* Status */}
      <StatusDot status={device.status} size={10} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ letterSpacing: '-.01em' }}>
            {device.name}
          </span>
          <span className={`text-xs px-1.5 py-px rounded border ${tc.border}
                            ${tc.muted} font-mono flex-shrink-0`}
            style={{ fontSize: 9 }}>
            {device.device_id}
          </span>
          {isWarning && (
            <span className="text-xs px-2 py-px rounded-full flex-shrink-0"
              style={{
                background: 'rgba(245,158,11,.12)',
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,.25)',
                fontSize: 10,
              }}>
              ⚠ PF {device.pf?.toFixed(2) ?? '—'}
            </span>
          )}
        </div>
        <p className={`text-xs truncate mt-0.5 ${tc.muted}`}>
          {device.location}
        </p>
      </div>

      {/* Right meta */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <SignalBars rssi={device.rssi} online={!isOffline} cc={cc} />
        <span className={`text-xs`}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: isOffline ? '#ef4444' : 'var(--color-dark-muted, #64748b)',
          }}>
          {timeAgo(device.lastSeen)}
         
        </span>
      </div>

      {/* Check */}
      {isSelected && (
        <svg className="w-4 h-4 flex-shrink-0" fill="none"
          viewBox="0 0 24 24" stroke="currentColor"
          style={{ color: cc.energy }}>
          <path strokeLinecap="round" strokeLinejoin="round"
            strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

// ── DeviceModal ───────────────────────────────────────────────────────────────

function DeviceModal({ isOpen, onClose, devices, selected, onSelect, tc, cc }) {
  const [query,   setQuery]   = useState('')
  const [filter,  setFilter]  = useState('all')
  const [kbdIdx,  setKbdIdx]  = useState(-1)
  const inputRef  = useRef(null)
  const listRef   = useRef(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(''); setFilter('all'); setKbdIdx(-1)
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [isOpen])

  const sorted = useMemo(() => sortDevices(devices), [devices])

  const filtered = useMemo(() => {
    let list = filter === 'all' ? sorted : sorted.filter(d => d.status === filter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.device_id.toLowerCase().includes(q) ||
        d.location?.toLowerCase().includes(q)
      )
    }
    return list
  }, [sorted, filter, query])

  const counts = useMemo(() => ({
    all:     devices.length,
    online:  devices.filter(d => d.status === 'online').length,
    warning: devices.filter(d => d.status === 'warning').length,
    offline: devices.filter(d => d.status === 'offline').length,
  }), [devices])

  const groups = useMemo(() => [
    { label: 'Active',  items: filtered.filter(d => d.status === 'online'),  pip: '#22c55e' },
    { label: 'Warning', items: filtered.filter(d => d.status === 'warning'), pip: '#f59e0b' },
    { label: 'Offline', items: filtered.filter(d => d.status === 'offline'), pip: '#ef4444' },
  ].filter(g => g.items.length > 0), [filtered])

  const visibleIds = filtered.map(d => d.device_id)

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape')     { onClose(); return }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setKbdIdx(i => Math.min(i+1, visibleIds.length-1)) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setKbdIdx(i => Math.max(i-1, 0)) }
    if (e.key === 'Enter' && kbdIdx >= 0 && visibleIds[kbdIdx]) {
      onSelect(visibleIds[kbdIdx]); onClose()
    }
  }, [visibleIds, kbdIdx, onClose, onSelect])

  // Scroll focused item into view
  useEffect(() => {
    if (kbdIdx < 0 || !listRef.current) return
    const items = listRef.current.querySelectorAll('[role="option"]')
    items[kbdIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [kbdIdx])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      style={{ background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Device switcher"
    >
      <div
        className={`w-full max-w-lg ${tc.card} overflow-hidden`}
        style={{
          boxShadow: '0 25px 60px rgba(0,0,0,.5)',
          animation: 'modalIn .2s cubic-bezier(.22,1,.36,1) both',
        }}
      >

        {/* ── Search row ── */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${tc.border}`}>
          <svg className={`w-4 h-4 flex-shrink-0 ${tc.muted}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by name, ID, or location..."
            value={query}
            onChange={e => { setQuery(e.target.value); setKbdIdx(-1) }}
            onKeyDown={handleKeyDown}
            className={`flex-1 bg-transparent border-none outline-none text-sm
                        placeholder:${tc.muted}`}
            style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button onClick={() => { setQuery(''); setKbdIdx(-1) }}
              className={`text-xs ${tc.muted} hover:opacity-80 flex-shrink-0`}>
              ✕
            </button>
          )}
          <button onClick={onClose}
            className={`text-xs px-2 py-1 rounded-md border ${tc.border}
                        ${tc.muted} hover:opacity-80 flex-shrink-0`}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
            ESC
          </button>
        </div>

        {/* ── Filter tabs ── */}
        <FilterTabs
          active={filter}
          setActive={f => { setFilter(f); setKbdIdx(-1) }}
          counts={counts}
          tc={tc}
        />

        {/* ── Device list ── */}
        <div
          ref={listRef}
          role="listbox"
          className="overflow-y-auto px-2 py-2"
          style={{ maxHeight: 340 }}
        >
          {filtered.length === 0 ? (
            <div className={`flex flex-col items-center justify-center
                             py-10 gap-2 ${tc.muted}`}>
              <svg className="w-9 h-9 opacity-40" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01
                     M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No devices found</p>
              {query && (
                <button onClick={() => setQuery('')}
                  className={`text-xs underline underline-offset-2
                               hover:opacity-80 mt-1`}
                  style={{ color: 'var(--color-dark-accent, #6366f1)' }}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            groups.map(g => {
              // Build row index offset for kbd navigation
              let offset = 0
              groups.forEach(pg => {
                if (pg.label === g.label) return
                // only count groups that come before this one
                const order = ['Active','Warning','Offline']
                if (order.indexOf(pg.label) < order.indexOf(g.label)) {
                  offset += pg.items.length
                }
              })

              return (
                <div key={g.label}>
                  {/* Group header */}
                  <div className={`flex items-center gap-2 px-2 py-1.5`}>
                    <span className="w-0.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ background: g.pip }} />
                    <span className={`text-xs font-semibold uppercase
                                      tracking-wider ${tc.muted}`}
                      style={{ fontSize: 10 }}>
                      {g.label} · {g.items.length}
                    </span>
                  </div>

                  {/* Rows */}
                  {g.items.map((d, ri) => {
                    const absIdx = offset + ri
                    return (
                      <DeviceRow
                        key={d.device_id}
                        device={d}
                        isSelected={selected === d.device_id}
                        isFocused={kbdIdx === absIdx}
                        onSelect={id => { onSelect(id); onClose() }}
                        cc={cc}
                        tc={tc}
                      />
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div className={`flex items-center justify-between px-4 py-2.5
                         border-t ${tc.border}`}>
          <div className={`flex items-center gap-3 text-xs ${tc.muted}`}
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd><Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> select
            </span>
            <span className="flex items-center gap-1">
              <Kbd>ESC</Kbd> close
            </span>
          </div>
          <span className={`text-xs ${tc.muted}`}>
            {filtered.length !== devices.length
              ? `${filtered.length} of ${devices.length} devices`
              : `${devices.length} device${devices.length !== 1 ? 's' : ''}`
            }
          </span>
        </div>

      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:translateY(-10px) scale(.97) }
          to   { opacity:1; transform:translateY(0)     scale(1)    }
        }
      `}</style>
    </div>
  )
}

function Kbd({ children }) {
  return (
    <kbd className="px-1.5 py-px rounded border"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        background: 'var(--surface2, rgba(255,255,255,.05))',
        borderColor: 'var(--border2, rgba(255,255,255,.15))',
      }}>
      {children}
    </kbd>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function DeviceSwitcher({ devices = [], selected, onSelect }) {
  const tc            = useThemeClasses()
  const cc            = useChartColors()
  const [open, setOpen] = useState(false)

  const selectedDevice = devices.find(d => d.device_id === selected) ?? null

  // Global Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!selected && devices.length > 0) {
      const latestOnlineDevice = selectLatestOnlineDevice(devices)
      if (latestOnlineDevice) {
        onSelect(latestOnlineDevice)
      }
    }
  }, [devices, selected, onSelect])

  return (
    <>
      <TriggerButton
        device={selectedDevice}
        onClick={() => setOpen(true)}
        tc={tc}
      />

      <DeviceModal
        isOpen={open}
        onClose={() => setOpen(false)}
        devices={devices}
        selected={selected}
        onSelect={id => { onSelect(id); setOpen(false) }}
        tc={tc}
        cc={cc}
      />
    </>
  )
}