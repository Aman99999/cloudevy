import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value)
  
  const hasRole = (role) => {
    if (!user.value) return false
    
    const hierarchy = {
      super_admin: 3,
      admin: 2,
      viewer: 1
    }
    
    return hierarchy[user.value.role] >= hierarchy[role]
  }

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password
      })
      
      token.value = response.data.token
      user.value = response.data.user
      
      localStorage.setItem('token', token.value)
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      }
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get('/auth/me')
      user.value = response.data.user
    } catch (error) {
      logout()
    }
  }

  // Auto-fetch user if token exists
  if (token.value && !user.value) {
    fetchCurrentUser()
  }

  return {
    user,
    token,
    isAuthenticated,
    hasRole,
    login,
    logout,
    fetchCurrentUser
  }
})

