<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-6 sm:space-y-8">
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <Logo size="md" :icon-only="false" />
        </div>
        <p class="text-sm sm:text-base text-gray-400">
          Visual Infrastructure Control Platform
        </p>
      </div>
      
      <form class="mt-6 sm:mt-8 space-y-4 sm:space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
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
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Enter password"
            />
          </div>
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
          >
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>
      </form>

      <div class="text-center">
        <p class="text-xs sm:text-sm text-gray-400">
          Don't have an account? 
          <router-link to="/signup" class="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign up for free
          </router-link>
        </p>
      </div>

      <div class="text-xs sm:text-sm text-gray-400 text-center space-y-2 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <p class="font-semibold text-gray-300">💡 Tip:</p>
        <p>Create a new account to get started, or use test credentials if you have them.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Logo from '@/components/Logo.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const result = await authStore.login(email.value, password.value)
    
    if (result.success) {
      // Wait a moment for user data to be set in store
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirect to workspace dashboard with slug in URL
      const slug = result.workspaceSlug || authStore.user?.workspace?.slug
      
      if (slug) {
        router.push(`/${slug}`)
      } else {
        // If still no slug, fetch user data
        await authStore.fetchCurrentUser()
        const finalSlug = authStore.user?.workspace?.slug
        if (finalSlug) {
          router.push(`/${finalSlug}`)
        } else {
          error.value = 'Failed to load workspace information'
        }
      }
    } else {
      error.value = result.message || 'Login failed'
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

