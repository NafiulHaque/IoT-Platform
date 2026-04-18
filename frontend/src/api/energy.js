import api from './axios'

export const getLatestReading = (device_id) =>
  api.get(`/readings/${device_id}/latest`).then(r => r.data)

export const getHistory = (device_id, limit = 30) =>
  api.get(`/readings/${device_id}?limit=${limit}`).then(r => r.data)

export const getHeatmap = (device_id) =>
  api.get(`/analytics/${device_id}/heatmap`).then(r => r.data)

export const getDaily = (device_id, days = 7) =>
  api.get(`/analytics/${device_id}/daily?days=${days}`).then(r => r.data)

export const getUptime = (device_id, hours = 24) =>
  api.get(`/analytics/${device_id}/uptime?hours=${hours}`).then(r => r.data)

export const getSummary = (device_id) =>
  api.get(`/analytics/${device_id}/summary`).then(r => r.data)