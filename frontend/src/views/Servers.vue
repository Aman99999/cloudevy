<template>
  <div class="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-12 xl:px-16">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">Servers</h1>
        <p class="text-gray-400">Manage your cloud infrastructure</p>
      </div>
      <button
        @click="showAddServerModal = true"
        class="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Add Server
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Empty State -->
    <div v-else-if="servers.length === 0" class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
      <div class="p-16 text-center">
        <div class="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-white mb-2">No Servers Yet</h2>
        <p class="text-gray-400 mb-8">Add your first server to start monitoring your infrastructure</p>
        <button
          @click="showAddServerModal = true"
          class="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Your First Server
        </button>
      </div>
    </div>

    <!-- Servers Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="server in serversWithMetrics"
        :key="server.id"
        class="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 cursor-pointer"
        @click="viewServerDetails(server.id)"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 rounded-2xl transition-all duration-300"></div>
        
        <div class="relative">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-bold text-white mb-1">{{ server.name }}</h3>
              <div class="flex items-center space-x-2">
                <span
                  :class="[
                    'px-2 py-1 rounded-lg text-xs font-medium',
                    server.status === 'running' ? 'bg-green-500/20 text-green-400' :
                    server.status === 'stopped' ? 'bg-red-500/20 text-red-400' :
                    server.status === 'stopping' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' :
                    server.status === 'starting' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                    server.status === 'rebooting' ? 'bg-purple-500/20 text-purple-400 animate-pulse' :
                    server.status === 'terminating' ? 'bg-red-500/20 text-red-400 animate-pulse' :
                    server.status === 'provisioning' ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' :
                    'bg-gray-500/20 text-gray-400'
                  ]"
                >
                  {{ server.status }}
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-2" @click.stop>
              <!-- Start/Stop toggle for AWS instances -->
              <button
                v-if="server.provider === 'aws' && server.instanceId && server.status === 'stopped'"
                @click="startServer(server.id)"
                class="w-9 h-9 flex items-center justify-center rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 transition-all"
                title="Start server"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                v-if="server.provider === 'aws' && server.instanceId && server.status === 'running'"
                @click="stopServer(server.id)"
                class="w-9 h-9 flex items-center justify-center rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 transition-all"
                title="Stop server"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <!-- Schedule Downtime button (only for AWS with instanceId) -->
              <button
                v-if="server.provider === 'aws' && server.instanceId"
                @click="openScheduleModal(server)"
                class="w-9 h-9 flex items-center justify-center rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition-all"
                title="Schedule Downtime"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <!-- View Scheduled Jobs button (only for AWS with instanceId) -->
              <button
                v-if="server.provider === 'aws' && server.instanceId"
                @click="openSchedulesModal(server)"
                class="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all"
                title="View Scheduled Jobs"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </button>
              
              <button
                @click="viewServerDetails(server.id)"
                class="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-all"
                title="View details"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </button>
              <button
                @click="deleteServer(server.id)"
                class="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all"
                title="Delete server"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Metrics Preview (only if running) -->
          <div v-if="server.status === 'running' && server.metrics" class="mb-4 space-y-3">
            <!-- CPU -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-400">CPU Usage</span>
                <span class="text-xs text-white font-medium">{{ server.metrics.cpu }}%</span>
              </div>
              <div class="w-full bg-gray-700/50 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-500"
                  :class="getUsageColor(server.metrics.cpu)"
                  :style="{ width: server.metrics.cpu + '%' }"
                ></div>
              </div>
            </div>

            <!-- Memory -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-400">Memory</span>
                <span class="text-xs text-white font-medium">{{ server.metrics.memory }}%</span>
              </div>
              <div class="w-full bg-gray-700/50 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-500"
                  :class="getUsageColor(server.metrics.memory)"
                  :style="{ width: server.metrics.memory + '%' }"
                ></div>
              </div>
            </div>

            <!-- Disk -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-400">Disk Usage</span>
                <span class="text-xs text-white font-medium">{{ server.metrics.disk }}%</span>
              </div>
              <div class="w-full bg-gray-700/50 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-500"
                  :class="getUsageColor(server.metrics.disk)"
                  :style="{ width: server.metrics.disk + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Server Details -->
          <div class="space-y-2">
            <div v-if="server.ipAddress" class="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
              <span class="text-xs text-gray-400">IP Address</span>
              <span class="text-xs text-white font-mono">{{ server.ipAddress }}</span>
            </div>
            <div v-if="server.instanceType" class="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
              <span class="text-xs text-gray-400">Instance Type</span>
              <span class="text-xs text-white font-medium">{{ server.instanceType }}</span>
            </div>
            <div v-if="server.region" class="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
              <span class="text-xs text-gray-400">Region</span>
              <span class="text-xs text-white">{{ server.region }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Server Modal -->
    <AddServerModal
      :is-open="showAddServerModal"
      @close="showAddServerModal = false"
      @server-added="handleServerAdded"
    />

    <!-- Server Details Modal -->
    <ServerDetailsModal
      :is-open="showDetailsModal"
      :server-id="selectedServerId"
      @close="showDetailsModal = false"
    />

    <!-- Custom Confirm Dialog -->
    <ConfirmDialog
      :is-open="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :variant="confirmDialog.variant"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      @confirm="confirmDialog.onConfirm"
      @cancel="confirmDialog.onCancel"
      @close="confirmDialog.isOpen = false"
    />

    <!-- Schedule Modal -->
    <ScheduleModal
      v-if="showScheduleModal"
      :server="selectedServer"
      @close="showScheduleModal = false"
      @saved="handleScheduleSaved"
    />

    <!-- Floating Refresh Button -->
    <button
      @click="refreshPage"
      class="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center transition-all hover:scale-110 group z-50"
      title="Refresh page"
    >
      <svg class="w-6 h-6 transition-transform group-hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AddServerModal from '@/components/AddServerModal.vue'
import ServerDetailsModal from '@/components/ServerDetailsModal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ScheduleModal from '@/components/ScheduleModal.vue'
import apiClient from '@/api/client'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const servers = ref([])
const serverMetrics = ref({})
const loading = ref(false)
const showAddServerModal = ref(false)
const showDetailsModal = ref(false)
const selectedServerId = ref(null)
const showScheduleModal = ref(false)
const showSchedulesModal = ref(false)
const selectedServer = ref(null)
let metricsInterval = null
let statusPollInterval = null

// Confirm dialog state
const confirmDialog = ref({
  isOpen: false,
  title: '',
  message: '',
  variant: 'warning',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: () => {},
  onCancel: () => {}
})

const serversWithMetrics = computed(() => {
  return servers.value.map(server => ({
    ...server,
    metrics: serverMetrics.value[server.id] || null
  }))
})

const fetchServers = async () => {
  loading.value = true
  try {
    const response = await apiClient.get('/servers')
    if (response.data.success) {
      servers.value = response.data.data
      
      // Auto-start polling for servers in transitional states
      servers.value.forEach(server => {
        const transitionalStates = ['stopping', 'starting', 'rebooting', 'provisioning']
        if (transitionalStates.includes(server.status)) {
          console.log(`🔄 Auto-polling status for ${server.name} (${server.status})`)
          pollServerStatus(server.id)
        }
      })
      
      // Fetch metrics for all running servers
      fetchAllMetrics()
    }
  } catch (error) {
    console.error('Failed to fetch servers:', error)
  } finally {
    loading.value = false
  }
}

const fetchAllMetrics = async () => {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await apiClient.get('/metrics/servers/summary', {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (response.data.success) {
      // Store metrics by server ID
      response.data.data.forEach(summary => {
        serverMetrics.value[summary.serverId] = summary.metrics
      })
    }
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      console.warn('Metrics request timed out, will retry on next interval')
    } else {
      console.error('Failed to fetch metrics:', error)
    }
    // Don't crash - just continue without metrics
  }
}

const handleServerAdded = () => {
  fetchServers()
}

const deleteServer = async (serverId) => {
  const server = servers.value.find(s => s.id === serverId)
  const serverName = server?.name || 'this server'
  
  confirmDialog.value = {
    isOpen: true,
    title: 'Delete Server',
    message: `Are you sure you want to delete ${serverName} from tracking? This will not delete the instance from AWS.`,
    variant: 'warning',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        const response = await apiClient.delete(`/servers/${serverId}`)
        if (response.data.success) {
          toast.success('Server deleted successfully')
          fetchServers()
        }
      } catch (error) {
        console.error('Failed to delete server:', error)
        toast.error('Failed to delete server. Please try again.')
      }
    },
    onCancel: () => {}
  }
}

