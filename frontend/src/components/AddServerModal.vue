<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div class="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col">
          <!-- Animated background -->
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div class="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s"></div>
          
          <!-- Header -->
          <div class="relative p-6 sm:p-8 border-b border-gray-700/50 flex-shrink-0">
            <div class="relative flex items-center justify-between">
              <div>
                <div class="flex items-center space-x-3 mb-2">
                  <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-2xl sm:text-3xl font-bold text-white">Add Server</h2>
                    <p class="text-gray-400 text-sm mt-1">Connect existing or create a new server</p>
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
          </div>

          <!-- Content - Scrollable -->
          <div class="relative p-6 sm:p-8 overflow-y-auto flex-1">
            <!-- Mode Selection -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-300 mb-3">
                What would you like to do? <span class="text-red-400">*</span>
              </label>
              <div class="grid grid-cols-2 gap-4">
                <button
                  @click="mode = 'existing'"
                  :class="[
                    'group relative p-5 rounded-xl border-2 transition-all duration-300',
                    mode === 'existing'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-blue-600/10 shadow-lg shadow-blue-500/20'
                      : 'border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-blue-500/50'
                  ]"
                >
                  <div class="flex flex-col items-center text-center">
                    <div
                      :class="[
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all',
                        mode === 'existing'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30'
                          : 'bg-gray-700/50'
                      ]"
                    >
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                      </svg>
                    </div>
                    <h3 class="text-white font-bold text-base mb-1">Connect Existing</h3>
                    <p class="text-xs text-gray-400">Register a server already running on your cloud</p>
                  </div>
                  <div v-if="mode === 'existing'" class="absolute top-3 right-3">
                    <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                </button>

                <button
                  @click="mode = 'create'"
                  :class="[
                    'group relative p-5 rounded-xl border-2 transition-all duration-300',
                    mode === 'create'
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 shadow-lg shadow-emerald-500/20'
                      : 'border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-emerald-500/50'
                  ]"
                >
                  <div class="flex flex-col items-center text-center">
                    <div
                      :class="[
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all',
                        mode === 'create'
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30'
                          : 'bg-gray-700/50'
                      ]"
                    >
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                    </div>
                    <h3 class="text-white font-bold text-base mb-1">Create New</h3>
                    <p class="text-xs text-gray-400">Provision a new server on your cloud provider</p>
                  </div>
                  <div v-if="mode === 'create'" class="absolute top-3 right-3">
                    <div class="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Form Content -->
            <Transition name="fade" mode="out-in">
              <div v-if="mode" class="space-y-5">
                <div class="relative">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-700/50"></div>
                  </div>
                  <div class="relative flex justify-center text-sm">
                    <span class="px-4 bg-gray-800 text-gray-400 font-medium">
                      {{ mode === 'existing' ? 'Connection Details' : 'Server Configuration' }}
                    </span>
                  </div>
                </div>

                <!-- Cloud Account Selection (Common) -->
                <div>
                  <label class="block text-sm font-semibold text-gray-300 mb-2.5">
                    Select Cloud Account <span class="text-red-400">*</span>
                  </label>
                  <select
                    v-model="form.cloudAccountId"
                    class="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                  >
                    <option value="">Select a cloud account</option>
                    <option v-for="account in cloudAccounts" :key="account.id" :value="account.id">
                      {{ account.accountName }} ({{ account.provider.toUpperCase() }})
                    </option>
                  </select>
                </div>

                <!-- Existing Server Form -->
                <template v-if="mode === 'existing'">
                  <!-- Fetch Servers Button -->
                  <div v-if="!cloudServers.length && !fetchingServers">
                    <button
                      @click="fetchCloudServers"
                      :disabled="!form.cloudAccountId"
                      class="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      <span>Fetch Servers from Cloud</span>
                    </button>
                    <p class="text-xs text-gray-500 mt-2 text-center">
                      Click to load available servers from your cloud account
                    </p>
                  </div>

                  <!-- Loading State -->
                  <div v-if="fetchingServers" class="text-center py-8">
                    <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p class="text-gray-400 text-sm">Fetching servers from cloud provider...</p>
                  </div>

                  <!-- Server Selection -->
                  <div v-if="cloudServers.length > 0">
                    <div class="flex items-center justify-between mb-2.5">
                      <label class="block text-sm font-semibold text-gray-300">
                        Select Server <span class="text-red-400">*</span>
                      </label>
                      <button
                        @click="fetchCloudServers"
                        class="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        <span>Refresh</span>
                      </button>
                    </div>
                    <select
                      v-model="selectedCloudServerId"
                      @change="onServerSelected"
                      class="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                    >
                      <option value="">Choose a server to connect</option>
                      <option 
                        v-for="server in cloudServers" 
                        :key="server.id" 
                        :value="server.id"
                      >
                        {{ server.name }} - {{ server.instanceType }} ({{ server.state }})
                      </option>
                    </select>

                    <!-- Server Details Preview -->
                    <div v-if="selectedCloudServer" class="mt-4 bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 space-y-3">
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500">Server Name</span>
                        <span class="text-sm text-white font-medium">{{ selectedCloudServer.name }}</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500">Instance Type</span>
                        <span class="text-sm text-white">{{ selectedCloudServer.instanceType }}</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500">Status</span>
                        <span 
                          :class="[
                            'text-xs px-2 py-1 rounded-lg font-medium',
                            selectedCloudServer.state === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          ]"
                        >
                          {{ selectedCloudServer.state }}
                        </span>
                      </div>
                      <div v-if="selectedCloudServer.publicIp" class="flex items-center justify-between">
                        <span class="text-xs text-gray-500">Public IP</span>
                        <span class="text-sm text-white font-mono">{{ selectedCloudServer.publicIp }}</span>
                      </div>
                      <div v-if="selectedCloudServer.privateIp" class="flex items-center justify-between">
                        <span class="text-xs text-gray-500">Private IP</span>
                        <span class="text-sm text-white font-mono">{{ selectedCloudServer.privateIp }}</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500">Region</span>
                        <span class="text-sm text-white">{{ selectedCloudServer.region || selectedCloudServer.location || 'N/A' }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="cloudServers.length > 0" class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div class="flex items-start space-x-3">
                      <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div>
                        <p class="text-blue-300 text-sm">
                          <strong class="font-semibold">Note:</strong> Select a server from your cloud account to register it in Cloudevy for monitoring and management.
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Fetch Error -->
                  <div v-if="fetchError" class="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg py-3 px-4">
                    {{ fetchError }}
                  </div>
                </template>

                <!-- Create New Server Form -->
                <template v-if="mode === 'create'">
                  <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2.5">
                      Server Name <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="form.name"
                      type="text"
                      placeholder="production-web-01"
                      class="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                    />
                  </div>

                  <div class="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label class="block text-sm font-semibold text-gray-300 mb-2.5">
                        Instance Type <span class="text-red-400">*</span>
                      </label>
                      <select
                        v-model="form.instanceType"
                        class="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                      >
                        <option value="">Select instance type</option>
                        <optgroup v-if="selectedProvider === 'aws'" label="AWS Instance Types">
                          <option value="t3.micro">t3.micro (2 vCPU, 1 GB RAM)</option>
                          <option value="t3.small">t3.small (2 vCPU, 2 GB RAM)</option>
                          <option value="t3.medium">t3.medium (2 vCPU, 4 GB RAM)</option>
                          <option value="t3.large">t3.large (2 vCPU, 8 GB RAM)</option>
                          <option value="m5.large">m5.large (2 vCPU, 8 GB RAM)</option>
                          <option value="m5.xlarge">m5.xlarge (4 vCPU, 16 GB RAM)</option>
                        </optgroup>
                        <optgroup v-if="selectedProvider === 'azure'" label="Azure Instance Types">
                          <option value="Standard_B1s">Standard_B1s (1 vCPU, 1 GB RAM)</option>
                          <option value="Standard_B2s">Standard_B2s (2 vCPU, 4 GB RAM)</option>
                          <option value="Standard_D2s_v3">Standard_D2s_v3 (2 vCPU, 8 GB RAM)</option>
                          <option value="Standard_D4s_v3">Standard_D4s_v3 (4 vCPU, 16 GB RAM)</option>
                        </optgroup>
                        <optgroup v-if="selectedProvider === 'gcp'" label="GCP Instance Types">
                          <option value="e2-micro">e2-micro (2 vCPU, 1 GB RAM)</option>
                          <option value="e2-small">e2-small (2 vCPU, 2 GB RAM)</option>
                          <option value="e2-medium">e2-medium (2 vCPU, 4 GB RAM)</option>
                          <option value="n1-standard-1">n1-standard-1 (1 vCPU, 3.75 GB RAM)</option>
                          <option value="n1-standard-2">n1-standard-2 (2 vCPU, 7.5 GB RAM)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-semibold text-gray-300 mb-2.5">
                        Region <span class="text-red-400">*</span>
                      </label>
                      <select
                        v-model="form.region"
                        class="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                      >
                        <option value="">Select region</option>
                        <optgroup v-if="selectedProvider === 'aws'" label="AWS Regions">
                          <option value="us-east-1">US East (N. Virginia)</option>
                          <option value="us-west-2">US West (Oregon)</option>
                          <option value="eu-west-1">EU (Ireland)</option>
                          <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                        </optgroup>
                        <optgroup v-if="selectedProvider === 'azure'" label="Azure Regions">
                          <option value="eastus">East US</option>
                          <option value="westus">West US</option>
                          <option value="westeurope">West Europe</option>
                          <option value="southeastasia">Southeast Asia</option>
                        </optgroup>
                        <optgroup v-if="selectedProvider === 'gcp'" label="GCP Regions">
                          <option value="us-central1">US Central (Iowa)</option>
                          <option value="us-east1">US East (South Carolina)</option>
                          <option value="europe-west1">Europe West (Belgium)</option>
                          <option value="asia-south1">Asia South (Mumbai)</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2.5">
                      Operating System <span class="text-red-400">*</span>
                    </label>
                    <select
                      v-model="form.operatingSystem"
                      class="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                    >
                      <option value="">Select OS</option>
                      <option value="ubuntu-22.04">Ubuntu 22.04 LTS</option>
                      <option value="ubuntu-20.04">Ubuntu 20.04 LTS</option>
                      <option value="debian-11">Debian 11</option>
                      <option value="centos-8">CentOS 8</option>
                      <option value="rhel-8">Red Hat Enterprise Linux 8</option>
                      <option value="amazon-linux-2">Amazon Linux 2</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2.5">
                      Storage Size (GB) <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model.number="form.storageSize"
                      type="number"
                      min="8"
                      max="1000"
                      placeholder="30"
                      class="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                    />
                  </div>

                  <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <div class="flex items-start space-x-3">
                      <svg class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div>
                        <p class="text-emerald-300 text-sm">
                          <strong class="font-semibold">Note:</strong> This will create a new server on your cloud provider. You'll be charged by your cloud provider for the resources used.
                        </p>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </Transition>

            <!-- Error Message -->
            <div v-if="error" class="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">
              {{ error }}
            </div>
          </div>

          <!-- Footer -->
          <div class="relative p-6 sm:p-8 border-t border-gray-700/50 bg-gray-900/30 flex items-center justify-between flex-shrink-0">
            <div class="text-xs text-gray-500">
              <span class="flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{{ mode === 'existing' ? 'Register server for monitoring' : 'Provision new cloud server' }}</span>
              </span>
            </div>
            <div class="flex items-center space-x-3">
              <button
                @click="closeModal"
                class="px-6 py-3 text-gray-300 hover:text-white font-medium transition rounded-xl hover:bg-gray-700/50"
              >
                Cancel
              </button>
              <button
                @click="handleSubmit"
                :disabled="!canSubmit || loading"
                :class="[
                  'px-8 py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:scale-105',
                  mode === 'existing'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/30 hover:shadow-blue-500/50'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/30 hover:shadow-emerald-500/50'
                ]"
              >
                <span v-if="loading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ mode === 'existing' ? 'Adding...' : 'Creating...' }}
                </span>
                <span v-else class="flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  {{ mode === 'existing' ? 'Add Server' : 'Create Server' }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import apiClient from '@/api/client'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'server-added'])

