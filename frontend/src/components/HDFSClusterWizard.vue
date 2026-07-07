<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] border border-gray-700 overflow-hidden flex flex-col">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-orange-900/20 to-yellow-900/20">
        <div>
          <h2 class="text-2xl font-bold text-white flex items-center">
            🐘 Create HDFS Cluster
          </h2>
          <p class="text-sm text-gray-400 mt-1">Distributed data processing with Hadoop ecosystem</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Progress Steps -->
      <div class="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
        <div class="flex items-center justify-between max-w-5xl mx-auto">
          <div v-for="(step, index) in steps" :key="index" class="flex items-center">
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0',
              currentStep > index + 1 ? 'bg-green-500 text-white' :
              currentStep === index + 1 ? 'bg-orange-500 text-white' :
              'bg-gray-700 text-gray-400'
            ]">
              <svg v-if="currentStep > index + 1" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span :class="[
              'ml-3 text-sm font-medium whitespace-nowrap',
              currentStep >= index + 1 ? 'text-white' : 'text-gray-500'
            ]">
              {{ step }}
            </span>
            <div v-if="index < steps.length - 1" :class="[
              'w-12 h-0.5 mx-3',
              currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-700'
            ]"></div>
          </div>
        </div>
      </div>

      <!-- Content (scrollable) -->
      <div class="flex-1 overflow-y-auto p-6">
        
        <!-- Step 1: Distribution Selection -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div>
            <h3 class="text-xl font-bold text-white mb-2">Select Hadoop Distribution</h3>
            <p class="text-gray-400 text-sm">Choose the distribution that best fits your needs</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="(dist, key) in distributions"
              :key="key"
              @click="selectDistribution(key)"
              :class="[
                'p-6 rounded-xl border-2 cursor-pointer transition group',
                config.distribution === key 
                  ? 'border-orange-500 bg-orange-500/10' 
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              ]"
            >
              <div class="flex items-start justify-between mb-4">
                <div class="text-4xl">{{ dist.icon }}</div>
                <div v-if="dist.recommended" class="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                  RECOMMENDED
                </div>
              </div>
              <h4 class="text-lg font-bold text-white mb-2">{{ dist.name }}</h4>
              <p class="text-sm text-gray-400 mb-3">{{ dist.description }}</p>
              <div class="space-y-1 text-xs text-gray-500">
                <div>Version: {{ dist.version }}</div>
                <div class="font-semibold text-orange-400">{{ dist.cost }}</div>
              </div>
              <ul class="mt-4 space-y-1">
                <li v-for="feature in dist.features" :key="feature" class="text-xs text-gray-400 flex items-center">
                  <svg class="w-3 h-3 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {{ feature }}
                </li>
              </ul>
              <div v-if="dist.note" class="mt-3 text-xs text-gray-500 italic">
                {{ dist.note }}
              </div>
            </div>
          </div>

          <!-- ODP Version Selected Info (shown when ODP version is selected) -->
          <div v-if="config.distribution === 'odp' && selectedODPVersion" class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="text-lg font-bold text-white mb-2">✅ ODP Version Selected</h4>
                <div class="bg-black/30 rounded-lg p-4 text-sm">
                  <div class="flex items-center">
                    <span class="text-gray-400">ODP Version:</span>
                    <span class="text-white ml-2 font-mono text-lg">{{ selectedODPVersion }}</span>
                  </div>
                </div>
              </div>
              <button
                @click.stop="openODPMatrix"
                class="ml-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all shadow-lg whitespace-nowrap"
              >
                Change Version
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Service Selection -->
        <div v-else-if="currentStep === 2" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-bold text-white mb-2">Select Services</h3>
              <p class="text-gray-400 text-sm">Choose services to install on your cluster</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-orange-400">{{ config.services.length }}</div>
              <div class="text-xs text-gray-500">Services Selected</div>
            </div>
          </div>

          <!-- Service Presets -->
          <div>
            <h4 class="text-sm font-semibold text-gray-400 mb-3">🎯 Quick Presets</h4>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div
                v-for="(preset, key) in presets"
                :key="key"
                @click="applyPreset(preset)"
                class="p-4 rounded-lg border-2 border-gray-700 hover:border-orange-500 bg-gray-800/50 cursor-pointer transition group"
              >
                <div class="text-3xl mb-2">{{ preset.icon }}</div>
                <div class="font-semibold text-white text-sm group-hover:text-orange-400">{{ preset.name }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ preset.services.length }} services • ~{{ preset.estimatedTime }}min</div>
                <div v-if="preset.note" class="text-xs text-gray-400 mt-2 italic">{{ preset.note }}</div>
              </div>
            </div>
          </div>

          <!-- Service Categories -->
          <div class="space-y-4">
            <div v-for="(category, catName) in services" :key="catName">
              <h4 class="text-sm font-semibold text-gray-400 mb-3 uppercase">{{ catName }}</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  v-for="service in category"
                  :key="service.id"
                  @click="toggleService(service)"
                  :class="[
                    'p-4 rounded-lg border-2 cursor-pointer transition',
                    config.services.includes(service.id)
                      ? 'border-orange-500 bg-orange-500/10'
                      : service.required 
                        ? 'border-blue-500/50 bg-blue-500/5 cursor-not-allowed'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  ]"
                >
                  <div class="flex items-start justify-between mb-2">
                    <h5 class="font-semibold text-white">{{ service.name }}</h5>
                    <div class="flex flex-col items-end space-y-1">
                      <div v-if="service.required" class="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded">
                        REQUIRED
                      </div>
                      <div v-if="service.recommended" class="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
                        ⭐
                      </div>
                    </div>
                  </div>
                  <p class="text-xs text-gray-400 mb-2">{{ service.description }}</p>
                  <div class="text-xs text-gray-500">Setup: ~{{ service.setupTime }} min</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Configuration -->
        <div v-else-if="currentStep === 3" class="space-y-6">
          <div>
            <h3 class="text-xl font-bold text-white mb-2">Cluster Configuration</h3>
            <p class="text-gray-400 text-sm">Configure HDFS and cluster settings</p>
          </div>

          <!-- Cluster Name -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Cluster Name</label>
            <input
              v-model="config.name"
              type="text"
              placeholder="my-hdfs-cluster"
              class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <!-- HDFS Configuration -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Replication Factor</label>
              <select
                v-model.number="config.config.hdfs.replicationFactor"
                class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option :value="1">1 (Testing only)</option>
                <option :value="2">2 (Minimum HA)</option>
                <option :value="3" selected>3 (Recommended)</option>
                <option :value="4">4 (High durability)</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">Number of copies of each data block</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Block Size</label>
              <select
                v-model="config.config.hdfs.blockSize"
                class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="64MB">64 MB</option>
                <option value="128MB" selected>128 MB (Recommended)</option>
                <option value="256MB">256 MB</option>
                <option value="512MB">512 MB</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">Default HDFS block size</p>
            </div>
          </div>

          <!-- YARN Configuration -->
          <div v-if="config.services.includes('yarn')">
            <h4 class="text-lg font-semibold text-white mb-4">YARN Resource Configuration</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Memory per Node (GB)</label>
                <input
                  v-model.number="config.config.yarn.memoryPerNode"
                  type="number"
                  min="4"
                  max="128"
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">CPU Cores per Node</label>
                <input
                  v-model.number="config.config.yarn.coresPerNode"
                  type="number"
                  min="2"
                  max="64"
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Node Assignment -->
        <div v-else-if="currentStep === 4" class="space-y-6">
          <div>
            <h3 class="text-xl font-bold text-white mb-2">Assign Nodes</h3>
            <p class="text-gray-400 text-sm">Select servers for master and worker roles</p>
          </div>

          <!-- Requirements Info -->
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="text-sm text-blue-300">
                <strong>Requirements:</strong> Minimum 1 master node and 2 worker nodes (for replication).
                Master nodes run NameNode, ResourceManager, and Zookeeper.
                Worker nodes run DataNode and NodeManager.
              </div>
            </div>
          </div>

          <!-- Master Nodes -->
          <div>
            <h4 class="text-lg font-semibold text-white mb-3">
              Master Nodes ({{ config.nodes.masters.length }})
            </h4>
            <div class="space-y-2">
              <div
                v-for="server in availableServers"
                :key="`master-${server.id}`"
                @click="toggleMasterNode(server)"
                :class="[
                  'p-4 rounded-lg border-2 cursor-pointer transition',
                  isNodeSelected(server, 'master')
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-semibold text-white">{{ server.name }}</div>
                    <div class="text-sm text-gray-400">{{ server.ipAddress }} | {{ server.instanceType }}</div>
                  </div>
                  <div v-if="isNodeSelected(server, 'master')" class="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                    MASTER
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Worker Nodes -->
          <div>
            <h4 class="text-lg font-semibold text-white mb-3">
              Worker Nodes ({{ config.nodes.workers.length }})
            </h4>
            <div class="space-y-2">
              <div
                v-for="server in availableServers"
                :key="`worker-${server.id}`"
                @click="toggleWorkerNode(server)"
                :class="[
                  'p-4 rounded-lg border-2 cursor-pointer transition',
                  isNodeSelected(server, 'worker')
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-semibold text-white">{{ server.name }}</div>
                    <div class="text-sm text-gray-400">{{ server.ipAddress }} | {{ server.instanceType }}</div>
                  </div>
                  <div v-if="isNodeSelected(server, 'worker')" class="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded">
                    WORKER
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 5: Review & Create -->
        <div v-else-if="currentStep === 5" class="space-y-6">
          <div class="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 rounded-xl p-6 border border-orange-500/30">
            <h3 class="text-2xl font-bold text-white mb-2">📋 Configuration Summary</h3>
            <p class="text-gray-300">Review all details before creating your HDFS cluster</p>
          </div>

          <!-- Cluster Type & Distribution -->
          <div class="bg-gray-800/70 rounded-xl p-6 border border-gray-700">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mr-4">
                <span class="text-2xl">🐘</span>
              </div>
              <div>
                <h4 class="text-lg font-bold text-white">Cluster Type</h4>
                <p class="text-sm text-gray-400">Hadoop Distributed File System (HDFS)</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div class="text-xs text-gray-500 mb-1">Cluster Name</div>
                <div class="text-white font-semibold text-lg">{{ config.name }}</div>
              </div>
              
              <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div class="text-xs text-gray-500 mb-1">Distribution</div>
                <div class="text-white font-semibold text-lg">{{ distributions[config.distribution]?.name }}</div>
                <div class="text-xs text-gray-400 mt-1">{{ distributions[config.distribution]?.version }}</div>
              </div>
              
              <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div class="text-xs text-gray-500 mb-1">Installation Type</div>
                <div class="text-white font-semibold text-lg">Direct Apache</div>
                <div class="text-xs text-gray-400 mt-1">CLI Management</div>
              </div>
            </div>
          </div>

          <!-- Services -->
          <div class="bg-gray-800/70 rounded-xl p-6 border border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                  <span class="text-2xl">🎯</span>
                </div>
                <div>
                  <h4 class="text-lg font-bold text-white">Selected Services</h4>
                  <p class="text-sm text-gray-400">{{ config.services.length }} services will be installed</p>
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div
                v-for="service in config.services"
                :key="service"
                class="bg-gray-900/50 rounded-lg p-3 border border-gray-700 text-center hover:border-orange-500/50 transition"
              >
                <div class="text-2xl mb-1">{{ getServiceIcon(service) }}</div>
                <div class="text-xs font-semibold text-white">{{ service.toUpperCase() }}</div>
              </div>
            </div>
          </div>

          <!-- Cluster Topology -->
          <div class="bg-gray-800/70 rounded-xl p-6 border border-gray-700">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                <span class="text-2xl">🖥️</span>
              </div>
              <div>
                <h4 class="text-lg font-bold text-white">Cluster Topology</h4>
                <p class="text-sm text-gray-400">{{ config.nodes.masters.length }} Master + {{ config.nodes.workers.length }} Workers</p>
              </div>
            </div>
          </div>

          <!-- Configuration Details -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-800/70 rounded-lg p-5 border border-gray-700">
              <h5 class="text-xs font-semibold text-gray-400 mb-3">HDFS Configuration</h5>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Replication Factor:</span>
                  <span class="text-white font-semibold">{{ config.config.hdfs.replicationFactor }}x</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Block Size:</span>
                  <span class="text-white font-semibold">{{ config.config.hdfs.blockSize }}</span>
                </div>
              </div>
            </div>

            <div class="bg-gray-800/70 rounded-lg p-5 border border-gray-700">
              <h5 class="text-xs font-semibold text-gray-400 mb-3">YARN Configuration</h5>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Memory/Node:</span>
                  <span class="text-white font-semibold">{{ config.config.yarn.memoryPerNode }} GB</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Cores/Node:</span>
                  <span class="text-white font-semibold">{{ config.config.yarn.coresPerNode }}</span>
                </div>
              </div>
            </div>

            <div class="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 rounded-lg p-5 border border-orange-500/30">
              <h5 class="text-xs font-semibold text-orange-300 mb-3">Estimated Time</h5>
              <div class="text-3xl font-bold text-orange-400 mb-1">{{ estimatedTime }}-{{ estimatedTime + 10 }}</div>
              <div class="text-xs text-gray-400">minutes</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-700 flex items-center justify-between bg-gray-800/50">
        <button
          v-if="currentStep > 1"
          @click="currentStep--"
          class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
        >
          ← Back
        </button>
        <div v-else></div>

        <div class="flex items-center space-x-3">
          <button
            @click="$emit('close')"
            class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            v-if="currentStep < 5"
            @click="currentStep++"
            :disabled="!canProceed"
            class="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
          >
            Next →
          </button>
          <button
            v-else
            @click="createCluster"
            :disabled="creating"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition flex items-center space-x-2"
          >
            <span v-if="creating">Creating...</span>
            <span v-else>🚀 Create Cluster</span>
          </button>
        </div>
      </div>

    </div>

    <!-- ODP Support Matrix Modal -->
    <div v-if="showODPMatrix" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" @click.self="showODPMatrix = false">
      <div class="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] border border-gray-700 overflow-hidden flex flex-col" @click.stop>
        <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-purple-900/30 to-pink-900/30">
          <div>
            <h2 class="text-2xl font-bold text-white">ODP Support Matrix</h2>
            <p class="text-sm text-gray-400 mt-1">Select compatible versions for your cluster</p>
          </div>
          <button @click="showODPMatrix = false" class="text-gray-400 hover:text-white transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <ODPSupportMatrix 
            @odp-version-selected="handleODPVersionSelected" 
            @next="handleODPMatrixNext" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient from '@/api/client';
