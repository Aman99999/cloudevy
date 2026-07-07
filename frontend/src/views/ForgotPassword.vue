<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-6 sm:space-y-8">
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <Logo size="md" :icon-only="false" />
        </div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white mb-2">
          Forgot Password?
        </h2>
        <p class="text-sm sm:text-base text-gray-400">
          No worries! Enter your email and we'll send you a reset link.
        </p>
      </div>
      
      <form class="mt-6 sm:mt-8 space-y-4 sm:space-y-6" @submit.prevent="handleForgotPassword">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
            placeholder="you@company.com"
          />
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
            :disabled="loading"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
            <span v-else>Send Reset Link</span>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '@/components/Logo.vue'
import apiClient from '@/api/client'

const router = useRouter()

const email = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const handleForgotPassword = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const response = await apiClient.post('/auth/forgot-password', {
      email: email.value.toLowerCase()
    })
    
    if (response.data.success) {
      success.value = response.data.message || 'If an account with that email exists, a password reset link has been sent.'
      email.value = ''
    } else {
      error.value = response.data.message || 'Failed to send reset link'
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to send reset link. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

