import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import { useTheme, useThemeClasses, THEMES } from '../context/ThemeContext';


export default function SensorDailyAvgChart({ data = [], title }) {
    const tc = useThemeClasses();
    const { theme } = useTheme();
    const colors = {
        [THEMES.dark]: { temp: '#818cf8', hum: '#34d399', grid: '#334155', text: '#94a3b8' },
        [THEMES.enterprise]: { temp: '#3182ce', hum: '#38a169', grid: '#bee3f8', text: '#718096' },
        [THEMES.graphite]: { temp: '#374151', hum: '#059669', grid: '#e4e4e7', text: '#9ca3af' },
    }[theme];   

    const formatted = data.map(r => ({
        date: new Date(r._id).toLocaleDateString(),
        'Avg Temp °C': r.avgTemp.toFixed(1),
        'Avg Humidity %': r.avgHumidity.toFixed(1),
  }))


  return (
    <div className={`${tc.card} p-5`}>
      <p className={`text-sm font-medium mb-4 ${tc.accent}`}>{title}</p>
        <ResponsiveContainer width="100%" height={300}>         
      <BarChart
        width={500}
        height={300}
        data={formatted}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="date" stroke={colors.text} />
        <YAxis stroke={colors.text} />
        <Tooltip
          contentStyle={{
              background: theme === THEMES.dark ? '#1e293b' : '#fff',
              border: `1px solid ${colors.grid}`,
              borderRadius: 8,
              fontSize: 12,
            }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: colors.text }} />      
        <Bar type='monotone' dataKey="Avg Temp °C" fill={colors.temp} />
        <Bar type='monotone' dataKey="Avg Humidity %" fill={colors.hum} />

      </BarChart>
        </ResponsiveContainer>
    </div>
  ) 
}