const mode = ref('existing') // 'existing' or 'create'
const cloudAccounts = ref([])
const cloudServers = ref([])
const selectedCloudServerId = ref('')
const fetchingServers = ref(false)
const fetchError = ref('')
const loading = ref(false)
const error = ref('')

const form = ref({
  cloudAccountId: '',
  name: '',
  ipAddress: '',
  instanceType: '',
  region: '',
  instanceId: '', // Cloud provider instance ID
  operatingSystem: '',
  storageSize: 30
})

const selectedProvider = computed(() => {
  if (!form.value.cloudAccountId) return null
  const account = cloudAccounts.value.find(a => a.id === parseInt(form.value.cloudAccountId))
  return account?.provider
})

const selectedCloudServer = computed(() => {
  if (!selectedCloudServerId.value) return null
  return cloudServers.value.find(s => s.id === selectedCloudServerId.value)
})

const canSubmit = computed(() => {
  if (!mode.value || !form.value.cloudAccountId) {
    return false
  }
  
  if (mode.value === 'existing') {
    return selectedCloudServerId.value !== ''
  }
  
  if (mode.value === 'create') {
    return form.value.name.trim() &&
           form.value.instanceType && 
           form.value.region && 
           form.value.operatingSystem && 
           form.value.storageSize > 0
  }
  
  return false
})

