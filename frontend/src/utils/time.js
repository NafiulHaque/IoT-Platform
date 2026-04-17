const TZ = 'Asia/Dhaka'

// "11 Apr 2026, 10:30:45"
export const formatDateTime = (utcStr) => {
  if (!utcStr) return '—'
  return new Date(utcStr).toLocaleString('en-BD', {
    timeZone: TZ,
    year:     'numeric',
    month:    'short',
    day:      'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
    second:   '2-digit',
    hour12:   false,
  })
}

// "10:30:45"
export const formatTime = (utcStr) => {
  if (!utcStr) return '—'
  return new Date(utcStr).toLocaleTimeString('en-BD', {
    timeZone: TZ,
    hour:     '2-digit',
    minute:   '2-digit',
    second:   '2-digit',
    hour12:   false,
  })
}

// "11 Apr 2026"
export const formatDate = (utcStr) => {
  if (!utcStr) return '—'
  return new Date(utcStr).toLocaleDateString('en-BD', {
    timeZone: TZ,
    year:     'numeric',
    month:    'short',
    day:      'numeric',
  })
}

// "2 minutes ago" style relative time
export const timeAgo = (utcStr) => {
  if (!utcStr) return 'Never'
  const diffMs  = Date.now() - new Date(utcStr).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec <  60)  return `${diffSec}s ago`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400)return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

// Chart X-axis label — "10:30"
export const formatChartTime = (utcStr) => {
  if (!utcStr) return ''
  return new Date(utcStr).toLocaleTimeString('en-BD', {
    timeZone: TZ,
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  })
}

// chart X-axis label for daily avg — "11 Apr"
export const formatChartDate = (utcStr) => {
  if (!utcStr) return ''
  return new Date(utcStr).toLocaleDateString('en-BD', {
    timeZone: TZ,
    year:     'numeric',
    month:    'short',
    day:      'numeric',
  })
}