const viewServerDetails = (serverId) => {
  selectedServerId.value = serverId
  showDetailsModal.value = true
}

const stopServer = async (serverId) => {
  const server = servers.value.find(s => s.id === serverId)
  const serverName = server?.name || 'this server'
  
  confirmDialog.value = {
    isOpen: true,
    title: 'Stop Server',
    message: `Are you sure you want to stop ${serverName}? It will be powered off.`,
    variant: 'warning',
    confirmText: 'Stop Server',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        const response = await apiClient.post(`/servers/${serverId}/stop`)
        if (response.data.success) {
          // Update local state optimistically
          if (server) {
            server.status = 'stopping'
          }
          toast.success('Server is stopping')
          
          // Start polling for status updates
          pollServerStatus(serverId)
        }
      } catch (error) {
        console.error('Failed to stop server:', error)
        toast.error(error.response?.data?.message || 'Failed to stop server. Please try again.')
      }
    },
    onCancel: () => {}
  }
}

const startServer = async (serverId) => {
  const server = servers.value.find(s => s.id === serverId)
  const serverName = server?.name || 'this server'
  
  confirmDialog.value = {
    isOpen: true,
    title: 'Start Server',
    message: `Are you sure you want to start ${serverName}?`,
    variant: 'info',
    confirmText: 'Start Server',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        const response = await apiClient.post(`/servers/${serverId}/start`)
        if (response.data.success) {
          // Update local state optimistically
          if (server) {
            server.status = 'starting'
          }
          toast.success('Server is starting')
          
          // Start polling for status updates
          pollServerStatus(serverId)
        }
      } catch (error) {
        console.error('Failed to start server:', error)
        toast.error(error.response?.data?.message || 'Failed to start server. Please try again.')
      }
    },
    onCancel: () => {}
  }
}

