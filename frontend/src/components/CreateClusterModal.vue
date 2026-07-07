<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-gray-900 border border-gray-700 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 z-10">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-white">Create Kubernetes Cluster</h2>
            <p class="text-sm text-gray-400 mt-1">Deploy a production-ready cluster in minutes</p>
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
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Step Indicator -->
        <div class="flex items-center justify-center space-x-4 mb-8">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="flex items-center"
          >
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-bold transition',
              currentStep >= index + 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400'
            ]">
              {{ index + 1 }}
            </div>
            <div
              v-if="index < steps.length - 1"
              :class="[
                'w-16 h-1 mx-2 transition',
                currentStep > index + 1 ? 'bg-blue-600' : 'bg-gray-700'
              ]"
            ></div>
          </div>
        </div>

        <!-- Step 1: Pre-requisites Checklist -->
        <div v-if="currentStep === 1" class="space-y-6">
          <h3 class="text-2xl font-bold text-white text-center mb-2">Quick Setup Checklist</h3>
          <p class="text-center text-gray-400 text-sm mb-8">Make sure you have these ready before creating your cluster</p>

          <!-- Simple 3-item checklist -->
          <div class="max-w-2xl mx-auto space-y-4">
            <!-- 1. Servers -->
            <div class="bg-gray-800 border-2 border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition">
              <div class="flex items-center space-x-4">
                <div :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0',
                  checklist.serversAdded ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                ]">
                  <svg v-if="checklist.serversAdded" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span v-else>1</span>
                </div>
                <div class="flex-1">
                  <h5 class="text-white font-bold text-lg mb-1">Add Servers</h5>
                  <p class="text-sm text-gray-400 mb-3">
                    Add your AWS EC2 instances (or other servers) to CloudEvy
                  </p>
                  <p class="text-xs text-gray-500">Go to: Servers → Add Server</p>
                </div>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="checklist.serversAdded"
                    class="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            <!-- 2. SSH Test -->
            <div class="bg-gray-800 border-2 border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition">
              <div class="flex items-center space-x-4">
                <div :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0',
                  checklist.sshTested ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                ]">
                  <svg v-if="checklist.sshTested" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span v-else>2</span>
                </div>
                <div class="flex-1">
                  <h5 class="text-white font-bold text-lg mb-1">Test SSH</h5>
                  <p class="text-sm text-gray-400 mb-3">
                    Make sure CloudEvy can connect to your servers
                  </p>
                  <p class="text-xs text-gray-500">Servers → Click each server → Test SSH</p>
                </div>
                <label class="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="checklist.sshTested"
                    class="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            <!-- 3. Security Group -->
            <div class="bg-gray-800 border-2 border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition">
              <div class="flex items-start space-x-4">
                <div :class="[
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0',
                  checklist.securityGroup ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                ]">
                  <svg v-if="checklist.securityGroup" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span v-else>3</span>
                </div>
                <div class="flex-1">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <h5 class="text-white font-bold text-lg mb-1">Configure Security Group</h5>
                      <p class="text-sm text-gray-400">
                        Set up network rules for your cluster nodes
                      </p>
                    </div>
                    <label class="flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        v-model="checklist.securityGroup"
                        class="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>

                  <!-- Detailed Instructions (Expandable) -->
                  <div class="space-y-3">
                    <button
                      @click="showSecurityGroupDetails = !showSecurityGroupDetails"
                      class="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      <svg :class="['w-4 h-4 transition-transform', showSecurityGroupDetails ? 'rotate-90' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                      <span>{{ showSecurityGroupDetails ? 'Hide' : 'Show' }} Security Group Setup Instructions</span>
                    </button>

                    <div v-show="showSecurityGroupDetails" class="bg-gray-900/50 rounded-lg p-4 space-y-4 text-sm">
                      <!-- Step 1 -->
                      <div>
                        <h6 class="text-green-400 font-bold mb-2 flex items-center">
                          <span class="bg-green-500/20 rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">1</span>
                          Put All Nodes in Same Security Group
                        </h6>
                        <p class="text-gray-400 text-xs ml-8">
                          AWS Console → EC2 → Instances → Select all your cluster nodes → Actions → Security → Change security groups → Select the same group for all
                        </p>
                      </div>

                      <!-- Step 2 -->
                      <div>
                        <h6 class="text-green-400 font-bold mb-2 flex items-center">
                          <span class="bg-green-500/20 rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">2</span>
                          Add Self-Referencing Rule
                        </h6>
                        <p class="text-gray-400 text-xs ml-8 mb-2">
                          AWS Console → EC2 → Security Groups → Select your group → Edit inbound rules → Add Rule:
                        </p>
                        <div class="ml-8 bg-gray-800 border border-gray-700 rounded p-2 font-mono text-xs">
                          <div class="text-gray-500">Type: <span class="text-white">All Traffic</span></div>
                          <div class="text-gray-500">Source: <span class="text-white">Custom → Select same security group (sg-xxxxx)</span></div>
                          <div class="text-gray-500">Description: <span class="text-white">Internal K3s cluster communication</span></div>
                        </div>
                      </div>

                      <!-- Step 3 -->
                      <div>
                        <h6 class="text-yellow-400 font-bold mb-2 flex items-center">
                          <span class="bg-yellow-500/20 rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">✨</span>
                          CloudEvy Auto-Configuration
                        </h6>
                        <p class="text-gray-400 text-xs ml-8">
                          <span class="text-yellow-400 font-semibold">Good news!</span> CloudEvy will automatically add a rule allowing itself to monitor your cluster (port 6443). 
                          Make sure you provide Instance ID and Security Group ID when adding servers!
                        </p>
                      </div>

                      <!-- Optional Step 4 -->
                      <div class="border-t border-gray-700 pt-3">
                        <h6 class="text-blue-400 font-bold mb-2 flex items-center">
                          <span class="bg-blue-500/20 rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">?</span>
                          Optional: Your Laptop Access
                        </h6>
                        <p class="text-gray-400 text-xs ml-8 mb-2">
                          If you want to use <code class="bg-gray-800 px-1 py-0.5 rounded text-blue-300">kubectl</code> from your laptop, add this rule:
                        </p>
                        <div class="ml-8 bg-gray-800 border border-gray-700 rounded p-2 font-mono text-xs">
                          <div class="text-gray-500">Type: <span class="text-white">Custom TCP</span></div>
                          <div class="text-gray-500">Port: <span class="text-white">6443</span></div>
                          <div class="text-gray-500">Source: <span class="text-white">My IP (auto-detect)</span></div>
                          <div class="text-gray-500">Description: <span class="text-white">Developer kubectl access</span></div>
                        </div>
                      </div>

                      <!-- Quick Summary -->
                      <div class="bg-blue-500/10 border border-blue-500/30 rounded p-3 mt-4">
                        <p class="text-xs text-blue-300 font-bold mb-1">📋 Quick Summary:</p>
                        <ul class="text-xs text-gray-300 space-y-1">
                          <li>✅ All nodes in same security group</li>
                          <li>✅ Self-referencing rule (sg-xxxxx → sg-xxxxx) for internal traffic</li>
                          <li>✨ CloudEvy will auto-add monitoring access</li>
                          <li>⚙️ Optionally add your laptop IP for kubectl</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <p class="text-xs text-gray-500 mt-3">AWS Console → EC2 → Security Groups</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Simple info box -->
          <div class="max-w-2xl mx-auto bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-sm text-gray-300">
                <strong class="text-white">Tip:</strong> When you add servers from your cloud provider, CloudEvy automatically captures their IDs and will configure security groups for monitoring!
              </p>
            </div>
          </div>
        </div>

        <!-- Step 2: Basic Configuration -->
        <div v-if="currentStep === 2" class="space-y-6">
          <h3 class="text-xl font-bold text-white">Basic Configuration</h3>

          <!-- Help Box -->
          <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 class="text-blue-400 font-bold mb-2 flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              What You're Doing Here
            </h4>
            <p class="text-sm text-gray-300">
              You're naming your cluster and choosing what type of Kubernetes to install. 
              <strong class="text-white">K3s is recommended</strong> - it's faster to set up and uses less resources, 
              perfect for most applications. Choose full Kubernetes only if you need enterprise features.
            </p>
          </div>

          <!-- Cluster Name -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Cluster Name
              <span class="text-gray-500 font-normal">(Pick a name you'll remember)</span>
            </label>
            <input
              v-model="clusterConfig.name"
              type="text"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="my-prod-cluster"
            />
            <p class="text-xs text-gray-400 mt-1">Examples: production-cluster, dev-cluster, my-app-cluster</p>
          </div>

          <!-- Cluster Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Cluster Type
              <span class="text-gray-500 font-normal">(Don't worry, both work great!)</span>
            </label>
            <div class="grid grid-cols-2 gap-4">
              <button
                @click="clusterConfig.type = 'k3s'"
                :class="[
                  'p-4 rounded-lg border-2 transition text-left',
                  clusterConfig.type === 'k3s'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                ]"
              >
                <div class="flex items-center mb-2">
                  <span class="text-2xl mr-2">🚀</span>
                  <span class="font-bold text-white">K3s</span>
                  <span class="ml-auto px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Recommended</span>
                </div>
                <p class="text-sm text-gray-400">
                  Lightweight Kubernetes. Perfect for small to medium workloads. Fast setup (2 mins).
                </p>
                <p class="text-xs text-green-400 mt-2">✓ Best for: Startups, personal projects, dev/test</p>
              </button>
              <button
                @click="clusterConfig.type = 'kubernetes'"
                :class="[
                  'p-4 rounded-lg border-2 transition text-left',
                  clusterConfig.type === 'kubernetes'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                ]"
              >
                <div class="flex items-center mb-2">
                  <span class="text-2xl mr-2">⎈</span>
                  <span class="font-bold text-white">Kubernetes</span>
                </div>
                <p class="text-sm text-gray-400">
                  Full Kubernetes (kubeadm). Enterprise-grade. Setup time: ~10 mins.
                </p>
                <p class="text-xs text-blue-400 mt-2">✓ Best for: Large teams, enterprise, strict compliance</p>
              </button>
            </div>
          </div>

          <!-- Network Plugin (only for full Kubernetes) -->
          <div v-if="clusterConfig.type === 'kubernetes'">
            <label class="block text-sm font-medium text-gray-300 mb-2">Network Plugin (CNI)</label>
            <select
              v-model="clusterConfig.networkPlugin"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="calico">Calico (Recommended)</option>
              <option value="flannel">Flannel</option>
              <option value="cilium">Cilium</option>
            </select>
          </div>
        </div>

        <!-- Step 3: Node Selection -->
        <div v-if="currentStep === 3" class="space-y-6">
          <h3 class="text-xl font-bold text-white mb-4">Select Nodes</h3>

          <!-- Help Box -->
          <div class="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h4 class="text-purple-400 font-bold mb-2 flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              What Are Nodes?
            </h4>
            <p class="text-sm text-gray-300 mb-2">
              "Nodes" are just servers. Your cluster needs at least 1 server, but having 2-3 is better for reliability.
              The <strong class="text-white">first server you select becomes the "master"</strong> (the brain), 
              and additional servers are "workers" (the muscle).
            </p>
            <p class="text-xs text-gray-400">
              💡 Tip: You need at least 1 node. For production, we recommend 3 nodes (1 master + 2 workers).
            </p>
          </div>

          <!-- Node Source Tabs -->
          <div class="flex space-x-4 border-b border-gray-700">
            <button
              @click="nodeSource = 'existing'"
              :class="[
                'px-4 py-2 font-medium transition border-b-2',
                nodeSource === 'existing'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              ]"
            >
              Use Existing Servers
            </button>
            <button
              @click="nodeSource = 'provision'"
              :class="[
                'px-4 py-2 font-medium transition border-b-2',
                nodeSource === 'provision'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              ]"
            >
              Provision New Servers
            </button>
            <button
              @click="nodeSource = 'hybrid'"
              :class="[
                'px-4 py-2 font-medium transition border-b-2',
                nodeSource === 'hybrid'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              ]"
            >
              Hybrid (Mix Both)
            </button>
          </div>

          <!-- Existing Servers -->
          <div v-if="nodeSource === 'existing' || nodeSource === 'hybrid'" class="space-y-4">
            <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 class="text-blue-400 font-bold mb-2">📝 Selecting Servers</h4>
              <p class="text-sm text-gray-300 mb-2">
                Click on servers below to add them to your cluster. 
                <strong class="text-white">The first server you select will be the Master</strong> (brain of the cluster).
                Additional servers will be Workers (they run your apps).
              </p>
              <p class="text-xs text-gray-400">
                ✅ Requirements: Each server must have SSH configured in CloudEvy (check Servers page → Live Logs tab)
              </p>
            </div>

            <div class="space-y-2 max-h-96 overflow-y-auto">
              <!-- No servers message -->
              <div v-if="availableServers.length === 0" class="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                <svg class="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-gray-400 mb-2">No servers available</p>
                <p class="text-sm text-gray-500">
                  You don't have any running servers yet. 
                  <br>
                  <strong class="text-white">Switch to "Provision New Servers"</strong> tab above to create new ones automatically.
                </p>
              </div>

              <div
                v-for="server in availableServers"
                :key="server.id"
                @click="toggleServer(server)"
                :class="[
                  'p-4 rounded-lg border-2 cursor-pointer transition',
                  isServerSelected(server.id)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div :class="[
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      isServerSelected(server.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-600'
                    ]">
                      <svg v-if="isServerSelected(server.id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div>
                      <p class="text-white font-medium">{{ server.name }}</p>
                      <p class="text-sm text-gray-400">{{ server.ipAddress }} • {{ server.instanceType }}</p>
                    </div>
                  </div>
                  <div v-if="isServerSelected(server.id) && getServerRole(server.id)" class="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
                    {{ getServerRole(server.id) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Provision New Servers -->
          <div v-if="nodeSource === 'provision' || nodeSource === 'hybrid'" class="space-y-4">
            <!-- Instructions for AWS provisioning -->
            <div class="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <h4 class="text-orange-400 font-bold mb-2">🚀 Auto-Provisioning Servers</h4>
              <p class="text-sm text-gray-300 mb-2">
                We'll automatically create brand new servers on AWS for you and install everything needed. 
                <strong class="text-white">You only pay AWS</strong> for the servers (starting ~$15/month per server).
              </p>
              <p class="text-xs text-gray-400">
                💡 Recommended: Start with t3.small (2 vCPU, 2GB RAM) - perfect for most small to medium apps
              </p>
            </div>

            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p class="text-sm text-yellow-400">
                ⚠️ New servers will be provisioned on your cloud provider. You'll be charged by the provider directly.
              </p>
            </div>

            <!-- Cloud Provider -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Cloud Provider</label>
              <select
                v-model="provisionConfig.provider"
                @change="loadCloudAccounts"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Provider</option>
                <option value="aws">AWS (EC2)</option>
                <option value="azure">Azure</option>
                <option value="gcp">Google Cloud</option>
                <option value="digitalocean">DigitalOcean</option>
              </select>
            </div>

            <!-- Cloud Account -->
            <div v-if="provisionConfig.provider">
              <label class="block text-sm font-medium text-gray-300 mb-2">Cloud Account</label>
              <select
                v-model="provisionConfig.cloudAccountId"
                @change="loadRegions"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Account</option>
                <option v-for="account in cloudAccounts" :key="account.id" :value="account.id">
                  {{ account.accountName }}
                </option>
              </select>
            </div>

            <!-- Region -->
            <div v-if="provisionConfig.cloudAccountId">
              <label class="block text-sm font-medium text-gray-300 mb-2">Region</label>
              <select
                v-model="provisionConfig.region"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Region</option>
                <option v-for="region in regions" :key="region" :value="region">
                  {{ region }}
                </option>
              </select>
            </div>

            <!-- Instance Type -->
            <div v-if="provisionConfig.region">
              <label class="block text-sm font-medium text-gray-300 mb-2">Instance Type</label>
              <select
                v-model="provisionConfig.instanceType"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Instance Type</option>
                <option value="t3.small">t3.small (2 vCPU, 2GB RAM) - $0.0208/hr</option>
                <option value="t3.medium">t3.medium (2 vCPU, 4GB RAM) - $0.0416/hr</option>
                <option value="t3.large">t3.large (2 vCPU, 8GB RAM) - $0.0832/hr</option>
                <option value="t3.xlarge">t3.xlarge (4 vCPU, 16GB RAM) - $0.1664/hr</option>
              </select>
            </div>

            <!-- Node Count -->
            <div v-if="provisionConfig.instanceType">
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Number of Nodes (1 master + {{ provisionConfig.nodeCount - 1 }} workers)
              </label>
              <input
                v-model.number="provisionConfig.nodeCount"
                type="number"
                min="1"
                max="10"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <!-- Cost Estimate -->
            <div v-if="provisionConfig.nodeCount > 0" class="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p class="text-sm text-green-400">
                💰 Estimated Cost: <strong>${{ calculateCost() }}/month</strong> ({{ provisionConfig.nodeCount }} × {{ provisionConfig.instanceType }})
              </p>
            </div>
          </div>
        </div>

        <!-- Step 3: Review & Create -->
        <!-- Step 4: Review -->
        <div v-if="currentStep === 4" class="space-y-6">
          <h3 class="text-xl font-bold text-white mb-4">Review Configuration</h3>

          <!-- Help Box -->
          <div v-if="!creating" class="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h4 class="text-green-400 font-bold mb-2 flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              What Happens Next?
            </h4>
            <p class="text-sm text-gray-300 mb-2">
              When you click "Create Cluster", we'll automatically:
            </p>
            <ol class="text-sm text-gray-300 space-y-1 ml-4">
              <li>1. Connect to each server via SSH</li>
              <li>2. Install Docker and Kubernetes</li>
              <li>3. Set up the master node (takes ~5 mins)</li>
              <li>4. Connect worker nodes</li>
              <li>5. Give you a kubeconfig file to start deploying apps</li>
            </ol>
            <p class="text-xs text-gray-400 mt-2">
              ⏱️ Estimated time: {{ clusterConfig.type === 'k3s' ? '2-5' : '10-15' }} minutes. You can close this window and come back later.
            </p>
          </div>

          <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
            <div>
              <p class="text-sm text-gray-400">Cluster Name</p>
              <p class="text-white font-medium">{{ clusterConfig.name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-400">Type</p>
              <p class="text-white font-medium">{{ clusterConfig.type === 'k3s' ? 'K3s (Lightweight)' : 'Kubernetes (Full)' }}</p>
            </div>
            <div v-if="clusterConfig.type === 'kubernetes'">
              <p class="text-sm text-gray-400">Network Plugin</p>
              <p class="text-white font-medium">{{ clusterConfig.networkPlugin }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-400">Total Nodes</p>
              <p class="text-white font-medium">
                {{ selectedServers.length + provisionConfig.nodeCount }}
                ({{ selectedServers.length }} existing + {{ provisionConfig.nodeCount }} new)
              </p>
            </div>
            <div v-if="selectedServers.length > 0">
              <p class="text-sm text-gray-400 mb-2">Existing Servers</p>
              <div class="space-y-2">
                <div v-for="(serverId, index) in selectedServers" :key="serverId" class="flex items-center space-x-2 text-sm">
                  <span :class="index === 0 ? 'text-purple-400' : 'text-gray-400'">
                    {{ getServerName(serverId) }} <span class="text-xs">({{ index === 0 ? 'Master' : 'Worker' }})</span>
                  </span>
                </div>
              </div>
            </div>
            <div v-if="provisionConfig.nodeCount > 0">
              <p class="text-sm text-gray-400">New Servers to Provision</p>
              <p class="text-white font-medium">
                {{ provisionConfig.nodeCount }} × {{ provisionConfig.instanceType }} @ {{ provisionConfig.region }}
              </p>
              <p class="text-sm text-green-400 mt-1">Est. Cost: ${{ calculateCost() }}/month</p>
            </div>
          </div>

          <!-- Installation Progress (when creating) -->
          <div v-if="creating" class="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 class="text-white font-bold mb-4">Installation Progress</h4>
            <div class="space-y-3">
              <div v-for="(step, index) in installSteps" :key="index" class="flex items-center space-x-3">
                <div v-if="step.status === 'pending'" class="w-5 h-5 rounded-full border-2 border-gray-600"></div>
                <div v-else-if="step.status === 'running'" class="w-5 h-5">
                  <svg class="animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div v-else-if="step.status === 'completed'" class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div v-else-if="step.status === 'error'" class="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <span :class="[
                  'text-sm',
                  step.status === 'completed' ? 'text-green-400' :
                  step.status === 'running' ? 'text-blue-400' :
                  step.status === 'error' ? 'text-red-400' :
                  'text-gray-400'
                ]">
                  {{ step.label }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex items-center justify-between">
        <button
          v-if="currentStep > 1 && !creating"
          @click="currentStep--"
          class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
        >
          Back
        </button>
        <div v-else></div>

        <div class="flex items-center space-x-4">
          <button
            @click="$emit('close')"
            class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            v-if="currentStep < 4"
            @click="nextStep"
            :disabled="!canProceed"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
          >
            Next
          </button>
          <button
            v-else
            @click="createCluster"
            :disabled="creating || !canCreate"
            class="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
          >
            {{ creating ? 'Creating...' : 'Create Cluster' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import apiClient from '@/api/client';

const emit = defineEmits(['close', 'created']);

const steps = ['Pre-requisites', 'Configuration', 'Nodes', 'Review'];
const currentStep = ref(1);

const clusterConfig = ref({
  name: '',
  type: 'k3s',
  networkPlugin: 'calico'
});

const nodeSource = ref('existing');
const selectedServers = ref([]);
const availableServers = ref([]);

// Checklist state
const checklist = ref({
  serversAdded: false,
  sshTested: false,
  securityGroup: false
});

// UI state for expandable sections
const showSecurityGroupDetails = ref(false);

const provisionConfig = ref({
  provider: '',
  cloudAccountId: '',
  region: '',
  instanceType: '',
  nodeCount: 0
});

const cloudAccounts = ref([]);
const regions = ref([]);
const creating = ref(false);
let ws = null;

const installSteps = ref([
  { label: 'Provisioning servers...', status: 'pending' },
  { label: 'Installing prerequisites...', status: 'pending' },
  { label: 'Initializing master node...', status: 'pending' },
  { label: 'Installing network plugin...', status: 'pending' },
  { label: 'Joining worker nodes...', status: 'pending' },
  { label: 'Verifying cluster health...', status: 'pending' }
]);

// Map progress steps to install steps
const stepMapping = {
  'provision': 0,
  'prerequisites': 1,
  'master': 2,
  'cni': 3,
  'workers': 4,
  'verify': 5,
  'complete': 5
};

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    // Pre-requisites step - at least check servers are added
    return checklist.value.serversAdded;
  }
  if (currentStep.value === 2) {
    // Configuration step
    return clusterConfig.value.name.length > 0;
  }
  if (currentStep.value === 3) {
    // Node selection step
    return selectedServers.value.length > 0 || provisionConfig.value.nodeCount > 0;
  }
  return true;
});

const canCreate = computed(() => {
  return (selectedServers.value.length > 0 || provisionConfig.value.nodeCount > 0) && !creating.value;
});

async function fetchServers() {
  try {
    const response = await apiClient.get('/servers');
    // Show all running servers - SSH credentials will be checked during cluster creation
    availableServers.value = response.data.data.filter(s => s.status === 'running');
    
    console.log('Available servers for cluster:', availableServers.value.length);
  } catch (error) {
    console.error('Failed to fetch servers:', error);
  }
}

async function loadCloudAccounts() {
  try {
    const response = await apiClient.get('/cloud-accounts');
    cloudAccounts.value = response.data.data.filter(
      acc => acc.provider === provisionConfig.value.provider
    );
  } catch (error) {
    console.error('Failed to load cloud accounts:', error);
  }
}

function loadRegions() {
  // AWS regions (can be expanded)
  if (provisionConfig.value.provider === 'aws') {
    regions.value = [
      'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
      'eu-west-1', 'eu-west-2', 'eu-central-1',
      'ap-south-1', 'ap-southeast-1', 'ap-northeast-1'
    ];
  }
}

function toggleServer(server) {
  const index = selectedServers.value.indexOf(server.id);
  if (index > -1) {
    selectedServers.value.splice(index, 1);
  } else {
    selectedServers.value.push(server.id);
  }
}

function isServerSelected(serverId) {
  return selectedServers.value.includes(serverId);
}

function getServerRole(serverId) {
  const index = selectedServers.value.indexOf(serverId);
  if (index === 0) return 'Master';
  if (index > 0) return 'Worker';
  return null;
}

function getServerName(serverId) {
  const server = availableServers.value.find(s => s.id === serverId);
  return server?.name || 'Unknown';
}

function calculateCost() {
  const prices = {
    't3.small': 15.12,
    't3.medium': 30.24,
    't3.large': 60.48,
    't3.xlarge': 120.96
  };
  const price = prices[provisionConfig.value.instanceType] || 0;
  return (price * provisionConfig.value.nodeCount).toFixed(2);
}

function nextStep() {
  if (canProceed.value && currentStep.value < 4) {
    currentStep.value++;
  }
}

async function createCluster() {
  if (!canCreate.value) return;

  creating.value = true;

  try {
    const payload = {
      name: clusterConfig.value.name,
      type: clusterConfig.value.type,
      networkPlugin: clusterConfig.value.networkPlugin,
      existingServers: selectedServers.value,
      provisionConfig: provisionConfig.value.nodeCount > 0 ? provisionConfig.value : null
    };

    const response = await apiClient.post('/clusters', payload);
    const clusterId = response.data.data.id;

    // Connect to WebSocket for real-time progress
    connectWebSocket(clusterId);

  } catch (error) {
    console.error('Failed to create cluster:', error);
    installSteps.value[0].status = 'error';
    alert('Failed to create cluster. Please check the logs and try again.');
    creating.value = false;
  }
}

function connectWebSocket(clusterId) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const port = import.meta.env.VITE_API_PORT || '8002';
  
  let wsUrl;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    wsUrl = `${protocol}//${hostname}:${port}/ws/logs`;
  } else {
    wsUrl = `${protocol}//${hostname}/ws/logs`;
  }

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    // Authenticate
    const token = localStorage.getItem('token');
    ws.send(JSON.stringify({ type: 'auth', token }));
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'auth_success') {
      // Subscribe to cluster progress
      ws.send(JSON.stringify({ 
        type: 'subscribe_cluster', 
        clusterId 
      }));
    } else if (message.type === 'cluster_progress') {
      const { progress } = message;
      updateProgressUI(progress);
    }
  };

  ws.onerror = () => {
    console.error('WebSocket error');
  };

  ws.onclose = () => {
    if (creating.value) {
      // If still creating but WebSocket closed, fall back to polling
      pollClusterStatus(clusterId);
    }
  };
}

