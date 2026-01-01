<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div class="relative w-full max-w-md bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden backdrop-blur-xl">
          <!-- Animated background -->
          <div 
            class="absolute inset-0 bg-gradient-to-br opacity-10"
            :class="variantClasses.gradient"
          ></div>
          
          <!-- Icon Header -->
          <div class="relative p-6 border-b border-gray-700/50">
            <div class="flex items-start space-x-4">
              <div 
                class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                :class="variantClasses.iconBg"
              >
                <component :is="iconComponent" class="w-6 h-6" :class="variantClasses.iconColor" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-white mb-1">{{ title }}</h3>
                <p class="text-gray-300 text-sm" v-if="message">{{ message }}</p>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="relative p-6">
            <div class="space-y-4">
              <!-- Custom slot for additional content -->
              <slot></slot>

              <!-- Input field for confirmation (e.g., type server name) -->
              <div v-if="requireInput">
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  {{ inputLabel }}
                </label>
                <input
                  v-model="inputValue"
                  type="text"
                  :placeholder="inputPlaceholder"
                  class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  @keyup.enter="handleConfirm"
                  @keyup.esc="handleCancel"
                  ref="inputRef"
                />
                <p v-if="inputError" class="text-red-400 text-xs mt-2">{{ inputError }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="relative p-6 border-t border-gray-700/50 bg-gray-900/30 flex justify-end space-x-3">
            <button
              @click="handleCancel"
              class="px-5 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-medium transition-all"
            >
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              :disabled="requireInput && !isInputValid"
              class="px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              :class="variantClasses.button"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'warning', // 'warning', 'danger', 'info', 'success'
    validator: (value) => ['warning', 'danger', 'info', 'success'].includes(value)
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  requireInput: {
    type: Boolean,
    default: false
  },
  inputLabel: {
    type: String,
    default: 'Please confirm by typing below:'
  },
  inputPlaceholder: {
    type: String,
    default: ''
  },
  expectedInput: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const inputValue = ref('')
const inputError = ref('')
const inputRef = ref(null)

const isInputValid = computed(() => {
  if (!props.requireInput) return true
  if (!props.expectedInput) return inputValue.value.trim().length > 0
  return inputValue.value.trim() === props.expectedInput.trim()
})

const variantClasses = computed(() => {
  const variants = {
    warning: {
      gradient: 'from-yellow-500/20 to-orange-500/20',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      button: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
    },
    danger: {
      gradient: 'from-red-500/20 to-pink-500/20',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      button: 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
    },
    info: {
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      button: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
    },
    success: {
      gradient: 'from-green-500/20 to-emerald-500/20',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      button: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
    }
  }
  return variants[props.variant]
})

const iconComponent = computed(() => {
  const icons = {
    warning: WarningIcon,
    danger: DangerIcon,
    info: InfoIcon,
    success: SuccessIcon
  }
  return icons[props.variant]
})

const handleConfirm = () => {
  if (props.requireInput && !isInputValid.value) {
    inputError.value = props.expectedInput 
      ? `Please type "${props.expectedInput}" to confirm`
      : 'This field is required'
    return
  }
  emit('confirm')
  resetAndClose()
}

const handleCancel = () => {
  emit('cancel')
  resetAndClose()
}

const resetAndClose = () => {
  inputValue.value = ''
  inputError.value = ''
  emit('close')
}

// Auto-focus input when modal opens
watch(() => props.isOpen, async (newVal) => {
  if (newVal && props.requireInput) {
    await nextTick()
    inputRef.value?.focus()
  }
  if (!newVal) {
    inputValue.value = ''
    inputError.value = ''
  }
})

// Icon Components
const WarningIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  `
}

const DangerIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const SuccessIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `
}
</script>

<style scoped>
/* Modal backdrop transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Modal content transition */
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}
</style>

