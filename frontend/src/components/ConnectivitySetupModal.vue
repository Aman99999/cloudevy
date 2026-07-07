<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <div>
          <h2 class="text-2xl font-bold text-white">Setup Network Access</h2>
          <p class="text-sm text-gray-400 mt-1">Enable CloudEvy monitoring for your cluster</p>
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

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Connection Info -->
        <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-gray-400">CloudEvy Server</p>
              <p class="text-white font-mono">{{ connectivityInfo?.cloudEvyIP || 'Loading...' }}</p>
            </div>
            <div>
              <p class="text-gray-400">Required Port</p>
              <p class="text-white font-mono">{{ connectivityInfo?.requiredPort || 6443 }}</p>
            </div>
            <div>
              <p class="text-gray-400">Master Node</p>
              <p class="text-white font-mono">{{ masterIP }}</p>
            </div>
          </div>
        </div>

        <!-- Platform Selector -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-300 mb-3">Select Your Platform:</label>
          <div class="grid grid-cols-4 gap-3">
            <button
              v-for="platform in platforms"
              :key="platform.id"
              @click="selectedPlatform = platform.id"
              :class="[
                'px-4 py-3 rounded-lg border-2 transition font-medium',
                selectedPlatform === platform.id
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
              ]"
            >
              {{ platform.name }}
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div v-if="instructions" class="space-y-4">
          <h3 class="text-lg font-bold text-white">{{ instructions.title }}</h3>

          <!-- Steps -->
          <div class="space-y-4">
            <div
              v-for="step in instructions.steps"
              :key="step.number"
              class="bg-gray-800 border border-gray-700 rounded-lg p-4"
            >
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {{ step.number }}
                </div>
                <div class="flex-1">
                  <h4 class="text-white font-bold mb-1">{{ step.title }}</h4>
                  <p class="text-gray-400 text-sm mb-2">{{ step.description }}</p>
                  
                  <!-- Link if available -->
                  <a
                    v-if="step.link"
                    :href="step.link"
                    target="_blank"
                    class="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center"
                  >
                    Open in new tab
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>

                  <!-- Rule details if available -->
                  <div v-if="step.rule" class="mt-3 bg-gray-900 border border-gray-700 rounded p-3 text-sm">
                    <div class="grid grid-cols-2 gap-2">
                      <div v-for="(value, key) in step.rule" :key="key">
                        <span class="text-gray-500">{{ formatKey(key) }}:</span>
                        <span class="text-white ml-2">{{ value }}</span>
                      </div>
                    </div>
                    <button
                      @click="copyRule(step.rule)"
                      class="mt-2 text-blue-400 hover:text-blue-300 text-xs flex items-center"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Rule Details
                    </button>
                  </div>

                  <!-- Command if available -->
                  <div v-if="step.command" class="mt-3 bg-gray-900 border border-gray-700 rounded p-3">
                    <pre class="text-xs text-gray-300 overflow-x-auto">{{ step.command }}</pre>
                    <button
                      @click="copyToClipboard(step.command)"
                      class="mt-2 text-blue-400 hover:text-blue-300 text-xs flex items-center"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Command
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CLI Commands -->
          <div v-if="instructions.awsCLI || instructions.azureCLI || instructions.gcloudCLI || instructions.iptables" class="mt-6">
            <h4 class="text-white font-bold mb-3">Command Line Options:</h4>
            
            <div v-if="instructions.awsCLI" class="mb-4">
              <p class="text-sm text-gray-400 mb-2">AWS CLI:</p>
              <div class="bg-gray-900 border border-gray-700 rounded p-3">
                <pre class="text-xs text-gray-300 overflow-x-auto">{{ instructions.awsCLI }}</pre>
                <button
                  @click="copyToClipboard(instructions.awsCLI)"
                  class="mt-2 text-blue-400 hover:text-blue-300 text-xs"
                >
                  Copy Command
                </button>
              </div>
            </div>

            <div v-if="instructions.terraform" class="mb-4">
              <p class="text-sm text-gray-400 mb-2">Terraform:</p>
              <div class="bg-gray-900 border border-gray-700 rounded p-3">
                <pre class="text-xs text-gray-300 overflow-x-auto">{{ instructions.terraform }}</pre>
                <button
                  @click="copyToClipboard(instructions.terraform)"
                  class="mt-2 text-blue-400 hover:text-blue-300 text-xs"
                >
                  Copy Code
                </button>
              </div>
            </div>

            <div v-if="instructions.azureCLI" class="mb-4">
              <p class="text-sm text-gray-400 mb-2">Azure CLI:</p>
              <div class="bg-gray-900 border border-gray-700 rounded p-3">
                <pre class="text-xs text-gray-300 overflow-x-auto">{{ instructions.azureCLI }}</pre>
                <button
                  @click="copyToClipboard(instructions.azureCLI)"
                  class="mt-2 text-blue-400 hover:text-blue-300 text-xs"
                >
                  Copy Command
                </button>
              </div>
            </div>

            <div v-if="instructions.gcloudCLI" class="mb-4">
              <p class="text-sm text-gray-400 mb-2">Google Cloud CLI:</p>
              <div class="bg-gray-900 border border-gray-700 rounded p-3">
                <pre class="text-xs text-gray-300 overflow-x-auto">{{ instructions.gcloudCLI }}</pre>
                <button
                  @click="copyToClipboard(instructions.gcloudCLI)"
                  class="mt-2 text-blue-400 hover:text-blue-300 text-xs"
                >
                  Copy Command
                </button>
              </div>
            </div>
          </div>

          <!-- IAM Policy for AWS -->
          <div v-if="instructions.requiredIAMPolicy" class="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 class="text-white font-bold mb-2">🔐 For Auto-Configuration (Optional)</h4>
            <p class="text-sm text-gray-400 mb-3">
              To enable automatic security group configuration, your AWS credentials need these permissions:
            </p>
            <div class="bg-gray-900 border border-gray-700 rounded p-3">
              <pre class="text-xs text-gray-300 overflow-x-auto">{{ JSON.stringify(instructions.requiredIAMPolicy, null, 2) }}</pre>
              <button
                @click="copyToClipboard(JSON.stringify(instructions.requiredIAMPolicy, null, 2))"
                class="mt-2 text-blue-400 hover:text-blue-300 text-xs"
              >
                Copy IAM Policy
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else class="flex items-center justify-center py-12">
          <svg class="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-700 p-6 flex items-center justify-between">
        <button
          @click="$emit('close')"
          class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
        >
          Close
        </button>
        <button
          @click="testConnectivity"
          :disabled="testing"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition flex items-center space-x-2"
        >
          <svg v-if="testing" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ testing ? 'Testing...' : 'Test Connection' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import apiClient from '@/api/client';
