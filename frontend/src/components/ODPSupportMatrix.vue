<template>
  <div class="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl border border-purple-500/30 shadow-2xl min-h-screen flex flex-col">
    
    <!-- Header with Progress -->
    <div class="px-8 py-6 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/40 to-pink-900/40">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-3xl font-bold text-white mb-1">Select ODP Version</h2>
          <p class="text-gray-300">Choose the version that matches your infrastructure</p>
        </div>
        <div v-if="selectedODP" class="flex items-center space-x-2 bg-green-500/20 border border-green-500/40 px-4 py-2 rounded-lg">
          <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="text-green-300 font-semibold">Version Selected</span>
        </div>
      </div>
      
      <!-- Step Indicator -->
      <div class="flex items-center space-x-2 text-sm">
        <div class="flex items-center">
          <div :class="selectedODP ? 'bg-green-500' : 'bg-purple-500'" class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">
            <svg v-if="selectedODP" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
            <span v-else>1</span>
          </div>
          <span class="ml-2 text-white font-medium">Select Version</span>
        </div>
        <div class="flex-1 h-0.5 bg-gray-700 mx-3"></div>
        <div class="flex items-center">
          <div :class="selectedODP ? 'bg-purple-500' : 'bg-gray-700'" class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">2</div>
          <span :class="selectedODP ? 'text-white' : 'text-gray-500'" class="ml-2 font-medium">View Compatibility</span>
        </div>
        <div class="flex-1 h-0.5 bg-gray-700 mx-3"></div>
        <div class="flex items-center">
          <div :class="selectedODP ? 'bg-purple-500' : 'bg-gray-700'" class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">3</div>
          <span :class="selectedODP ? 'text-white' : 'text-gray-500'" class="ml-2 font-medium">Continue</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <svg class="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-400">Loading ODP versions...</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="flex-1 overflow-y-auto px-8 py-6 pb-32">
      
      <!-- ODP Versions Selection -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">📦 Available ODP Versions</h3>
          <span class="text-sm text-gray-400">{{ matrixData.odpVersions.length }} versions available</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            v-for="version in matrixData.odpVersions"
            :key="version"
            @click="selectODPVersion(version)"
            class="group relative px-4 py-3 rounded-xl border-2 transition-all duration-300 font-mono text-sm font-semibold"
            :class="{
              'bg-gradient-to-br from-pink-500 to-purple-500 border-pink-400 text-white shadow-lg shadow-pink-500/50 scale-105': selectedODP === version,
              'bg-gray-800 border-gray-600 text-gray-300 hover:border-purple-500 hover:bg-gray-700 hover:scale-105': selectedODP !== version
            }"
          >
            <div v-if="selectedODP === version" class="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            {{ version }}
          </button>
        </div>
      </div>

      <!-- Compatibility Matrix (only show when version selected) -->
      <div v-if="selectedODP" class="space-y-6 animate-fadeIn">
        
        <!-- Info Banner -->
        <div class="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 rounded-xl p-5">
          <div class="flex items-start">
            <svg class="w-6 h-6 text-purple-300 mr-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h4 class="text-white font-bold text-lg mb-1">ODP {{ selectedODP }} - Compatibility Matrix</h4>
              <p class="text-purple-200 text-sm mb-2">The following components are compatible with this version:</p>
              <div class="flex items-center space-x-4 text-xs text-purple-300">
                <div class="flex items-center">
                  <span class="inline-block w-3 h-3 bg-purple-500 rounded mr-2"></span>
                  Compatible
                </div>
                <div class="flex items-center">
                  <span class="inline-block w-3 h-3 bg-gray-600 rounded mr-2"></span>
                  Not compatible
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Compatibility Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Ambari Versions -->
          <div class="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
              </svg>
              Ambari Versions
            </h4>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="version in matrixData.ambariVersions"
                :key="version"
                class="px-3 py-2 rounded-lg border transition-all font-mono text-xs"
                :class="isAmbariCompatible(version)
                  ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                  : 'bg-gray-700/50 border-gray-600 text-gray-500'"
              >
                {{ version }}
              </div>
            </div>
          </div>

          <!-- Operating Systems -->
          <div class="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              Operating Systems
            </h4>
            <div class="space-y-3">
              <div v-for="(osData, osKey) in matrixData.operatingSystems" :key="osKey" class="flex items-center justify-between">
                <span class="text-gray-400 text-sm font-medium w-24">{{ osData.name }}</span>
                <div class="flex flex-wrap gap-2 flex-1">
                  <div
                    v-for="version in osData.versions"
                    :key="`${osKey}-${version}`"
                    class="px-3 py-1 rounded-lg border transition-all text-xs"
                    :class="isOSCompatible(osKey, version)
                      ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                      : 'bg-gray-700/50 border-gray-600 text-gray-500'"
                  >
                    {{ version }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Java Versions (ODP) -->
          <div class="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              ODP JDK Versions
            </h4>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="version in matrixData.javaVersions.odp"
                :key="`odp-jdk-${version}`"
                class="px-4 py-2 rounded-lg border transition-all text-sm font-semibold"
                :class="isODPJdkCompatible(version)
                  ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                  : 'bg-gray-700/50 border-gray-600 text-gray-500'"
              >
                JDK {{ version }}
              </div>
            </div>
          </div>

          <!-- Java Versions (Ambari) -->
          <div class="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              Ambari JDK Versions
            </h4>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="version in matrixData.javaVersions.ambari"
                :key="`ambari-jdk-${version}`"
                class="px-4 py-2 rounded-lg border transition-all text-sm font-semibold"
                :class="isAmbariJdkCompatible(version)
                  ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                  : 'bg-gray-700/50 border-gray-600 text-gray-500'"
              >
                JDK {{ version }}
              </div>
            </div>
          </div>

          <!-- Python Versions -->
          <div class="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
              </svg>
              Python Versions
            </h4>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="version in matrixData.pythonVersions"
                :key="`python-${version}`"
                class="px-4 py-2 rounded-lg border transition-all text-sm font-semibold"
                :class="isPythonCompatible(version)
                  ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                  : 'bg-gray-700/50 border-gray-600 text-gray-500'"
              >
                Python {{ version }}
              </div>
            </div>
          </div>

          <!-- Databases -->
          <div class="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
              </svg>
              Supported Databases
            </h4>
            <div class="space-y-2">
              <div v-for="(dbData, dbKey) in matrixData.databases" :key="dbKey" class="flex items-center justify-between">
                <span class="text-gray-400 text-xs font-medium w-24">{{ dbData.name }}</span>
                <div class="flex flex-wrap gap-1 flex-1">
                  <div
                    v-for="version in dbData.versions"
                    :key="`${dbKey}-${version}`"
                    class="px-2 py-1 rounded-md border transition-all text-xs"
                    :class="isDatabaseCompatible(dbKey, version)
                      ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                      : 'bg-gray-700/50 border-gray-600 text-gray-500'"
                  >
                    {{ version }}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6 border-4 border-purple-500/30">
          <svg class="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"></path>
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-white mb-2">Select an ODP Version</h3>
        <p class="text-gray-400 max-w-md">Choose an ODP version above to view its compatibility matrix with Ambari, OS, Java, Python, and databases.</p>
      </div>

    </div>

    <!-- Fixed Bottom Action Bar -->
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent border-t border-purple-500/30 px-8 py-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div v-if="selectedODP" class="bg-purple-500/20 border border-purple-500/40 rounded-lg px-4 py-3">
            <div class="text-xs text-purple-300 mb-1">Selected Version</div>
            <div class="text-lg font-bold text-white font-mono">ODP {{ selectedODP }}</div>
          </div>
          <div v-else class="text-gray-500 text-sm">
            No version selected yet
          </div>
        </div>
        
        <button
          @click="handleNext"
          :disabled="!selectedODP"
          class="px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 shadow-2xl"
          :class="selectedODP 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-purple-500/50 hover:scale-105' 
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'"
        >
          <span>{{ selectedODP ? 'Continue to Next Step' : 'Select a Version First' }}</span>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api/client';

const loading = ref(true);
const matrixData = ref({
  odpVersions: [],
  ambariVersions: [],
  operatingSystems: {},
  javaVersions: { odp: [], ambari: [] },
  pythonVersions: [],
  databases: {},
  compatibility: {}
});

const selectedODP = ref(null);
const currentCompatibility = ref(null);

const emit = defineEmits(['odp-version-selected', 'close', 'next']);

async function fetchMatrix() {
  try {
    loading.value = true;
    const response = await apiClient.get('/odp-matrix');
    matrixData.value = response.data.data;
  } catch (error) {
    console.error('Failed to fetch ODP matrix:', error);
  } finally {
    loading.value = false;
  }
}

function selectODPVersion(version) {
  selectedODP.value = version;
  currentCompatibility.value = matrixData.value.compatibility[version] || null;
  
  // Emit the selected ODP version
  emit('odp-version-selected', version);
}

function isAmbariCompatible(version) {
  return currentCompatibility.value?.ambari.includes(version) || false;
}

function isOSCompatible(osType, osVersion) {
  return currentCompatibility.value?.os[osType]?.includes(osVersion) || false;
}

function isODPJdkCompatible(version) {
  return currentCompatibility.value?.odpJdk.includes(version) || false;
}

function isAmbariJdkCompatible(version) {
  return currentCompatibility.value?.ambariJdk.includes(version) || false;
}

function isPythonCompatible(version) {
  return currentCompatibility.value?.python.includes(version) || false;
}

function isDatabaseCompatible(dbType, version) {
  return currentCompatibility.value?.database[dbType]?.includes(version) || false;
}

function handleNext() {
  if (!selectedODP.value) return;
  emit('next');
}

onMounted(() => {
  fetchMatrix();
});
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}
</style>