import { useToast } from '@/composables/useToast';
import ODPSupportMatrix from './ODPSupportMatrix.vue';

const props = defineProps({
  isOpen: Boolean,
  servers: Array
});

const emit = defineEmits(['close', 'created']);

const toast = useToast();

const currentStep = ref(1);
const creating = ref(false);

// ODP Support Matrix state
const showODPMatrix = ref(false);
const selectedODPVersion = ref(null);

const steps = ['Distribution', 'Services', 'Configuration', 'Nodes', 'Review'];

// Data
const distributions = ref({});
const services = ref({});
const presets = ref({});
const availableServers = ref([]);

// Configuration
const config = ref({
  name: '',
  distribution: 'odp',
  services: ['hdfs', 'yarn', 'zookeeper'],
  nodes: {
    masters: [],
    workers: []
  },
  config: {
    hdfs: {
      replicationFactor: 3,
      blockSize: '128MB'
    },
    yarn: {
      memoryPerNode: 8,
      coresPerNode: 4
    }
  }
});

// Computed
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    if (config.value.distribution === 'odp') {
      return !!selectedODPVersion.value;
    }
    return !!config.value.distribution;
  }
  if (currentStep.value === 2) return config.value.services.length >= 3;
  if (currentStep.value === 3) return config.value.name.trim().length > 0;
  if (currentStep.value === 4) {
    return config.value.nodes.masters.length >= 1 && config.value.nodes.workers.length >= 2;
  }
  return true;
});

