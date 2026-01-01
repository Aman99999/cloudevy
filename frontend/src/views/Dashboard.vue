<template>
  <div>
    <!-- Main Content -->
    <main class="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-12 xl:px-16">
      <!-- Welcome Section -->
      <div class="mb-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div class="flex-1">
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
              Welcome back, <span class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{{ authStore.user?.name?.split(' ')[0] }}</span>! 👋
            </h1>
            <p class="text-gray-400 text-base sm:text-lg">
              Here's what's happening in <span class="text-indigo-400 font-medium">{{ authStore.user?.workspace?.name }}</span> today
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <div class="hidden lg:flex items-center space-x-3 px-4 py-2 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span class="text-sm text-gray-300">All systems operational</span>
            </div>
            <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:scale-110 transition-transform cursor-pointer">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Trial Banner (if on trial) -->
      <div v-if="isTrial" class="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 backdrop-blur-sm">
        <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div class="relative p-6 lg:p-8">
          <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div class="flex items-center space-x-5">
              <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
                </svg>
              </div>
              <div>
                <p class="text-white font-bold text-xl mb-1">Free Trial Active</p>
                <p class="text-base text-gray-300">
                  <span class="font-semibold text-indigo-300">{{ trialDaysLeft }} days</span> remaining to explore all features
                </p>
              </div>
            </div>
            <button class="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-base font-semibold transition-all hover:scale-105 border border-white/20 whitespace-nowrap">
              Upgrade Now →
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <!-- Server Card -->
        <div class="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-300"></div>
          <div class="relative">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                </svg>
              </div>
              <div class="text-xs font-medium text-gray-500 uppercase tracking-wider">Servers</div>
            </div>
            <div class="text-3xl sm:text-4xl font-bold text-white mb-1">{{ stats.servers }}</div>
            <div class="text-sm text-gray-400">Active instances</div>
          </div>
        </div>

        <!-- Container Card -->
        <div class="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-300"></div>
          <div class="relative">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <div class="text-xs font-medium text-gray-500 uppercase tracking-wider">Containers</div>
            </div>
            <div class="text-3xl sm:text-4xl font-bold text-white mb-1">{{ stats.containers }}</div>
            <div class="text-sm text-gray-400">Running</div>
          </div>
        </div>

        <!-- Provider Card -->
        <div class="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-300"></div>
          <div class="relative">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
                </svg>
              </div>
              <div class="text-xs font-medium text-gray-500 uppercase tracking-wider">Providers</div>
            </div>
            <div class="text-3xl sm:text-4xl font-bold text-white mb-1">{{ stats.providers }}</div>
            <div class="text-sm text-gray-400">Connected</div>
          </div>
        </div>

        <!-- Cost Card -->
        <div class="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-300"></div>
          <div class="relative">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Cost</div>
            </div>
            <div class="text-3xl sm:text-4xl font-bold text-white mb-1">${{ stats.monthlyCost }}</div>
            <div class="text-sm text-gray-400">This month</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Recent Activity -->
      <div class="grid lg:grid-cols-3 gap-6 mb-8">
        <!-- Quick Actions -->
        <div class="lg:col-span-1 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">Quick Actions</h2>
            <div class="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
          </div>
          <div class="space-y-3">
            <button
              @click="showConnectModal = true"
              class="w-full group relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-between overflow-hidden"
            >
              <span class="relative z-10 flex items-center space-x-3">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Connect Cloud Account</span>
              </span>
              <svg class="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
              <div class="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            <button
              @click="handleAddServer"
              :disabled="stats.providers === 0"
              :class="[
                'w-full group bg-gray-700/50 hover:bg-gray-700 text-white px-5 py-4 rounded-xl font-medium transition-all hover:scale-[1.02] flex items-center justify-between border border-gray-600/50 hover:border-gray-500',
                stats.providers === 0 ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              <span class="flex items-center space-x-3">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Add Server</span>
              </span>
              <svg class="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
            <button class="w-full group bg-gray-700/50 hover:bg-gray-700 text-white px-5 py-4 rounded-xl font-medium transition-all hover:scale-[1.02] flex items-center justify-between border border-gray-600/50 hover:border-gray-500">
              <span class="flex items-center space-x-3">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                <span>View Documentation</span>
              </span>
              <svg class="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- System Health / Overview -->
        <div class="lg:col-span-1 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">System Health</h2>
            <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span class="text-sm text-gray-300">All Services</span>
              </div>
              <span class="text-sm font-semibold text-green-400">Operational</span>
            </div>
            <div class="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span class="text-sm text-gray-300">API Status</span>
              </div>
              <span class="text-sm font-semibold text-blue-400">Healthy</span>
            </div>
            <div class="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-purple-400 rounded-full"></div>
                <span class="text-sm text-gray-300">Database</span>
              </div>
              <span class="text-sm font-semibold text-purple-400">Connected</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="lg:col-span-1 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">Recent Activity</h2>
            <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div v-if="recentActivity.length === 0" class="text-center py-12">
            <div class="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <p class="text-gray-400 font-medium mb-1">No activity yet</p>
            <p class="text-sm text-gray-500">Start by connecting your first cloud account</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(activity, index) in recentActivity"
              :key="index"
              class="group flex items-start space-x-4 p-4 bg-gray-900/50 rounded-xl hover:bg-gray-900 transition-all border border-gray-800/50 hover:border-gray-700/50"
            >
              <div class="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white font-medium">{{ activity.action }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ activity.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Getting Started (if no data) -->
      <div v-if="stats.providers === 0" class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 backdrop-blur-sm">
        <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div class="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div class="relative p-8 sm:p-12 lg:p-16 text-center">
          <div class="max-w-3xl mx-auto">
            <div class="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/30 hover:scale-110 transition-transform">
              <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">Get Started with CloudEvy</h2>
            <p class="text-gray-300 mb-10 text-base sm:text-lg max-w-2xl mx-auto">
              Connect your first cloud account to start managing your infrastructure visually. No terminal required.
            </p>
            <button
              @click="showConnectModal = true"
              class="inline-flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30 text-lg"
            >
              <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Connect Your First Cloud Account
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Connect Cloud Modal -->
    <ConnectCloudModal
      :is-open="showConnectModal"
      @close="showConnectModal = false"
      @connected="handleCloudConnected"
    />

    <!-- Add Server Modal -->
    <AddServerModal
      :is-open="showAddServerModal"
      @close="showAddServerModal = false"
      @server-added="handleServerAdded"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ConnectCloudModal from '@/components/ConnectCloudModal.vue'
import AddServerModal from '@/components/AddServerModal.vue'
import apiClient from '@/api/client'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref({
  servers: 0,
  containers: 0,
  providers: 0,
  monthlyCost: 0
})

const recentActivity = ref([])
const loading = ref(false)
const showConnectModal = ref(false)
const showAddServerModal = ref(false)

const isTrial = computed(() => {
  return true // For now, assume trial
})

const trialDaysLeft = computed(() => {
  return 14 // Placeholder
})

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const statsResponse = await apiClient.get('/dashboard/stats')
    if (statsResponse.data.success) {
      stats.value = statsResponse.data.data
    }

    const activityResponse = await apiClient.get('/dashboard/activity')
    if (activityResponse.data.success) {
      recentActivity.value = activityResponse.data.data
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    loading.value = false
  }
}

const handleCloudConnected = (data) => {
  // Refresh dashboard data after connecting
  fetchDashboardData()
  // Show success message or notification
  console.log('Cloud account connected:', data)
}

const handleAddServer = () => {
  if (stats.value.providers === 0) {
    // Show message that they need to connect a cloud account first
    return
  }
  showAddServerModal.value = true
}

const handleServerAdded = (data) => {
  // Refresh dashboard data after adding server
  fetchDashboardData()
  console.log('Server added:', data)
}

onMounted(() => {
  if (!authStore.user) {
    authStore.fetchCurrentUser()
  }
  fetchDashboardData()
})
</script>

<style scoped>
/* Grid pattern background */
.bg-grid-pattern {
  background-image: 
    linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* Smooth transitions */
button, a {
  transition: all 0.2s ease;
}

/* Card hover effects */
.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}
</style>
