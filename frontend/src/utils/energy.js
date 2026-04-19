export const fmtPower   = v => v == null ? '—' : v >= 1000 ? (v/1000).toFixed(2)+' kW' : v.toFixed(1)+' W'
export const fmtEnergy  = v => v == null ? '—' : Number(v).toFixed(3)+' kWh'
export const fmtVoltage = v => v == null ? '—' : Number(v).toFixed(1)+' V'
export const fmtCurrent = v => v == null ? '—' : Number(v).toFixed(2)+' A'
export const fmtPF      = v => v == null ? '—' : Number(v).toFixed(2)
export const fmtFreq    = v => v == null ? '—' : Number(v).toFixed(2)+' Hz'

export const pfStatus = v => {
  if (v == null) return { label: '—',        cssVar: 'var(--color-pf)' }
  if (v >= 0.95) return { label: 'Excellent', cssVar: 'var(--color-energy)' }
  if (v >= 0.90) return { label: 'Good',      cssVar: 'var(--color-energy)' }
  if (v >= 0.80) return { label: 'Fair',      cssVar: 'var(--color-power)'  }
  return               { label: 'Poor',       cssVar: '#f87171'              }
}

export const voltageStatus = v => {
  if (v == null) return { label: '—',        ok: true  }
  const dev = Math.abs(v - 230)
  if (dev <= 5)  return { label: 'Nominal',  ok: true  }
  if (dev <= 15) return { label: 'Low',      ok: false }
  return               { label: 'Critical', ok: false }
}

export const heatIntensityColor = (intensity, heatmapColors) => {
  const idx = Math.min(4, Math.floor(intensity * 5))
  return heatmapColors[idx]
}

// Add this if not already present
export const buildTooltip = (cc) => ({
  backgroundColor:  cc.tooltipBg,
  borderColor:      cc.tooltipBorder,
  borderWidth:      1,
  titleColor:       cc.tick,
  bodyColor:        cc.tick,
  padding:          8,
  cornerRadius:     6,
  displayColors:    false,
})