import { useToast } from '@/composables/useToast';

const toast = useToast();

const props = defineProps({
  cluster: { type: Object, required: true },
  masterIP: { type: String, required: true }
});

const emit = defineEmits(['close', 'connectivity-updated']);

const platforms = [
  { id: 'aws', name: 'AWS' },
  { id: 'azure', name: 'Azure' },
  { id: 'gcp', name: 'GCP' },
  { id: 'generic', name: 'Other' }
];

const selectedPlatform = ref('aws');
const connectivityInfo = ref(null);
const instructions = ref(null);
const testing = ref(false);

// Fetch connectivity info
async function fetchConnectivityInfo() {
  try {
    const response = await apiClient.get('/connectivity/info');
    connectivityInfo.value = response.data.data;
  } catch (error) {
    console.error('Failed to fetch connectivity info:', error);
  }
}

// Fetch instructions for selected platform
async function fetchInstructions() {
  try {
    const response = await apiClient.get(`/connectivity/instructions/${props.cluster.id}?platform=${selectedPlatform.value}`);
    instructions.value = response.data.data.instructions;
  } catch (error) {
    console.error('Failed to fetch instructions:', error);
    toast.error('Failed to load instructions');
  }
}

// Test connectivity
async function testConnectivity() {
  testing.value = true;
  try {
    const response = await apiClient.post(`/connectivity/test/${props.cluster.id}`);
    if (response.data.success) {
      toast.success('Connection successful! Monitoring is now active.');
      emit('connectivity-updated', 'connected');
      setTimeout(() => emit('close'), 2000);
    } else {
      toast.error(response.data.message || 'Connection test failed');
    }
  } catch (error) {
    console.error('Test connectivity error:', error);
    toast.error(error.response?.data?.message || 'Failed to test connectivity');
  } finally {
    testing.value = false;
  }
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Copied to clipboard!');
  }).catch(() => {
    toast.error('Failed to copy');
  });
}

// Copy rule details
function copyRule(rule) {
  const text = Object.entries(rule).map(([key, value]) => `${formatKey(key)}: ${value}`).join('\n');
  copyToClipboard(text);
}

// Format key name
function formatKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Watch platform changes
watch(selectedPlatform, () => {
  fetchInstructions();
});

onMounted(() => {
  fetchConnectivityInfo();
  fetchInstructions();
});
</script>

