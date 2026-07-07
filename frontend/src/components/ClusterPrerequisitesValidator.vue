<template>
  <div class="space-y-4">
    <!-- Overall Status Banner -->
    <div 
      v-if="validationResult"
      :class="[
        'rounded-xl p-5 border-2',
        validationResult.overall.status === 'success' ? 'bg-green-500/10 border-green-500/30' :
        validationResult.overall.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
        'bg-red-500/10 border-red-500/30'
      ]"
    >
      <div class="flex items-start space-x-4">
        <div class="flex-shrink-0 mt-1">
          <svg 
            v-if="validationResult.overall.status === 'success'" 
            class="w-8 h-8 text-green-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <svg 
            v-else-if="validationResult.overall.status === 'warning'" 
            class="w-8 h-8 text-yellow-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <svg 
            v-else 
            class="w-8 h-8 text-red-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h3 
            :class="[
              'text-lg font-bold mb-1',
              validationResult.overall.status === 'success' ? 'text-green-300' :
              validationResult.overall.status === 'warning' ? 'text-yellow-300' :
              'text-red-300'
            ]"
          >
            {{ validationResult.overall.message }}
          </h3>
          <p 
            :class="[
              'text-sm',
              validationResult.overall.status === 'success' ? 'text-green-400/80' :
              validationResult.overall.status === 'warning' ? 'text-yellow-400/80' :
              'text-red-400/80'
            ]"
          >
            <span v-if="validationResult.overall.criticalIssues > 0">
              {{ validationResult.overall.criticalIssues }} critical issue(s) • 
            </span>
            <span v-if="validationResult.overall.warnings > 0">
              {{ validationResult.overall.warnings }} warning(s) •
            </span>
            {{ validationResult.serversSummary.total }} servers validated
          </p>
        </div>
      </div>
    </div>

    <!-- Validation Checks -->
    <div v-if="validationResult && validationResult.checks.length > 0" class="space-y-3">
      <h4 class="text-sm font-semibold text-gray-300 uppercase tracking-wider">Pre-requisites Validation</h4>
      
      <div 
        v-for="(check, index) in validationResult.checks" 
        :key="index"
        class="bg-gray-800/50 rounded-lg border border-gray-700 p-4"
      >
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0 mt-0.5">
            <div 
              :class="[
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                check.status === 'success' ? 'bg-green-500/20 text-green-400' :
                check.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              ]"
            >
              <span v-if="check.status === 'success'">✓</span>
              <span v-else-if="check.status === 'warning'">!</span>
              <span v-else>✗</span>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <h5 class="text-sm font-semibold text-white">{{ check.name }}</h5>
              <span class="text-xs text-gray-500 px-2 py-0.5 bg-gray-700/50 rounded">{{ check.category }}</span>
            </div>
            <p class="text-sm text-gray-300 mb-1">{{ check.message }}</p>
            <p class="text-xs text-gray-500">{{ check.details }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div v-if="validationResult && validationResult.recommendations.length > 0" class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
      <h4 class="text-sm font-semibold text-blue-300 mb-2 flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        Recommendations
      </h4>
      <ul class="space-y-1">
        <li 
          v-for="(rec, index) in validationResult.recommendations" 
          :key="index"
          class="text-sm text-blue-300 flex items-start"
        >
          <span class="mr-2">•</span>
          <span>{{ rec }}</span>
        </li>
      </ul>
    </div>

    <!-- Loading State -->
    <div v-if="validating" class="flex items-center justify-center py-8">
      <svg class="animate-spin h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Action Buttons -->
    <div v-if="validationResult && !validationResult.isReady" class="flex items-center space-x-3">
      <button
        @click="$emit('retry')"
        class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
      >
        🔄 Re-validate
      </button>
      <button
        v-if="showAutoSetup && hasSecurityGroupIssue"
        @click="$emit('auto-setup')"
        class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
      >
        ⚡ Auto-Setup Security Groups
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  validationResult: {
    type: Object,
    default: null
  },
  validating: {
    type: Boolean,
    default: false
  },
  showAutoSetup: {
    type: Boolean,
    default: true
  }
});

defineEmits(['retry', 'auto-setup']);

const hasSecurityGroupIssue = computed(() => {
  if (!props.validationResult || !props.validationResult.checks) return false;
  
  return props.validationResult.checks.some(check => 
    (check.category === 'Security' && check.status !== 'success')
  );
});
</script>
