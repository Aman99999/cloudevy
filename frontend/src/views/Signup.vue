<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-lg w-full">
      <!-- Logo and Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <Logo size="md" :icon-only="false" />
        </div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white mb-2">
          Create your workspace
        </h2>
        <p class="text-sm sm:text-base text-gray-400">
          Step {{ currentStep }} of {{ totalSteps }}
        </p>
      </div>

      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex justify-between mb-2">
          <span class="text-xs text-gray-500">{{ Math.round((currentStep / totalSteps) * 100) }}% Complete</span>
        </div>
        <div class="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Form Container -->
      <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <form @submit.prevent="handleNext">
          <!-- Step 1: Workspace Name -->
          <div v-if="currentStep === 1" class="step-container">
            <div class="step-content">
              <div class="mb-6">
                <h3 class="text-xl sm:text-2xl font-bold text-white mb-2">
                  What's your workspace name?
                </h3>
                <p class="text-sm text-gray-400">
                  This will be your organization's identity
                </p>
              </div>
              
              <div>
                <label for="workspace" class="block text-sm font-medium text-gray-300 mb-2">
                  Workspace Name <span class="text-red-400">*</span>
                </label>
                <input
                  id="workspace"
                  ref="workspaceInput"
                  v-model="form.workspaceName"
                  type="text"
                  required
                  placeholder="e.g., Acme Corp"
                  class="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition"
                  @keyup.enter="handleNext"
                />
                <p class="text-xs text-gray-500 mt-2">
                  💡 Choose a name that represents your team or company
                </p>
              </div>
            </div>
          </div>

          <!-- Step 2: Full Name -->
          <div v-if="currentStep === 2" class="step-container">
            <div class="step-content">
              <div class="mb-6">
                <h3 class="text-xl sm:text-2xl font-bold text-white mb-2">
                  What's your name?
                </h3>
                <p class="text-sm text-gray-400">
                  Let us know who you are
                </p>
              </div>
              
              <div>
                <label for="fullname" class="block text-sm font-medium text-gray-300 mb-2">
                  Full Name <span class="text-red-400">*</span>
                </label>
                <input
                  id="fullname"
                  ref="fullNameInput"
                  v-model="form.fullName"
                  type="text"
                  required
                  placeholder="e.g., John Doe"
                  class="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition"
                  @keyup.enter="handleNext"
                />
              </div>
            </div>
          </div>

          <!-- Step 3: Email -->
          <div v-if="currentStep === 3" class="step-container">
            <div class="step-content">
              <div class="mb-6">
                <h3 class="text-xl sm:text-2xl font-bold text-white mb-2">
                  What's your email?
                </h3>
                <p class="text-sm text-gray-400">
                  We'll use this to keep you updated
                </p>
              </div>
              
              <div>
                <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
                  Work Email <span class="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  ref="emailInput"
                  v-model="form.email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  class="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition"
                  @keyup.enter="handleNext"
                />
              </div>
            </div>
          </div>

          <!-- Step 4: Password -->
          <div v-if="currentStep === 4" class="step-container">
            <div class="step-content">
              <div class="mb-6">
                <h3 class="text-xl sm:text-2xl font-bold text-white mb-2">
                  Create a password
                </h3>
                <p class="text-sm text-gray-400">
                  Make it strong and secure
                </p>
              </div>
              
              <div>
                <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
                  Password <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input
                    id="password"
                    ref="passwordInput"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    placeholder="Minimum 8 characters"
                    class="appearance-none relative block w-full px-4 py-3 pr-12 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition"
                    @input="checkPasswordStrength"
                    @keyup.enter="handleNext"
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
                
                <!-- Password Strength Indicator -->
                <div v-if="form.password.length > 0" class="mt-3">
                  <div class="flex items-center gap-2 mb-1">
                    <div class="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        class="h-full transition-all duration-300"
                        :class="passwordStrengthColor"
                        :style="{ width: passwordStrengthWidth }"
                      ></div>
                    </div>
                    <span class="text-xs font-medium" :class="passwordStrengthTextColor">
                      {{ passwordStrengthText }}
                    </span>
                  </div>
                  <p v-if="passwordStrength < 3" class="text-xs text-gray-500">
                    Use 8+ characters with a mix of letters, numbers & symbols
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 5: Terms & Review -->
          <div v-if="currentStep === 5" class="step-container">
            <div class="step-content">
              <div class="mb-6">
                <h3 class="text-xl sm:text-2xl font-bold text-white mb-2">
                  Almost there!
                </h3>
                <p class="text-sm text-gray-400">
                  Review and accept our terms
                </p>
              </div>
              
              <!-- Summary -->
              <div class="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-400">Workspace</span>
                  <span class="text-sm text-white font-medium">{{ form.workspaceName }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-400">Name</span>
                  <span class="text-sm text-white font-medium">{{ form.fullName }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-400">Email</span>
                  <span class="text-sm text-white font-medium">{{ form.email }}</span>
                </div>
              </div>

              <!-- Terms -->
              <div class="flex items-start mb-4">
                <input
                  id="terms"
                  v-model="form.acceptTerms"
                  type="checkbox"
                  required
                  class="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
                <label for="terms" class="ml-2 text-xs sm:text-sm text-gray-400">
                  I agree to the 
                  <a href="#" class="text-indigo-400 hover:text-indigo-300">Terms of Service</a> 
                  and 
                  <a href="#" class="text-indigo-400 hover:text-indigo-300">Privacy Policy</a>
                </label>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="mb-4 text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">
            {{ error }}
          </div>

          <!-- Success Message -->
          <div v-if="success" class="mb-4 text-green-400 text-sm text-center bg-green-500/10 border border-green-500/20 rounded-lg py-2 px-3">
            {{ success }}
          </div>

          <!-- Navigation Buttons -->
          <div class="flex gap-3 mt-6">
            <button
              v-if="currentStep > 1"
              type="button"
              @click="handleBack"
              class="flex-1 py-3 px-4 border border-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-600 transition"
            >
              Back
            </button>
            
            <button
              v-if="currentStep < totalSteps"
              type="submit"
              :disabled="!canProceed"
              class="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
              <svg class="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <button
              v-if="currentStep === totalSteps"
              type="button"
              @click="handleSignup"
              :disabled="loading || !canProceed"
              class="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span v-if="loading" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
              <span v-else>
                Create Workspace
                <svg class="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </span>
            </button>
          </div>
        </form>

        <!-- Sign In Link -->
        <div class="text-center mt-6 pt-6 border-t border-gray-700">
          <p class="text-xs sm:text-sm text-gray-400">
            Already have an account? 
            <router-link to="/login" class="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Logo from '@/components/Logo.vue'
import apiClient from '@/api/client'

const router = useRouter()
const authStore = useAuthStore()

const currentStep = ref(1)
const totalSteps = 5

const form = ref({
  workspaceName: '',
  fullName: '',
  email: '',
  password: '',
  acceptTerms: false
})

const loading = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)
const passwordStrength = ref(0)

// Refs for auto-focus
const workspaceInput = ref(null)
const fullNameInput = ref(null)
const emailInput = ref(null)
const passwordInput = ref(null)

// Auto-focus input when step changes
watch(currentStep, async (newStep) => {
  await nextTick()
  
  if (newStep === 1 && workspaceInput.value) {
    workspaceInput.value.focus()
  } else if (newStep === 2 && fullNameInput.value) {
    fullNameInput.value.focus()
  } else if (newStep === 3 && emailInput.value) {
    emailInput.value.focus()
  } else if (newStep === 4 && passwordInput.value) {
    passwordInput.value.focus()
  }
}, { immediate: true })

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return form.value.workspaceName.trim().length >= 2
    case 2:
      return form.value.fullName.trim().length >= 2
    case 3:
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)
    case 4:
      return form.value.password.length >= 8
    case 5:
      return form.value.acceptTerms
    default:
      return false
  }
})

