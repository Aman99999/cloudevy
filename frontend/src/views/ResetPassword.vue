<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-6 sm:space-y-8">
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <Logo size="md" :icon-only="false" />
        </div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white mb-2">
          Reset Password
        </h2>
        <p class="text-sm sm:text-base text-gray-400">
          Enter your new password below
        </p>
      </div>
      
      <form class="mt-6 sm:mt-8 space-y-4 sm:space-y-6" @submit.prevent="handleResetPassword">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-1">New Password</label>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="8"
              class="appearance-none relative block w-full px-4 py-3 pr-12 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
            >
              <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
              </svg>
            </button>
          </div>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            class="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
            placeholder="Confirm your password"
          />
        </div>

        <div v-if="password && confirmPassword && password !== confirmPassword" class="text-red-400 text-sm">
          Passwords do not match
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2">
          {{ error }}
        </div>

        <div v-if="success" class="text-green-400 text-sm text-center bg-green-500/10 border border-green-500/20 rounded-lg py-2">
          {{ success }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Resetting...
            </span>
            <span v-else>Reset Password</span>
          </button>
        </div>
      </form>

      <div class="text-center">
        <p class="text-xs sm:text-sm text-gray-400">
          Remember your password? 
          <router-link to="/login" class="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign in
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Logo from '@/components/Logo.vue'
import apiClient from '@/api/client'

const router = useRouter()
const route = useRoute()

const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const showPassword = ref(false)

const token = computed(() => route.query.token)

const isFormValid = computed(() => {
  return password.value.length >= 8 && 
         confirmPassword.value.length >= 8 && 
         password.value === confirmPassword.value &&
         token.value
})

const handleResetPassword = async () => {
  if (!isFormValid.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const response = await apiClient.post('/auth/reset-password', {
      token: token.value,
      password: password.value
    })
    
    if (response.data.success) {
      success.value = response.data.message || 'Password has been reset successfully. Redirecting to login...'
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      error.value = response.data.message || 'Failed to reset password'
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to reset password. The link may have expired.'
    
    // If token is invalid, redirect to forgot password after 3 seconds
    if (err.response?.status === 400) {
      setTimeout(() => {
        router.push('/forgot-password')
      }, 3000)
    }
  } finally {
    loading.value = false
  }
}

// Check if token exists on mount
if (!token.value) {
  error.value = 'Invalid reset link. Please request a new password reset.'
}
</script>

