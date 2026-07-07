<template>
  <div class="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <h3 class="text-sm font-semibold text-white">Live Installation Logs</h3>
        <span class="text-xs text-gray-500">{{ logs.length }} entries</span>
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="autoscroll = !autoscroll"
          :class="[
            'px-3 py-1 text-xs font-medium rounded transition',
            autoscroll 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          {{ autoscroll ? '📌 Auto-scroll' : '📌 Scroll locked' }}
        </button>
        <button
          @click="clearLogs"
          class="px-3 py-1 text-xs font-medium rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Logs Container -->
    <div 
      ref="logsContainer"
      class="bg-black p-4 font-mono text-xs h-96 overflow-y-auto"
      @scroll="handleScroll"
    >
      <div v-if="logs.length === 0" class="text-gray-600 italic">
        Waiting for installation to start...
      </div>
      
      <div
        v-for="(log, index) in logs"
        :key="index"
        :class="[
          'mb-1 leading-relaxed',
          log.level === 'stderr' ? 'text-red-400' :
          log.level === 'info' ? 'text-blue-400' :
          log.level === 'success' ? 'text-green-400' :
          'text-gray-300'
        ]"
      >
        <span class="text-gray-600">{{ formatTime(log.timestamp) }}</span>
        <span v-if="log.server" class="text-purple-400 mx-2">[{{ log.server }}]</span>
        <span>{{ log.message }}</span>
      </div>
    </div>

    <!-- Footer Stats -->
    <div class="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
      <div class="flex items-center space-x-4">
        <span>Lines: {{ logs.length }}</span>
        <span v-if="stats.errors > 0" class="text-red-400">Errors: {{ stats.errors }}</span>
        <span v-if="stats.servers > 0" class="text-purple-400">Servers: {{ stats.servers }}</span>
      </div>
      <div class="text-gray-500">
        Press Ctrl+C to copy
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  }
});

const logsContainer = ref(null);
const autoscroll = ref(true);

const stats = computed(() => {
  const servers = new Set();
  let errors = 0;

  props.logs.forEach(log => {
    if (log.server) servers.add(log.server);
    if (log.level === 'stderr') errors++;
  });

  return {
    servers: servers.size,
    errors
  };
});

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function handleScroll() {
  if (!logsContainer.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = logsContainer.value;
  const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
  
  // If user scrolled up, disable autoscroll
  if (!isAtBottom && autoscroll.value) {
    autoscroll.value = false;
  }
}

function scrollToBottom() {
  if (!logsContainer.value || !autoscroll.value) return;
  
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  });
}

function clearLogs() {
  if (confirm('Clear all logs?')) {
    // Emit event to parent
    // For now, just scroll to top
    if (logsContainer.value) {
      logsContainer.value.scrollTop = 0;
    }
  }
}

// Watch for new logs and auto-scroll
watch(() => props.logs.length, () => {
  scrollToBottom();
});
</script>

