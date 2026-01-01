import { ref } from 'vue'

// Global state for the confirm dialog
export const confirmState = ref({
  isOpen: false,
  title: '',
  message: '',
  variant: 'warning',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  requireInput: false,
  inputLabel: '',
  inputPlaceholder: '',
  expectedInput: '',
  onConfirm: null,
  onCancel: null
})

export const useConfirm = () => {
  return {
    // Show a simple confirmation dialog
    confirm: (options) => {
      return new Promise((resolve) => {
        confirmState.value = {
          isOpen: true,
          title: options.title || 'Confirm Action',
          message: options.message || '',
          variant: options.variant || 'warning',
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          requireInput: false,
          inputLabel: '',
          inputPlaceholder: '',
          expectedInput: '',
          onConfirm: () => {
            confirmState.value.isOpen = false
            resolve(true)
          },
          onCancel: () => {
            confirmState.value.isOpen = false
            resolve(false)
          }
        }
      })
    },

    // Show a confirmation dialog with required input
    confirmWithInput: (options) => {
      return new Promise((resolve) => {
        confirmState.value = {
          isOpen: true,
          title: options.title || 'Confirm Action',
          message: options.message || '',
          variant: options.variant || 'danger',
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          requireInput: true,
          inputLabel: options.inputLabel || 'Please confirm by typing below:',
          inputPlaceholder: options.inputPlaceholder || '',
          expectedInput: options.expectedInput || '',
          onConfirm: () => {
            confirmState.value.isOpen = false
            resolve(true)
          },
          onCancel: () => {
            confirmState.value.isOpen = false
            resolve(false)
          }
        }
      })
    },

    // Close the dialog
    close: () => {
      confirmState.value.isOpen = false
    }
  }
}

