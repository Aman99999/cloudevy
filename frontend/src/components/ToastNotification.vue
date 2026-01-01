<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[70] space-y-3 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto w-96 max-w-full bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-xl border shadow-2xl overflow-hidden backdrop-blur-xl"
          :class="getToastClasses(toast.type).border"
        >
          <!-- Animated background -->
          <div 
            class="absolute inset-0 opacity-10"
            :class="getToastClasses(toast.type).gradient"
          ></div>
          
          <!-- Progress bar -->
          <div 
            v-if="toast.duration"
            class="absolute top-0 left-0 h-1 transition-all ease-linear"
            :class="getToastClasses(toast.type).progress"
            :style="{ width: toast.progress + '%' }"
          ></div>

          <div class="relative p-4 flex items-start space-x-3">
            <!-- Icon -->
            <div 
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="getToastClasses(toast.type).iconBg"
            >
              <component 
                :is="getIcon(toast.type)" 
                class="w-5 h-5" 
                :class="getToastClasses(toast.type).iconColor" 
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h4 
                v-if="toast.title" 
                class="text-sm font-semibold text-white mb-1"
              >
                {{ toast.title }}
              </h4>
              <p class="text-sm text-gray-300 break-words">
                {{ toast.message }}
              </p>
            </div>

            <!-- Close button -->
            <button
              @click="removeToast(toast.id)"
              class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

const getToastClasses = (type) => {
  const classes = {
    success: {
      gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      progress: 'bg-green-500'
    },
    error: {
      gradient: 'bg-gradient-to-br from-red-500/20 to-pink-500/20',
      border: 'border-red-500/30',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      progress: 'bg-red-500'
    },
    warning: {
      gradient: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
      border: 'border-yellow-500/30',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      progress: 'bg-yellow-500'
    },
    info: {
      gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      progress: 'bg-blue-500'
    }
  }
  return classes[type] || classes.info
}

const getIcon = (type) => {
  const icons = {
    success: SuccessIcon,
    error: ErrorIcon,
    warning: WarningIcon,
    info: InfoIcon
  }
  return icons[type] || InfoIcon
}

const addToast = (options) => {
  const id = toastId++
  const toast = {
    id,
    type: options.type || 'info',
    title: options.title || '',
    message: options.message,
    duration: options.duration === undefined ? 5000 : options.duration,
    progress: 100
  }

  toasts.value.push(toast)

  // Auto-dismiss
  if (toast.duration > 0) {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      toast.progress = Math.max(0, 100 - (elapsed / toast.duration) * 100)
      
      if (elapsed >= toast.duration) {
        clearInterval(interval)
        removeToast(id)
      }
    }, 50)
  }

  return id
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

// Expose methods for external use
defineExpose({
  addToast,
  removeToast,
  success: (message, title) => addToast({ type: 'success', message, title }),
  error: (message, title) => addToast({ type: 'error', message, title }),
  warning: (message, title) => addToast({ type: 'warning', message, title }),
  info: (message, title) => addToast({ type: 'info', message, title })
})

// Icon Components
const SuccessIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
  `
}

const ErrorIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `
}

const WarningIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  `
}

const InfoIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `
}
</script>

<style scoped>
/* Toast transitions */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>

