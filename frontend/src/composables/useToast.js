import { ref, createApp, h } from 'vue'
import ToastNotification from '@/components/ToastNotification.vue'

// Create a single toast container instance
let toastInstance = null

const getToastInstance = () => {
  if (!toastInstance) {
    const container = document.createElement('div')
    document.body.appendChild(container)
    
    const app = createApp({
      render() {
        return h(ToastNotification, { ref: 'toast' })
      }
    })
    
    const vm = app.mount(container)
    toastInstance = vm.$refs.toast
  }
  return toastInstance
}

export const useToast = () => {
  const toast = getToastInstance()

  return {
    success: (message, title = 'Success') => {
      toast.success(message, title)
    },
    error: (message, title = 'Error') => {
      toast.error(message, title)
    },
    warning: (message, title = 'Warning') => {
      toast.warning(message, title)
    },
    info: (message, title = 'Info') => {
      toast.info(message, title)
    },
    // Custom toast with full options
    show: (options) => {
      toast.addToast(options)
    }
  }
}

