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
              Schedule Configuration Scaling
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
              placeholder="e.g., Night-time Scale Down"
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
          </div>

          <!-- Current Configuration -->
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p class="text-sm font-medium text-blue-300 mb-1">📊 Current Configuration:</p>
            <p class="text-sm text-white font-mono">{{ server.instanceType }}</p>
          </div>

          <!-- Action Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-3">Scaling Direction</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                @click="form.action = 'scale_down'"
                :class="[
                  'p-4 border-2 rounded-xl text-center transition-all',
                  form.action === 'scale_down'
                    ? 'border-orange-500 bg-orange-500/10 scale-105'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/30'
                ]"
              >
                <div class="text-3xl mb-2">📉</div>
                <div class="font-medium text-white text-sm">Scale Down</div>
                <div class="text-xs text-gray-400 mt-1">Reduce resources</div>
              </button>
              <button
                type="button"
                @click="form.action = 'scale_up'"
                :class="[
                  'p-4 border-2 rounded-xl text-center transition-all',
                  form.action === 'scale_up'
                    ? 'border-green-500 bg-green-500/10 scale-105'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/30'
                ]"
              >
                <div class="text-3xl mb-2">📈</div>
                <div class="font-medium text-white text-sm">Scale Up</div>
                <div class="text-xs text-gray-400 mt-1">Increase resources</div>
              </button>
            </div>
          </div>

          <!-- Target Instance Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Target Instance Type (Optional)
              <span class="text-gray-500 text-xs ml-2">(leave empty to only modify volume)</span>
            </label>
            <select
              v-model="form.targetInstanceType"
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            >
              <option value="">No change</option>
              <optgroup v-for="category in instanceCategories" :key="category" :label="category">
                <option
                  v-for="type in getInstancesByCategory(category)"
                  :key="type.value"
                  :value="type.value"
                  :disabled="type.value === server.instanceType"
                >
                  {{ type.label }} {{ type.value === server.instanceType ? '(Current)' : '' }}
                </option>
              </optgroup>
            </select>
          </div>

          <!-- EBS Volume Configuration -->
          <div class="border-t border-gray-700 pt-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h4 class="text-lg font-semibold text-white">EBS Volume Configuration (Optional)</h4>
                <p class="text-xs text-gray-400 mt-1">💡 Modify volume without stopping the instance!</p>
              </div>
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="enableVolumeScaling"
                  class="w-4 h-4 text-cyan-500 bg-gray-900 border-gray-700 rounded focus:ring-cyan-500"
                />
                <span class="ml-2 text-sm text-gray-300">Enable</span>
              </label>
            </div>

            <div v-if="enableVolumeScaling" class="space-y-4 bg-gray-900/30 p-4 rounded-lg">
              <!-- Volume Size -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Volume Size (GB)
                  <span class="text-yellow-400 text-xs ml-2">⚠️ Can only increase, not decrease</span>
                </label>
                <input
                  v-model.number="form.targetVolumeSize"
                  type="number"
                  min="1"
                  max="16384"
                  placeholder="e.g., 100"
                  class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                />
              </div>

              <!-- Volume Type -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Volume Type</label>
                <select
                  v-model="form.targetVolumeType"
                  class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                >
                  <option value="">No change</option>
                  <option value="gp2">gp2 - General Purpose SSD (Legacy)</option>
                  <option value="gp3">gp3 - General Purpose SSD (Recommended)</option>
                  <option value="io1">io1 - Provisioned IOPS SSD</option>
                  <option value="io2">io2 - Provisioned IOPS SSD (Better)</option>
                  <option value="st1">st1 - Throughput Optimized HDD</option>
                  <option value="sc1">sc1 - Cold HDD</option>
                </select>
              </div>

              <!-- IOPS (for io1, io2, gp3) -->
              <div v-if="['io1', 'io2', 'gp3'].includes(form.targetVolumeType)">
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Provisioned IOPS
                  <span class="text-gray-500 text-xs ml-2">
                    ({{ form.targetVolumeType === 'gp3' ? 'gp3: 3,000-16,000' : form.targetVolumeType === 'io1' ? 'io1: 100-64,000' : 'io2: 100-256,000' }})
                  </span>
                </label>
                <input
                  v-model.number="form.targetVolumeIops"
                  type="number"
                  :min="form.targetVolumeType === 'gp3' ? 3000 : 100"
                  :max="form.targetVolumeType === 'gp3' ? 16000 : form.targetVolumeType === 'io1' ? 64000 : 256000"
                  placeholder="e.g., 3000"
                  class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                />
              </div>

              <!-- Throughput (for gp3) -->
              <div v-if="form.targetVolumeType === 'gp3'">
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Throughput (MB/s)
                  <span class="text-gray-500 text-xs ml-2">(125-1000)</span>
                </label>
                <input
                  v-model.number="form.targetVolumeThroughput"
                  type="number"
                  min="125"
                  max="1000"
                  placeholder="e.g., 125"
                  class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                />
              </div>

              <!-- Cost Estimate Hint -->
              <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <p class="text-xs text-green-400">
                  💰 <strong>Cost Savings Example:</strong> Switching from gp3 with 10,000 IOPS to gp2 can save ~$50/month per 100GB volume
                </p>
              </div>
            </div>
          </div>

          <!-- Schedule Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-3">Schedule Type</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                v-for="type in scheduleTypes"
                :key="type.value"
                @click="scheduleType = type.value"
                :class="[
                  'px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all',
                  scheduleType === type.value
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/30 text-gray-300'
                ]"
              >
                {{ type.label }}
              </button>
            </div>
          </div>

          <!-- Time Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Scale Time</label>
            <input
              v-model="scaleTime"
              type="time"
              required
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
          </div>

          <!-- Weekly Day Selection (only for weekly schedule) -->
          <div v-if="scheduleType === 'weekly'">
            <label class="block text-sm font-medium text-gray-300 mb-3">Select Days</label>
            <div class="grid grid-cols-7 gap-2">
              <button
                type="button"
                v-for="day in weekDays"
                :key="day.value"
                @click="toggleDay(day.value)"
                :class="[
                  'px-2 py-3 border-2 rounded-lg text-xs font-medium transition-all',
                  selectedDays.includes(day.value)
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900/30 text-gray-400'
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
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <!-- Auto Scale-Back Option -->
          <div v-if="form.action === 'scale_down'" class="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div class="flex items-start space-x-3">
              <input
                type="checkbox"
                id="enableAutoScaleBack"
                v-model="enableAutoScaleBack"
                class="mt-1 w-4 h-4 text-green-500 bg-gray-900 border-gray-700 rounded focus:ring-green-500"
              />
              <div class="flex-1">
                <label for="enableAutoScaleBack" class="text-sm font-medium text-green-300 cursor-pointer">
                  Automatically scale back up
                </label>
                <p class="text-xs text-gray-400 mt-1">
                  Create a paired schedule to automatically scale back to original configuration after a specified time.
                </p>
              </div>
            </div>
            
            <!-- Scale-Back Time (only if enabled) -->
            <div v-if="enableAutoScaleBack" class="mt-4">
              <label class="block text-sm font-medium text-green-300 mb-2">Scale-Back Time</label>
              <input
                v-model="scaleBackTime"
                type="time"
                required
                class="w-full px-4 py-3 bg-gray-900/50 border border-green-700 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <!-- Preview -->
          <div class="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
            <p class="text-sm font-medium text-cyan-300 mb-1">📅 Schedule Preview:</p>
            <p class="text-sm text-gray-300">{{ scheduleDescription }}</p>
            <p v-if="form.action === 'scale_down' && enableAutoScaleBack" class="text-sm text-green-400 mt-2">
              🔄 Auto scale-back: {{ scaleBackDescription }}
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
              :disabled="saving || (!form.targetInstanceType && !enableVolumeScaling)"
              class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition disabled:opacity-50"
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
import { ref, computed, watch } from 'vue';
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
const scaleTime = ref('22:00');
const scaleBackTime = ref('08:00');
const selectedDays = ref([0]); // Monday by default
const enableAutoScaleBack = ref(false);
const enableVolumeScaling = ref(false);