function updateProgressUI(progress) {
  const stepIndex = stepMapping[progress.step];
  
  if (stepIndex !== undefined) {
    // Update current step
    installSteps.value[stepIndex].status = progress.status;
    installSteps.value[stepIndex].label = progress.message || installSteps.value[stepIndex].label;
    
    // Mark previous steps as completed
    for (let i = 0; i < stepIndex; i++) {
      if (installSteps.value[i].status === 'pending') {
        installSteps.value[i].status = 'completed';
      }
    }
  }

  // Check if complete
  if (progress.step === 'complete' && progress.status === 'completed') {
    creating.value = false;
    if (ws) ws.close();
    emit('created');
  } else if (progress.status === 'error') {
    creating.value = false;
    if (ws) ws.close();
  }
}

async function pollClusterStatus(clusterId) {
  const interval = setInterval(async () => {
    try {
      const response = await apiClient.get(`/clusters/${clusterId}`);
      const cluster = response.data.data;
      
      if (cluster.status === 'running') {
        installSteps.value.forEach(step => step.status = 'completed');
        clearInterval(interval);
        creating.value = false;
        emit('created');
      } else if (cluster.status === 'error') {
        installSteps.value[0].status = 'error';
        clearInterval(interval);
        creating.value = false;
      }
    } catch (error) {
      console.error('Failed to poll cluster status:', error);
    }
  }, 5000);
}

onMounted(() => {
  fetchServers();
});
</script>

