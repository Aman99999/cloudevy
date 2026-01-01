<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-700">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white flex items-center gap-2">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Scheduled Jobs
          </h2>
          <p class="text-blue-100 text-sm mt-1">{{ server.name }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Filters -->
      <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
        <div class="flex gap-2">
          <button
            @click="filterStatus = 'all'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition',
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            ]"
          >
            All ({{ schedules.length }})
          </button>
          <button
            @click="filterStatus = 'active'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition',
              filterStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            ]"
          >
            Active ({{ activeCount }})
          </button>
          <button
            @click="filterStatus = 'inactive'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition',
              filterStatus === 'inactive'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            ]"
          >
            Inactive ({{ inactiveCount }})
          </button>
        </div>

        <button
          @click="refreshSchedules"
          class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition flex items-center gap-2"
          :disabled="loading"
        >
          <svg class="w-5 h-5" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Refresh
        </button>
      </div>

      <!-- Schedules List -->
      <div class="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredSchedules.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-gray-400 text-lg">
            {{ filterStatus === 'all' ? 'No scheduled jobs found' : `No ${filterStatus} jobs found` }}
          </p>
          <p class="text-gray-500 text-sm mt-2">Create a schedule from the "Schedule Downtime" button</p>
        </div>

        <!-- Schedule Cards -->
        <div v-else class="space-y-4">
          <div
            v-for="schedule in filteredSchedules"
            :key="schedule.id"
            class="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition"
          >
            <!-- Schedule Header -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-lg font-semibold text-white">{{ schedule.name }}</h3>
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-medium',
                      schedule.enabled
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    ]"
                  >
                    {{ schedule.enabled ? 'Active' : 'Paused' }}
                  </span>
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-medium',
                      getActionColor(schedule.action)
                    ]"
                  >
                    {{ schedule.action.toUpperCase() }}
                  </span>
                </div>
                <p class="text-gray-400 text-sm">{{ getScheduleDescription(schedule) }}</p>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 ml-4">
                <!-- Toggle Active/Pause -->
                <button
                  @click="toggleSchedule(schedule)"
                  :class="[
                    'p-2 rounded-lg transition',
                    schedule.enabled
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                  ]"
                  :title="schedule.enabled ? 'Pause' : 'Resume'"
                >
                  <svg v-if="schedule.enabled" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </button>

                <!-- Edit -->
                <button
                  @click="editSchedule(schedule)"
                  class="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition border border-blue-500/30"
                  title="Edit"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>

                <!-- Delete -->
                <button
                  @click="deleteSchedule(schedule)"
                  class="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition border border-red-500/30"
                  title="Delete"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Schedule Details -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">Next Run:</span>
                <span class="text-white ml-2">{{ formatDate(schedule.nextRunAt) }}</span>
              </div>
              <div v-if="schedule.lastRunAt">
                <span class="text-gray-500">Last Run:</span>
                <span class="text-white ml-2">{{ formatDate(schedule.lastRunAt) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Timezone:</span>
                <span class="text-white ml-2">{{ schedule.timezone }}</span>
              </div>
              <div>
                <span class="text-gray-500">Executions:</span>
                <span class="text-white ml-2">{{ schedule.executionCount }} times</span>
              </div>
            </div>

            <!-- Execution History -->
            <div v-if="schedule.executions && schedule.executions.length > 0" class="mt-4 pt-4 border-t border-gray-700">
              <p class="text-gray-400 text-xs font-medium mb-2">Recent Executions</p>
              <div class="space-y-1">
                <div
                  v-for="exec in schedule.executions.slice(0, 3)"
                  :key="exec.id"
                  class="flex items-center justify-between text-xs"
                >
                  <span class="text-gray-500">{{ formatDate(exec.executedAt) }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded',
                      exec.status === 'success'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    ]"
                  >
                    {{ exec.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Schedule Modal -->
    <ScheduleModal
      v-if="showEditModal"
      :server="server"
      :schedule="editingSchedule"
      @close="showEditModal = false"
      @saved="handleScheduleSaved"
    />

    <!-- Confirm Dialog -->
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiClient from '@/api/client'
import { useToast } from '@/composables/useToast'
import ScheduleModal from './ScheduleModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps({
  isOpen: Boolean,
  server: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])

const toast = useToast()
const schedules = ref([])
const loading = ref(false)
const filterStatus = ref('all')
const showEditModal = ref(false)
const editingSchedule = ref(null)

const confirmDialog = ref({
  isOpen: false,
  title: '',
  message: '',
  variant: 'danger',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: () => {},
  onCancel: () => { confirmDialog.value.isOpen = false }
})

const activeCount = computed(() => schedules.value.filter(s => s.enabled).length)
const inactiveCount = computed(() => schedules.value.filter(s => !s.enabled).length)

const filteredSchedules = computed(() => {
  if (filterStatus.value === 'all') return schedules.value
  if (filterStatus.value === 'active') return schedules.value.filter(s => s.enabled)
  if (filterStatus.value === 'inactive') return schedules.value.filter(s => !s.enabled)
  return schedules.value
})

onMounted(() => {
  fetchSchedules()
})

async function fetchSchedules() {
  loading.value = true
  try {
    const response = await apiClient.get(`/schedules?serverId=${props.server.id}`)
    if (response.data.success) {
      schedules.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    toast.error('Failed to load schedules')
  } finally {
    loading.value = false
  }
}

async function refreshSchedules() {
  await fetchSchedules()
  toast.success('Schedules refreshed')
}

async function toggleSchedule(schedule) {
  try {
    const newStatus = !schedule.enabled
    const response = await apiClient.put(`/schedules/${schedule.id}/toggle`, {
      enabled: newStatus
    })

    if (response.data.success) {
      schedule.enabled = newStatus
      toast.success(newStatus ? 'Schedule resumed' : 'Schedule paused')
      emit('updated')
    }
  } catch (error) {
    console.error('Failed to toggle schedule:', error)
    toast.error('Failed to update schedule')
  }
}

function editSchedule(schedule) {
  editingSchedule.value = schedule
  showEditModal.value = true
}

function deleteSchedule(schedule) {
  confirmDialog.value = {
    isOpen: true,
    title: 'Delete Schedule',
    message: `Are you sure you want to delete "${schedule.name}"? This action cannot be undone.`,
    variant: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: async () => {
      try {
        const response = await apiClient.delete(`/schedules/${schedule.id}`)
        if (response.data.success) {
          schedules.value = schedules.value.filter(s => s.id !== schedule.id)
          toast.success('Schedule deleted successfully')
          emit('updated')
        }
      } catch (error) {
        console.error('Failed to delete schedule:', error)
        toast.error('Failed to delete schedule')
      } finally {
        confirmDialog.value.isOpen = false
      }
    },
    onCancel: () => { confirmDialog.value.isOpen = false }
  }
}

function handleScheduleSaved() {
  showEditModal.value = false
  editingSchedule.value = null
  fetchSchedules()
  emit('updated')
}

function getActionColor(action) {
  const colors = {
    stop: 'bg-red-500/20 text-red-400 border border-red-500/30',
    start: 'bg-green-500/20 text-green-400 border border-green-500/30',
    reboot: 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
  }
  return colors[action] || 'bg-gray-500/20 text-gray-400'
}

function getScheduleDescription(schedule) {
  try {
    // Parse rrule to create human-readable description
    const rrule = schedule.rrule
    if (rrule.includes('FREQ=DAILY') && rrule.includes('BYDAY=MO,TU,WE,TH,FR')) {
      return 'Every weekday'
    } else if (rrule.includes('FREQ=DAILY') && rrule.includes('BYDAY=SA,SU')) {
      return 'Every weekend'
    } else if (rrule.includes('FREQ=DAILY')) {
      return 'Every day'
    } else if (rrule.includes('FREQ=WEEKLY')) {
      return 'Every week'
    }
    return 'Custom schedule'
  } catch (error) {
    return 'Custom schedule'
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

