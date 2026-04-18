// Format energy readings cleanly
export const fmtPower = (w) => {
  if (w == null) return '—'
  return w >= 1000 ? (w / 1000).toFixed(2) + ' kW' : w.toFixed(1) + ' W'
}

export const fmtEnergy = (kwh) =>
  kwh == null ? '—' : Number(kwh).toFixed(3) + ' kWh'

export const fmtVoltage = (v) =>
  v == null ? '—' : Number(v).toFixed(1) + ' V'

export const fmtCurrent = (a) =>
  a == null ? '—' : Number(a).toFixed(2) + ' A'

export const fmtPF = (pf) =>
  pf == null ? '—' : Number(pf).toFixed(2)

export const fmtFreq = (hz) =>
  hz == null ? '—' : Number(hz).toFixed(2) + ' Hz'

// Power factor health label
export const pfLabel = (pf) => {
  if (pf == null) return { label: '—',        color: '#8b949e' }
  if (pf >= 0.95) return { label: 'Excellent', color: '#3fb950' }
  if (pf >= 0.90) return { label: 'Good',      color: '#3fb950' }
  if (pf >= 0.80) return { label: 'Fair',      color: '#ffa657' }
  return               { label: 'Poor',       color: '#f85149' }
}

// Voltage deviation from nominal
export const voltageStatus = (v) => {
  if (v == null) return { label: '—', color: '#8b949e' }
  const dev = Math.abs(v - 230)
  if (dev <= 5)  return { label: 'Nominal',  color: '#3fb950' }
  if (dev <= 15) return { label: 'Low',      color: '#ffa657' }
  return               { label: 'Critical', color: '#f85149' }
}

// Build heatmap color from 0–1 intensity
export const heatColor = (intensity) => {
  const stops = ['#0d1117','#0e4429','#006d32','#26a641','#39d353']
  const idx = Math.min(4, Math.floor(intensity * 5))
  return stops[idx]
}