const fetchCloudAccounts = async () => {
  try {
    const response = await apiClient.get('/cloud-accounts')
    if (response.data.success) {
      cloudAccounts.value = response.data.data
    }
  } catch (err) {
    console.error('Failed to fetch cloud accounts:', err)
  }
}

const fetchCloudServers = async () => {
  if (!form.value.cloudAccountId) return
  
  fetchingServers.value = true
  fetchError.value = ''
  cloudServers.value = []
  selectedCloudServerId.value = ''
  
  try {
    const response = await apiClient.get(`/cloud-accounts/${form.value.cloudAccountId}/servers`)
    if (response.data.success) {
      cloudServers.value = response.data.data
      if (cloudServers.value.length === 0) {
        fetchError.value = 'No servers found in this cloud account'
      }
    } else {
      fetchError.value = response.data.message || 'Failed to fetch servers'
    }
  } catch (err) {
    fetchError.value = err.response?.data?.message || 'Failed to fetch servers from cloud provider'
    console.error('Failed to fetch cloud servers:', err)
  } finally {
    fetchingServers.value = false
  }
}

const onServerSelected = () => {
  if (selectedCloudServer.value) {
    // Auto-populate form fields including instanceId
    form.value.name = selectedCloudServer.value.name
    form.value.ipAddress = selectedCloudServer.value.publicIp || selectedCloudServer.value.privateIp || ''
    form.value.instanceType = selectedCloudServer.value.instanceType
    form.value.region = selectedCloudServer.value.region || selectedCloudServer.value.location || ''
    form.value.instanceId = selectedCloudServer.value.id // Store cloud provider instance ID
  }
}

