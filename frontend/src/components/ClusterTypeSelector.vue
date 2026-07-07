<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl border border-gray-700 overflow-hidden">
      
      <!-- Header -->
      <div class="px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold text-white mb-2">Create New Cluster</h2>
            <p class="text-gray-300">Choose the type of cluster you want to create</p>
          </div>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Kubernetes Cluster -->
          <button
            @click="selectType('kubernetes')"
            class="group relative p-8 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-105"
            :class="selectedType === 'kubernetes'
              ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-blue-600/10 shadow-lg shadow-blue-500/30'
              : 'border-gray-700 bg-gray-800/50 hover:border-blue-500/50'"
          >
            <div v-if="selectedType === 'kubernetes'" class="absolute -top-3 -right-3 bg-blue-500 rounded-full p-2">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            <div class="text-6xl mb-4">☸️</div>
            <h3 class="text-2xl font-bold text-white mb-3">Kubernetes Cluster</h3>
            <p class="text-gray-400 mb-4 text-sm leading-relaxed">
              Container orchestration platform for modern cloud-native applications. Deploy, scale, and manage containerized workloads.
            </p>

            <div class="space-y-2 mb-4">
              <div class="flex items-center text-sm text-gray-300">
                <svg class="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Container orchestration
              </div>
              <div class="flex items-center text-sm text-gray-300">
                <svg class="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Auto-scaling & self-healing
              </div>
              <div class="flex items-center text-sm text-gray-300">
                <svg class="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Microservices architecture
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-gray-700">
              <span class="text-xs text-gray-500">Best for: Apps, APIs, Services</span>
              <span class="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full">Quick Setup</span>
            </div>
          </button>

          <!-- HDFS/Hadoop Cluster -->
          <button
            @click="selectType('hdfs')"
            class="group relative p-8 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-105"
            :class="selectedType === 'hdfs'
              ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-orange-600/10 shadow-lg shadow-orange-500/30'
              : 'border-gray-700 bg-gray-800/50 hover:border-orange-500/50'"
          >
            <div v-if="selectedType === 'hdfs'" class="absolute -top-3 -right-3 bg-orange-500 rounded-full p-2">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            <div class="text-6xl mb-4">🐘</div>
            <h3 class="text-2xl font-bold text-white mb-3">Hadoop/HDFS Cluster</h3>
            <p class="text-gray-400 mb-4 text-sm leading-relaxed">
              Distributed data processing framework for big data analytics. Store and process massive datasets across multiple machines.
            </p>

            <div class="space-y-2 mb-4">
              <div class="flex items-center text-sm text-gray-300">
                <svg class="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Distributed storage (HDFS)
              </div>
              <div class="flex items-center text-sm text-gray-300">
                <svg class="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                MapReduce & YARN processing
              </div>
              <div class="flex items-center text-sm text-gray-300">
                <svg class="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Spark, Hive, Kafka support
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-gray-700">
              <span class="text-xs text-gray-500">Best for: Big Data, Analytics</span>
              <span class="px-3 py-1 bg-orange-500/20 text-orange-300 text-xs font-semibold rounded-full">Advanced</span>
            </div>
          </button>

        </div>

        <!-- Continue Button -->
        <div class="mt-8 flex justify-end">
          <button
            @click="handleContinue"
            :disabled="!selectedType"
            class="px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center space-x-3"
            :class="selectedType
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:scale-105'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'"
          >
            <span>{{ selectedType ? 'Continue' : 'Select a Cluster Type' }}</span>
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'select']);

const selectedType = ref(null);

function selectType(type) {
  selectedType.value = type;
}

function handleContinue() {
  if (!selectedType.value) return;
  emit('select', selectedType.value);
}
</script>
