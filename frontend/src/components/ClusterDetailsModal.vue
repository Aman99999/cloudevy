<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-gray-900 border border-gray-700 rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <div>
          <h2 class="text-2xl font-bold text-white">{{ cluster.name }}</h2>
          <div class="flex items-center space-x-2 mt-1">
            <span :class="[
              'px-2 py-1 rounded-lg text-xs font-medium',
              cluster.status === 'running' ? 'bg-green-500/20 text-green-400' :
              cluster.status === 'creating' ? 'bg-blue-500/20 text-blue-400' :
              cluster.status === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            ]">
              {{ cluster.status }}
            </span>
            <span class="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400">
              {{ cluster.type === 'k3s' ? 'K3s' : cluster.type === 'hdfs' ? 'HDFS' : 'Kubernetes' }}
              {{ cluster.version || (cluster.distribution ? cluster.distribution.toUpperCase() : '') }}
            </span>
          </div>
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

      <!-- Tabs -->
      <div class="border-b border-gray-700 px-6 flex space-x-8">
        <button
          @click="activeTab = 'overview'"
          :class="[
            'py-4 border-b-2 font-medium transition',
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          ]"
        >
          Overview
        </button>
        <button
          @click="activeTab = 'nodes'"
          :class="[
            'py-4 border-b-2 font-medium transition',
            activeTab === 'nodes'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          ]"
        >
          Nodes
        </button>
        <button
          v-if="cluster.type === 'hdfs'"
          @click="activeTab = 'services'"
          :class="[
            'py-4 border-b-2 font-medium transition',
            activeTab === 'services'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          ]"
        >
          Services
        </button>
        <button
          v-if="cluster.type !== 'hdfs'"
          @click="activeTab = 'workloads'"
          :class="[
            'py-4 border-b-2 font-medium transition',
            activeTab === 'workloads'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          ]"
        >
          Workloads
        </button>
        <button
          v-if="cluster.type !== 'hdfs'"
          @click="activeTab = 'kubeconfig'"
          :class="[
            'py-4 border-b-2 font-medium transition',
            activeTab === 'kubeconfig'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          ]"
        >
          Access
        </button>
        <button
          v-if="cluster.type === 'hdfs'"
          @click="activeTab = 'webui'"
          :class="[
            'py-4 border-b-2 font-medium transition',
            activeTab === 'webui'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          ]"
        >
          Web UIs
        </button>
        <button
          v-if="cluster.status === 'creating'"
          @click="activeTab = 'logs'"
          :class="[
            'py-4 border-b-2 font-medium transition flex items-center space-x-2',
            activeTab === 'logs'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          ]"
        >
          <span>Live Logs</span>
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <!-- Stats Grid - K8s -->
          <div v-if="cluster.type !== 'hdfs'" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p class="text-sm text-gray-400 mb-1">Total Nodes</p>
              <p class="text-3xl font-bold text-white">{{ cluster.nodeCount || 0 }}</p>
            </div>
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p class="text-sm text-gray-400 mb-1">Network Plugin</p>
              <p class="text-xl font-bold text-white">{{ cluster.networkPlugin || 'N/A' }}</p>
            </div>
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p class="text-sm text-gray-400 mb-1">API Endpoint</p>
              <p class="text-sm font-mono text-white break-all">{{ cluster.apiEndpoint || 'N/A' }}</p>
            </div>
          </div>

          <!-- Stats Grid - HDFS -->
          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p class="text-sm text-gray-400 mb-1">Total Nodes</p>
              <p class="text-3xl font-bold text-white">{{ cluster.nodeCount || 0 }}</p>
            </div>
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p class="text-sm text-gray-400 mb-1">Distribution</p>
              <p class="text-xl font-bold text-white">{{ cluster.distribution ? cluster.distribution.toUpperCase() : 'N/A' }}</p>
            </div>
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p class="text-sm text-gray-400 mb-1">Services</p>
              <p class="text-3xl font-bold text-white">{{ cluster.hadoopServices ? cluster.hadoopServices.length : 0 }}</p>
            </div>
          </div>

          <!-- Connectivity Warning (K8s only) -->
          <div
            v-if="cluster.type !== 'hdfs' && (cluster.connectivityStatus === 'unreachable' || cluster.connectivityStatus === 'unknown')"
            class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
          >
            <div class="flex items-start space-x-3">
              <svg class="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div class="flex-1">
                <h4 class="text-white font-bold mb-1">⚠️ Monitoring Unavailable</h4>
                <p class="text-sm text-gray-300 mb-3">
                  CloudEvy cannot reach your cluster. Live node metrics and monitoring features are disabled.
                </p>
                <p class="text-sm text-gray-400 mb-3">
                  <strong>Why?</strong> Port 6443 on your master node needs to allow connections from CloudEvy.
                </p>
                <button
                  @click="showSetupModal = true"
                  class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-medium transition text-sm"
                >
                  Setup Network Access
                </button>
              </div>
            </div>
          </div>

          <!-- Connectivity Success (K8s only) -->
          <div
            v-else-if="cluster.type !== 'hdfs' && cluster.connectivityStatus === 'connected'"
            class="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
          >
            <div class="flex items-center space-x-3">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 class="text-white font-bold">✅ Monitoring Active</h4>
                <p class="text-sm text-gray-300">CloudEvy can access your cluster. All monitoring features are available.</p>
              </div>
            </div>
          </div>

          <!-- Cluster Info -->
          <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 class="text-lg font-bold text-white mb-4">Cluster Information</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-400">Created</p>
                <p class="text-white">{{ new Date(cluster.createdAt).toLocaleString() }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-400">Type</p>
                <p class="text-white">{{ cluster.type === 'k3s' ? 'K3s' : cluster.type === 'hdfs' ? 'HDFS' : 'Kubernetes' }}</p>
              </div>
              <div v-if="cluster.type !== 'hdfs'">
                <p class="text-sm text-gray-400">Version</p>
                <p class="text-white">{{ cluster.version || 'N/A' }}</p>
              </div>
              <div v-if="cluster.type !== 'hdfs'">
                <p class="text-sm text-gray-400">Network Plugin</p>
                <p class="text-white">{{ cluster.networkPlugin || 'N/A' }}</p>
              </div>
              <div v-if="cluster.type === 'hdfs'">
                <p class="text-sm text-gray-400">Distribution</p>
                <p class="text-white">{{ cluster.distribution ? cluster.distribution.toUpperCase() : 'N/A' }}</p>
              </div>
              <div v-if="cluster.type === 'hdfs' && cluster.ambariUrl">
                <p class="text-sm text-gray-400">Ambari URL</p>
                <a :href="cluster.ambariUrl" target="_blank" class="text-blue-400 hover:text-blue-300 underline break-all">{{ cluster.ambariUrl }}</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Nodes Tab -->
        <div v-else-if="activeTab === 'nodes'" class="space-y-4">
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
            <p class="text-sm text-blue-400">
              💡 Nodes are the servers that make up your cluster. The master node manages the cluster, while worker nodes run your applications.
            </p>
          </div>

          <!-- K8s Nodes -->
          <div v-if="cluster.type !== 'hdfs'">
            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 mb-4">
              <!-- Fix Metrics Button (shown if any node has unknown metrics) -->
              <button
                v-if="hasUnknownMetrics"
                @click="fixMetrics"
                :disabled="fixingMetrics"
                class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition flex items-center space-x-2"
              >
                <svg v-if="fixingMetrics" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span>{{ fixingMetrics ? 'Installing...' : 'Fix Metrics' }}</span>
              </button>

              <!-- Refresh Button -->
              <button
                @click="fetchClusterNodes"
                :disabled="loadingNodes"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition flex items-center space-x-2"
              >
                <svg v-if="loadingNodes" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>{{ loadingNodes ? 'Loading...' : 'Refresh' }}</span>
              </button>
            </div>

            <!-- Error Message -->
            <div v-if="nodesError" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p class="text-sm text-red-400">
                ⚠️ {{ nodesError }}
              </p>
            </div>

          <!-- Metrics Unavailable Info -->
          <div v-if="hasUnknownMetrics && !fixingMetrics" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="flex-1">
                <p class="text-sm text-yellow-400 font-semibold mb-1">
                  📊 Node Metrics Not Available
                </p>
                <p class="text-xs text-yellow-300/80">
                  Your cluster needs the metrics-server component to show CPU and memory usage. Click "Fix Metrics" above to install it automatically (takes ~30 seconds).
                </p>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loadingNodes && clusterNodes.length === 0" class="flex items-center justify-center py-12">
            <div class="text-center">
              <svg class="animate-spin h-8 w-8 mx-auto text-blue-400 mb-2" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-gray-400">Loading node metrics...</p>
            </div>
          </div>

          <!-- Nodes Grid -->
          <div v-else class="space-y-3">
            <div
              v-for="node in clusterNodes"
              :key="node.name"
              class="bg-gray-800 border border-gray-700 rounded-lg p-5 hover:border-gray-600 transition"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <!-- Node Header -->
                  <div class="flex items-center space-x-3 mb-3">
                    <h4 class="text-white font-bold text-lg">{{ node.server?.name || node.name }}</h4>
                    <span :class="[
                      'px-2.5 py-1 rounded-lg text-xs font-semibold',
                      node.role === 'master' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    ]">
                      {{ node.role }}
                    </span>
                    <span :class="[
                      'px-2.5 py-1 rounded-lg text-xs font-semibold',
                      node.status === 'Ready' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    ]">
                      {{ node.status }}
                    </span>
                  </div>

                  <!-- Node Info -->
                  <div class="text-xs text-gray-400 mb-3 space-y-1">
                    <div v-if="node.internalIP" class="flex items-center space-x-2">
                      <span class="font-medium">Internal IP:</span>
                      <span class="font-mono">{{ node.internalIP }}</span>
                    </div>
                    <div v-if="node.kubeletVersion" class="flex items-center space-x-2">
                      <span class="font-medium">Version:</span>
                      <span class="font-mono">{{ node.kubeletVersion }}</span>
                    </div>
                    <div v-if="node.osImage" class="flex items-center space-x-2">
                      <span class="font-medium">OS:</span>
                      <span>{{ node.osImage }}</span>
                    </div>
                  </div>

                  <!-- Metrics Grid -->
                  <div class="grid grid-cols-3 gap-4">
                    <div class="bg-gray-900 border border-gray-700 rounded-lg p-3">
                      <div class="flex items-center space-x-2 mb-1">
                        <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                        </svg>
                        <p class="text-xs text-gray-400 font-medium">CPU Usage</p>
                      </div>
                      <p class="text-2xl font-bold text-white">{{ node.cpuUsage }}</p>
                    </div>
                    <div class="bg-gray-900 border border-gray-700 rounded-lg p-3">
                      <div class="flex items-center space-x-2 mb-1">
                        <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                        </svg>
                        <p class="text-xs text-gray-400 font-medium">Memory Usage</p>
                      </div>
                      <p class="text-2xl font-bold text-white">{{ node.memoryUsage }}</p>
                    </div>
                    <div class="bg-gray-900 border border-gray-700 rounded-lg p-3">
                      <div class="flex items-center space-x-2 mb-1">
                        <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                        <p class="text-xs text-gray-400 font-medium">Pods</p>
                      </div>
                      <p class="text-2xl font-bold text-white">{{ node.podCount }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!loadingNodes && clusterNodes.length === 0" class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <p class="text-gray-400 text-lg font-medium">No nodes found</p>
            <p class="text-gray-500 text-sm mt-1">Cluster may still be initializing</p>
          </div>
          </div>

          <!-- HDFS Nodes -->
          <div v-else class="space-y-4">
            <div 
              v-for="nodeRole in cluster.hadoopNodeRoles" 
              :key="nodeRole.id"
              class="bg-gray-800 border border-gray-700 rounded-lg p-5"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <div :class="[
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    nodeRole.isPrimary ? 'bg-orange-500/20' : 'bg-blue-500/20'
                  ]">
                    <span class="text-2xl">
                      {{ nodeRole.isPrimary ? '👑' : '⚙️' }}
                    </span>
                  </div>
                  <div>
                    <h4 class="text-lg font-bold text-white">{{ nodeRole.server.name }}</h4>
                    <p class="text-sm text-gray-400">
                      {{ nodeRole.role.toUpperCase() }}{{ nodeRole.isPrimary ? ' (Primary)' : '' }}
                    </p>
                  </div>
                </div>
                <span class="px-3 py-1 rounded-lg text-sm font-medium bg-green-500/20 text-green-400">
                  Active
                </span>
              </div>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="text-gray-400">IP Address</p>
                  <p class="text-white font-mono">{{ nodeRole.server.ipAddress }}</p>
                </div>
                <div>
                  <p class="text-gray-400">Role</p>
                  <p class="text-white">{{ nodeRole.role }}</p>
                </div>
              </div>
            </div>

            <div v-if="!cluster.hadoopNodeRoles || cluster.hadoopNodeRoles.length === 0" class="text-center py-12">
              <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <p class="text-gray-400 text-lg font-medium">No nodes found</p>
              <p class="text-gray-500 text-sm mt-1">Cluster may still be initializing</p>
            </div>
          </div>
        </div>

        <!-- Workloads Tab -->
        <div v-else-if="activeTab === 'workloads'" class="space-y-4">
          <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <p class="text-sm text-yellow-400">
              🚧 Workload monitoring coming soon! For now, use kubectl to manage your deployments.
            </p>
          </div>
        </div>

        <!-- Kubeconfig/Access Tab -->
        <div v-else-if="activeTab === 'kubeconfig'" class="space-y-6">
          <!-- What's Next Guide -->
          <div class="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-6">
            <h3 class="text-xl font-bold text-white mb-3 flex items-center">
              <svg class="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              🎉 Your Cluster is Ready!
            </h3>
            <p class="text-gray-300 text-sm mb-4">
              Congratulations! Your Kubernetes cluster is up and running. Here's how to start using it:
            </p>
          </div>

          <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 class="text-lg font-bold text-white mb-4">Access Your Cluster</h3>
            
            <div class="space-y-4">
              <!-- Download Kubeconfig -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Step 1: Download Kubeconfig File
                  <span class="text-gray-500 font-normal">(This is your access key)</span>
                </label>
                <button
                  @click="downloadKubeconfig"
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition flex items-center justify-center space-x-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  <span>Download Kubeconfig</span>
                </button>
                <p class="text-xs text-gray-400 mt-2">
                  💡 This file contains credentials to access your cluster. Keep it safe!
                </p>
              </div>

              <!-- Instructions -->
              <div class="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <h4 class="text-white font-bold mb-3 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  Step 2: How to Use (3 Easy Steps)
                </h4>
                <ol class="space-y-3 text-sm text-gray-300">
                  <li class="flex items-start">
                    <span class="text-blue-400 font-bold mr-3 mt-0.5">1.</span>
                    <div class="flex-1">
                      <p class="font-medium text-white mb-1">Install kubectl (if you haven't already)</p>
                      <p class="text-gray-400 text-xs mb-2">kubectl is the tool to control Kubernetes. Think of it like a remote control.</p>
                      <div class="bg-black/50 rounded p-3 font-mono text-xs text-green-400">
                        # On Mac:<br>
                        brew install kubectl<br><br>
                        # On Windows:<br>
                        choco install kubernetes-cli<br><br>
                        # On Linux:<br>
                        sudo apt-get install kubectl
                      </div>
                    </div>
                  </li>
                  <li class="flex items-start">
                    <span class="text-blue-400 font-bold mr-3 mt-0.5">2.</span>
                    <div class="flex-1">
                      <p class="font-medium text-white mb-1">Tell kubectl to use your cluster</p>
                      <p class="text-gray-400 text-xs mb-2">This connects kubectl to YOUR cluster (not anyone else's)</p>
                      <div class="bg-black/50 rounded p-3 font-mono text-xs text-green-400">
                        export KUBECONFIG=~/{{ cluster.name }}-kubeconfig.yaml
                      </div>
                    </div>
                  </li>
                  <li class="flex items-start">
                    <span class="text-blue-400 font-bold mr-3 mt-0.5">3.</span>
                    <div class="flex-1">
                      <p class="font-medium text-white mb-1">Verify it's working</p>
                      <p class="text-gray-400 text-xs mb-2">This should show your server nodes</p>
                      <div class="bg-black/50 rounded p-3 font-mono text-xs text-green-400">
                        kubectl get nodes
                      </div>
                      <p class="text-gray-400 text-xs mt-2">
                        ✅ You should see your nodes listed with "Ready" status!
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              <!-- What's Next -->
              <div class="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <h4 class="text-purple-400 font-bold mb-2">🚀 What Can You Do Now?</h4>
                <ul class="text-sm text-gray-300 space-y-1">
                  <li class="flex items-start">
                    <span class="text-purple-400 mr-2">•</span>
                    <span><strong class="text-white">Deploy apps:</strong> kubectl create deployment my-app --image=nginx</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-purple-400 mr-2">•</span>
                    <span><strong class="text-white">Expose to internet:</strong> kubectl expose deployment my-app --port=80 --type=NodePort</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-purple-400 mr-2">•</span>
                    <span><strong class="text-white">View running apps:</strong> kubectl get pods</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-purple-400 mr-2">•</span>
                    <span><strong class="text-white">Check logs:</strong> kubectl logs [pod-name]</span>
                  </li>
                </ul>
              </div>

              <!-- API Endpoint -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  API Endpoint
                  <span class="text-gray-500 font-normal">(Your cluster's address)</span>
                </label>
                <div class="bg-gray-900 border border-gray-700 rounded-lg p-3 font-mono text-sm text-white break-all">
                  {{ cluster.apiEndpoint || 'N/A' }}
                </div>
                <p class="text-xs text-gray-400 mt-1">
                  This is where kubectl talks to your cluster
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- HDFS Services Tab -->
        <div v-else-if="activeTab === 'services' && cluster.type === 'hdfs'">
          <div class="space-y-4">
            <h3 class="text-lg font-bold text-white mb-4">Installed Services</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Dynamic services from cluster.hadoopServices or static list -->
              <div 
                v-for="service in getHDFSServices()"
                :key="service.name"
                class="bg-gray-800 border border-gray-700 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-white">{{ service.name }}</span>
                  <span :class="[
                    'px-2 py-1 rounded text-xs font-medium',
                    service.status === 'running' ? 'bg-green-500/20 text-green-400' :
                    service.status === 'starting' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  ]">
                    {{ service.status || 'installed' }}
                  </span>
                </div>
                <p class="text-sm text-gray-400">{{ service.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- HDFS Web UIs Tab -->
        <div v-else-if="activeTab === 'webui' && cluster.type === 'hdfs'">
          <div class="space-y-4">
            <h3 class="text-lg font-bold text-white mb-4">Web Interfaces</h3>
            <div class="space-y-3">
              <a 
                v-if="cluster.ambariUrl"
                :href="cluster.ambariUrl"
                target="_blank"
                class="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-orange-500 transition group"
              >
                <div>
                  <div class="font-medium text-white group-hover:text-orange-400 transition">Ambari Server</div>
                  <div class="text-sm text-gray-400">Manage and monitor your cluster</div>
                  <div class="text-xs text-gray-500 mt-1">Default: admin / admin</div>
                </div>
                <svg class="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>

              <a 
                :href="`http://${getMasterNodeIP()}:50070`"
                target="_blank"
                class="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition group"
              >
                <div>
                  <div class="font-medium text-white group-hover:text-blue-400 transition">HDFS NameNode UI</div>
                  <div class="text-sm text-gray-400">View HDFS cluster status and file system</div>
                </div>
                <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>

              <a 
                :href="`http://${getMasterNodeIP()}:8088`"
                target="_blank"
                class="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-green-500 transition group"
              >
                <div>
                  <div class="font-medium text-white group-hover:text-green-400 transition">YARN ResourceManager UI</div>
                  <div class="text-sm text-gray-400">Monitor YARN jobs and resources</div>
                </div>
                <svg class="w-5 h-5 text-gray-400 group-hover:text-green-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>

            <div class="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div class="flex items-start space-x-3">
                <svg class="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div class="text-sm text-yellow-400">
                  <p class="font-medium mb-1">Security Note</p>
                  <p class="text-yellow-400/80">Make sure your security group allows access to these ports (8080, 50070, 8088) from your IP address.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Logs Tab -->
        <div v-else-if="activeTab === 'logs'">
          <LiveLogsViewer :logs="installationLogs" />
          <div v-if="installationLogs.length === 0" class="text-center py-12">
            <div class="text-5xl mb-4">📡</div>
            <p class="text-gray-400">Waiting for installation logs...</p>
            <p class="text-sm text-gray-500 mt-2">Logs will appear here as services are being installed</p>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="border-t border-gray-700 p-6 flex items-center justify-between">
        <button
          @click="$emit('close')"
          class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
        >
          Close
        </button>
        <div class="flex items-center space-x-3">
          <button
            @click="refreshCluster"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            🔄 Refresh
          </button>
          <button
            v-if="cluster.kubeconfig"
            @click="downloadKubeconfig"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            Download Kubeconfig
          </button>
        </div>
      </div>
    </div>

    <!-- Setup Instructions Modal -->
    <ConnectivitySetupModal
      v-if="showSetupModal"
      :cluster="cluster"
      :masterIP="masterIP"
      @close="showSetupModal = false"
      @connectivity-updated="handleConnectivityUpdated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import apiClient from '@/api/client';
import ConnectivitySetupModal from './ConnectivitySetupModal.vue';
import LiveLogsViewer from './LiveLogsViewer.vue';

const props = defineProps({
  cluster: { type: Object, required: true }
});

const emit = defineEmits(['close', 'refresh']);

const activeTab = ref('overview');
const clusterNodes = ref([]);
const loadingNodes = ref(false);
const nodesError = ref(null);
const showSetupModal = ref(false);
const fixingMetrics = ref(false);
const installationLogs = ref([]);

// Check if any nodes have unknown metrics or if there's a metrics error
const hasUnknownMetrics = computed(() => {
  // Show button if there's an explicit metrics error
  if (nodesError.value && nodesError.value.toLowerCase().includes('metrics')) {
    return true;
  }
  
  // Show button if any node has unknown or 0% metrics (except master can be 0%)
  return clusterNodes.value.some(node => 
    node.cpuUsage === '<unknown>' || 
    node.memoryUsage === '<unknown>' ||
    (node.cpuUsage === '0%' && node.memoryUsage === '0%' && node.role !== 'master')
  );
});

// Get master IP from nodes
const masterIP = computed(() => {
  const masterNode = clusterNodes.value.find(n => n.role === 'master');
  return masterNode?.server?.ipAddress || masterNode?.internalIP || 'Unknown';
});

async function fetchClusterNodes() {
  loadingNodes.value = true;
  nodesError.value = null;
  try {
    // Use 60 second timeout for nodes/live (backend needs up to 35s)
    const response = await apiClient.get(`/clusters/${props.cluster.id}/nodes/live`, {
      timeout: 60000
    });
    clusterNodes.value = response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch cluster nodes:', error);
    nodesError.value = error.response?.data?.message || error.message || 'Failed to fetch node metrics';
    
    // Fallback to database nodes if live metrics fail
    try {
      const fallbackResponse = await apiClient.get(`/clusters/${props.cluster.id}/nodes`);
      clusterNodes.value = fallbackResponse.data.data || [];
    } catch (fallbackError) {
      console.error('Failed to fetch fallback nodes:', fallbackError);
    }
  } finally {
    loadingNodes.value = false;
  }
}

function handleConnectivityUpdated(status) {
  // Update cluster connectivity status
  props.cluster.connectivityStatus = status;
  // Refresh data
  fetchClusterNodes();
  emit('refresh');
}

async function fixMetrics() {
  fixingMetrics.value = true;
  try {
    const response = await apiClient.post(`/clusters/${props.cluster.id}/fix-metrics`, {}, {
      timeout: 90000 // 90 seconds for installation
    });
    
    if (response.data.success) {
      toast.success(response.data.message || 'Metrics-server installed successfully!');
      
      // Wait a bit then refresh nodes
      setTimeout(() => {
        fetchClusterNodes();
      }, 5000); // Give it 5 seconds before first refresh
    } else {
      toast.error(response.data.message || 'Failed to install metrics-server');
    }
  } catch (error) {
    console.error('Failed to fix metrics:', error);
    toast.error(error.response?.data?.message || 'Failed to install metrics-server. Please try again.');
  } finally {
    fixingMetrics.value = false;
  }
}

function downloadKubeconfig() {
  if (!props.cluster.kubeconfig) return;
  
  const blob = new Blob([props.cluster.kubeconfig], { type: 'text/yaml' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${props.cluster.name}-kubeconfig.yaml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function refreshCluster() {
  fetchClusterNodes();
  emit('refresh');
}

// HDFS-specific helper functions
function getHDFSServices() {
  // If cluster has hadoopServices from DB, use those
  if (props.cluster.hadoopServices && props.cluster.hadoopServices.length > 0) {
    return props.cluster.hadoopServices.map(s => ({
      name: s.serviceName,
      status: s.status,
      description: getServiceDescription(s.serviceName)
    }));
  }
  
  // Otherwise, return default services based on what was selected
  const serviceDescriptions = {
    'hdfs': 'Distributed file system for storing large datasets',
    'yarn': 'Resource manager for running distributed applications',
    'zookeeper': 'Coordination service for distributed systems',
    'spark': 'Fast in-memory data processing engine',
    'hive': 'SQL-like query engine for big data',
    'hbase': 'NoSQL database built on HDFS',
    'ambari': 'Web-based management and monitoring tool'
  };
  
  const services = props.cluster.hdfsConfig?.services || ['hdfs', 'yarn', 'zookeeper'];
  
  return services.map(name => ({
    name: name.toUpperCase(),
    status: props.cluster.status === 'running' ? 'running' : 'installed',
    description: serviceDescriptions[name] || 'Hadoop ecosystem service'
  }));
}

function getServiceDescription(serviceName) {
  const descriptions = {
    'HDFS': 'Distributed file system for storing large datasets',
    'YARN': 'Resource manager for running distributed applications',
    'ZOOKEEPER': 'Coordination service for distributed systems',
    'SPARK': 'Fast in-memory data processing engine',
    'HIVE': 'SQL-like query engine for big data',
    'HBASE': 'NoSQL database built on HDFS',
    'AMBARI': 'Web-based management and monitoring tool'
  };
  return descriptions[serviceName.toUpperCase()] || 'Hadoop ecosystem service';
}

function getMasterNodeIP() {
  // Try to get from cluster nodes
  if (clusterNodes.value && clusterNodes.value.length > 0) {
    const masterNode = clusterNodes.value.find(n => n.role === 'master');
    if (masterNode) return masterNode.ipAddress;
  }
  
  // Fallback to ambari URL if available
  if (props.cluster.ambariUrl) {
    try {
      const url = new URL(props.cluster.ambariUrl);
      return url.hostname;
    } catch (e) {
      // Invalid URL, extract IP manually
      const match = props.cluster.ambariUrl.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (match) return match[1];
    }
  }
  
  return 'master-node-ip';
}


onMounted(() => {
  fetchClusterNodes();
  
  // If cluster is creating, auto-switch to logs tab and listen for WebSocket updates
  if (props.cluster.status === 'creating') {
    activeTab.value = 'logs';
    
    // Listen for WebSocket progress updates (logs)
    if (window.socket) {
      window.socket.on(`cluster:${props.cluster.id}:progress`, (progress) => {
        if (progress.type === 'log') {
          // Real log output from SSH
          installationLogs.value.push({
            timestamp: progress.timestamp || new Date().toISOString(),
            level: progress.level || 'stdout',
            message: progress.message,
            server: progress.server
          });
        } else if (progress.message) {
          // Progress updates (step changes)
          installationLogs.value.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `[${progress.step}] ${progress.message}`,
            server: 'system'
          });
        }
      });
    }
  }
});
</script>

