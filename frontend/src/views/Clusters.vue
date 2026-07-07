<template>
  <div class="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-12 xl:px-16">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">Clusters</h1>
        <p class="text-gray-400">Create and manage Kubernetes & HDFS clusters</p>
      </div>
      <button
        @click="showClusterTypeModal = true"
        class="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Create Cluster
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Empty State -->
    <div v-else-if="clusters.length === 0" class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-sm">
      <div class="p-16 text-center">
        <div class="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-white mb-2">No Clusters Yet</h2>
        <p class="text-gray-400 mb-8">Create your first Kubernetes cluster in minutes, not hours</p>

        <!-- What is Kubernetes? -->
        <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6 text-left max-w-2xl mx-auto">
          <h3 class="text-lg font-bold text-blue-400 mb-3">🤔 What is a Kubernetes Cluster?</h3>
          <p class="text-sm text-gray-300 mb-3">
            A Kubernetes cluster is like having a smart manager for your applications. Instead of manually managing each server, 
            Kubernetes automatically distributes your apps across multiple servers, restarts them if they crash, and scales them 
            up or down based on traffic.
          </p>
          <p class="text-sm text-gray-300">
            <strong class="text-white">Think of it as:</strong> Your own private "cloud platform" that runs your applications 
            reliably and efficiently, just like how Netflix or Spotify run their services.
          </p>
        </div>

        <!-- Why Create a Cluster? -->
        <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6 text-left max-w-2xl mx-auto">
          <h3 class="text-lg font-bold text-green-400 mb-3">✨ Why Create a Cluster?</h3>
          <div class="space-y-2 text-sm text-gray-300">
            <div class="flex items-start space-x-2">
              <span class="text-green-400 font-bold">•</span>
              <span><strong class="text-white">Auto-Recovery:</strong> If an app crashes, it restarts automatically</span>
            </div>
            <div class="flex items-start space-x-2">
              <span class="text-green-400 font-bold">•</span>
              <span><strong class="text-white">Load Balancing:</strong> Traffic is distributed evenly across servers</span>
            </div>
            <div class="flex items-start space-x-2">
              <span class="text-green-400 font-bold">•</span>
              <span><strong class="text-white">Easy Scaling:</strong> Add more servers when traffic increases</span>
            </div>
            <div class="flex items-start space-x-2">
              <span class="text-green-400 font-bold">•</span>
              <span><strong class="text-white">Zero Downtime:</strong> Update apps without taking them offline</span>
            </div>
          </div>
        </div>

        <!-- Getting Started -->
        <div class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-8 text-left max-w-2xl mx-auto">
          <h3 class="text-lg font-bold text-purple-400 mb-3">🚀 Getting Started (2 Options)</h3>
          
          <div class="space-y-4">
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h4 class="text-white font-bold mb-2">Option 1: Use Your Existing Servers (Fastest)</h4>
              <p class="text-sm text-gray-300 mb-2">
                If you already have servers in CloudEvy with SSH configured, we'll install Kubernetes on them.
              </p>
              <p class="text-xs text-gray-400">
                ⏱️ Setup time: 2-10 minutes • 💰 Cost: $0 (uses existing servers)
              </p>
            </div>

            <div class="bg-gray-800/50 rounded-lg p-4">
              <h4 class="text-white font-bold mb-2">Option 2: Create New AWS Servers (Automatic)</h4>
              <p class="text-sm text-gray-300 mb-2">
                We'll create new EC2 servers on AWS for you, install Kubernetes, and set everything up.
              </p>
              <p class="text-xs text-gray-400">
                ⏱️ Setup time: 10-15 minutes • 💰 Cost: Starting at ~$15/month per server
              </p>
            </div>
          </div>
        </div>

        <button
          @click="showCreateModal = true"
          class="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Create Your First Cluster
        </button>
      </div>
    </div>

    <!-- Clusters Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="cluster in clusters"
        :key="cluster.id"
        class="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 rounded-2xl transition-all duration-300"></div>
        
        <div class="relative">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-bold text-white mb-1">{{ cluster.name }}</h3>
              <div class="flex items-center space-x-2 mb-2">
                <span
                  :class="[
                    'px-2 py-1 rounded-lg text-xs font-medium',
                    cluster.status === 'running' ? 'bg-green-500/20 text-green-400' :
                    cluster.status === 'creating' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                    cluster.status === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  ]"
                >
                  {{ cluster.status }}
                </span>
                <span class="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400">
                  {{ cluster.type === 'k3s' ? 'K3s' : cluster.type === 'hdfs' ? 'HDFS' : 'Kubernetes' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-gray-700/30 rounded-lg p-3">
              <p class="text-xs text-gray-400 mb-1">Nodes</p>
              <p class="text-xl font-bold text-white">{{ cluster.nodeCount || 0 }}</p>
            </div>
            <div class="bg-gray-700/30 rounded-lg p-3">
              <p class="text-xs text-gray-400 mb-1">Version</p>
              <p class="text-sm font-bold text-white">{{ cluster.version || 'N/A' }}</p>
            </div>
          </div>

          <!-- Info -->
          <div class="space-y-2 mb-4">
            <div v-if="cluster.type === 'hdfs' && cluster.distribution" class="flex items-center text-xs text-gray-400">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <span>{{ cluster.distribution.toUpperCase() }}</span>
            </div>
            <div v-else-if="cluster.networkPlugin" class="flex items-center text-xs text-gray-400">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
              </svg>
              <span>{{ cluster.networkPlugin || 'Calico' }}</span>
            </div>
            <div class="flex items-center text-xs text-gray-400">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Created {{ formatDate(cluster.createdAt) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2">
            <button
              @click="viewClusterDetails(cluster)"
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm"
            >
              View Details
            </button>
            <button
              v-if="cluster.kubeconfig"
              @click="downloadKubeconfig(cluster)"
              class="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              title="Download kubeconfig"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
            </button>
            <button
              @click="deleteCluster(cluster)"
              class="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
              title="Delete cluster"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cluster Type Selection Modal -->
    <ClusterTypeSelector 
      :isOpen="showClusterTypeModal" 
      @close="showClusterTypeModal = false"
      @select="selectClusterType"
    />

    <!-- Create Kubernetes Cluster Modal -->
    <CreateClusterModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleClusterCreated"
    />

    <!-- Create HDFS Cluster Modal -->
    <HDFSClusterWizard
      v-if="showHDFSModal"
      :is-open="showHDFSModal"
      :servers="servers"
      @close="showHDFSModal = false"
      @created="handleClusterCreated"
    />

    <!-- Cluster Details Modal -->
    <ClusterDetailsModal
      v-if="showDetailsModal && selectedCluster"
      :cluster="selectedCluster"
      @close="showDetailsModal = false"
      @refresh="fetchClusters"
    />

    <!-- Installation Progress Panel -->
    <InstallationProgressPanel ref="installationPanel" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api/client';
import CreateClusterModal from '@/components/CreateClusterModal.vue';
import HDFSClusterWizard from '@/components/HDFSClusterWizard.vue';
import ClusterDetailsModal from '@/components/ClusterDetailsModal.vue';
import InstallationProgressPanel from '@/components/InstallationProgressPanel.vue';
import ClusterTypeSelector from '@/components/ClusterTypeSelector.vue';

const loading = ref(true);
const clusters = ref([]);
const servers = ref([]);
const showClusterTypeModal = ref(false);
const showCreateModal = ref(false);
const showHDFSModal = ref(false);
const showDetailsModal = ref(false);
const selectedCluster = ref(null);
const installationPanel = ref(null);

function selectClusterType(type) {
  showClusterTypeModal.value = false;
  if (type === 'kubernetes') {
    showCreateModal.value = true;
  } else if (type === 'hdfs') {
    showHDFSModal.value = true;
  }
}

async function fetchClusters() {
  try {
    loading.value = true;
    const [clustersResponse, serversResponse] = await Promise.all([
      apiClient.get('/clusters'),
      apiClient.get('/servers')
    ]);
    clusters.value = clustersResponse.data.data || [];
    servers.value = serversResponse.data.data || [];
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    loading.value = false;
  }
}

function handleClusterCreated(cluster) {
  showCreateModal.value = false;
  showHDFSModal.value = false;
  
  // Show installation progress panel
  if (installationPanel.value && cluster) {
    installationPanel.value.startInstallation({
      id: cluster.id,
      name: cluster.name,
      distribution: cluster.distribution || 'Apache Hadoop'
    });
  }
  
  fetchClusters();
}

function viewClusterDetails(cluster) {
  selectedCluster.value = cluster;
  showDetailsModal.value = true;
}

function downloadKubeconfig(cluster) {
  // Create a download link
  const blob = new Blob([cluster.kubeconfig], { type: 'text/yaml' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cluster.name}-kubeconfig.yaml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

async function deleteCluster(cluster) {
  if (!confirm(`Are you sure you want to delete cluster "${cluster.name}"? This action cannot be undone.`)) {
    return;
  }

  try {
    await apiClient.delete(`/clusters/${cluster.id}`);
    fetchClusters();
  } catch (error) {
    console.error('Failed to delete cluster:', error);
    alert('Failed to delete cluster. Please try again.');
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

onMounted(() => {
  fetchClusters();
});
</script>