const closeModal = () => {
  mode.value = 'existing'
  form.value = {
    cloudAccountId: '',
    name: '',
    ipAddress: '',
    instanceType: '',
    region: '',
    instanceId: '',
    operatingSystem: '',
    storageSize: 30
  }
  cloudServers.value = []
  selectedCloudServerId.value = ''
  fetchError.value = ''
  error.value = ''
  emit('close')
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  loading.value = true
  error.value = ''

  try {
    const endpoint = mode.value === 'existing' ? '/servers' : '/servers/create'
    const payload = mode.value === 'existing' 
      ? {
          cloudAccountId: parseInt(form.value.cloudAccountId),
          name: form.value.name.trim(),
          ipAddress: form.value.ipAddress.trim() || null,
          instanceType: form.value.instanceType.trim() || null,
          region: form.value.region.trim() || null,
          instanceId: form.value.instanceId.trim() || null // Pass cloud instance ID
        }
      : {
          cloudAccountId: parseInt(form.value.cloudAccountId),
          name: form.value.name.trim(),
          instanceType: form.value.instanceType,
          region: form.value.region,
          operatingSystem: form.value.operatingSystem,
          storageSize: form.value.storageSize
        }

    const response = await apiClient.post(endpoint, payload)

    if (response.data.success) {
      emit('server-added', response.data.data)
      closeModal()
    } else {
      error.value = response.data.message || `Failed to ${mode.value === 'existing' ? 'add' : 'create'} server`
    }
  } catch (err) {
    error.value = err.response?.data?.message || `Failed to ${mode.value === 'existing' ? 'add' : 'create'} server. Please try again.`
    console.error('Server operation error:', err)
  } finally {
    loading.value = false
  }
}

// Watch for modal opening to fetch cloud accounts
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    fetchCloudAccounts()
  }
})

// Watch for cloud account changes
watch(() => form.value.cloudAccountId, () => {
  // Reset servers when cloud account changes
  cloudServers.value = []
  selectedCloudServerId.value = ''
  fetchError.value = ''
  
  // Reset form fields for create mode
  if (mode.value === 'create') {
    form.value.instanceType = ''
    form.value.region = ''
  }
})

// Watch for mode changes
watch(() => mode.value, () => {
  // Reset cloud servers when switching modes
  cloudServers.value = []
  selectedCloudServerId.value = ''
  fetchError.value = ''
})
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

/* Fade transition for mode change */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
