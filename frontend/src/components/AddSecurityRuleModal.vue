<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
        <h2 class="text-xl font-bold text-white flex items-center">
          <svg class="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add Inbound Rule
        </h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        <!-- Protocol Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Protocol</label>
          <select
            v-model="form.protocol"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
            <option value="icmp">ICMP</option>
            <option value="all">All Traffic</option>
          </select>
        </div>

        <!-- Port Range (only for TCP/UDP) -->
        <div v-if="form.protocol === 'tcp' || form.protocol === 'udp'" class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">From Port</label>
            <input
              v-model="form.fromPort"
              type="number"
              min="0"
              max="65535"
              placeholder="e.g., 6443"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">To Port</label>
            <input
              v-model="form.toPort"
              type="number"
              min="0"
              max="65535"
              placeholder="e.g., 6443"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Source Type -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Source Type</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="sourceType = 'cidr'"
              :class="[
                'px-4 py-3 rounded-lg border-2 transition font-medium',
                sourceType === 'cidr'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              ]"
            >
              <div class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                CIDR / IP
              </div>
            </button>
            <button
              @click="sourceType = 'sg'"
              :class="[
                'px-4 py-3 rounded-lg border-2 transition font-medium',
                sourceType === 'sg'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              ]"
            >
              <div class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                Security Group
              </div>
            </button>
          </div>
        </div>

        <!-- Source Input -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            {{ sourceType === 'cidr' ? 'CIDR Block / IP Address' : 'Security Group ID' }}
          </label>
          <div class="relative">
            <input
              v-model="form.source"
              :placeholder="sourceType === 'cidr' ? 'e.g., 203.0.113.0/24 or 203.0.113.25/32' : 'e.g., sg-0123456789abcdef0'"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
            <button
              v-if="sourceType === 'cidr'"
              @click="detectMyIP"
              :disabled="detectingIP"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded-lg transition"
            >
              {{ detectingIP ? 'Detecting...' : 'My IP' }}
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{ sourceType === 'cidr' ? 'Use /32 for a single IP address' : 'Enter the security group ID (sg-xxxxx)' }}
          </p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
          <input
            v-model="form.description"
            placeholder="e.g., K3s API server access"
            maxlength="255"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <!-- Common Port Presets -->
        <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p class="text-sm text-blue-400 font-semibold mb-2">Quick Presets:</p>
          <div class="flex flex-wrap gap-2">
            <button
              @click="applyPreset('ssh')"
              class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
            >
              SSH (22)
            </button>
            <button
              @click="applyPreset('http')"
              class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
            >
              HTTP (80)
            </button>
            <button
              @click="applyPreset('https')"
              class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
            >
              HTTPS (443)
            </button>
            <button
              @click="applyPreset('k3s')"
              class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
            >
              K3s API (6443)
            </button>
            <button
              @click="applyPreset('postgres')"
              class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
            >
              PostgreSQL (5432)
            </button>
            <button
              @click="applyPreset('mysql')"
              class="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
            >
              MySQL (3306)
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-700 flex items-center justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
        >
          Cancel
        </button>
        <button
          @click="addRule"
          :disabled="adding || !isFormValid"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center"
        >
          <svg v-if="adding" class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ adding ? 'Adding...' : 'Add Rule' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import apiClient from '@/api/client';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  isOpen: Boolean,
  serverId: Number,
  securityGroupId: String
});

const emit = defineEmits(['close', 'rule-added']);
const toast = useToast();

const sourceType = ref('cidr');
const adding = ref(false);
const detectingIP = ref(false);

const form = ref({
  protocol: 'tcp',
  fromPort: '',
  toPort: '',
  source: '',
  description: ''
});

const isFormValid = computed(() => {
  if (!form.value.source) return false;
  
  if (form.value.protocol === 'tcp' || form.value.protocol === 'udp') {
    if (!form.value.fromPort) return false;
  }
  
  return true;
});

const applyPreset = (preset) => {
  const presets = {
    ssh: { protocol: 'tcp', fromPort: '22', toPort: '22', description: 'SSH access' },
    http: { protocol: 'tcp', fromPort: '80', toPort: '80', description: 'HTTP access' },
    https: { protocol: 'tcp', fromPort: '443', toPort: '443', description: 'HTTPS access' },
    k3s: { protocol: 'tcp', fromPort: '6443', toPort: '6443', description: 'K3s API server' },
    postgres: { protocol: 'tcp', fromPort: '5432', toPort: '5432', description: 'PostgreSQL' },
    mysql: { protocol: 'tcp', fromPort: '3306', toPort: '3306', description: 'MySQL' }
  };

  const selected = presets[preset];
  if (selected) {
    form.value.protocol = selected.protocol;
    form.value.fromPort = selected.fromPort;
    form.value.toPort = selected.toPort;
    form.value.description = selected.description;
  }
};

const detectMyIP = async () => {
  detectingIP.value = true;
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    form.value.source = `${data.ip}/32`;
    toast.success(`Detected your IP: ${data.ip}`);
  } catch (error) {
    toast.error('Failed to detect your IP');
  } finally {
    detectingIP.value = false;
  }
};

const addRule = async () => {
  adding.value = true;
  try {
    const payload = {
      protocol: form.value.protocol,
      source: form.value.source,
      description: form.value.description
    };

    if (form.value.protocol === 'tcp' || form.value.protocol === 'udp') {
      payload.fromPort = form.value.fromPort;
      payload.toPort = form.value.toPort || form.value.fromPort;
    }

    const response = await apiClient.post(`/security-groups/${props.serverId}/inbound`, payload);

    if (response.data.success) {
      toast.success('Inbound rule added successfully!');
      emit('rule-added');
      emit('close');
      
      // Reset form
      form.value = {
        protocol: 'tcp',
        fromPort: '',
        toPort: '',
        source: '',
        description: ''
      };
    }
  } catch (error) {
    console.error('Failed to add rule:', error);
    toast.error(error.response?.data?.message || 'Failed to add inbound rule');
  } finally {
    adding.value = false;
  }
};
</script>

