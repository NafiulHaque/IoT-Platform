import axios from 'axios'

const api = axios.create({
  baseURL:   import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 15000, 
})

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {

// Block requests where URL ends with "/" — missing route param
  if (config.url && config.url.endsWith('/')) {
    const err = new Error(`Blocked API call with empty param: ${config.url}`)
    err.blocked = true
    return Promise.reject(err)
  }

  const token = sessionStorage.getItem('iot-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.blocked) return Promise.reject(err) 
    if (err.response?.status === 401) {
      sessionStorage.removeItem('iot-token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api