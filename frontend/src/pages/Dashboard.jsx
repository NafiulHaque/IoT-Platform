import { useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import { useThemeClasses } from '../context/ThemeContext'
import api from '../api/axios'
import StatCard from '../components/StatCard'
import SensorChart from '../components/SensorChart'
import SensorDailyAvgChart from '../components/SensorDailyAvgChart'
import { formatTime, timeAgo } from '../utils/time'
import SensorGauge from '../components/SenorGauge'
import SensorGauges from '../components/SenorGauge'
import CircularGauge from '../components/ReactGauge'

let socket

export default function Dashboard() {
  const tc        = useThemeClasses()
  const { token } = useAuth()

  const [devices,      setDevices]      = useState([])
  const [selected,     setSelected]     = useState(null)
  const [readings,     setReadings]     = useState([])
  const [readingDayAvg, setReadingDayAvg] = useState(null)
  const [latest,       setLatest]       = useState(null)
  const [liveStatus,   setLiveStatus]   = useState('connecting')

  // Load devices
  useEffect(() => {
    api.get('/devices').then(r => {
      setDevices(r.data)
      if (r.data.length > 0) setSelected(r.data[0].device_id)
    })
  }, [])

  // Load historical readings for selected device
  useEffect(() => {
    if (!selected) return
    api.get(`/readings/${selected}`).then(r => {
      const sorted = r.data.sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt))
      setReadings(sorted.slice(-30))           // last 30 readings for chart
      setLatest(sorted[sorted.length - 1])
    })
  }, [selected])

  // Calculate daily average for chart last 7 days
  useEffect(() => {
    if (!selected) return 
    try {
      setReadingDayAvg(null) // reset while loading
      api.get(`/readings/${selected}/daily`).then(r => {
        setReadingDayAvg(r.data)
      })
    } catch (error) {
      console.error('Error fetching daily readings:', error)
    }
  }, [selected])  


  // Socket.IO for live updates
  useEffect(() => {
    socket = io('http://localhost:5000', { auth: { token } })

    socket.on('connect',    () => setLiveStatus('live'))
    socket.on('disconnect', () => setLiveStatus('disconnected'))

    socket.on('sensor_update', ({ device_id, reading }) => {
      if (device_id !== selected) return
      setLatest(reading)
      setReadings(prev => [...prev.slice(-29), reading])
      // Update device online status in list
      setDevices(prev => prev.map(d =>
        d.device_id === device_id ? { ...d, status: 'online' } : d
      ))
    })

    return () => socket.disconnect()
  }, [token, selected])

  const LiveDot = () => (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full
      ${liveStatus === 'live' ? tc.badge : tc.badgeOff}`}>
      <span className={`w-1.5 h-1.5 rounded-full
        ${liveStatus === 'live' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      {liveStatus === 'live' ? 'Live' : 'Reconnecting'}
    </span>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className={`text-sm mt-0.5 ${tc.muted}`}>Real-time sensor monitoring</p>
        </div>
        <LiveDot />
      </div>

      {/* Device selector */}
      {devices.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {devices.map(d => (
            <button
              key={d.device_id}
              onClick={() => setSelected(d.device_id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${selected === d.device_id
                  ? `${tc.btn} border-transparent`
                  : `${tc.border} ${tc.muted} bg-transparent`
                }`}
            >
              {d.name || d.device_id}
              <span className={`ml-2 ${d.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                {d.status === 'online' ? '●' : '○'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Temperature"
          value={latest?.temp_c}
          unit="°C"
          sub={latest
              ? `${formatTime(latest.receivedAt)} BD · ${timeAgo(latest.receivedAt)}`
              : 'Waiting...'}
        />
        <StatCard
          label="Humidity"
          value={latest?.humidity}
          unit="%"
          sub={latest
            ? `${formatTime(latest.receivedAt)} BD · ${timeAgo(latest.receivedAt)}`
            : 'Waiting...'}
        />
        <StatCard
          label="Heat index"
          value={latest?.heat_index}
          unit="°C"
          sub="Feels like"
          subColor={tc.muted}
        />
        <StatCard
          label="Uptime"
          value={latest ? Math.floor(latest.uptime_ms / 60000) : '—'}
          unit="min"
          sub={`Device: ${selected ?? '—'}`}
          subColor={tc.muted}
        />
      </div>
     <div className='flex gap-2'>
      <CircularGauge value={latest?.temp_c} label={"Temperatur"} unit={"C"} max={50}/>
     <CircularGauge value={latest?.humidity} label={"Humidity"} unit={"%"}/>
     <CircularGauge value={latest?.voltage} label={"Voltage"} unit={"V"} max={300} />
     <CircularGauge value={latest?.frequency} label={"Frequency"} unit={"Hz"} max={60} />
     </div>


         {selected && (
          <SensorGauges
            temp={latest?.temp_c}
            hum={latest?.humidity}
          />
        ) || <p className={`text-sm ${tc.muted} text-center py-4`}>
          Select a device to view gauges
        </p>}
        {!latest && <SensorGauges 
                      temp={0} 
                      hum={0}
                      />
        }
  

      {/* Chart */}
      <SensorChart
        data={readings}
        title={`Sensor trend — ${selected ?? 'select a device'} (last 30 readings)`}
      />

    {readingDayAvg && (
      <SensorDailyAvgChart
        data={readingDayAvg}
        title={`Daily average — ${selected ?? 'select a device'} (last 7 days)`}
      />
    ) || <p className={`text-sm ${tc.muted} text-center py-4`}>
          Loading daily averages...
        </p>}

      {console.log('readingDayAvg:', readingDayAvg)}
      {console.log('readings:', readings)}
      

      {/* Device list */}
      <div className={`${tc.card} p-5`}>
        <p className={`text-sm font-medium mb-4 ${tc.accent}`}>All devices</p>
        <div className="divide-y divide-transparent space-y-2">
          {devices.map(d => (
            <div
              key={d.device_id}
              onClick={() => setSelected(d.device_id)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer
                border ${tc.border} ${tc.cardHover}
                ${selected === d.device_id ? tc.active : ''}`}
            >
              <div>
                <p className="text-sm font-medium">{d.name || d.device_id}</p>
                <p className={`text-xs ${tc.muted}`}>
                  {d.location} · last seen {d.lastSeen
                    ? new Date(d.lastSeen).toLocaleTimeString()
                    : 'never'}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full
                ${d.status === 'online' ? tc.badge : tc.badgeOff}`}>
                {d.status}
              </span>
            </div>
          ))}
          {devices.length === 0 && (
            <p className={`text-sm ${tc.muted} text-center py-4`}>
              No devices registered yet
            </p>
          )}
        </div>
      </div>

    </div>
  )
}