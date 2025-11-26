<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Navigation -->
    <nav class="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700">
      <div class="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
        <div class="flex justify-between h-16 sm:h-20">
          <div class="flex items-center">
            <Logo size="xs" :show-text="true" />
            <div class="ml-6 hidden md:flex space-x-8">
              <router-link
                :to="`/${workspaceSlug}`"
                :class="[
                  'px-1 pb-4 text-sm font-medium transition',
                  $route.name === 'Dashboard' 
                    ? 'text-indigo-400 border-b-2 border-indigo-400' 
                    : 'text-gray-300 hover:text-white'
                ]"
              >
                Dashboard
              </router-link>
              <router-link
                :to="`/${workspaceSlug}/servers`"
                :class="[
                  'px-1 pb-4 text-sm font-medium transition',
                  $route.name === 'Servers' 
                    ? 'text-indigo-400 border-b-2 border-indigo-400' 
                    : 'text-gray-300 hover:text-white'
                ]"
              >
                Servers
              </router-link>
              <router-link
                :to="`/${workspaceSlug}/containers`"
                :class="[
                  'px-1 pb-4 text-sm font-medium transition',
                  $route.name === 'Containers' 
                    ? 'text-indigo-400 border-b-2 border-indigo-400' 
                    : 'text-gray-300 hover:text-white'
                ]"
              >
                Containers
              </router-link>
              <router-link
                :to="`/${workspaceSlug}/costs`"
                :class="[
                  'px-1 pb-4 text-sm font-medium transition',
                  $route.name === 'Costs' 
                    ? 'text-indigo-400 border-b-2 border-indigo-400' 
                    : 'text-gray-300 hover:text-white'
                ]"
              >
                Costs
              </router-link>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="hidden sm:block text-right">
              <p class="text-xs text-gray-400">{{ authStore.user?.workspace?.name }}</p>
              <p class="text-sm text-white font-medium">{{ authStore.user?.name }}</p>
            </div>
            <button
              @click="handleLogout"
              class="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-lg text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Page Content -->
    <router-view />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Logo from '@/components/Logo.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const workspaceSlug = computed(() => {
  return route.params.workspaceSlug || authStore.user?.workspace?.slug
})

// Ensure user data is loaded
onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchCurrentUser()
  }
  
  // If slug in URL doesn't match user's workspace, redirect
  const urlSlug = route.params.workspaceSlug
  const userSlug = authStore.user?.workspace?.slug
  
  if (urlSlug && userSlug && urlSlug !== userSlug) {
    console.log(`Redirecting: URL slug "${urlSlug}" doesn't match user slug "${userSlug}"`)
    router.replace(`/${userSlug}${route.path.split('/').slice(2).join('/') || ''}`)
  } else if (urlSlug === 'workspace' && userSlug) {
    // If someone visits /workspace, redirect to actual slug
    console.log(`Redirecting from /workspace to /${userSlug}`)
    router.replace(`/${userSlug}${route.path.split('/').slice(2).join('/') || ''}`)
  }
})

// Watch for route changes
watch(() => route.params.workspaceSlug, async (newSlug) => {
  if (newSlug === 'workspace') {
    // Fetch user if needed
    if (authStore.isAuthenticated && !authStore.user) {
      await authStore.fetchCurrentUser()
    }
    
    const userSlug = authStore.user?.workspace?.slug
    if (userSlug) {
      console.log(`Redirecting from /workspace to /${userSlug}`)
      router.replace(`/${userSlug}${route.path.split('/').slice(2).join('/') || ''}`)
    }
  }
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