const form = ref({
  name: '',
  serverId: props.server.id,
  action: 'scale_down',
  rrule: '',
  timezone: 'Asia/Kolkata',
  targetInstanceType: '',
  originalInstanceType: props.server.instanceType || '',
  // Volume fields
  targetVolumeSize: null,
  targetVolumeType: '',
  targetVolumeIops: null,
  targetVolumeThroughput: null,
  originalVolumeSize: null,
  originalVolumeType: '',
  originalVolumeIops: null,
  originalVolumeThroughput: null
});

const scaleBackForm = ref({
  name: '',
  serverId: props.server.id,
  action: 'scale_up',
  rrule: '',
  timezone: 'Asia/Kolkata',
  targetInstanceType: props.server.instanceType || '',
  originalInstanceType: '',
  // Volume fields for scale-back
  targetVolumeSize: null,
  targetVolumeType: '',
  targetVolumeIops: null,
  targetVolumeThroughput: null,
  originalVolumeSize: null,
  originalVolumeType: '',
  originalVolumeIops: null,
  originalVolumeThroughput: null
});

const scheduleTypes = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'weekly', label: 'Custom Days' }
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

// AWS instance types
const instanceTypes = [
  // General Purpose - T2
  { value: 't2.micro', label: 't2.micro (1 vCPU, 1 GB)', category: 'General Purpose (T2)' },
  { value: 't2.small', label: 't2.small (1 vCPU, 2 GB)', category: 'General Purpose (T2)' },
  { value: 't2.medium', label: 't2.medium (2 vCPU, 4 GB)', category: 'General Purpose (T2)' },
  { value: 't2.large', label: 't2.large (2 vCPU, 8 GB)', category: 'General Purpose (T2)' },
  { value: 't2.xlarge', label: 't2.xlarge (4 vCPU, 16 GB)', category: 'General Purpose (T2)' },
  // General Purpose - T3
  { value: 't3.micro', label: 't3.micro (2 vCPU, 1 GB)', category: 'General Purpose (T3)' },
  { value: 't3.small', label: 't3.small (2 vCPU, 2 GB)', category: 'General Purpose (T3)' },
  { value: 't3.medium', label: 't3.medium (2 vCPU, 4 GB)', category: 'General Purpose (T3)' },
  { value: 't3.large', label: 't3.large (2 vCPU, 8 GB)', category: 'General Purpose (T3)' },
  { value: 't3.xlarge', label: 't3.xlarge (4 vCPU, 16 GB)', category: 'General Purpose (T3)' },
  { value: 't3.2xlarge', label: 't3.2xlarge (8 vCPU, 32 GB)', category: 'General Purpose (T3)' },
  // Compute Optimized
  { value: 'c5.large', label: 'c5.large (2 vCPU, 4 GB)', category: 'Compute Optimized' },
  { value: 'c5.xlarge', label: 'c5.xlarge (4 vCPU, 8 GB)', category: 'Compute Optimized' },
  { value: 'c5.2xlarge', label: 'c5.2xlarge (8 vCPU, 16 GB)', category: 'Compute Optimized' },
  { value: 'c5.4xlarge', label: 'c5.4xlarge (16 vCPU, 32 GB)', category: 'Compute Optimized' },
  // Memory Optimized
  { value: 'r5.large', label: 'r5.large (2 vCPU, 16 GB)', category: 'Memory Optimized' },
  { value: 'r5.xlarge', label: 'r5.xlarge (4 vCPU, 32 GB)', category: 'Memory Optimized' },
  { value: 'r5.2xlarge', label: 'r5.2xlarge (8 vCPU, 64 GB)', category: 'Memory Optimized' }
];

