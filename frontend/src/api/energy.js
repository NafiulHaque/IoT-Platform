import api from './axios'

// Helper — throws before hitting network if id is missing
function requireId(id, fnName) {
  if (!id || String(id).trim() === '') {
    throw new Error(`${fnName}: device_id is required but got "${id}"`)
  }
}

export const getLatestReading = (device_id) => {
  requireId(device_id, 'getLatestReading')
  return api.get(`/readings/${device_id}/latest`).then(r => r.data)
}

export const getHistory = (device_id, limit = 30) => {
  requireId(device_id, 'getHistory')
  return api.get(`/readings/${device_id}?limit=${limit}`).then(r => r.data)
}

export const getHeatmap = (device_id) => {
  requireId(device_id, 'getHeatmap')
  return api.get(`/analytics/${device_id}/heatmap`).then(r => r.data)
}

export const getDaily = (device_id, days = 7) => {
  requireId(device_id, 'getDaily')
  return api.get(`/analytics/${device_id}/daily?days=${days}`).then(r => r.data)
}

export const getUptime = (device_id) => {
  requireId(device_id, 'getUptime')
  return api.get(`/analytics/${device_id}/uptime`).then(r => r.data)
}

export const getSummary = (device_id) => {
  requireId(device_id, 'getSummary')
  return api.get(`/analytics/${device_id}/summary`).then(r => r.data)
}