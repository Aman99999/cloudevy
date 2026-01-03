<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div class="relative w-full max-w-6xl max-h-[90vh] bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col">
          <!-- Animated background -->
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
          
          <!-- Header -->
          <div class="relative p-6 sm:p-8 border-b border-gray-700/50 flex-shrink-0">
            <div class="relative flex items-center justify-between mb-4">
              <div>
                <div class="flex items-center space-x-3 mb-2">
                  <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-2xl sm:text-3xl font-bold text-white">{{ serverDetails?.name || 'Server Details' }}</h2>
                    <p class="text-gray-400 text-sm mt-1">Real-time monitoring and metrics</p>
                  </div>
                </div>
              </div>
              <button
                @click="closeModal"
                class="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all hover:scale-110 hover:rotate-90"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <!-- Server Control Actions (only for AWS instances with instanceId) -->
            <div v-if="serverData?.provider === 'aws' && serverData?.instanceId" class="relative flex flex-wrap gap-3">
              <button
                v-if="serverData?.status === 'running'"
                @click="handleStopServer"
                :disabled="isPerformingAction"
                class="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-400 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ isPerformingAction ? 'Stopping...' : 'Stop' }}</span>
              </button>
              
              <button
                v-if="serverData?.status === 'stopped'"
                @click="handleStartServer"
                :disabled="isPerformingAction"
                class="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ isPerformingAction ? 'Starting...' : 'Start' }}</span>
              </button>
              
              <button
                v-if="serverData?.status === 'running'"
                @click="handleRebootServer"
                :disabled="isPerformingAction"
                class="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{{ isPerformingAction ? 'Rebooting...' : 'Reboot' }}</span>
              </button>
              
              <button
                @click="handleTerminateServer"
                :disabled="isPerformingAction"
                class="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>{{ isPerformingAction ? 'Terminating...' : 'Terminate Instance' }}</span>
              </button>
            </div>

            <!-- DEBUG INFO - Shows why buttons aren't appearing -->
            <div v-else-if="serverData" class="relative mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div class="text-xs text-yellow-400 space-y-1">
                <div class="font-semibold mb-2">ℹ️ Instance control not available:</div>
                <div v-if="serverData.provider !== 'aws'">
                  ❌ Provider: <span class="font-mono">{{ serverData.provider || 'not set' }}</span> (must be 'aws')
                </div>
                <div v-else>
                  ✅ Provider: <span class="font-mono">{{ serverData.provider }}</span>
                </div>
                <div v-if="!serverData.instanceId">
                  ❌ Instance ID: <span class="font-mono">not set</span> (required for control)
                </div>
                <div v-else>
                  ✅ Instance ID: <span class="font-mono">{{ serverData.instanceId }}</span>
                </div>
                <div class="text-xs text-gray-400 mt-2 pt-2 border-t border-yellow-500/20">
                  Tip: Import servers from AWS to get instance controls
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Navigation -->
          <div class="relative border-b border-gray-700/50 px-6 sm:px-8 flex-shrink-0">
            <nav class="flex space-x-8">
              <button
                @click="activeTab = 'metrics'"
                :class="[
                  'py-4 px-1 border-b-2 font-medium text-sm transition relative',
                  activeTab === 'metrics'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                ]"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Metrics</span>
                </div>
              </button>
              <button
                @click="activeTab = 'costs'"
                :class="[
                  'py-4 px-1 border-b-2 font-medium text-sm transition relative',
                  activeTab === 'costs'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                ]"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Costs</span>
                </div>
              </button>
              <button
                @click="activeTab = 'traffic'"
                :class="[
                  'py-4 px-1 border-b-2 font-medium text-sm transition relative',
                  activeTab === 'traffic'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                ]"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>Traffic Insights</span>
                  <span class="px-1.5 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold rounded uppercase">New</span>
                </div>
              </button>
              <button
                @click="activeTab = 'agent'"
                :class="[
                  'py-4 px-1 border-b-2 font-medium text-sm transition relative',
                  activeTab === 'agent'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                ]"
              >
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Agent Setup</span>
                </div>
              </button>
            </nav>
          </div>

          <!-- Content - Scrollable -->
          <div class="relative p-6 sm:p-8 overflow-y-auto flex-1">
            <!-- Loading State -->
            <div v-if="loading" class="flex items-center justify-center py-20">
              <svg class="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <!-- Metrics Tab -->
            <div v-else-if="activeTab === 'metrics' && metrics" class="space-y-6">
              
              <!-- No Agent Warning -->
              <div v-if="!hasAgent" class="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-2xl p-6">
                <div class="flex items-start space-x-4">
                  <div class="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-yellow-400 mb-2">No Real-Time Data Available</h3>
                    <p class="text-gray-300 mb-4">This server is not sending metrics yet. Install the monitoring agent to get real-time CPU, Memory, Disk, and Network data.</p>
                    <button
                      @click="activeTab = 'agent'"
                      class="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Install Agent Now</span>
                    </button>
                    <p class="text-xs text-gray-400 mt-3">Takes only 2 minutes • Get updates every 5 seconds</p>
                  </div>
                </div>
              </div>

              <!-- Machine Not Connected Message -->
              <div v-if="metrics.status === 'offline'" class="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-8 text-center">
                <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
                </svg>
                <h3 class="text-xl font-bold text-red-400 mb-2">Machine Not Connected</h3>
                <p class="text-gray-400 mb-4">{{ metrics.message || 'Install the monitoring agent to see real-time metrics.' }}</p>
                <button
                  v-if="!hasAgent"
                  @click="activeTab = 'agent'"
                  class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Install Agent
                </button>
              </div>

              <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- CPU Card -->
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-400">CPU Usage</span>
                    <div class="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="text-3xl font-bold text-white mb-1">{{ metrics.cpu.usage }}%</div>
                  <div class="text-xs text-gray-500">{{ metrics.cpu.cores }} cores</div>
                </div>

                <!-- Memory Card -->
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-400">Memory</span>
                    <div class="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="text-3xl font-bold text-white mb-1">{{ metrics.memory.percentage }}%</div>
                  <div class="text-xs text-gray-500">{{ metrics.memory.used }} / {{ metrics.memory.total }} MB</div>
                </div>

                <!-- Disk Card -->
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-400">Disk</span>
                    <div class="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="text-3xl font-bold text-white mb-1">{{ metrics.disk.percentage }}%</div>
                  <div class="text-xs text-gray-500">{{ metrics.disk.used }} / {{ metrics.disk.total }} GB</div>
                </div>

                <!-- Network Card -->
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-400">Network</span>
                    <div class="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div>
                      <div class="text-sm font-bold text-white">↓ {{ metrics.network.inbound }}</div>
                      <div class="text-xs text-gray-500">MB/s</div>
                    </div>
                    <div class="text-gray-600">|</div>
                    <div>
                      <div class="text-sm font-bold text-white">↑ {{ metrics.network.outbound }}</div>
                      <div class="text-xs text-gray-500">MB/s</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- All metrics content - hidden when offline -->
              <div v-if="metrics.status !== 'offline'">
                <!-- Time Range Selector -->
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-lg font-bold text-white">Historical Metrics</h3>
                  <div class="flex items-center space-x-2">
                    <button
                      v-for="range in timeRanges"
                      :key="range.value"
                      @click="selectedTimeRange = range.value"
                      :class="[
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        selectedTimeRange === range.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                      ]"
                    >
                      {{ range.label }}
                    </button>
                  </div>
                </div>

                <!-- Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- CPU Chart -->
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                  <h4 class="text-base font-semibold text-white mb-4">CPU Usage Over Time</h4>
                  <div class="h-64">
                    <Line v-if="chartData.cpu" :data="chartData.cpu" :options="chartOptions" />
                  </div>
                </div>

                <!-- Memory Chart -->
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                  <h4 class="text-base font-semibold text-white mb-4">Memory Usage Over Time</h4>
                  <div class="h-64">
                    <Line v-if="chartData.memory" :data="chartData.memory" :options="chartOptions" />
                  </div>
                </div>

                <!-- Network Chart -->
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-6 lg:col-span-2">
                  <h4 class="text-base font-semibold text-white mb-4">Network Traffic Over Time</h4>
                  <div class="h-64">
                    <Line v-if="chartData.network" :data="chartData.network" :options="chartOptions" />
                  </div>
                </div>

                <!-- Disk I/O Chart -->
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                  <h4 class="text-base font-semibold text-white mb-4 flex items-center space-x-2">
                    <span>Disk I/O Speed</span>
                    <span class="text-xs text-gray-500 font-normal">(Read/Write)</span>
                  </h4>
                  <div class="h-64">
                    <Line v-if="chartData.diskIO" :data="chartData.diskIO" :options="chartOptions" />
                  </div>
                </div>

                <!-- Load Average Chart -->
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                  <h4 class="text-base font-semibold text-white mb-4 flex items-center space-x-2">
                    <span>System Load Average</span>
                    <span class="text-xs text-gray-500 font-normal">(Lower is better)</span>
                  </h4>
                  <div class="h-64">
                    <Line v-if="chartData.loadAverage" :data="chartData.loadAverage" :options="chartOptions" />
                  </div>
                </div>

                <!-- Top Processes Table -->
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-6 lg:col-span-2">
                  <h4 class="text-base font-semibold text-white mb-4">Top Resource-Consuming Processes</h4>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="border-b border-gray-700">
                          <th class="text-left text-gray-400 font-medium pb-3 pr-4">Process</th>
                          <th class="text-right text-gray-400 font-medium pb-3 px-4">CPU %</th>
                          <th class="text-right text-gray-400 font-medium pb-3 px-4">Memory %</th>
                          <th class="text-right text-gray-400 font-medium pb-3 pl-4">PID</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="!metrics.topProcesses || metrics.topProcesses.length === 0">
                          <td colspan="4" class="text-center text-gray-500 py-8">
                            <div class="flex flex-col items-center space-y-2">
                              <svg class="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                              <p>Install the monitoring agent to see top processes</p>
                            </div>
                          </td>
                        </tr>
                        <tr v-else v-for="(process, index) in metrics.topProcesses" :key="index" class="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                          <td class="py-3 pr-4">
                            <div class="flex items-center space-x-2">
                              <div :class="[
                                'w-6 h-6 rounded flex items-center justify-center text-xs font-bold',
                                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                index === 1 ? 'bg-gray-500/20 text-gray-400' :
                                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                'bg-gray-700/20 text-gray-500'
                              ]">
                                {{ index + 1 }}
                              </div>
                              <span class="text-white font-mono text-xs">{{ process.name }}</span>
                            </div>
                          </td>
                          <td class="text-right px-4">
                            <div class="flex items-center justify-end space-x-2">
                              <div class="flex-1 bg-gray-800 rounded-full h-2 max-w-[60px]">
                                <div 
                                  :style="{ width: `${Math.min(process.cpu, 100)}%` }"
                                  :class="[
                                    'h-2 rounded-full transition-all',
                                    process.cpu > 80 ? 'bg-red-500' :
                                    process.cpu > 50 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  ]"
                                ></div>
                              </div>
                              <span class="text-white font-semibold w-12">{{ process.cpu.toFixed(1) }}%</span>
                            </div>
                          </td>
                          <td class="text-right px-4">
                            <div class="flex items-center justify-end space-x-2">
                              <div class="flex-1 bg-gray-800 rounded-full h-2 max-w-[60px]">
                                <div 
                                  :style="{ width: `${Math.min(process.memory, 100)}%` }"
                                  class="bg-purple-500 h-2 rounded-full transition-all"
                                ></div>
                              </div>
                              <span class="text-white font-semibold w-12">{{ process.memory.toFixed(1) }}%</span>
                            </div>
                          </td>
                          <td class="text-right pl-4">
                            <span class="text-gray-400 font-mono text-xs">{{ process.pid }}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Additional Info -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-400">Uptime</span>
                    <span class="text-base font-semibold text-white">{{ formatUptime(metrics.uptime) }}</span>
                  </div>
                </div>
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-400">Load Average</span>
                    <span class="text-base font-semibold text-white font-mono">{{ metrics.loadAverage ? metrics.loadAverage.join(', ') : '0, 0, 0' }}</span>
                  </div>
                </div>
              </div>
              </div>

            </div>

            <!-- Costs Tab -->
            <div v-else-if="activeTab === 'costs'" class="space-y-6">
              
              <!-- Cost Tracking Disabled -->
              <div v-if="costTrackingDisabled" class="text-center py-12">
                <div class="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-white mb-3">Cost Tracking Disabled</h3>
                <p class="text-gray-400 mb-6">
                  Cost tracking is currently disabled. AWS Cost Explorer API costs $0.01 per request.
                </p>
                <button
                  @click="enableCostTracking"
                  class="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
                >
                  Enable Cost Tracking
                </button>
              </div>
              
              <!-- Loading State -->
              <div v-else-if="loadingCosts" class="flex items-center justify-center py-20">
                <svg class="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>

              <!-- Data Not Available -->
              <div v-else-if="!costDataAvailable" class="space-y-6">
                
                <!-- Error Banner -->
                <div class="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/30 rounded-2xl p-8 text-center">
                  <div class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 class="text-2xl font-bold text-white mb-3">Cost Data Not Available</h3>
                  <p class="text-gray-300 mb-6">
                    {{ costErrorMessage || 'AWS Cost Explorer is not enabled or IAM permissions are missing.' }}
                  </p>
                </div>

                <!-- Setup Instructions -->
                <div class="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 text-indigo-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    How to Enable Cost Tracking
                  </h3>

                  <div class="space-y-6">
                    <!-- Step 1 -->
                    <div>
                      <div class="flex items-start space-x-3 mb-3">
                        <div class="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-400 font-bold">
                          1
                        </div>
                        <div class="flex-1">
                          <h4 class="text-white font-semibold mb-2">Enable AWS Cost Explorer</h4>
                          <ol class="text-sm text-gray-300 space-y-1 list-disc list-inside">
                            <li>Go to AWS Console → Billing Dashboard</li>
                            <li>Navigate to "Cost Explorer"</li>
                            <li>Click "Enable Cost Explorer" (free to enable)</li>
                            <li>Wait 24 hours for initial data to populate</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <!-- Step 2 -->
                    <div>
                      <div class="flex items-start space-x-3 mb-3">
                        <div class="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-400 font-bold">
                          2
                        </div>
                        <div class="flex-1">
                          <h4 class="text-white font-semibold mb-2">Enable Cost Allocation Tags (Required for Per-Instance Costs)</h4>
                          <div class="space-y-3">
                            <p class="text-sm text-gray-300">
                              <strong>Without this step, you'll see costs for ALL EC2 instances combined, not individual servers.</strong>
                            </p>
                            
                            <!-- Substeps -->
                            <div class="bg-gray-900/50 rounded-lg p-4 space-y-3">
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.1</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300">Open AWS Console and navigate to:</p>
                                  <code class="text-xs text-green-400 block mt-1 bg-gray-950/50 px-2 py-1 rounded">
                                    Billing and Cost Management → Cost Allocation Tags
                                  </code>
                                </div>
                              </div>
                              
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.2</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300">Click on the <strong>"User-defined cost allocation tags"</strong> tab</p>
                                </div>
                              </div>
                              
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.3</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300 mb-2">Use the search box and search for:</p>
                                  <code class="text-xs text-yellow-400 block bg-gray-950/50 px-2 py-1 rounded">
                                    Name
                                  </code>
                                  <p class="text-xs text-gray-400 mt-1">
                                    (This tag contains the server name you set in AWS)
                                  </p>
                                </div>
                              </div>
                              
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.4</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300">Check the checkbox next to <strong>Name</strong></p>
                                </div>
                              </div>
                              
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.5</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300">Click the <strong>"Activate"</strong> button at the top</p>
                                </div>
                              </div>
                              
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.6</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300">
                                    <strong>⏰ Wait 24 hours</strong> for the tag to become active and for cost data to populate
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <!-- Important Note -->
                            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                              <div class="flex items-start space-x-2">
                                <svg class="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div class="text-xs text-yellow-300">
                                  <strong>Important:</strong> After activation, AWS needs 24 hours to start tracking costs by instance. 
                                  Cost data will appear in CloudEvy the next day after the waiting period.
                                </div>
                              </div>
                            </div>
                            
                            <!-- Visual Aid -->
                            <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                              <div class="flex items-start space-x-2">
                                <svg class="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div class="text-xs text-blue-300">
                                  <strong>What you'll see after enabling:</strong><br>
                                  Before: "Costs for ALL EC2 instances: $50.00"<br>
                                  After: "Costs for instance {{ serverDetails?.instanceId || 'i-xxx' }}: $5.00"
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Step 3: Add IAM Permissions -->
                    <div>
                      <div class="flex items-start space-x-3 mb-3">
                        <div class="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-400 font-bold">
                          2
                        </div>
                        <div class="flex-1">
                          <h4 class="text-white font-semibold mb-2">Add IAM Permissions</h4>
                          <p class="text-sm text-gray-300 mb-2">Attach this policy to your IAM user/role:</p>
                          <div class="bg-gray-950/50 border border-gray-800 rounded-lg px-4 py-3 relative group">
                            <pre class="text-xs text-green-400 font-mono overflow-x-auto"><code>{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
      ],
      "Resource": "*"
    }
  ]
}</code></pre>
                            <button
                              @click="copyIAMPolicy"
                              class="absolute right-2 top-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded text-xs transition"
                            >
                              {{ iamPolicyCopied ? 'Copied!' : 'Copy' }}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Step 3 -->
                    <div>
                      <div class="flex items-start space-x-3">
                        <div class="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-400 font-bold">
                          4
                        </div>
                        <div class="flex-1">
                          <h4 class="text-white font-semibold mb-2">Refresh & Try Again</h4>
                          <p class="text-sm text-gray-300 mb-3">
                            After completing all steps above, retry to fetch cost data.
                          </p>
                          <div class="flex items-center space-x-3">
                            <button
                              @click="retryFetchCosts"
                              class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Retry Now
                            </button>
                            <button
                              @click="disableCostTracking"
                              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Disable Cost Tracking
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Additional Info -->
                <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="text-sm text-blue-300">
                      <strong>Note:</strong> AWS Cost Explorer is free to enable, but API calls cost $0.01 per request. 
                      CloudEvy caches cost data to minimize API usage.
                    </div>
                  </div>
                </div>

              </div>

              <!-- Cost Overview (Real Data) -->
              <div v-else class="space-y-6">
                
                <!-- Header with Disable Button -->
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-white">Cost Analytics</h3>
                    <p class="text-sm text-gray-400 mt-1">AWS Cost Explorer data for this server</p>
                  </div>
                  <button
                    @click="disableCostTracking"
                    class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span>Disable Cost Tracking</span>
                  </button>
                </div>

                <!-- Setup Instructions (Collapsible) -->
                <div class="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                  <button
                    @click="showCostInstructions = !showCostInstructions"
                    class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/70 transition-colors"
                  >
                    <div class="flex items-center space-x-3">
                      <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div class="text-left">
                        <h4 class="text-white font-semibold">Setup Instructions</h4>
                        <p class="text-xs text-gray-400">How to enable per-instance cost tracking</p>
                      </div>
                    </div>
                    <svg 
                      :class="['w-5 h-5 text-gray-400 transition-transform', showCostInstructions ? 'rotate-180' : '']" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div v-if="showCostInstructions" class="px-6 pb-6 space-y-6">
                    
                    <!-- Step 1: Enable Cost Explorer -->
                    <div>
                      <div class="flex items-start space-x-3 mb-3">
                        <div class="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-400 font-bold">
                          1
                        </div>
                        <div class="flex-1">
                          <h4 class="text-white font-semibold mb-2">Enable AWS Cost Explorer</h4>
                          <ol class="text-sm text-gray-300 space-y-1 list-disc list-inside">
                            <li>Go to AWS Console → Billing Dashboard</li>
                            <li>Navigate to "Cost Explorer"</li>
                            <li>Click "Enable Cost Explorer" (free to enable)</li>
                            <li>Wait 24 hours for initial data to populate</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <!-- Step 2: Enable Cost Allocation Tags -->
                    <div>
                      <div class="flex items-start space-x-3 mb-3">
                        <div class="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-400 font-bold">
                          2
                        </div>
                        <div class="flex-1">
                          <h4 class="text-white font-semibold mb-2">Enable Cost Allocation Tags (Required for Per-Instance Costs)</h4>
                          <div class="space-y-3">
                            <p class="text-sm text-gray-300">
                              <strong>Without this step, you'll see costs for ALL EC2 instances combined, not individual servers.</strong>
                            </p>
                            
                            <!-- Substeps -->
                            <div class="bg-gray-900/50 rounded-lg p-4 space-y-3">
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.1</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300 mb-2">Open AWS Console and navigate to <strong>Billing Dashboard</strong>:</p>
                                  <div class="space-y-2">
                                    <div class="bg-gray-950/50 rounded px-3 py-2">
                                      <p class="text-xs text-gray-400 mb-1">Option A: Direct URL</p>
                                      <code class="text-xs text-green-400 block">
                                        https://console.aws.amazon.com/billing/home#/tags
                                      </code>
                                    </div>
                                    <div class="bg-gray-950/50 rounded px-3 py-2">
                                      <p class="text-xs text-gray-400 mb-1">Option B: From Console</p>
                                      <div class="text-xs text-green-400 space-y-1">
                                        <div>1. Click your <strong>account name</strong> (top right)</div>
                                        <div>2. Select <strong>"Billing and Cost Management"</strong></div>
                                        <div>3. In left sidebar, find <strong>"Cost allocation tags"</strong></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.2</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300 mb-2">You'll see TWO tabs at the top. Click on:</p>
                                  <div class="bg-indigo-500/10 border border-indigo-500/30 rounded px-3 py-2">
                                    <p class="text-sm text-indigo-300 font-semibold">
                                      📌 "AWS-generated cost allocation tags"
                                    </p>
                                    <p class="text-xs text-gray-400 mt-1">(NOT "User-defined" - use the AWS-generated tab)</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.3</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300 mb-2">In the search/filter box, type:</p>
                                  <div class="bg-gray-950/50 border border-gray-800 rounded-lg px-4 py-3">
                                    <code class="text-base text-yellow-400 font-bold">Name</code>
                                  </div>
                                  <div class="mt-3 space-y-2">
                                    <div class="bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                                      <p class="text-xs text-red-300">
                                        <strong>⚠️ Tag Not Showing?</strong> This is normal if you've never enabled it before. Try these:
                                      </p>
                                      <ul class="text-xs text-gray-400 mt-2 space-y-1 list-disc list-inside">
                                        <li>Clear the search box and scroll through ALL tags</li>
                                        <li>Ensure you're in "User-defined tags" tab</li>
                                        <li>Make sure your EC2 instance has a "Name" tag in AWS console</li>
                                        <li>If still not visible, try refreshing the page</li>
                                      </ul>
                                    </div>
                                    <p class="text-xs text-gray-400">
                                      <strong>What it looks like:</strong> A row in the table with tag name "Name" and a checkbox on the left
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.4</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300 mb-2">
                                    <strong>Check the checkbox</strong> in the leftmost column next to "Name"
                                  </p>
                                  <div class="bg-gray-950/50 rounded px-3 py-2">
                                    <p class="text-xs text-gray-400">
                                      The row should highlight when selected (usually turns blue/darker)
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.5</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300 mb-2">
                                    Click the <strong>"Activate"</strong> button (usually at top-right of the table)
                                  </p>
                                  <div class="bg-green-500/10 border border-green-500/30 rounded px-3 py-2">
                                    <p class="text-xs text-green-300">
                                      ✅ You'll see a success message: "Tag activation is processing"
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div class="flex items-start space-x-2">
                                <span class="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-1 rounded">2.6</span>
                                <div class="flex-1">
                                  <p class="text-sm text-gray-300 mb-2">
                                    <strong>⏰ Wait 24 hours</strong> for the tag to become active
                                  </p>
                                  <div class="bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2 space-y-1">
                                    <p class="text-xs text-yellow-300">
                                      <strong>During this time:</strong>
                                    </p>
                                    <ul class="text-xs text-gray-400 space-y-1 list-disc list-inside">
                                      <li>AWS activates the tag across your account</li>
                                      <li>Cost data starts being tracked per instance</li>
                                      <li>CloudEvy will show "ALL EC2 costs" until this completes</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <!-- Important Note -->
                            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                              <div class="flex items-start space-x-2">
                                <svg class="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div class="text-xs text-yellow-300">
                                  <strong>Important:</strong> After activation, AWS needs 24 hours to start tracking costs by instance. 
                                  Cost data will appear in CloudEvy the next day after the waiting period.
                                </div>
                              </div>
                            </div>
                            
                            <!-- Visual Aid -->
                            <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                              <div class="flex items-start space-x-2">
                                <svg class="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div class="text-xs text-blue-300">
                                  <strong>What you'll see after enabling:</strong><br>
                                  Before: "Costs for ALL EC2 instances: $50.00"<br>
                                  After: "Costs for instance {{ serverDetails?.instanceId || 'i-xxx' }}: $5.00"
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Step 3: Add IAM Permissions -->
                    <div>
                      <div class="flex items-start space-x-3 mb-3">
                        <div class="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-400 font-bold">
                          3
                        </div>
                        <div class="flex-1">
                          <h4 class="text-white font-semibold mb-2">Add IAM Permissions</h4>
                          <p class="text-sm text-gray-300 mb-2">Attach this policy to your IAM user/role:</p>
                          <div class="bg-gray-950/50 border border-gray-800 rounded-lg px-4 py-3 relative group">
                            <pre class="text-xs text-green-400 font-mono overflow-x-auto"><code>{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
      ],
      "Resource": "*"
    }
  ]
}</code></pre>
                            <button
                              @click="copyIAMPolicy"
                              class="absolute right-2 top-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded text-xs transition"
                            >
                              {{ iamPolicyCopied ? 'Copied!' : 'Copy' }}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
                
                <!-- Cache Info Banner -->
                <div v-if="costDataCached" class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-start space-x-3">
                      <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div class="text-sm text-blue-300">
                        <strong>Cached Data:</strong> Showing cached cost data to reduce AWS API costs ($0.01 per request). Data refreshes every 24 hours (matches AWS billing data update frequency).
                      </div>
                    </div>
                    <button
                      @click="refreshCostData"
                      :disabled="loadingCosts"
                      class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>
                
                <!-- API Usage Stats -->
                <div v-if="!costTrackingDisabled" class="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                  <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-3 flex-1">
                      <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <div>
                        <p class="text-sm font-semibold text-green-400 mb-2">Cost Explorer API Usage (Last 30 Days)</p>
                        <div v-if="apiStats" class="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p class="text-gray-400">API Calls</p>
                            <p class="text-white font-bold text-lg">{{ apiStats.totalCalls }}</p>
                          </div>
                          <div>
                            <p class="text-gray-400">Total Cost</p>
                            <p class="text-white font-bold text-lg">${{ apiStats.totalCost }}</p>
                          </div>
                          <div>
                            <p class="text-gray-400">Cache Efficiency</p>
                            <p class="text-green-400 font-bold text-lg">{{ apiStats.cacheHitRate }}%</p>
                          </div>
                        </div>
                        <div v-else class="text-xs text-gray-400">
                          Loading API usage statistics...
                        </div>
                        <p v-if="apiStats && apiStats.lastCall" class="text-xs text-gray-500 mt-2">
                          Last API call: {{ new Date(apiStats.lastCall).toLocaleString() }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Monthly Cost Summary -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Current Month -->
                  <div class="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-gray-400 text-sm font-medium">Current Month</span>
                      <div :class="[
                        'px-2 py-1 rounded-full text-xs font-semibold',
                        costData.trend === 'increasing' ? 'bg-red-500/20 text-red-400' :
                        costData.trend === 'decreasing' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      ]">
                        {{ costData.trend === 'increasing' ? '↑' : costData.trend === 'decreasing' ? '↓' : '→' }} {{ costData.trend }}
                      </div>
                    </div>
                    <div class="text-3xl font-bold text-white mb-1">
                      ${{ costData.currentMonth }}
                    </div>
                    <p class="text-xs text-gray-400">Month-to-date spend</p>
                  </div>

                  <!-- Last Month -->
                  <div class="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-gray-400 text-sm font-medium">Last Month</span>
                    </div>
                    <div class="text-3xl font-bold text-white mb-1">
                      ${{ costData.lastMonth }}
                    </div>
                    <p class="text-xs text-gray-400">Previous month total</p>
                  </div>

                  <!-- Daily Average -->
                  <div class="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-gray-400 text-sm font-medium">Daily Average</span>
                    </div>
                    <div class="text-3xl font-bold text-white mb-1">
                      ${{ (parseFloat(costData.currentMonth) / 30).toFixed(2) }}
                    </div>
                    <p class="text-xs text-gray-400">Avg cost per day</p>
                  </div>
                </div>

                <!-- Cost Trend Chart -->
                <div class="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 class="text-lg font-semibold text-white mb-4">Daily Cost Trend (Last 30 Days)</h3>
                  <div class="h-64">
                    <Line :data="costChartData" :options="costChartOptions" />
                  </div>
                </div>

                <!-- Cost Breakdown -->
                <div class="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 class="text-lg font-semibold text-white mb-4">Cost Breakdown</h3>
                  <div class="space-y-3">
                    <!-- Compute -->
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span class="text-gray-300 text-sm">Compute (EC2)</span>
                        </div>
                        <span class="text-white font-semibold">${{ costData.breakdown.compute }}</span>
                      </div>
                      <div class="w-full bg-gray-800 rounded-full h-2">
                        <div class="bg-blue-500 h-2 rounded-full" :style="{ width: (parseFloat(costData.breakdown.compute) / parseFloat(costData.currentMonth) * 100) + '%' }"></div>
                      </div>
                    </div>

                    <!-- Storage -->
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                          <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span class="text-gray-300 text-sm">Storage (EBS)</span>
                        </div>
                        <span class="text-white font-semibold">${{ costData.breakdown.storage }}</span>
                      </div>
                      <div class="w-full bg-gray-800 rounded-full h-2">
                        <div class="bg-purple-500 h-2 rounded-full" :style="{ width: (parseFloat(costData.breakdown.storage) / parseFloat(costData.currentMonth) * 100) + '%' }"></div>
                      </div>
                    </div>

                    <!-- Network -->
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span class="text-gray-300 text-sm">Network (Data Transfer)</span>
                        </div>
                        <span class="text-white font-semibold">${{ costData.breakdown.network }}</span>
                      </div>
                      <div class="w-full bg-gray-800 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full" :style="{ width: (parseFloat(costData.breakdown.network) / parseFloat(costData.currentMonth) * 100) + '%' }"></div>
                      </div>
                    </div>

                    <!-- Other -->
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                          <div class="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span class="text-gray-300 text-sm">Other Services</span>
                        </div>
                        <span class="text-white font-semibold">${{ costData.breakdown.other }}</span>
                      </div>
                      <div class="w-full bg-gray-800 rounded-full h-2">
                        <div class="bg-gray-500 h-2 rounded-full" :style="{ width: (parseFloat(costData.breakdown.other) / parseFloat(costData.currentMonth) * 100) + '%' }"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Cost Optimization Tips -->
                <div class="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-6">
                  <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg class="w-5 h-5 text-indigo-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Cost Optimization Tips
                  </h3>
                  <ul class="space-y-2 text-sm text-gray-300">
                    <li class="flex items-start space-x-2">
                      <span class="text-indigo-400 font-bold">•</span>
                      <span>Use scheduled downtime to stop instances during off-peak hours</span>
                    </li>
                    <li class="flex items-start space-x-2">
                      <span class="text-indigo-400 font-bold">•</span>
                      <span>Consider rightsizing your instance type based on actual usage metrics</span>
                    </li>
                    <li class="flex items-start space-x-2">
                      <span class="text-indigo-400 font-bold">•</span>
                      <span>Enable EBS volume optimization and delete unused snapshots</span>
                    </li>
                    <li class="flex items-start space-x-2">
                      <span class="text-indigo-400 font-bold">•</span>
                      <span>Review and optimize data transfer costs by using CloudFront or VPC endpoints</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            <!-- Traffic Insights Tab -->
            <TrafficInsights 
              v-else-if="activeTab === 'traffic'" 
              :server-id="serverData?.id"
              :patterns="trafficPatterns"
              :loading="trafficLoading"
              :error="trafficError"
              @schedule-downtime="handleScheduleFromTraffic"
              @refresh="fetchTrafficPatterns"
            />

            <!-- Agent Setup Tab -->
            <div v-else-if="activeTab === 'agent' && serverData" class="space-y-6">
              
              <!-- Agent Status Banner -->
              <div :class="[
                'border-2 rounded-2xl p-6',
                agentStatusDisplay.bgColor,
                agentStatusDisplay.borderColor
              ]">
                <div class="flex items-start space-x-4">
                  <div :class="[
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl',
                    agentStatusDisplay.bgColor
                  ]">
                    {{ agentStatusDisplay.icon }}
                  </div>
                  <div class="flex-1">
                    <h3 :class="['text-xl font-bold mb-1', agentStatusDisplay.color]">
                      {{ agentStatusDisplay.text }}
                    </h3>
                    <p class="text-gray-300 text-sm">{{ agentStatusDisplay.description }}</p>
                    
                    <!-- Connected - Show Metrics Info -->
                    <div v-if="agentStatus === 'connected'">
                      <div class="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div class="bg-gray-900/50 rounded-lg p-3">
                          <div class="text-xs text-gray-500">Agent Version</div>
                          <div class="flex items-center space-x-2">
                            <span class="text-white font-semibold font-mono">{{ agentVersion || '1.0.0' }}</span>
                            <span v-if="isAgentOutdated" class="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                              Update!
                            </span>
                            <span v-else class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                              Latest
                            </span>
                          </div>
                        </div>
                        <div class="bg-gray-900/50 rounded-lg p-3">
                          <div class="text-xs text-gray-500">Update Interval</div>
                          <div class="text-white font-semibold">5 seconds</div>
                        </div>
                        <div class="bg-gray-900/50 rounded-lg p-3">
                          <div class="text-xs text-gray-500">Last Update</div>
                          <div class="text-white font-semibold">{{ timeSinceLastSeen }}</div>
                        </div>
                        <div class="bg-gray-900/50 rounded-lg p-3">
                          <div class="text-xs text-gray-500">Data Source</div>
                          <div class="text-white font-semibold">Real-Time Agent</div>
                        </div>
                        <div class="bg-gray-900/50 rounded-lg p-3">
                          <div class="text-xs text-gray-500">Status</div>
                          <div class="text-green-400 font-semibold flex items-center space-x-1">
                            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span>Active</span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Update Agent Button (if outdated) -->
                      <div v-if="isAgentOutdated" class="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-1">
                              <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span class="text-sm font-semibold text-orange-300">New Agent Version Available</span>
                            </div>
                            <p class="text-xs text-gray-400">Version {{ latestAgentVersion }} is available with improved metrics collection.</p>
                          </div>
                          <button
                            @click="showAgentUpdateInstructions = !showAgentUpdateInstructions"
                            class="ml-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>{{ showAgentUpdateInstructions ? 'Hide' : 'Update Agent' }}</span>
                          </button>
                        </div>
                        
                        <!-- Update Instructions (toggleable) -->
                        <div v-if="showAgentUpdateInstructions" class="mt-4 space-y-3">
                          <div class="text-xs text-gray-300">Run this command on your server to update the agent:</div>
                          <div class="relative">
                            <pre class="bg-gray-950 border border-gray-700 rounded-lg p-4 overflow-x-auto text-xs text-green-400">{{ updateAgentCommand }}</pre>
                            <button
                              @click="copyToClipboard(updateAgentCommand)"
                              class="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                              :class="{ 'bg-green-600': copied }"
                            >
                              <svg v-if="!copied" class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Stale - Show Warning -->
                    <div v-else-if="agentStatus === 'stale'" class="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <div class="text-sm text-yellow-300">
                        ⚠️ Agent hasn't reported in a while. Check if the service is still running:
                      </div>
                      <code class="text-xs text-green-400 mt-2 block">sudo systemctl status cloudevy-agent</code>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Show Installation Instructions ONLY if agent is not connected -->
              <div v-if="agentStatus !== 'connected'">
                <!-- Header -->
                <div class="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-6">
                  <div class="flex items-start space-x-4">
                    <div class="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-white mb-2">Get Real-Time Metrics</h3>
                      <p class="text-gray-300">Install the Cloudevy monitoring agent on your server to collect real-time CPU, Memory, Disk, and Network metrics every 5 seconds.</p>
                    </div>
                  </div>
                </div>

              <!-- Server Info -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <div class="text-xs text-gray-500 mb-1">Server ID</div>
                  <div class="text-white font-mono font-semibold">{{ serverData.id }}</div>
                </div>
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <div class="text-xs text-gray-500 mb-1">Server Name</div>
                  <div class="text-white font-semibold">{{ serverData.name }}</div>
                </div>
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                  <div class="text-xs text-gray-500 mb-1">IP Address</div>
                  <div class="text-white font-mono">{{ serverData.ipAddress || 'N/A' }}</div>
                </div>
              </div>

              <!-- API Key -->
              <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-lg font-semibold text-white">API Key</h4>
                  <button
                    @click="copyToClipboard(serverData.apiKey)"
                    class="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg text-sm font-medium transition flex items-center space-x-2"
                  >
                    <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <svg v-else class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
                  </button>
                </div>
                <code class="block bg-gray-950/50 border border-gray-800 rounded-lg px-4 py-3 text-green-400 font-mono text-sm break-all">{{ serverData.apiKey || 'Generating...' }}</code>
              </div>

              <!-- Installation Instructions -->
              <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-semibold text-white">Quick Install</h4>
                  
                  <!-- Distro Selector -->
                  <div class="flex items-center space-x-2">
                    <span class="text-xs text-gray-400">Select your OS:</span>
                    <select 
                      v-model="selectedDistro"
                      class="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option v-for="distro in distros" :key="distro.value" :value="distro.value">
                        {{ distro.icon }} {{ distro.label }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- One-Command Install (Recommended) -->
                <div class="bg-indigo-500/10 border-2 border-indigo-500/30 rounded-xl p-4 mb-6">
                  <div class="flex items-start space-x-3 mb-3">
                    <svg class="w-6 h-6 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <div class="text-sm font-bold text-indigo-300">🐳 Docker Install (Recommended)</div>
                      <div class="text-xs text-gray-400 mt-1">Run the agent as a Docker container with one command:</div>
                    </div>
                  </div>
                  <div class="bg-gray-950/50 border border-gray-800 rounded-lg px-4 py-3 relative group">
                    <code class="text-green-400 font-mono text-sm block break-all whitespace-pre-wrap">{{ installCommand }}</code>
                    <button
                      @click="copyToClipboard(installCommand)"
                      class="absolute right-2 top-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition opacity-0 group-hover:opacity-100 shadow-lg"
                    >
                      📋 Copy All
                    </button>
                  </div>
                  <div class="mt-3 text-xs text-gray-500">
                    <strong class="text-gray-400">Prerequisites:</strong> Docker must be installed on your server. 
                    <a href="https://docs.docker.com/engine/install/" target="_blank" class="text-indigo-400 hover:text-indigo-300 underline">Install Docker →</a>
                  </div>
                </div>
                
                <div class="text-xs text-gray-500 text-center mb-4">Step-by-step guide:</div>
                
                <div class="space-y-4">
                  <!-- Step 1: Install Docker -->
                  <div>
                    <div class="flex items-center space-x-2 mb-2">
                      <div class="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                      <span class="text-sm font-semibold text-gray-300">Install Docker (if not already installed)</span>
                    </div>
                    <div class="ml-8 bg-gray-950/50 border border-gray-800 rounded-lg px-4 py-3 relative group">
                      <code class="text-green-400 font-mono text-sm whitespace-pre-wrap">{{ dockerInstallCommand }}</code>
                      <button
                        @click="copyToClipboard(dockerInstallCommand)"
                        class="absolute right-2 top-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded text-xs transition opacity-0 group-hover:opacity-100"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <!-- Step 2: Run Agent Container -->
                  <div>
                    <div class="flex items-center space-x-2 mb-2">
                      <div class="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                      <span class="text-sm font-semibold text-gray-300">Run the agent container</span>
                    </div>
                    <div class="ml-8 bg-gray-950/50 border border-gray-800 rounded-lg px-4 py-3 relative group max-h-64 overflow-y-auto">
                      <code class="text-green-400 font-mono text-sm block whitespace-pre-wrap">{{ installCommand }}</code>
                      <button
                        @click="copyToClipboard(installCommand)"
                        class="sticky top-2 right-2 float-right px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded text-xs transition"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <!-- Verification Step -->
                  <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                    <div class="flex items-start space-x-3">
                      <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div class="text-sm font-semibold text-blue-300 mb-1">Verify Installation</div>
                        <div class="text-xs text-gray-400 space-y-1">
                          <div>✓ Check if running: <code class="text-green-400">docker ps | grep cloudevy-agent</code></div>
                          <div>✓ View logs: <code class="text-green-400">docker logs -f cloudevy-agent</code></div>
                          <div>✓ Restart agent: <code class="text-green-400">docker restart cloudevy-agent</code></div>
                          <div>✓ Update agent: <code class="text-green-400">docker pull cloudevy/cloudevy-agent:latest && docker restart cloudevy-agent</code></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- What You Get -->
              <div class="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
                <h4 class="text-lg font-semibold text-white mb-4">What You Get</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div class="text-white font-medium text-sm">Real-Time CPU</div>
                      <div class="text-gray-400 text-xs">Updated every 5 seconds</div>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div class="text-white font-medium text-sm">Live Memory</div>
                      <div class="text-gray-400 text-xs">Actual RAM usage</div>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div class="text-white font-medium text-sm">Disk Usage</div>
                      <div class="text-gray-400 text-xs">Real disk consumption</div>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div class="text-white font-medium text-sm">Network Traffic</div>
                      <div class="text-gray-400 text-xs">Live inbound/outbound</div>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div class="text-white font-medium text-sm">System Load</div>
                      <div class="text-gray-400 text-xs">1, 5, 15 min averages</div>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div class="text-white font-medium text-sm">Disk I/O Speed</div>
                      <div class="text-gray-400 text-xs">Read/Write MB/s</div>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div class="text-white font-medium text-sm">Top Processes</div>
                      <div class="text-gray-400 text-xs">Resource hogs tracker</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Troubleshooting -->
              <div class="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6">
                <h4 class="text-lg font-semibold text-white mb-3">Troubleshooting</h4>
                <div class="space-y-2 text-sm text-gray-300">
                  <p><strong class="text-white">Agent not reporting?</strong></p>
                  <ul class="list-disc list-inside space-y-1 ml-2 text-gray-400">
                    <li>Check if Node.js is installed: <code class="text-green-400 font-mono">node --version</code></li>
                    <li>Verify agent is running: <code class="text-green-400 font-mono">sudo systemctl status cloudevy-agent</code></li>
                    <li>Check logs: <code class="text-green-400 font-mono">sudo journalctl -u cloudevy-agent -f</code></li>
                    <li>Restart service: <code class="text-green-400 font-mono">sudo systemctl restart cloudevy-agent</code></li>
                    <li>Ensure firewall allows outbound connections to {{ apiUrl }}</li>
                  </ul>
                </div>
              </div>
              
              </div><!-- End v-if for installation instructions -->

              <!-- Agent Management (shown when connected) -->
              <div v-else class="space-y-6">
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                  <h4 class="text-lg font-semibold text-white mb-4">🎮 Agent Remote Control</h4>
                  
                  <div class="space-y-4">
                    <!-- Restart Agent -->
                    <div class="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <div class="flex-1">
                        <div class="font-medium text-white">Restart Agent</div>
                        <div class="text-xs text-gray-400">Restart the monitoring service remotely</div>
                      </div>
                      <button 
                        @click="sendAgentCommand('restart')"
                        :disabled="isSendingCommand"
                        class="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{{ isSendingCommand ? 'Sending...' : 'Restart' }}</span>
                      </button>
                    </div>
                    
                    <!-- Stop Agent -->
                    <div class="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <div class="flex-1">
                        <div class="font-medium text-white">Stop Agent</div>
                        <div class="text-xs text-gray-400">Stop monitoring (can be restarted manually)</div>
                      </div>
                      <button 
                        @click="sendAgentCommand('stop')"
                        :disabled="isSendingCommand"
                        class="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{{ isSendingCommand ? 'Sending...' : 'Stop' }}</span>
                      </button>
                    </div>
                    
                    <!-- Uninstall Agent -->
                    <div class="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                      <div class="flex-1">
                        <div class="font-medium text-red-300">Uninstall Agent</div>
                        <div class="text-xs text-gray-400">Permanently remove agent from server</div>
                      </div>
                      <button 
                        @click="sendAgentCommand('uninstall')"
                        :disabled="isSendingCommand"
                        class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>{{ isSendingCommand ? 'Sending...' : 'Uninstall' }}</span>
                      </button>
                    </div>
                  </div>
                  
                  <div class="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                    <div class="flex items-start space-x-2">
                      <svg class="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div class="text-xs text-gray-300">
                        <strong class="text-indigo-300">Remote Control:</strong> Commands are sent to the agent and executed within ~30 seconds. No SSH access required!
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Manual Commands (fallback) -->
                <div class="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                  <h4 class="text-lg font-semibold text-white mb-4">📝 Manual Commands (SSH)</h4>
                  
                  <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <div class="flex-1">
                        <div class="text-sm text-gray-300">View Logs</div>
                        <code class="text-xs text-green-400 font-mono">docker logs -f cloudevy-agent</code>
                      </div>
                      <button
                        @click="copyToClipboard('docker logs -f cloudevy-agent')"
                        class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition"
                      >
                        Copy
                      </button>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <div class="flex-1">
                        <div class="text-sm text-gray-300">Update Agent</div>
                        <code class="text-xs text-green-400 font-mono">docker pull cloudevy/cloudevy-agent:latest && docker restart cloudevy-agent</code>
                      </div>
                      <button
                        @click="copyToClipboard('docker pull cloudevy/cloudevy-agent:latest && docker restart cloudevy-agent')"
                        class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div><!-- End Agent Setup Tab Content -->
          </div><!-- End Scrollable Content -->

          <!-- Footer -->
          <div class="relative p-6 sm:p-8 border-t border-gray-700/50 bg-gray-900/30 flex justify-end flex-shrink-0">
            <button
              @click="closeModal"
              class="px-6 py-3 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Custom Confirm Dialog for server actions -->
    <ConfirmDialog
      :is-open="confirmDialog.isOpen"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :variant="confirmDialog.variant"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      :require-input="confirmDialog.requireInput"
      :input-label="confirmDialog.inputLabel"
      :input-placeholder="confirmDialog.inputPlaceholder"
      :expected-input="confirmDialog.expectedInput"
      @confirm="confirmDialog.onConfirm"
      @cancel="confirmDialog.onCancel"
      @close="confirmDialog.isOpen = false"
    />
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import apiClient from '@/api/client'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import TrafficInsights from '@/components/TrafficInsights.vue'
import { useToast } from '@/composables/useToast'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const toast = useToast()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  serverId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const serverDetails = ref(null)
const metrics = ref(null)
const history = ref([])
const selectedTimeRange = ref('1h')
const activeTab = ref('metrics')
const serverData = ref(null)
const copied = ref(false)
const dataSource = ref('mock')
const hasAgent = ref(false)
const isPerformingAction = ref(false)
const selectedDistro = ref('amazon-linux') // Default for AWS
const agentLastSeen = ref(null)
const agentStatus = ref('disconnected') // 'connected', 'stale', 'disconnected'
const agentVersion = ref(null)
const latestAgentVersion = ref('1.2.0')
const showAgentUpdateInstructions = ref(false)

// Cost tracking state
const loadingCosts = ref(false)
const costDataAvailable = ref(false)
const costDataCached = ref(false)
const costErrorMessage = ref('')
const iamPolicyCopied = ref(false)
const costTrackingDisabled = ref(false)
const showCostInstructions = ref(false)
const costData = ref({
  currentMonth: '0.00',
  lastMonth: '0.00',
  daily: [],
  trend: 'stable',
  breakdown: {
    compute: '0.00',
    storage: '0.00',
    network: '0.00',
    other: '0.00'
  }
})
const apiStats = ref(null)

// Load cost tracking preference from localStorage
const loadCostTrackingPreference = () => {
  const disabled = localStorage.getItem('costTrackingDisabled')
  costTrackingDisabled.value = disabled === 'true'
}

// Traffic Insights state
const trafficPatterns = ref({ success: false })
const trafficLoading = ref(false)
const trafficError = ref(null)

// Confirm dialog state
const confirmDialog = ref({
  isOpen: false,
  title: '',
  message: '',
  variant: 'warning',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  requireInput: false,
  inputLabel: '',
  inputPlaceholder: '',
  expectedInput: '',
  onConfirm: () => {},
  onCancel: () => {}
})

const timeRanges = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' }
]

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#D1D5DB',
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12,
          weight: '500'
        }
      }
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#F3F4F6',
      bodyColor: '#D1D5DB',
      borderColor: '#374151',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y.toFixed(2)
            // Add appropriate unit based on label
            if (label.includes('CPU') || label.includes('Memory')) {
              label += '%'
            } else if (label.includes('MB/s')) {
              label += ' MB/s'
            }
          }
          return label
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(75, 85, 99, 0.15)',
        drawBorder: false
      },
      ticks: {
        color: '#9CA3AF',
        font: {
          size: 11
        },
        maxRotation: 0,
        autoSkipPadding: 20
      }
    },
    y: {
      grid: {
        color: 'rgba(75, 85, 99, 0.15)',
        drawBorder: false
      },
      ticks: {
        color: '#9CA3AF',
        font: {
          size: 11
        },
        callback: function(value) {
          return value.toFixed(0)
        }
      },
      beginAtZero: true
    }
  },
  animation: {
    duration: 750,
    easing: 'easeInOutQuart'
  }
}

