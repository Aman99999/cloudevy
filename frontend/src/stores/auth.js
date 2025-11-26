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

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      })
      
      if (response.data.success) {
        token.value = response.data.token
        user.value = response.data.user
        
        localStorage.setItem('token', token.value)
        
        return { success: true }
      } else {
        return {
          success: false,
          message: response.data.message || 'Login failed'
        }
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get('/auth/me')
      if (response.data.success) {
        user.value = response.data.user
      } else {
        logout()
      }
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

