const BD_OFFSET_MS = 6 * 60 * 60 * 1000  // UTC+6 in milliseconds

// Convert a UTC Date to Bangladesh time Date object
const toBDTime = (utcDate) =>
  new Date(new Date(utcDate).getTime() + BD_OFFSET_MS)

// Format a UTC date as a readable BD time string
const formatBD = (utcDate) => {
  if (!utcDate) return 'Never'
  return new Date(utcDate).toLocaleString('en-BD', {
    timeZone:     'Asia/Dhaka',
    year:         'numeric',
    month:        '2-digit',
    day:          '2-digit',
    hour:         '2-digit',
    minute:       '2-digit',
    second:       '2-digit',
    hour12:       false,
  })
}

// Return current time as a BD-formatted string (for logging)
const nowBD = () => formatBD(new Date())

module.exports = { toBDTime, formatBD, nowBD }