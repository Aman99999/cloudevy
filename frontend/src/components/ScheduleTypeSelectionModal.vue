<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div class="relative inline-block w-full max-w-xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl rounded-2xl border border-gray-700">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-2xl font-bold text-white mb-1">
              Create Scheduled Job
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

        <!-- Schedule Type Selection -->
        <div class="space-y-4">
          <p class="text-gray-300 text-sm mb-6">
            Choose the type of scheduled job you want to create for this server:
          </p>

          <!-- Scheduled Downtime Option -->
          <button
            @click="selectType('downtime')"
            class="w-full p-6 border-2 border-gray-700 hover:border-purple-500 bg-gray-900/30 hover:bg-purple-500/10 rounded-xl transition-all group"
          >
            <div class="flex items-start space-x-4">
              <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition">
                <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1 text-left">
                <h4 class="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition">
                  Scheduled Downtime
                </h4>
                <p class="text-sm text-gray-400">
                  Schedule automatic server stop, start, or reboot operations. Perfect for non-production servers or maintenance windows.
                </p>
              </div>
            </div>
          </button>

          <!-- Scheduled Configuration Scaling Option -->
          <button
            v-if="server.instanceType"
            @click="selectType('scaling')"
            class="w-full p-6 border-2 border-gray-700 hover:border-cyan-500 bg-gray-900/30 hover:bg-cyan-500/10 rounded-xl transition-all group"
          >
            <div class="flex items-start space-x-4">
              <div class="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition">
                <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div class="flex-1 text-left">
                <h4 class="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition">
                  Scheduled Configuration Scaling
                </h4>
                <p class="text-sm text-gray-400">
                  Automatically scale your server up or down based on time. Reduce costs during low-traffic hours by downsizing, then scale back up when needed.
                </p>
                <div class="mt-3 flex items-center space-x-2 text-xs">
                  <span class="px-2 py-1 bg-green-500/20 text-green-400 rounded">Cost Saving</span>
                  <span class="text-gray-500">Current: {{ server.instanceType }}</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <!-- Cancel Button -->
        <div class="mt-6 flex justify-end">
          <button
            @click="$emit('close')"
            class="px-6 py-3 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  server: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'selectType']);

function selectType(type) {
  emit('selectType', type);
  emit('close');
}
</script>