const estimatedTime = computed(() => {
  return config.value.services.length * 5 + 10;
});

// Helper function to get service icons
function getServiceIcon(service) {
  const icons = {
    'hdfs': '📁',
    'yarn': '🧶',
    'zookeeper': '🦒',
    'kafka': '📨',
    'spark': '⚡',
    'flink': '🌊',
    'hive': '🐝',
    'hbase': '📊',
    'grafana': '📈'
  };
  return icons[service.toLowerCase()] || '🔧';
}

// Handle distribution selection
const selectDistribution = (distKey) => {
  config.value.distribution = distKey;
  
  if (distKey === 'odp') {
    showODPMatrix.value = true;
  }
};

// Handle ODP version selection from support matrix
const handleODPVersionSelected = (odpVersion) => {
  selectedODPVersion.value = odpVersion;
  config.value.odpVersion = odpVersion;
};

// Handle Next button click from ODP matrix
const handleODPMatrixNext = () => {
  showODPMatrix.value = false;
  toast.success(`ODP ${selectedODPVersion.value} selected!`);
  currentStep.value = 2;
};

// Open ODP support matrix
const openODPMatrix = () => {
  showODPMatrix.value = true;
};

const loadData = async () => {
  try {
    const [distResp, servResp, presetResp] = await Promise.all([
      apiClient.get('/hdfs/distributions'),
      apiClient.get('/hdfs/services'),
      apiClient.get('/hdfs/presets')
    ]);

    distributions.value = distResp.data.data;
    services.value = servResp.data.data;
    presets.value = presetResp.data.data;
    availableServers.value = props.servers || [];

  } catch (error) {
    console.error('Failed to load HDFS data:', error);
    toast.error('Failed to load cluster options');
  }
};

