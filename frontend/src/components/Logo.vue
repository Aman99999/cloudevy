<template>
  <div class="flex items-center space-x-2 sm:space-x-3">
    <img 
      :src="iconOnly ? logoIcon : logo" 
      :alt="alt"
      :class="sizeClass"
      class="transform transition-transform duration-300 hover:scale-110"
    />
    <span 
      v-if="showText" 
      :class="textSizeClass"
      class="font-bold"
    >
      <span class="text-white">Cloud</span><span class="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">Evy</span>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import logo from '@/assets/logo.svg'
import logoIcon from '@/assets/logo-icon.svg'

const props = defineProps({
  size: {
    type: String,
    default: 'md', // xs, sm, md, lg, xl
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  iconOnly: {
    type: Boolean,
    default: false
  },
  showText: {
    type: Boolean,
    default: true
  },
  text: {
    type: String,
    default: 'CloudEvy'
  },
  alt: {
    type: String,
    default: 'CloudEvy Logo'
  }
})

const sizeClass = computed(() => {
  const sizes = {
    xs: 'w-14 h-14 sm:w-16 sm:h-16',
    sm: 'w-16 h-16 sm:w-20 sm:h-20',
    md: 'w-20 h-20 sm:w-24 sm:h-24',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    xl: 'w-28 h-28 sm:w-32 sm:h-32'
  }
  return sizes[props.size]
})

const textSizeClass = computed(() => {
  const sizes = {
    xs: 'text-base sm:text-lg',
    sm: 'text-lg sm:text-xl',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl'
  }
  return sizes[props.size]
})
</script>