// Poll server status until it reaches a stable state
const pollServerStatus = async (serverId) => {
  const maxAttempts = 30 // Poll for max 2 minutes (30 * 4s)
  let attempts = 0
  
  const poll = async () => {
    if (attempts >= maxAttempts) {
      clearInterval(statusPollInterval)
      statusPollInterval = null
      toast.warning('Status polling timed out. Refresh the page to see latest status.')
      return
    }
    
    try {
      const response = await apiClient.get(`/servers/${serverId}/status`)
      if (response.data.success) {
        const newStatus = response.data.data.status
        const server = servers.value.find(s => s.id === serverId)
        
        if (server) {
          const oldStatus = server.status
          server.status = newStatus
          
          // Stop polling if reached stable state
          if (!['stopping', 'starting', 'rebooting', 'provisioning'].includes(newStatus)) {
            clearInterval(statusPollInterval)
            statusPollInterval = null
            
            console.log(`✅ Server ${serverId}: ${oldStatus} → ${newStatus}`)
            
            // Show notification with manual reload instruction
            if (newStatus === 'stopped') {
              toast.success('✅ Server stopped successfully! Reload the page to see the changes.')
            } else if (newStatus === 'running') {
              toast.success('✅ Server started successfully! Reload the page to see the changes.')
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to poll server status:', error)
    }
    
    attempts++
  }
  
  // Clear any existing poll interval
  if (statusPollInterval) {
    clearInterval(statusPollInterval)
  }
  
  // Poll every 4 seconds
  statusPollInterval = setInterval(poll, 4000)
  
  // Also poll immediately
  poll()
}

const refreshPage = () => {
  location.reload()
}

const getUsageColor = (percentage) => {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 70) return 'bg-yellow-500'
  return 'bg-green-500'
}

const openScheduleModal = (server) => {
  selectedServer.value = server
  showScheduleModal.value = true
}

const openSchedulesModal = (server) => {
  selectedServer.value = server
  showSchedulesModal.value = true
}

const handleScheduleSaved = () => {
  toast.success('Schedule created successfully')
  showScheduleModal.value = false
}

onMounted(async () => {
  await fetchServers()
  
  // Refresh metrics every 30 seconds
  metricsInterval = setInterval(fetchAllMetrics, 30000)
  
  // Auto-poll status for servers in transitional states every 10 seconds
  // This catches scheduler-initiated actions (not just user-initiated)
  statusPollInterval = setInterval(async () => {
    // Find all servers in transitional states
    const transitionalServers = servers.value.filter(s => 
      ['stopping', 'starting', 'rebooting', 'provisioning'].includes(s.status)
    )
    
    if (transitionalServers.length > 0) {
      console.log(`🔄 Auto-polling ${transitionalServers.length} server(s) in transitional state`)
      
      // Poll each one
      for (const server of transitionalServers) {
        try {
          const response = await apiClient.get(`/servers/${server.id}/status`)
          if (response.data.success) {
            const newStatus = response.data.data.status
            
            // Update if status changed
            if (server.status !== newStatus) {
              console.log(`   ${server.name}: ${server.status} → ${newStatus}`)
              server.status = newStatus
              
              // Show toast if reached stable state
              if (!['stopping', 'starting', 'rebooting', 'provisioning'].includes(newStatus)) {
                if (newStatus === 'stopped') {
                  toast.success(`Server "${server.name}" stopped`)
                } else if (newStatus === 'running') {
                  toast.success(`Server "${server.name}" started`)
                  // Refresh metrics after 2 seconds
                  setTimeout(() => fetchAllMetrics(), 2000)
                }
              }
            }
          }
        } catch (error) {
          console.error(`Failed to poll status for ${server.name}:`, error)
        }
      }
    }
  }, 10000) // Check every 10 seconds
})

onUnmounted(() => {
  if (metricsInterval) {
    clearInterval(metricsInterval)
  }
  if (statusPollInterval) {
    clearInterval(statusPollInterval)
  }
})
</script>

<style scoped>
/* Smooth transitions */
button, a {
  transition: all 0.2s ease;
}

/* Card hover effects */
.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}
</style>
