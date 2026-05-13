import axios from 'axios'

// Auto-detect environment and use appropriate API URL
const getApiBaseUrl = () => {
  // 1. Use environment variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  const hostname = window.location.hostname

  // 2. Local dev — Vite serves the SPA, backend runs separately on 8002.
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8002/api'
  }

  // 3. Anywhere else (prod, preview, cloudevy.in, www.cloudevy.in, *.fly.dev) —
  //    the frontend's nginx proxies /api to the backend over Fly's private
  //    network, so a same-origin relative URL is correct and avoids CORS.
  return '/api'
}

const API_BASE_URL = getApiBaseUrl()

console.log('🌐 API Base URL:', API_BASE_URL)

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout for all requests
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient

