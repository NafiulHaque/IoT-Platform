import { useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Filler, Tooltip, Legend
} from 'chart.js'
import { useAuth } from '../context/AuthContext'
import { useThemeClasses } from '../context/ThemeContext'
import { formatTime, timeAgo } from '../utils/time'
import {
  fmtPower, fmtEnergy, fmtVoltage, fmtCurrent,
  fmtPF, fmtFreq, voltageStatus
} from '../utils/energy'
import { getSummary, getHistory, getHeatmap, getUptime } from '../api/energy'
import PrimaryCard from '../components/energy/PrimaryCard'
import SecondaryCard from '../components/energy/SecondaryCard'
import PFGauge from '../components/energy/PFGauge'
import DualAxisChart from '../components/energy/DualAxisChart'
import EnergyHeatmap from '../components/energy/EnergyHeatmap'
import UptimeChart from '../components/energy/UptimeChart'
import ConsumptionChart from '../components/energy/ConsumptionChart'
//import DeviceSelector   from '../components/energy/DeviceSelector'
import DeviceSwitcher from '../components/energy/DeviceSwitcher'


ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Filler, Tooltip, Legend
)

let socket

export default function EnergyDashboard() {
  const tc = useThemeClasses()
  const { token } = useAuth()

  const [devices, setDevices] = useState([])
  const [selDev, setSelDev] = useState(null)
  const [latest, setLatest] = useState(null)
  const [history, setHistory] = useState([])
  const [heatmap, setHeatmap] = useState(null)
  const [uptime, setUptime] = useState([])
  const [liveStatus, setLive] = useState('connecting')
  const [bdTime, setBdTime] = useState('')

  // BD clock
  useEffect(() => {
    const tick = () => setBdTime(
      new Date().toLocaleTimeString('en-BD', { timeZone: 'Asia/Dhaka', hour12: false }) + ' BST'
    )
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  // Load device list and select latest online device

  const selectLatestOnlineDevice = (devices) => {
    const onlineDevices = devices.filter(d => d.status === 'online')
    return onlineDevices.length > 0 ? onlineDevices[0].device_id : null
  }
  useEffect(() => {
    import('../api/axios').then(({ default: api }) =>
      api.get('/devices').then(r => {
        setDevices(r.data)
        if (r.data.length > 0) {
          const latestOnlineDevice = selectLatestOnlineDevice(r.data)
          if (latestOnlineDevice) {
            setSelDev(latestOnlineDevice)
          }
        }
      })
    )
  }, [])


  // In loadDevice() — no change needed, uptime is already fetched
  // But add a refresh every 60 seconds so the current hour updates live

  useEffect(() => {
    if (!selDev) return
    const refresh = () =>
      getUptime(selDev).then(setUptime)

    refresh()                              // immediate on device change
    const id = setInterval(refresh, 60_000) // refresh every 60s
    return () => clearInterval(id)
  }, [selDev])


  // Replace the loadDevice function with this:
  const loadDevice = useCallback(async (id) => {
    if (!id) return
    try {
      const [sum, hist, hm, up] = await Promise.all([
        getSummary(id),
        getHistory(id, 30),
        getHeatmap(id),      // now returns BST-correct grid
        getUptime(id),       // now returns full 0–23 BST array
      ])

      setLatest(sum.latest)
      setHistory(
        [...hist].sort((a, b) =>
          new Date(a.receivedAt) - new Date(b.receivedAt)
        )
      )
      setHeatmap(hm)
      setUptime(up)
    } catch (err) {
      console.error('loadDevice error:', err)
    }
  }, [])

  useEffect(() => { if (selDev) loadDevice(selDev) }, [selDev])


  // Socket.IO live
  useEffect(() => {
    socket = io('http://localhost:5000', { auth: { token } })
    socket.on('connect', () => setLive('live'))
    socket.on('disconnect', () => setLive('disconnected'))
    socket.on('sensor_update', ({ device_id, reading }) => {
      if (device_id !== selDev) return
      setLatest(reading)
      setHistory(prev => [...prev.slice(-29), reading])
      setDevices(prev => prev.map(d =>
        d.device_id === device_id ? { ...d, status: 'online', lastSeen: reading.receivedAt } : d
      ))
    })
    return () => socket.disconnect()
  }, [token, selDev])

  const vstat = voltageStatus(latest?.voltage)

  return (
    <div className={tc.page}>
      <div className="space-y-4 mx-auto ">

        {/* Top bar
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium">Energy Monitor</h1>

          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${tc.muted}`}>{bdTime}</span>
            <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full
              ${liveStatus === 'live' ? tc.badge : tc.badgeOff}`}>
              <span className={`w-1.5 h-1.5 rounded-full
                ${liveStatus === 'live' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {liveStatus === 'live' ? 'Live' : 'Reconnecting'}
            </span>
          </div>
        </div> */}

        {/* Device selector
        <DeviceSelector
          devices={devices}
          selected={selDev}
          onSelect={setSelDev}
        /> */}

       
        <div className="dash-topbar flex items-center justify-between gap-3 flex-wrap">
          {/* LEFT: trigger button — THIS replaces the old pill/table selector */}
          <DeviceSwitcher
            devices={devices}
            selected={selDev}
            onSelect={setSelDev}
          />

          {/* RIGHT: live badge + BST clock */}
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1
                      rounded-full ${tc.badge}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {liveStatus === 'live' ? 'Live' : 'Reconnecting'}
            </span>
            <span className={`text-xs font-mono ${tc.muted}`}>{bdTime}</span>
          </div>
        </div>


        {/* ── Bento row 1: Primary metrics ── */}
        <div className="grid grid-cols-4 lg:grid-cols-6 md:grid-cols-4 gap-3">
          <PrimaryCard
            label="Active power"
            value={latest?.power != null ? (latest.power / 1000).toFixed(2) : '—'}
            unit="kW"
            sub={fmtPower(latest?.power)}
            sparkData={history.map(r => r.power)}
            sparkCssVar="--color-power"
          />
          <PrimaryCard
            label="Energy consumed"
            value={latest?.energy != null ? Number(latest.energy).toFixed(3) : '—'}
            unit="kWh"
            sub="Today cumulative"
            sparkData={history.map(r => r.energy)}
            sparkCssVar="--color-energy"
          />
          <PrimaryCard
            label="Voltage"
            value={latest?.voltage != null ? Number(latest.voltage).toFixed(1) : '—'}
            unit="V"
            sub={vstat.label}
            subStyle={{ color: vstat.ok ? 'var(--color-energy)' : '#f87171' }}
            sparkData={history.map(r => r.voltage)}
            sparkCssVar="--color-voltage"
          />


          {/* ── Bento row 2: Secondary metrics ── */}

          <SecondaryCard
            label="Current"
            value={fmtCurrent(latest?.current)}
            unit="A"
            gaugePct={(latest?.current ?? 0) / 1 * 100}
            gaugeCssVar="--color-current"
            gaugeMin="0 A"
            gaugeMax="1 A"
          />
          <PFGauge value={latest?.pf} />
          <SecondaryCard
            label="Frequency"
            value={fmtFreq(latest?.frequency)}
            unit="Hz"
            gaugePct={((latest?.frequency ?? 49) - 49) / 1.2 * 100}
            gaugeCssVar="--color-freq"
            gaugeMin="49 Hz"
            gaugeMax="50.2 Hz"
          />
        </div>

        {/* ── Ambient ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Temperature', value: `${latest?.temp_c ?? '—'}°C`, cssVar: '--color-temp' },
            { label: 'Humidity', value: `${latest?.humidity ?? '—'}%`, cssVar: '--color-hum' },
            { label: 'Heat index', value: `${latest?.heat_index ?? '—'}°C`, cssVar: '--color-temp' },
            { label: 'Last update', value: latest ? timeAgo(latest.receivedAt) : '—', cssVar: null },
          ].map(m => (
            <div key={m.label} className={`${tc.card} ${tc.cardHover} p-4`}>
              <p className={tc.label}>{m.label}</p>
              <p className="text-xl font-medium mt-1"
                style={m.cssVar ? { color: `var(${m.cssVar})` } : {}}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Dual axis + Uptime ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DualAxisChart history={history} />
          <UptimeChart data={uptime} />
        </div>

        {/* ── Heatmap ── */}
        <EnergyHeatmap data={heatmap} />

        {/* ── Consumption ── */}
        <ConsumptionChart deviceId={selDev} />

      </div>
    </div>
  )
}