const chartData = computed(() => {
  if (!history.value.length) return {}

  const labels = history.value.map(point => {
    const date = new Date(point.timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  })

  return {
    cpu: {
      labels,
      datasets: [{
        label: 'CPU Usage',
        data: history.value.map(p => p.cpu),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    memory: {
      labels,
      datasets: [{
        label: 'Memory Usage',
        data: history.value.map(p => p.memory),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: 'rgb(168, 85, 247)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    disk: {
      labels,
      datasets: [{
        label: 'Disk Usage',
        data: history.value.map(p => p.disk),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: 'rgb(251, 146, 60)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    network: {
      labels,
      datasets: [
        {
          label: 'Inbound',
          data: history.value.map(p => p.networkIn),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Outbound',
          data: history.value.map(p => p.networkOut),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgb(249, 115, 22)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    },
    loadAverage: {
      labels,
      datasets: [
        {
          label: '1 min',
          data: history.value.map(p => p.load1 || 0),
          borderColor: 'rgb(236, 72, 153)',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgb(236, 72, 153)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: '5 min',
          data: history.value.map(p => p.load5 || 0),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgb(139, 92, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: '15 min',
          data: history.value.map(p => p.load15 || 0),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    },
    diskIO: {
      labels,
      datasets: [
        {
          label: 'Read (MB/s)',
          data: history.value.map(p => p.diskRead || 0),
          borderColor: 'rgb(14, 165, 233)',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgb(14, 165, 233)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Write (MB/s)',
          data: history.value.map(p => p.diskWrite || 0),
          borderColor: 'rgb(244, 63, 94)',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgb(244, 63, 94)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    }
  }
})

const fetchServerMetrics = async () => {
  if (!props.serverId) return

  loading.value = true
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const [metricsRes, historyRes, serverRes] = await Promise.all([
      apiClient.get(`/metrics/server/${props.serverId}`, { signal: controller.signal }),
      apiClient.get(`/metrics/server/${props.serverId}/history?range=${selectedTimeRange.value}`, { signal: controller.signal }),
      apiClient.get(`/servers`).then(res => res.data.data.find(s => s.id === props.serverId))
    ])

    clearTimeout(timeoutId)

    if (metricsRes.data.success) {
      serverDetails.value = { name: metricsRes.data.data.serverName }
      metrics.value = metricsRes.data.data.metrics
      dataSource.value = metricsRes.data.data.source || 'mock'
      hasAgent.value = metricsRes.data.data.hasAgent || false
      
      // Extract agent version from metrics
      agentVersion.value = metrics.value.version || null
      
      // Determine agent status
      if (hasAgent.value) {
        agentLastSeen.value = metrics.value.timestamp ? new Date(metrics.value.timestamp) : null
        const now = Date.now()
        const lastSeenTime = agentLastSeen.value ? agentLastSeen.value.getTime() : 0
        const ageSeconds = (now - lastSeenTime) / 1000
        
        if (ageSeconds < 30) {
          agentStatus.value = 'connected' // Fresh data
        } else if (ageSeconds < 300) {
          agentStatus.value = 'stale' // Data older than 30s but less than 5 min
        } else {
          agentStatus.value = 'disconnected'
        }
      } else {
        agentStatus.value = 'disconnected'
        agentLastSeen.value = null
        agentVersion.value = null
      }
    }

    if (historyRes.data.success) {
      history.value = historyRes.data.data.history
    }
    
    // Store full server data for agent setup
    if (serverRes) {
      serverData.value = serverRes
      // Debug logging
      console.log('🔍 Server Data Loaded:', {
        id: serverRes.id,
        name: serverRes.name,
        provider: serverRes.provider,
        instanceId: serverRes.instanceId,
        status: serverRes.status,
        showButtons: serverRes.provider === 'aws' && !!serverRes.instanceId
      })
    }
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      console.error('Metrics request timed out')
      // Show user-friendly error
      metrics.value = {
        status: 'error',
        cpu: { usage: 0, cores: 0 },
        memory: { used: 0, total: 0, percentage: 0 },
        disk: { used: 0, total: 0, percentage: 0 },
        network: { inbound: 0, outbound: 0 },
        uptime: 0,
        loadAverage: [0, 0, 0],
        diskIO: { read: 0, write: 0 },
        topProcesses: []
      }
    } else {
      console.error('Failed to fetch server metrics:', error)
    }
  } finally {
    loading.value = false
  }
}

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const isSendingCommand = ref(false)

const sendAgentCommand = async (action) => {
  if (isSendingCommand.value) return
  
  const confirmMessages = {
    restart: 'Restart the monitoring agent? It will be back online in a few seconds.',
    stop: 'Stop the monitoring agent? You\'ll need to restart it manually via SSH.',
    uninstall: 'Permanently remove the monitoring agent? This action cannot be undone remotely.'
  }
  
  if (!confirm(confirmMessages[action])) {
    return
  }
  
  isSendingCommand.value = true
  
  try {
    const response = await apiClient.post(`/servers/${props.serverId}/agent/command`, {
      action
    })
    
    if (response.data.success) {
      toast.success(response.data.message)
      
      // If uninstalling, close modal after 2 seconds
      if (action === 'uninstall') {
        setTimeout(() => {
          emit('close')
        }, 2000)
      }
    }
  } catch (error) {
    console.error('Failed to send command:', error)
    toast.error(error.response?.data?.message || `Failed to ${action} agent`)
  } finally {
    isSendingCommand.value = false
  }
}

const apiUrl = computed(() => {
  // Detect environment and return appropriate API URL
  const hostname = window.location.hostname
  
  if (hostname === 'cloudevy.in' || hostname === 'www.cloudevy.in') {
    // Production
    return 'https://cloudevy.in/api'
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Local development
    return 'http://localhost:8002/api'
  } else {
    // Default to current origin with port 8002
    return window.location.origin.replace('8001', '8002') + '/api'
  }
})

const installCommand = computed(() => {
  if (!serverData.value) return ''
  
  // Docker-based agent installation (recommended)
  return `sudo docker run -d \\
  --name cloudevy-agent \\
  --restart unless-stopped \\
  --pid=host \\
  --network=host \\
  -v /:/host:ro \\
  -v /var/run/docker.sock:/var/run/docker.sock:ro \\
  -e CLOUDEVY_SERVER_ID=${serverData.value.id} \\
  -e CLOUDEVY_API_KEY=${serverData.value.apiKey} \\
  -e CLOUDEVY_API_URL=${apiUrl.value} \\
  cloudevy/cloudevy-agent:latest`
})

const dockerInstallCommand = computed(() => {
  const distro = selectedDistro.value
  
  const commands = {
    'amazon-linux': `# Amazon Linux 2023
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER`,
    
    'ubuntu-debian': `# Ubuntu / Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER`,
    
    'rhel-centos': `# RHEL / CentOS / Rocky Linux
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER`,
    
    'fedora': `# Fedora
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER`,
    
    'alpine': `# Alpine Linux
sudo apk add docker
sudo rc-update add docker default
sudo service docker start
sudo addgroup $USER docker`
  }
  
  return commands[distro] || commands['ubuntu-debian']
})

const nodeInstallCommand = computed(() => {
  const distro = selectedDistro.value
  
  const commands = {
    'amazon-linux': `# Amazon Linux 2 / 2023
sudo yum install -y nodejs npm
# Or use nvm for latest version:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20`,
    
    'ubuntu-debian': `# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs`,
    
    'rhel-centos': `# RHEL / CentOS / Rocky Linux
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs`,
    
    'fedora': `# Fedora
sudo dnf install -y nodejs npm`,
    
    'alpine': `# Alpine Linux
sudo apk add --update nodejs npm`
  }
  
  return commands[distro] || commands['ubuntu-debian']
})

const distros = [
  { value: 'amazon-linux', label: 'Amazon Linux', icon: '🟠' },
  { value: 'ubuntu-debian', label: 'Ubuntu / Debian', icon: '🟣' },
  { value: 'rhel-centos', label: 'RHEL / CentOS', icon: '🔴' },
  { value: 'fedora', label: 'Fedora', icon: '🔵' },
  { value: 'alpine', label: 'Alpine', icon: '⚪' }
]

const agentStatusDisplay = computed(() => {
  if (agentStatus.value === 'connected') {
    return {
      icon: '✅',
      status: 'Connected',
      message: 'Agent is actively reporting metrics',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400'
    }
  } else if (agentStatus.value === 'stale') {
    return {
      icon: '⚠️',
      status: 'Stale Connection',
      message: 'Agent last reported more than 5 minutes ago',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400'
    }
  } else {
    return {
      icon: '❌',
      status: 'Not Connected',
      message: 'Agent is not installed or not reporting',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400'
    }
  }
})

// Cost chart data
const costChartData = computed(() => {
  return {
    labels: costData.value.daily.map(d => {
      const date = new Date(d.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }),
    datasets: [
      {
        label: 'Daily Cost ($)',
        data: costData.value.daily.map(d => parseFloat(d.cost)),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  }
})

// Cost chart options
const costChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#9CA3AF',
        font: { size: 12, family: 'Inter, system-ui, sans-serif' }
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#F3F4F6',
      bodyColor: '#D1D5DB',
      borderColor: 'rgba(99, 102, 241, 0.3)',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        label: function(context) {
          return `Cost: $${context.parsed.y.toFixed(2)}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: '#9CA3AF',
        font: { size: 11 },
        callback: function(value) {
          return '$' + value.toFixed(2)
        }
      },
      grid: {
        color: 'rgba(75, 85, 99, 0.3)',
        drawBorder: false
      }
    },
    x: {
      ticks: {
        color: '#9CA3AF',
        font: { size: 11 },
        maxRotation: 45,
        minRotation: 45
      },
      grid: {
        color: 'rgba(75, 85, 99, 0.3)',
        drawBorder: false
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
}

const timeSinceLastSeen = computed(() => {
  if (!agentLastSeen.value) return 'never'
  
  const now = Date.now()
  const diff = now - agentLastSeen.value.getTime()
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
})

const isAgentOutdated = computed(() => {
  if (!agentVersion.value) return false
  // Simple version comparison (assumes semver)
  return agentVersion.value < latestAgentVersion.value
})

const updateAgentCommand = computed(() => {
  return installCommand.value // Reuse the install command (it updates if agent exists)
})

// Fetch traffic patterns
async function fetchTrafficPatterns() {
  if (!props.serverId) return
  
  trafficLoading.value = true
  trafficError.value = null
  
  try {
    const response = await apiClient.get(`/traffic/server/${props.serverId}/patterns`)
    trafficPatterns.value = response.data
  } catch (err) {
    console.error('Fetch traffic patterns error:', err)
    trafficError.value = err.response?.data?.message || 'Failed to load traffic patterns'
    trafficPatterns.value = { success: false }
  } finally {
    trafficLoading.value = false
  }
}

// Handle schedule downtime from traffic insights
function handleScheduleFromTraffic(suggestedTime) {
  console.log('Schedule downtime at:', suggestedTime)
  // TODO: Emit event to parent or open schedule modal with pre-filled time
  toast.showSuccess(`Suggested downtime: ${suggestedTime}`)
}

const closeModal = () => {
  emit('close')
}

// Server control actions
const handleStopServer = async () => {
  confirmDialog.value = {
    isOpen: true,
    title: 'Stop Server',
    message: 'Are you sure you want to stop this server? It will be powered off but data will be preserved.',
    variant: 'warning',
    confirmText: 'Stop Server',
    cancelText: 'Cancel',
    requireInput: false,
    onConfirm: async () => {
      isPerformingAction.value = true
      try {
        const response = await apiClient.post(`/servers/${props.serverId}/stop`)
        if (response.data.success) {
          toast.success('Server is stopping. This may take a moment.')
          await fetchServerMetrics()
        }
      } catch (error) {
        console.error('Failed to stop server:', error)
        toast.error(error.response?.data?.message || 'Failed to stop server. Please try again.')
      } finally {
        isPerformingAction.value = false
      }
    },
    onCancel: () => {}
  }
}

const handleStartServer = async () => {
  confirmDialog.value = {
    isOpen: true,
    title: 'Start Server',
    message: 'Are you sure you want to start this server? It will be powered on.',
    variant: 'info',
    confirmText: 'Start Server',
    cancelText: 'Cancel',
    requireInput: false,
    onConfirm: async () => {
      isPerformingAction.value = true
      try {
        const response = await apiClient.post(`/servers/${props.serverId}/start`)
        if (response.data.success) {
          toast.success('Server is starting. This may take a moment.')
          await fetchServerMetrics()
        }
      } catch (error) {
        console.error('Failed to start server:', error)
        toast.error(error.response?.data?.message || 'Failed to start server. Please try again.')
      } finally {
        isPerformingAction.value = false
      }
    },
    onCancel: () => {}
  }
}

const handleRebootServer = async () => {
  confirmDialog.value = {
    isOpen: true,
    title: 'Reboot Server',
    message: 'Are you sure you want to reboot this server? It will be temporarily unavailable during the reboot.',
    variant: 'info',
    confirmText: 'Reboot Server',
    cancelText: 'Cancel',
    requireInput: false,
    onConfirm: async () => {
      isPerformingAction.value = true
      try {
        const response = await apiClient.post(`/servers/${props.serverId}/reboot`)
        if (response.data.success) {
          toast.success('Server is rebooting. This may take a few minutes.')
          await fetchServerMetrics()
        }
      } catch (error) {
        console.error('Failed to reboot server:', error)
        toast.error(error.response?.data?.message || 'Failed to reboot server. Please try again.')
      } finally {
        isPerformingAction.value = false
      }
    },
    onCancel: () => {}
  }
}

const handleTerminateServer = async () => {
  const serverName = serverData.value?.name || 'this server'
  
  confirmDialog.value = {
    isOpen: true,
    title: '⚠️ Terminate Instance',
    message: `This will PERMANENTLY DELETE ${serverName} from AWS.\n\nAll data on this instance will be LOST FOREVER.\n\nThis action CANNOT be undone!`,
    variant: 'danger',
    confirmText: 'Terminate Instance',
    cancelText: 'Cancel',
    requireInput: true,
    inputLabel: `Type "${serverName}" to confirm termination:`,
    inputPlaceholder: serverName,
    expectedInput: serverName,
    onConfirm: async () => {
      isPerformingAction.value = true
      try {
        const response = await apiClient.delete(`/servers/${props.serverId}/terminate`)
        if (response.data.success) {
          toast.success('Server is being terminated. The instance will be permanently deleted from AWS.', 'Instance Terminating')
          closeModal()
          setTimeout(() => window.location.reload(), 2000)
        }
      } catch (error) {
        console.error('Failed to terminate server:', error)
        toast.error(error.response?.data?.message || 'Failed to terminate server. Please try again.')
      } finally {
        isPerformingAction.value = false
      }
    },
    onCancel: () => {}
  }
}

// Watch for modal opening
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.serverId) {
    loadCostTrackingPreference()
    fetchServerMetrics()
    fetchCostData()
    // Don't fetch traffic patterns immediately to avoid overwhelming API
  }
})

// Watch for time range changes
watch(() => selectedTimeRange.value, () => {
  if (props.isOpen && props.serverId) {
    fetchServerMetrics()
  }
})

// Watch for active tab changes
watch(() => activeTab.value, (newVal) => {
  if (newVal === 'costs' && props.serverId) {
    // Always fetch API stats when costs tab is opened
    fetchApiStats()
    // Only fetch cost data if not already loaded
    if (costData.value.daily.length === 0) {
      fetchCostData()
    }
  }
  if (newVal === 'traffic' && props.serverId && !trafficPatterns.value.success) {
    fetchTrafficPatterns()
  }
})

// Fetch cost data
async function fetchCostData(forceRefresh = false) {
  if (!props.serverId) return
  
  // Check if cost tracking is disabled
  if (costTrackingDisabled.value) {
    console.log('💰 Cost tracking is disabled, skipping API call')
    return
  }
  
  loadingCosts.value = true
  costDataAvailable.value = false
  costDataCached.value = false
  costErrorMessage.value = ''
  
  try {
    const url = forceRefresh 
      ? `/costs/server/${props.serverId}?period=30&force=true`
      : `/costs/server/${props.serverId}?period=30`
    
    const response = await apiClient.get(url)
    
    if (response.data.success && response.data.available) {
      costData.value = response.data.data
      costDataAvailable.value = true
      costDataCached.value = response.data.cached || false
    } else {
      costDataAvailable.value = false
      costErrorMessage.value = response.data.message || 'Cost data is not available'
    }
  } catch (error) {
    console.error('Failed to fetch cost data:', error)
    costDataAvailable.value = false
    costErrorMessage.value = error.response?.data?.message || 'Failed to load cost data'
  } finally {
    loadingCosts.value = false
  }
}

// Fetch API usage stats
async function fetchApiStats() {
  try {
    const response = await apiClient.get('/costs/stats?days=30')
    if (response.data.success) {
      apiStats.value = response.data.stats
    }
  } catch (error) {
    console.error('Failed to fetch API stats:', error)
  }
}

// Enable cost tracking
function enableCostTracking() {
  costTrackingDisabled.value = false
  localStorage.setItem('costTrackingDisabled', 'false')
  fetchCostData()
  toast.success('Cost tracking enabled')
}

// Disable cost tracking
function disableCostTracking() {
  costTrackingDisabled.value = true
  localStorage.setItem('costTrackingDisabled', 'true')
  costDataAvailable.value = false
  costErrorMessage.value = ''
  toast.success('Cost tracking disabled. No AWS API calls will be made.')
}

// Refresh cost data (force API call)
function refreshCostData() {
  fetchCostData(true)
}

// Copy IAM policy to clipboard
function copyIAMPolicy() {
  const policy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
      ],
      "Resource": "*"
    }
  ]
}`
  
  navigator.clipboard.writeText(policy).then(() => {
    iamPolicyCopied.value = true
    setTimeout(() => {
      iamPolicyCopied.value = false
    }, 2000)
  })
}

// Retry fetching costs
function retryFetchCosts() {
  fetchCostData()
}

</script>

<style scoped>
/* Modal backdrop transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Modal content transition */
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}
</style>