const instanceCategories = computed(() => {
  return [...new Set(instanceTypes.map(t => t.category))];
});

function getInstancesByCategory(category) {
  return instanceTypes.filter(t => t.category === category);
}

const scheduleDescription = computed(() => {
  try {
    const rule = rrulestr(form.value.rrule);
    return rule.toText();
  } catch (error) {
    return 'Invalid schedule';
  }
});

const scaleBackDescription = computed(() => {
  try {
    const rule = rrulestr(scaleBackForm.value.rrule);
    return rule.toText();
  } catch (error) {
    return 'Invalid schedule';
  }
});

function toggleDay(day) {
  const index = selectedDays.value.indexOf(day);
  if (index > -1) {
    selectedDays.value.splice(index, 1);
  } else {
    selectedDays.value.push(day);
  }
  selectedDays.value.sort((a, b) => a - b);
  updateRRule();
}

function updateRRule() {
  const [hour, minute] = scaleTime.value.split(':');
  let rrule = '';

  switch (scheduleType.value) {
    case 'daily':
      rrule = `FREQ=DAILY;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekdays':
      rrule = `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekends':
      rrule = `FREQ=WEEKLY;BYDAY=SA,SU;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekly':
      if (selectedDays.value.length === 0) {
        rrule = `FREQ=DAILY;BYHOUR=${hour};BYMINUTE=${minute}`;
      } else {
        const dayMap = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
        const days = selectedDays.value.map(d => dayMap[d]).join(',');
        rrule = `FREQ=WEEKLY;BYDAY=${days};BYHOUR=${hour};BYMINUTE=${minute}`;
      }
      break;
  }

  form.value.rrule = rrule;
}

function updateScaleBackRRule() {
  const [hour, minute] = scaleBackTime.value.split(':');
  let rrule = '';

  switch (scheduleType.value) {
    case 'daily':
      rrule = `FREQ=DAILY;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekdays':
      rrule = `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekends':
      rrule = `FREQ=WEEKLY;BYDAY=SA,SU;BYHOUR=${hour};BYMINUTE=${minute}`;
      break;
    case 'weekly':
      if (selectedDays.value.length === 0) {
        rrule = `FREQ=DAILY;BYHOUR=${hour};BYMINUTE=${minute}`;
      } else {
        const dayMap = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
        const days = selectedDays.value.map(d => dayMap[d]).join(',');
        rrule = `FREQ=WEEKLY;BYDAY=${days};BYHOUR=${hour};BYMINUTE=${minute}`;
      }
      break;
  }

  scaleBackForm.value.rrule = rrule;
}

// Set default schedule names
form.value.name = `${props.server.name} - Scale Down`;
scaleBackForm.value.name = `${props.server.name} - Scale Back Up`;

// Generate initial rrules
updateRRule();
updateScaleBackRRule();

// Watch for time changes
watch(scaleTime, updateRRule);
watch(scaleBackTime, updateScaleBackRRule);
watch(scheduleType, () => {
  updateRRule();
  updateScaleBackRRule();
});
watch(selectedDays, updateRRule);

watch(() => form.value.timezone, (newTimezone) => {
  scaleBackForm.value.timezone = newTimezone;
});

watch(() => form.value.targetInstanceType, (newType) => {
  // When scaling down, the scale-back should return to original
  if (form.value.action === 'scale_down') {
    scaleBackForm.value.targetInstanceType = props.server.instanceType;
    scaleBackForm.value.originalInstanceType = newType;
  }
});

async function saveSchedule() {
  try {
    saving.value = true;
    
    // Build the payload with only non-empty values
    const payload = {
      ...form.value
    };
    
    // Remove empty volume fields if volume scaling is not enabled
    if (!enableVolumeScaling.value) {
      delete payload.targetVolumeSize;
      delete payload.targetVolumeType;
      delete payload.targetVolumeIops;
      delete payload.targetVolumeThroughput;
      delete payload.originalVolumeSize;
      delete payload.originalVolumeType;
      delete payload.originalVolumeIops;
      delete payload.originalVolumeThroughput;
    }
    
    // Create the scale down/up schedule
    await apiClient.post('/schedules', payload);
    
    // If scale down with auto scale-back, create a second schedule
    if (form.value.action === 'scale_down' && enableAutoScaleBack.value) {
      const scaleBackPayload = {
        ...scaleBackForm.value
      };
      
      // If volume scaling was enabled, set scale-back volume config
      if (enableVolumeScaling.value) {
        scaleBackPayload.targetVolumeSize = form.value.originalVolumeSize;
        scaleBackPayload.targetVolumeType = form.value.originalVolumeType;
        scaleBackPayload.targetVolumeIops = form.value.originalVolumeIops;
        scaleBackPayload.targetVolumeThroughput = form.value.originalVolumeThroughput;
        scaleBackPayload.originalVolumeSize = form.value.targetVolumeSize;
        scaleBackPayload.originalVolumeType = form.value.targetVolumeType;
        scaleBackPayload.originalVolumeIops = form.value.targetVolumeIops;
        scaleBackPayload.originalVolumeThroughput = form.value.targetVolumeThroughput;
      } else {
        delete scaleBackPayload.targetVolumeSize;
        delete scaleBackPayload.targetVolumeType;
        delete scaleBackPayload.targetVolumeIops;
        delete scaleBackPayload.targetVolumeThroughput;
        delete scaleBackPayload.originalVolumeSize;
        delete scaleBackPayload.originalVolumeType;
        delete scaleBackPayload.originalVolumeIops;
        delete scaleBackPayload.originalVolumeThroughput;
      }
      
      await apiClient.post('/schedules', scaleBackPayload);
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

