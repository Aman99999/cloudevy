<template>
  <div class="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-pink-900/20">
      <div>
        <h3 class="text-lg font-bold text-white flex items-center">
          <svg class="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.040A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
          Security Group Management
        </h3>
        <p v-if="securityGroup" class="text-sm text-gray-400 mt-1">
          {{ securityGroup.groupName }} ({{ securityGroup.groupId }})
        </p>
      </div>
      <button
        @click="fetchSecurityGroup"
        :disabled="loading"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition flex items-center"
      >
        <svg v-if="loading" class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Refresh
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="p-6">
      <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
        <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <p class="text-red-400 font-semibold">Failed to load security group</p>
          <p class="text-sm text-red-300 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading && !securityGroup" class="p-12 flex items-center justify-center">
      <svg class="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="ml-3 text-gray-400">Loading security group...</span>
    </div>

    <!-- Content -->
    <div v-else-if="securityGroup" class="p-6 space-y-6">
      <!-- Quick Actions -->
      <div class="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 class="text-blue-400 font-bold mb-3 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          Quick Actions
        </h4>
        <div class="flex flex-wrap gap-3">
          <button
            @click="runQuickAction('k3s')"
            :disabled="performingAction"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition flex items-center text-sm"
          >
            <svg v-if="performingAction === 'k3s'" class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            🚀 Setup K3s Cluster Rules
          </button>
          <button
            @click="runQuickAction('my-ip')"
            :disabled="performingAction"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition flex items-center text-sm"
          >
            <svg v-if="performingAction === 'my-ip'" class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            💻 Add My IP (kubectl Access)
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-3">
          <strong class="text-blue-300">K3s Cluster:</strong> Adds self-referencing rule + CloudEvy monitoring. 
          <strong class="text-blue-300 ml-3">My IP:</strong> Allows kubectl from your current location.
        </p>
      </div>

      <!-- Inbound Rules -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-white font-bold flex items-center">
            <svg class="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
            Inbound Rules ({{ securityGroup.inboundRules.length }})
          </h4>
          <button
            @click="showAddRuleModal = true"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center text-sm"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Rule
          </button>
        </div>

        <!-- Inbound Rules Table -->
        <div class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-900/50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Protocol</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Port Range</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Source</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700">
                <tr v-for="rule in securityGroup.inboundRules" :key="rule.id" class="hover:bg-gray-900/30 transition">
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-mono">Inbound</span>
                  </td>
                  <td class="px-4 py-3 text-white font-mono text-sm">{{ rule.protocol }}</td>
                  <td class="px-4 py-3 text-white font-mono text-sm">
                    {{ rule.fromPort === rule.toPort ? rule.fromPort : `${rule.fromPort}-${rule.toPort}` }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="space-y-1">
                      <div v-for="(source, idx) in rule.sources" :key="idx" class="flex items-center space-x-2">
                        <span
                          :class="[
                            'px-2 py-0.5 text-xs rounded font-mono',
                            source.type === 'sg' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                          ]"
                        >
                          {{ source.value }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-400">
                    {{ rule.sources[0]?.description || '-' }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                      @click="deleteRule(rule)"
                      :disabled="deleting"
                      class="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                <tr v-if="securityGroup.inboundRules.length === 0">
                  <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                    No inbound rules configured
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <svg class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <div class="text-sm">
            <p class="text-yellow-400 font-semibold">Security Group Tips</p>
            <ul class="text-gray-300 mt-2 space-y-1 list-disc list-inside">
              <li>Use /32 for single IP addresses (e.g., 203.0.113.25/32)</li>
              <li>Self-referencing rules (sg → sg) allow all nodes in the same group to communicate</li>
              <li>Be careful when deleting rules - it may break connectivity</li>
              <li>Changes take effect immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Rule Modal -->
    <AddSecurityRuleModal
      :isOpen="showAddRuleModal"
      :serverId="serverId"
      :securityGroupId="securityGroup?.groupId"
      @close="showAddRuleModal = false"
      @rule-added="handleRuleAdded"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api/client';
import { useToast } from '@/composables/useToast';
import AddSecurityRuleModal from './AddSecurityRuleModal.vue';

const props = defineProps({
  serverId: {
    type: Number,
    required: true
  }
});

const toast = useToast();

const loading = ref(false);
const error = ref(null);
const securityGroup = ref(null);
const showAddRuleModal = ref(false);
const deleting = ref(false);
const performingAction = ref(null);

const fetchSecurityGroup = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await apiClient.get(`/security-groups/${props.serverId}`);
    
    if (response.data.success) {
      securityGroup.value = response.data.data;
    } else {
      error.value = response.data.message;
    }
  } catch (err) {
    console.error('Failed to fetch security group:', err);
    error.value = err.response?.data?.message || 'Failed to load security group details';
  } finally {
    loading.value = false;
  }
};

const deleteRule = async (rule) => {
  if (!confirm('Are you sure you want to delete this rule? This may affect connectivity.')) {
    return;
  }

  deleting.value = true;
  try {
    const payload = {
      protocol: rule.protocol,
      fromPort: rule.fromPort,
      toPort: rule.toPort,
      source: rule.sources[0].value
    };

    const response = await apiClient.delete(`/security-groups/${props.serverId}/inbound`, { data: payload });

    if (response.data.success) {
      toast.success('Rule deleted successfully!');
      await fetchSecurityGroup();
    }
  } catch (err) {
    console.error('Failed to delete rule:', err);
    toast.error(err.response?.data?.message || 'Failed to delete rule');
  } finally {
    deleting.value = false;
  }
};

const runQuickAction = async (action) => {
  performingAction.value = action;
  
  try {
    let response;
    
    if (action === 'k3s') {
      response = await apiClient.post(`/security-groups/${props.serverId}/quick-actions/k3s`);
    } else if (action === 'my-ip') {
      // Detect user's IP first
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      response = await apiClient.post(`/security-groups/${props.serverId}/quick-actions/my-ip`, {
        userIp: ipData.ip
      });
    }

    if (response.data.success) {
      const rulesAdded = response.data.rulesAdded || [response.data.message];
      toast.success(`✅ Success!\n${rulesAdded.join('\n')}`);
      await fetchSecurityGroup();
    }
  } catch (err) {
    console.error('Quick action failed:', err);
    toast.error(err.response?.data?.message || 'Failed to execute quick action');
  } finally {
    performingAction.value = null;
  }
};

const handleRuleAdded = () => {
  fetchSecurityGroup();
};

onMounted(() => {
  fetchSecurityGroup();
});
</script>

