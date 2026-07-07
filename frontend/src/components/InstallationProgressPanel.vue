<template>
  <div v-if="isVisible" class="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t-2 border-orange-500 shadow-2xl transition-all duration-300"
       :class="isMinimized ? 'h-16' : 'h-80'">
    
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-gray-700 cursor-pointer"
         @click="toggleMinimize">
      <div class="flex items-center space-x-4">
        <div class="animate-spin">
          <svg class="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-white font-semibold">
            Installing: {{ installation.clusterName }}
          </h3>
          <p class="text-sm text-gray-400">
            {{ installation.distribution }} • {{ installation.currentStep }}
          </p>
        </div>
      </div>
      
      <div class="flex items-center space-x-4">
        <!-- Progress percentage -->
        <div class="text-right">
          <div class="text-2xl font-bold text-orange-500">{{ progressPercentage }}%</div>
          <div class="text-xs text-gray-400">{{ installation.completedSteps }}/{{ installation.totalSteps }} steps</div>
        </div>
        
        <!-- Minimize/Expand button -->
        <button @click.stop="toggleMinimize" class="p-2 hover:bg-gray-800 rounded">
          <svg v-if="!isMinimized" class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          <svg v-else class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
          </svg>
        </button>
        
        <!-- Close button -->
        <button @click.stop="close" class="p-2 hover:bg-gray-800 rounded">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Progress bar -->
    <div class="px-6 py-2 bg-gray-800">
      <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
             :style="{ width: progressPercentage + '%' }">
        </div>
      </div>
    </div>
    
    <!-- Content (logs) -->
    <div v-if="!isMinimized" class="px-6 py-4 h-56 overflow-y-auto bg-black/30 font-mono text-sm">
      <div v-for="(log, index) in logs" :key="index" 
           class="mb-1"
           :class="{
             'text-green-400': log.level === 'info' || log.type === 'log',
             'text-red-400': log.level === 'error',
             'text-yellow-400': log.level === 'warn',
             'text-gray-400': log.level === 'stderr'
           }">
        <span class="text-gray-500 text-xs mr-2">{{ formatTime(log.timestamp) }}</span>
        <span v-if="log.server" class="text-blue-400 mr-2">[{{ log.server }}]</span>
        <span>{{ log.message }}</span>
      </div>
      
      <div v-if="logs.length === 0" class="text-gray-500 text-center py-8">
        Waiting for installation to start...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const isVisible = ref(false);
const isMinimized = ref(false);
const logs = ref([]);
const installation = ref({
  clusterName: '',
  clusterId: null,
  distribution: '',
  currentStep: 'Initializing...',
  completedSteps: 0,
  totalSteps: 10,
  status: 'running'
});

let ws = null;

const progressPercentage = computed(() => {
  return Math.round((installation.value.completedSteps / installation.value.totalSteps) * 100);
});

const stepMap = {
  'init': { order: 0, label: 'Initializing' },
  'validation': { order: 1, label: 'Validating nodes' },
  'config': { order: 2, label: 'Configuring' },
  'java': { order: 3, label: 'Installing Java' },
  'hadoop-download': { order: 4, label: 'Downloading Hadoop' },
  'hadoop-config': { order: 5, label: 'Configuring Hadoop' },
  'ssh-keys': { order: 6, label: 'Setting up SSH' },
  'namenode-format': { order: 7, label: 'Formatting NameNode' },
  'hdfs-start': { order: 8, label: 'Starting HDFS' },
  'yarn-start': { order: 9, label: 'Starting YARN' },
  'health-check': { order: 10, label: 'Health checks' },
  'optional-services': { order: 11, label: 'Installing services' }
};

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
};

const close = () => {
  isVisible.value = false;
  if (ws) {
    ws.close();
    ws = null;
  }
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false });
};

const connectWebSocket = (clusterId) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = import.meta.env.VITE_WS_PORT || '8002';
  
  ws = new WebSocket(`${protocol}//${host}:${port}/ws/logs`);
  
  ws.onopen = () => {
    console.log('📡 WebSocket connected for installation progress');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Filter messages for this cluster
      if (data.clusterId && data.clusterId !== installation.value.clusterId) {
        return;
      }
      
      // Add to logs
      if (data.message) {
        logs.value.push({
          message: data.message,
          level: data.level || 'info',
          type: data.type || 'log',
          server: data.server,
          timestamp: data.timestamp || new Date().toISOString()
        });
        
        // Keep only last 100 logs
        if (logs.value.length > 100) {
          logs.value = logs.value.slice(-100);
        }
      }
      
      // Update progress based on step
      if (data.step && stepMap[data.step]) {
        installation.value.currentStep = stepMap[data.step].label;
        
        if (data.status === 'completed') {
          installation.value.completedSteps = Math.max(
            installation.value.completedSteps,
            stepMap[data.step].order
          );
        }
      }
      
      // Check if installation is complete
      if (data.status === 'completed' && data.step === 'health-check') {
        setTimeout(() => {
          isVisible.value = false;
          if (ws) {
            ws.close();
            ws = null;
          }
        }, 3000);
      }
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('📡 WebSocket disconnected');
  };
};

const startInstallation = (cluster) => {
  installation.value = {
    clusterName: cluster.name,
    clusterId: cluster.id,
    distribution: cluster.distribution || 'Apache Hadoop',
    currentStep: 'Initializing...',
    completedSteps: 0,
    totalSteps: 10,
    status: 'running'
  };
  
  logs.value = [];
  isVisible.value = true;
  isMinimized.value = false;
  
  connectWebSocket(cluster.id);
};

// Expose method for parent component
defineExpose({
  startInstallation
});

onUnmounted(() => {
  if (ws) {
    ws.close();
  }
});
</script>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(249, 115, 22, 0.5);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(249, 115, 22, 0.7);
}
</style>