const toggleService = (service) => {
  if (service.required) return;

  const index = config.value.services.indexOf(service.id);
  if (index > -1) {
    config.value.services.splice(index, 1);
  } else {
    config.value.services.push(service.id);
  }
};

const applyPreset = (preset) => {
  config.value.services = [...preset.services];
  toast.success(`Applied "${preset.name}" preset`);
};

const isNodeSelected = (server, role) => {
  if (role === 'master') {
    return config.value.nodes.masters.some(n => n.serverId === server.id);
  } else {
    return config.value.nodes.workers.some(n => n.serverId === server.id);
  }
};

const toggleMasterNode = (server) => {
  const index = config.value.nodes.masters.findIndex(n => n.serverId === server.id);
  if (index > -1) {
    config.value.nodes.masters.splice(index, 1);
  } else {
    const workerIndex = config.value.nodes.workers.findIndex(n => n.serverId === server.id);
    if (workerIndex > -1) {
      config.value.nodes.workers.splice(workerIndex, 1);
    }
    config.value.nodes.masters.push({ serverId: server.id });
  }
};

const toggleWorkerNode = (server) => {
  const index = config.value.nodes.workers.findIndex(n => n.serverId === server.id);
  if (index > -1) {
    config.value.nodes.workers.splice(index, 1);
  } else {
    const masterIndex = config.value.nodes.masters.findIndex(n => n.serverId === server.id);
    if (masterIndex > -1) {
      config.value.nodes.masters.splice(masterIndex, 1);
    }
    config.value.nodes.workers.push({ serverId: server.id });
  }
};

const createCluster = async () => {
  creating.value = true;

  try {
    const response = await apiClient.post('/hdfs/clusters', config.value);

    toast.success('HDFS cluster creation started!');
    
    emit('created', response.data.data.clusterId);
    emit('close');

  } catch (error) {
    console.error('Failed to create HDFS cluster:', error);
    toast.error(error.response?.data?.message || 'Failed to create cluster');
  } finally {
    creating.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>
