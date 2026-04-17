import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useTheme, useThemeClasses, THEMES } from '../context/ThemeContext'
import { formatChartTime } from '../utils/time'

export default function SensorChart({ data = [], title }) {
  const tc       = useThemeClasses()
  const { theme } = useTheme()

  const colors = {
    [THEMES.dark]:       { temp: '#818cf8', hum: '#34d399', grid: '#334155', text: '#94a3b8' },
    [THEMES.enterprise]: { temp: '#3182ce', hum: '#38a169', grid: '#bee3f8', text: '#718096' },
    [THEMES.graphite]:   { temp: '#374151', hum: '#059669', grid: '#e4e4e7', text: '#9ca3af' },
  }[theme]

  const formatted = data.map(r => ({
    time: formatChartTime(r.receivedAt),
    'Temp °C':    r.temp_c,
    'Humidity %': r.humidity,
  }))

  return (
    <div className={`${tc.card} p-5`}>
      <p className={`text-sm font-medium mb-4 ${tc.accent}`}>{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="time" tick={{ fill: colors.text, fontSize: 11 }} />
          <YAxis tick={{ fill: colors.text, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: theme === THEMES.dark ? '#1e293b' : '#fff',
              border: `1px solid ${colors.grid}`,
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: colors.text }} />
          <Line type="monotone" dataKey="Temp °C"    stroke={colors.temp} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Humidity %" stroke={colors.hum}  strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 