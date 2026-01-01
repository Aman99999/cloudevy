<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div class="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl rounded-2xl border border-gray-700">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-2xl font-bold text-white mb-1">
              Schedule Downtime
            </h3>
            <p class="text-sm text-gray-400">for {{ server.name }}</p>
          </div>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-white transition"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="saveSchedule" class="space-y-6">
          <!-- Schedule Name -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Schedule Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="e.g., Nightly Shutdown"
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <!-- Action -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-3">Action</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                type="button"
                v-for="actionOption in actions"
                :key="actionOption.value"
                @click="selectAction(actionOption.value)"
                :class="[
                  'p-4 border-2 rounded-xl text-center transition-all',
                  form.action === actionOption.value
                    ? 'border-blue-500 bg-blue-500/10 scale-105'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/30'
                ]"
              >
                <div class="text-3xl mb-2">{{ actionOption.icon }}</div>
                <div class="font-medium text-white text-sm">{{ actionOption.label }}</div>
              </button>
            </div>
          </div>

          <!-- Auto-Start option (only for Stop action) -->
          <div v-if="form.action === 'stop'" class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <label class="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                v-model="enableAutoStart"
                class="mt-1 w-5 h-5 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500"
              />
              <div class="flex-1">
                <div class="text-sm font-medium text-white">Automatically start server later</div>
                <div class="text-xs text-gray-400 mt-1">Schedule when the server should start again after stopping</div>
              </div>
            </label>
          </div>

          <!-- Stop Time -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              {{ form.action === 'stop' ? 'Stop' : form.action === 'start' ? 'Start' : 'Reboot' }} Time
            </label>
            <input
              v-model="stopTime"
              type="time"
              required
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <!-- Auto-Start Time (only if Stop + Auto-Start enabled) -->
          <div v-if="form.action === 'stop' && enableAutoStart">
            <label class="block text-sm font-medium text-gray-300 mb-2">Auto-Start Time</label>
            <input
              v-model="startTime"
              type="time"
              required
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
            <p class="text-xs text-gray-400 mt-2">Server will automatically start at this time</p>
          </div>

          <!-- Schedule Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
            <select
              v-model="scheduleType"
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays (Mon-Fri)</option>
              <option value="weekends">Weekends (Sat-Sun)</option>
              <option value="weekly">Weekly (custom days)</option>
              <option value="custom">Custom (Advanced)</option>
            </select>
          </div>

          <!-- Days (for weekly) -->
          <div v-if="scheduleType === 'weekly'" class="space-y-2">
            <label class="block text-sm font-medium text-gray-300">Days of Week</label>
            <div class="flex gap-2">
              <button
                type="button"
                v-for="day in weekDays"
                :key="day.value"
                @click="toggleDay(day.value)"
                :class="[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  selectedDays.includes(day.value)
                    ? 'bg-blue-500 text-white scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                ]"
              >
                {{ day.label }}
              </button>
            </div>
          </div>

          <!-- Timezone -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
            <select
              v-model="form.timezone"
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="America/New_York">US Eastern</option>
              <option value="America/Los_Angeles">US Pacific</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>

          <!-- Custom RRule (for advanced users) -->
          <div v-if="scheduleType === 'custom'">
            <label class="block text-sm font-medium text-gray-300 mb-2">
              RRule String
              <a href="https://icalendar.org/iCalendar-RFC-5545/3-8-5-3-recurrence-rule.html" target="_blank" class="text-blue-400 text-xs ml-2 hover:text-blue-300">
                (Documentation)
              </a>
            </label>
            <input
              v-model="form.rrule"
              type="text"
              placeholder="FREQ=DAILY;BYHOUR=21;BYMINUTE=0"
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono text-sm"
            />
          </div>

          <!-- Preview -->
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p class="text-sm font-medium text-blue-300 mb-1">📅 Schedule Preview:</p>
            <p class="text-sm text-gray-300">{{ scheduleDescription }}</p>
            <p v-if="form.action === 'stop' && enableAutoStart" class="text-sm text-green-400 mt-2">
              🟢 Auto-start: {{ autoStartDescription }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              @click="$emit('close')"
              class="px-6 py-3 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50"
            >
              {{ saving ? 'Creating...' : 'Create Schedule' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import apiClient from '../api/client';
import { rrulestr } from 'rrule';

const props = defineProps({
  server: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'saved']);

const saving = ref(false);
const scheduleType = ref('daily');
const stopTime = ref('21:00');
const startTime = ref('10:00');
const selectedDays = ref([0]); // Monday by default
const enableAutoStart = ref(false);

const form = ref({
  name: '',
  serverId: props.server.id,
  action: 'stop',
  rrule: '',
  timezone: 'Asia/Kolkata'
});

const autoStartForm = ref({
  name: '',
  serverId: props.server.id,
  action: 'start',
  rrule: '',
  timezone: 'Asia/Kolkata'
});

const actions = [
  { value: 'stop', label: 'Stop Server', icon: '🔴' },
  { value: 'start', label: 'Start Server', icon: '🟢' },
  { value: 'reboot', label: 'Reboot Server', icon: '🔄' }
];

const weekDays = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' }
];

const scheduleDescription = computed(() => {
  try {
    const rule = rrulestr(form.value.rrule);
    return rule.toText();
  } catch (error) {
    return 'Invalid schedule';
  }
});

const autoStartDescription = computed(() => {
  try {
    const rule = rrulestr(autoStartForm.value.rrule);
    return rule.toText();
  } catch (error) {
    return 'Invalid schedule';
  }
});

onMounted(() => {
  // Default schedule name
  form.value.name = `${props.server.name} - Nightly Shutdown`;
  autoStartForm.value.name = `${props.server.name} - Morning Startup`;
  
  // Generate initial rrules
  updateRRule();
  updateAutoStartRRule();
});

function selectAction(action) {
  form.value.action = action;
  if (action !== 'stop') {
    enableAutoStart.value = false;
  }
}

// Watch for time changes and update rrule
watch(stopTime, () => {
  updateRRule();
});

watch(startTime, () => {
  if (enableAutoStart.value) {
    updateAutoStartRRule();
  }
});

watch(scheduleType, () => {
  updateRRule();
});

function updateRRule() {
  const [hour, minute] = stopTime.value.split(':');
  
  let rrule = '';
  
  switch (scheduleType.value) {
    case 'daily':
      rrule = `FREQ=DAILY;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekdays':
      rrule = `FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekends':
      rrule = `FREQ=DAILY;BYDAY=SA,SU;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekly':
      if (selectedDays.value.length === 0) {
        selectedDays.value = [0]; // Default to Monday
      }
      const days = selectedDays.value.map(d => ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][d]).join(',');
      rrule = `FREQ=WEEKLY;BYDAY=${days};BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'custom':
      // Keep existing rrule
      return;
  }
  
  form.value.rrule = rrule;
  updateAutoStartRRule();
}

function updateAutoStartRRule() {
  if (!enableAutoStart.value) return;
  
  const [hour, minute] = startTime.value.split(':');
  
  let rrule = '';
  
  switch (scheduleType.value) {
    case 'daily':
      rrule = `FREQ=DAILY;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekdays':
      rrule = `FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekends':
      rrule = `FREQ=DAILY;BYDAY=SA,SU;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekly':
      const days = selectedDays.value.map(d => ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][d]).join(',');
      rrule = `FREQ=WEEKLY;BYDAY=${days};BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
  }
  
  autoStartForm.value.rrule = rrule;
  autoStartForm.value.timezone = form.value.timezone;
}

function toggleDay(day) {
  const index = selectedDays.value.indexOf(day);
  if (index > -1) {
    selectedDays.value.splice(index, 1);
  } else {
    selectedDays.value.push(day);
  }
  selectedDays.value.sort();
  updateRRule();
}

// Watch for changes to auto-start toggle
watch(enableAutoStart, (newVal) => {
  if (newVal) {
    updateAutoStartRRule();
  }
});

watch(startTime, () => {
  if (enableAutoStart.value) {
    updateAutoStartRRule();
  }
});

watch(() => form.value.timezone, (newTimezone) => {
  autoStartForm.value.timezone = newTimezone;
});

async function saveSchedule() {
  try {
    saving.value = true;
    
    // Create the main schedule (stop/start/reboot)
    await apiClient.post('/schedules', form.value);
    
    // If Stop action with auto-start, create a second schedule for starting
    if (form.value.action === 'stop' && enableAutoStart.value) {
      await apiClient.post('/schedules', autoStartForm.value);
    }
    
    emit('saved');
    emit('close');
  } catch (error) {
    console.error('Failed to save schedule:', error);
    alert(error.response?.data?.message || 'Failed to save schedule');
  } finally {
    saving.value = false;
  }
}
</script>