const checkPasswordStrength = () => {
  const password = form.value.password
  let strength = 0
  
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  
  passwordStrength.value = Math.min(strength, 4)
}

const passwordStrengthWidth = computed(() => {
  return `${(passwordStrength.value / 4) * 100}%`
})

const passwordStrengthColor = computed(() => {
  if (passwordStrength.value <= 1) return 'bg-red-500'
  if (passwordStrength.value === 2) return 'bg-yellow-500'
  if (passwordStrength.value === 3) return 'bg-blue-500'
  return 'bg-green-500'
})

const passwordStrengthTextColor = computed(() => {
  if (passwordStrength.value <= 1) return 'text-red-400'
  if (passwordStrength.value === 2) return 'text-yellow-400'
  if (passwordStrength.value === 3) return 'text-blue-400'
  return 'text-green-400'
})

const passwordStrengthText = computed(() => {
  if (passwordStrength.value <= 1) return 'Weak'
  if (passwordStrength.value === 2) return 'Fair'
  if (passwordStrength.value === 3) return 'Good'
  return 'Strong'
})

const handleNext = () => {
  if (!canProceed.value) return
  
  error.value = ''
  currentStep.value++
}

const handleBack = () => {
  error.value = ''
  currentStep.value--
}

const handleSignup = async () => {
  if (!canProceed.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const response = await apiClient.post('/auth/signup', {
      workspaceName: form.value.workspaceName.trim(),
      fullName: form.value.fullName.trim(),
      email: form.value.email.trim().toLowerCase(),
      password: form.value.password
    })
    
    success.value = 'Workspace created successfully! Redirecting...'
    
    // Auto-login after signup
    if (response.data.data.token) {
      // Store token and user data
      localStorage.setItem('token', response.data.data.token)
      authStore.token = response.data.data.token
      authStore.user = {
        ...response.data.data.user,
        workspace: response.data.data.workspace
      }
      
      // Redirect to workspace dashboard with slug
      const slug = response.data.data.workspace.slug
      setTimeout(() => {
        router.push(`/${slug}`)
      }, 1500)
    } else {
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    }
    
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create workspace. Please try again.'
    console.error('Signup error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Step transition animation */
.step-container {
  animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Smooth transitions */
input, button, select, textarea {
  transition: all 0.2s ease;
}

/* Input focus effect */
input:focus {
  transform: scale(1.01);
}
</style>
