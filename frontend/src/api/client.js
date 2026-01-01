import axios from 'axios'

// Auto-detect environment and use appropriate API URL
const getApiBaseUrl = () => {
  // 1. Use environment variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // 2. Auto-detect based on current hostname
  const hostname = window.location.hostname
  
  if (hostname === 'cloudevy.in' || hostname === 'www.cloudevy.in') {
    // Production
    return 'https://cloudevy.in/api'
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Local development
    return 'http://localhost:8002/api'
  } else {
    // Default to localhost for any other hostname
    return 'http://localhost:8002/api'
  }
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

