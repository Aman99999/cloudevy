<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div class="relative w-full max-w-3xl bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden backdrop-blur-xl">
          <!-- Animated background -->
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div class="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s"></div>
          
          <!-- Header -->
          <div class="relative p-6 sm:p-8 border-b border-gray-700/50">
            <div class="relative flex items-center justify-between">
              <div>
                <div class="flex items-center space-x-3 mb-2">
                  <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-2xl sm:text-3xl font-bold text-white">Connect Cloud Account</h2>
                    <p class="text-gray-400 text-sm mt-1">Choose your cloud provider to get started</p>
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

          <!-- Content -->
          <div class="relative p-6 sm:p-8">
            <!-- Provider Selection -->
            <div class="mb-8">
              <label class="block text-base font-semibold text-white mb-6">
                Select Cloud Provider <span class="text-red-400">*</span>
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <!-- AWS -->
                <button
                  @click="selectedProvider = 'aws'"
                  :class="[
                    'group relative p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 overflow-hidden',
                    selectedProvider === 'aws'
                      ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-orange-600/10 shadow-lg shadow-orange-500/20 scale-105'
                      : 'border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-orange-500/50 hover:scale-102'
                  ]"
                >
                  <!-- Background glow effect -->
                  <div v-if="selectedProvider === 'aws'" class="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent"></div>
                  
                  <div class="relative flex flex-col items-center text-center">
                    <div
                      :class="[
                        'w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-lg',
                        selectedProvider === 'aws'
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 scale-110 shadow-orange-500/30'
                          : 'bg-gray-700/50 group-hover:bg-gray-700 group-hover:scale-105'
                      ]"
                    >
                      <!-- AWS Logo -->
                      <svg class="w-12 h-12" viewBox="0 0 304 182" xmlns="http://www.w3.org/2000/svg">
                        <g fill="#FF9900">
                          <path d="M86.66 109.53c0-3.74-.31-7.47-.93-11.18-.62-3.71-1.55-7.35-2.79-10.92-1.24-3.57-2.79-7.04-4.65-10.4-1.86-3.36-4.03-6.6-6.51-9.72L57.2 57.28c-4.96-5.84-10.84-10.52-17.64-14.04-6.8-3.52-14.48-5.28-23.04-5.28-7.22 0-13.48 1.15-18.78 3.45C-7.72 44.21-12 48.15-15.36 53.73c-3.36 5.58-5.04 12.4-5.04 20.46 0 7.22 1.24 13.48 3.72 18.78 2.48 5.3 5.89 9.72 10.23 13.26 4.34 3.54 9.41 6.2 15.21 7.98 5.8 1.78 11.95 2.67 18.45 2.67h31.38v8.91c0 5.58-1.24 9.72-3.72 12.42-2.48 2.7-6.2 4.05-11.16 4.05-3.36 0-6.51-.62-9.45-1.86-2.94-1.24-5.58-3.1-7.92-5.58l-8.91 12.42c3.36 3.72 7.47 6.51 12.33 8.37 4.86 1.86 10.4 2.79 16.62 2.79 9.72 0 17.64-2.17 23.76-6.51 6.12-4.34 10.4-10.23 12.84-17.67 2.44-7.44 3.66-15.98 3.66-25.62v-27.9zm-20.46 0c0 4.96.31 9.1.93 12.42.62 3.32 1.55 5.89 2.79 7.72 1.24 1.83 2.79 2.79 4.65 2.79 2.48 0 4.34-.93 5.58-2.79 1.24-1.86 2.17-4.65 2.79-8.37.62-3.72.93-8.37.93-13.95v-4.65H66.2v27.9z"/>
                          <path d="M143.31 57.28c-4.96-5.84-10.84-10.52-17.64-14.04-6.8-3.52-14.48-5.28-23.04-5.28-7.22 0-13.48 1.15-18.78 3.45-5.3 2.3-9.58 6.24-12.84 11.82-3.26 5.58-4.89 12.4-4.89 20.46 0 7.22 1.24 13.48 3.72 18.78 2.48 5.3 5.89 9.72 10.23 13.26 4.34 3.54 9.41 6.2 15.21 7.98 5.8 1.78 11.95 2.67 18.45 2.67h31.38v8.91c0 5.58-1.24 9.72-3.72 12.42-2.48 2.7-6.2 4.05-11.16 4.05-3.36 0-6.51-.62-9.45-1.86-2.94-1.24-5.58-3.1-7.92-5.58l-8.91 12.42c3.36 3.72 7.47 6.51 12.33 8.37 4.86 1.86 10.4 2.79 16.62 2.79 9.72 0 17.64-2.17 23.76-6.51 6.12-4.34 10.4-10.23 12.84-17.67 2.44-7.44 3.66-15.98 3.66-25.62V57.28zm-20.46 52.25c0 4.96.31 9.1.93 12.42.62 3.32 1.55 5.89 2.79 7.72 1.24 1.83 2.79 2.79 4.65 2.79 2.48 0 4.34-.93 5.58-2.79 1.24-1.86 2.17-4.65 2.79-8.37.62-3.72.93-8.37.93-13.95v-4.65h-17.67v27.9z"/>
                          <path d="M304 81.46c0-7.22-1.24-13.48-3.72-18.78-2.48-5.3-5.89-9.72-10.23-13.26-4.34-3.54-9.41-6.2-15.21-7.98-5.8-1.78-11.95-2.67-18.45-2.67h-31.38V18.24c0-5.58 1.24-9.72 3.72-12.42 2.48-2.7 6.2-4.05 11.16-4.05 3.36 0 6.51.62 9.45 1.86 2.94 1.24 5.58 3.1 7.92 5.58l8.91-12.42c-3.36-3.72-7.47-6.51-12.33-8.37C237.4-2.1 231.86-3.03 225.64-3.03c-9.72 0-17.64 2.17-23.76 6.51-6.12 4.34-10.4 10.23-12.84 17.67-2.44 7.44-3.66 15.98-3.66 25.62v27.9h17.67v-27.9c0-4.96-.31-9.1-.93-12.42-.62-3.32-1.55-5.89-2.79-7.72-1.24-1.83-2.79-2.79-4.65-2.79-2.48 0-4.34.93-5.58 2.79-1.24 1.86-2.17 4.65-2.79 8.37-.62 3.72-.93 8.37-.93 13.95v4.65h62.76V81.46z"/>
                          <path d="M304 109.53c0 7.22 1.24 13.48 3.72 18.78 2.48 5.3 5.89 9.72 10.23 13.26 4.34 3.54 9.41 6.2 15.21 7.98 5.8 1.78 11.95 2.67 18.45 2.67h31.38v8.91c0 5.58-1.24 9.72-3.72 12.42-2.48 2.7-6.2 4.05-11.16 4.05-3.36 0-6.51-.62-9.45-1.86-2.94-1.24-5.58-3.1-7.92-5.58l-8.91 12.42c3.36 3.72 7.47 6.51 12.33 8.37 4.86 1.86 10.4 2.79 16.62 2.79 9.72 0 17.64-2.17 23.76-6.51 6.12-4.34 10.4-10.23 12.84-17.67 2.44-7.44 3.66-15.98 3.66-25.62v-27.9h-17.67v27.9zm20.46-52.25c0-4.96-.31-9.1-.93-12.42-.62-3.32-1.55-5.89-2.79-7.72-1.24-1.83-2.79-2.79-4.65-2.79-2.48 0-4.34.93-5.58 2.79-1.24 1.86-2.17 4.65-2.79 8.37-.62 3.72-.93 8.37-.93 13.95v4.65h17.67v-27.9z"/>
                        </g>
                      </svg>
                    </div>
                    <h3 class="text-white font-bold text-lg mb-1">Amazon Web Services</h3>
                    <p class="text-xs text-gray-400 font-medium">AWS</p>
                  </div>
                  
                  <!-- Selection indicator -->
                  <div v-if="selectedProvider === 'aws'" class="absolute top-4 right-4">
                    <div class="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50 animate-pulse">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  
                  <!-- Hover effect -->
                  <div class="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/5 group-hover:to-orange-600/5 transition-all duration-300 rounded-2xl"></div>
                </button>

                <!-- Azure -->
                <button
                  @click="selectedProvider = 'azure'"
                  :class="[
                    'group relative p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 overflow-hidden',
                    selectedProvider === 'azure'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-blue-600/10 shadow-lg shadow-blue-500/20 scale-105'
                      : 'border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-blue-500/50 hover:scale-102'
                  ]"
                >
                  <!-- Background glow effect -->
                  <div v-if="selectedProvider === 'azure'" class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
                  
                  <div class="relative flex flex-col items-center text-center">
                    <div
                      :class="[
                        'w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-lg',
                        selectedProvider === 'azure'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 scale-110 shadow-blue-500/30'
                          : 'bg-gray-700/50 group-hover:bg-gray-700 group-hover:scale-105'
                      ]"
                    >
                      <!-- Azure Logo -->
                      <svg class="w-12 h-12" viewBox="0 0 161 161" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M88.218 0L0 88.218V161h72.782L161 72.782V0H88.218z" fill="#0078D4"/>
                        <path d="M88.218 0L0 88.218h72.782V0z" fill="#0078D4"/>
                        <path d="M161 72.782L88.218 161H161V72.782z" fill="#0078D4"/>
                        <path d="M88.218 88.218L0 161h72.782V88.218z" fill="#0078D4"/>
                      </svg>
                    </div>
                    <h3 class="text-white font-bold text-lg mb-1">Microsoft Azure</h3>
                    <p class="text-xs text-gray-400 font-medium">Azure</p>
                  </div>
                  
                  <!-- Selection indicator -->
                  <div v-if="selectedProvider === 'azure'" class="absolute top-4 right-4">
                    <div class="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 animate-pulse">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  
                  <!-- Hover effect -->
                  <div class="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/5 group-hover:to-blue-600/5 transition-all duration-300 rounded-2xl"></div>
                </button>

                <!-- GCP -->
                <button
                  @click="selectedProvider = 'gcp'"
                  :class="[
                    'group relative p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 overflow-hidden',
                    selectedProvider === 'gcp'
                      ? 'border-red-500 bg-gradient-to-br from-red-500/20 to-red-600/10 shadow-lg shadow-red-500/20 scale-105'
                      : 'border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-red-500/50 hover:scale-102'
                  ]"
                >
                  <!-- Background glow effect -->
                  <div v-if="selectedProvider === 'gcp'" class="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>
                  
                  <div class="relative flex flex-col items-center text-center">
                    <div
                      :class="[
                        'w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-lg',
                        selectedProvider === 'gcp'
                          ? 'bg-white scale-110 shadow-red-500/30'
                          : 'bg-gray-700/50 group-hover:bg-gray-700 group-hover:scale-105'
                      ]"
                    >
                      <!-- GCP Logo -->
                      <svg class="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <h3 class="text-white font-bold text-lg mb-1">Google Cloud</h3>
                    <p class="text-xs text-gray-400 font-medium">GCP</p>
                  </div>
                  
                  <!-- Selection indicator -->
                  <div v-if="selectedProvider === 'gcp'" class="absolute top-4 right-4">
                    <div class="w-7 h-7 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                  
                  <!-- Hover effect -->
                  <div class="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-600/0 group-hover:from-red-500/5 group-hover:to-red-600/5 transition-all duration-300 rounded-2xl"></div>
                </button>
              </div>
            </div>

            <!-- Connection Form -->
            <Transition name="slide-fade">
              <div v-if="selectedProvider" class="space-y-5">
                <div class="relative">
                  <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-700/50"></div>
                  </div>
                  <div class="relative flex justify-center text-sm">
                    <span class="px-4 bg-gray-800 text-gray-400 font-medium">Connection Details</span>
                  </div>
                </div>

                <!-- Show Instructions Button -->
                <div class="flex justify-center">
                  <button
                    @click="showInstructions = true"
                    type="button"
                    class="inline-flex items-center px-5 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg border border-gray-600/50"
                  >
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Show Instructions
                  </button>
                </div>
              
                <div class="grid sm:grid-cols-2 gap-5">
                  <div class="sm:col-span-2">
                    <label class="block text-sm font-semibold text-gray-300 mb-2.5">
                      Account Name <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="form.accountName"
                      type="text"
                      :placeholder="`My ${selectedProvider.toUpperCase()} Account`"
                      class="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                    />
                    <p class="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Choose a friendly name to identify this account in Cloudevy (e.g., "Production AWS", "Dev Environment", "Company Azure")</span>
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2.5">
                      Access Key ID <span class="text-red-400">*</span>
                    </label>
                    <input
                      v-model="form.accessKey"
                      type="text"
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      class="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-300 mb-2.5">
                      Secret Access Key <span class="text-red-400">*</span>
                    </label>
                    <div class="relative">
                      <input
                        v-model="form.secretKey"
                        :type="showSecret ? 'text' : 'password'"
                        placeholder="wJalrXUtnFEMI/K7MDENG..."
                        class="w-full px-4 py-3.5 pr-12 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner font-mono text-sm"
                      />
                      <button
                        type="button"
                        @click="showSecret = !showSecret"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition p-1.5 rounded-lg hover:bg-gray-700/50"
                      >
                        <svg v-if="!showSecret" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                        </svg>
                      </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                      </svg>
                      <span>Your credentials are encrypted and stored securely</span>
                    </p>
                  </div>

                  <div class="sm:col-span-2">
                    <label class="block text-sm font-semibold text-gray-300 mb-2.5">
                      Region <span class="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <select
                      v-model="form.region"
                      class="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner"
                    >
                      <option value="">Select region</option>
                      <option v-if="selectedProvider === 'aws'" value="us-east-1">US East (N. Virginia) - us-east-1</option>
                      <option v-if="selectedProvider === 'aws'" value="us-west-2">US West (Oregon) - us-west-2</option>
                      <option v-if="selectedProvider === 'aws'" value="eu-west-1">EU (Ireland) - eu-west-1</option>
                      <option v-if="selectedProvider === 'aws'" value="ap-south-1">Asia Pacific (Mumbai) - ap-south-1</option>
                      <option v-if="selectedProvider === 'azure'" value="eastus">East US</option>
                      <option v-if="selectedProvider === 'azure'" value="westus">West US</option>
                      <option v-if="selectedProvider === 'azure'" value="westeurope">West Europe</option>
                      <option v-if="selectedProvider === 'azure'" value="southeastasia">Southeast Asia</option>
                      <option v-if="selectedProvider === 'gcp'" value="us-central1">US Central (Iowa)</option>
                      <option v-if="selectedProvider === 'gcp'" value="us-east1">US East (South Carolina)</option>
                      <option v-if="selectedProvider === 'gcp'" value="europe-west1">Europe West (Belgium)</option>
                      <option v-if="selectedProvider === 'gcp'" value="asia-south1">Asia South (Mumbai)</option>
                    </select>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Error Message -->
            <div v-if="error" class="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">
              {{ error }}
            </div>
          </div>

          <!-- Footer -->
          <div class="relative p-6 sm:p-8 border-t border-gray-700/50 bg-gray-900/30 flex items-center justify-between">
            <div class="text-xs text-gray-500">
              <span class="flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <span>All data is encrypted and secure</span>
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
                @click="handleConnect"
                :disabled="!canConnect || loading"
                class="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105"
              >
                <span v-if="loading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
                <span v-else class="flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Connect Account
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Instructions Modal -->
    <Transition name="modal">
      <div
        v-if="showInstructions"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click.self="showInstructions = false"
      >
        <div class="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col">
          <!-- Header -->
          <div class="relative p-6 border-b border-gray-700/50 flex-shrink-0">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-white">
                    {{ selectedProvider === 'aws' ? 'AWS' : selectedProvider === 'azure' ? 'Azure' : 'GCP' }} Connection Instructions
                  </h3>
                  <p class="text-gray-400 text-sm">Follow these steps to get your credentials</p>
                </div>
              </div>
              <button
                @click="showInstructions = false"
                class="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all hover:scale-110"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Content - Scrollable -->
          <div class="relative p-6 overflow-y-auto flex-1">
            <!-- AWS Instructions -->
            <div v-if="selectedProvider === 'aws'" class="space-y-6">
              <div class="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <div class="flex items-start space-x-3">
                  <svg class="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <h4 class="text-orange-400 font-semibold mb-1">Before You Begin</h4>
                    <p class="text-gray-300 text-sm">You'll need an active AWS account with administrator access to create IAM credentials.</p>
                  </div>
                </div>
              </div>

              <div class="space-y-5">
                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">1</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Log into AWS Console</h5>
                    <p class="text-gray-400 text-sm mb-2">Go to <a href="https://console.aws.amazon.com" target="_blank" class="text-orange-400 hover:text-orange-300 underline">console.aws.amazon.com</a> and sign in with your AWS account credentials.</p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">2</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Navigate to IAM Service</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>In the AWS Console, search for "IAM" in the top search bar</li>
                      <li>Click on "IAM" (Identity and Access Management)</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">3</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Create a New User</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Click "Users" in the left sidebar</li>
                      <li>Click "Add users" or "Create user" button</li>
                      <li>Enter a username (e.g., "cloudevy-access")</li>
                      <li>Click "Next"</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">4</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Set Permissions</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Select "Attach policies directly"</li>
                      <li>Search and select <code class="bg-gray-900/50 px-2 py-0.5 rounded text-orange-400">ReadOnlyAccess</code> for read-only monitoring</li>
                      <li>Or select <code class="bg-gray-900/50 px-2 py-0.5 rounded text-orange-400">PowerUserAccess</code> for full management</li>
                      <li>Click "Next" and then "Create user"</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">5</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Create Access Keys</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Click on the newly created user</li>
                      <li>Go to the "Security credentials" tab</li>
                      <li>Scroll to "Access keys" section</li>
                      <li>Click "Create access key"</li>
                      <li>Select "Third-party service" or "Application running outside AWS"</li>
                      <li>Check the confirmation box and click "Next"</li>
                      <li>Add a description tag (optional) and click "Create access key"</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">6</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Copy Your Credentials</h5>
                    <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-2">
                      <p class="text-yellow-300 text-sm font-medium">⚠️ Important: This is your only chance to view the Secret Access Key!</p>
                    </div>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Copy the <strong class="text-white">Access Key ID</strong></li>
                      <li>Copy the <strong class="text-white">Secret Access Key</strong></li>
                      <li>Store them securely or paste them directly into Cloudevy</li>
                      <li>Click "Done"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Azure Instructions -->
            <div v-if="selectedProvider === 'azure'" class="space-y-6">
              <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div class="flex items-start space-x-3">
                  <svg class="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <h4 class="text-blue-400 font-semibold mb-1">Before You Begin</h4>
                    <p class="text-gray-300 text-sm">You'll need an active Azure account with permissions to create service principals and app registrations.</p>
                  </div>
                </div>
              </div>

              <div class="space-y-5">
                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">1</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Log into Azure Portal</h5>
                    <p class="text-gray-400 text-sm mb-2">Go to <a href="https://portal.azure.com" target="_blank" class="text-blue-400 hover:text-blue-300 underline">portal.azure.com</a> and sign in with your Microsoft account.</p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">2</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Navigate to App Registrations</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>In the Azure Portal, search for "App registrations" in the top search bar</li>
                      <li>Click on "App registrations"</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">3</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Create New Registration</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Click "+ New registration"</li>
                      <li>Enter a name (e.g., "cloudevy-app")</li>
                      <li>Select "Accounts in this organizational directory only"</li>
                      <li>Click "Register"</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">4</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Copy Application IDs</h5>
                    <p class="text-gray-400 text-sm mb-2">From the Overview page, copy these values:</p>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li><strong class="text-white">Application (client) ID</strong> - This is your Access Key ID</li>
                      <li><strong class="text-white">Directory (tenant) ID</strong> - Save this for later</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">5</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Create Client Secret</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Click "Certificates & secrets" in the left sidebar</li>
                      <li>Click "+ New client secret"</li>
                      <li>Add a description (e.g., "Cloudevy access")</li>
                      <li>Select an expiration period</li>
                      <li>Click "Add"</li>
                      <li>Copy the <strong class="text-white">Value</strong> immediately - This is your Secret Access Key</li>
                    </ul>
                    <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-2">
                      <p class="text-yellow-300 text-sm font-medium">⚠️ Important: Copy the secret value now - you won't be able to see it again!</p>
                    </div>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">6</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Assign Permissions</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Go to "Subscriptions" in the Azure Portal</li>
                      <li>Select your subscription</li>
                      <li>Click "Access control (IAM)"</li>
                      <li>Click "+ Add" → "Add role assignment"</li>
                      <li>Select "Reader" role (for read-only) or "Contributor" role (for management)</li>
                      <li>Search and select your app registration</li>
                      <li>Click "Review + assign"</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">7</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Use Your Credentials</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li><strong class="text-white">Access Key ID:</strong> Use your Application (client) ID</li>
                      <li><strong class="text-white">Secret Access Key:</strong> Use your Client secret value</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- GCP Instructions -->
            <div v-if="selectedProvider === 'gcp'" class="space-y-6">
              <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div class="flex items-start space-x-3">
                  <svg class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <h4 class="text-red-400 font-semibold mb-1">Before You Begin</h4>
                    <p class="text-gray-300 text-sm">You'll need an active Google Cloud account with permissions to create service accounts and manage IAM.</p>
                  </div>
                </div>
              </div>

              <div class="space-y-5">
                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">1</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Log into Google Cloud Console</h5>
                    <p class="text-gray-400 text-sm mb-2">Go to <a href="https://console.cloud.google.com" target="_blank" class="text-red-400 hover:text-red-300 underline">console.cloud.google.com</a> and sign in with your Google account.</p>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">2</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Select or Create a Project</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Click the project dropdown at the top of the page</li>
                      <li>Select an existing project or click "New Project"</li>
                      <li>If creating new, enter a project name and click "Create"</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">3</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Enable Required APIs</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Go to "APIs & Services" → "Library"</li>
                      <li>Search for and enable: "Compute Engine API", "Cloud Resource Manager API"</li>
                      <li>Click "Enable" for each API</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">4</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Create Service Account</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Go to "IAM & Admin" → "Service Accounts"</li>
                      <li>Click "+ Create Service Account"</li>
                      <li>Enter a name (e.g., "cloudevy-service")</li>
                      <li>Add a description (optional)</li>
                      <li>Click "Create and Continue"</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">5</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Grant Permissions</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Select role: "Viewer" (for read-only access) or "Editor" (for management)</li>
                      <li>Click "Continue"</li>
                      <li>Click "Done"</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">6</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Create and Download Key</h5>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li>Click on the service account you just created</li>
                      <li>Go to the "Keys" tab</li>
                      <li>Click "Add Key" → "Create new key"</li>
                      <li>Select "JSON" as the key type</li>
                      <li>Click "Create"</li>
                      <li>A JSON file will be downloaded automatically</li>
                    </ul>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span class="text-white font-bold text-sm">7</span>
                  </div>
                  <div class="flex-1">
                    <h5 class="text-white font-semibold mb-2">Extract Credentials from JSON</h5>
                    <p class="text-gray-400 text-sm mb-2">Open the downloaded JSON file and find these values:</p>
                    <ul class="text-gray-400 text-sm space-y-1 list-disc list-inside">
                      <li><strong class="text-white">Access Key ID:</strong> Use the value from <code class="bg-gray-900/50 px-2 py-0.5 rounded text-red-400">"client_email"</code></li>
                      <li><strong class="text-white">Secret Access Key:</strong> Use the value from <code class="bg-gray-900/50 px-2 py-0.5 rounded text-red-400">"private_key"</code></li>
                    </ul>
                    <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
                      <p class="text-blue-300 text-sm">💡 Tip: You can paste the entire JSON content as the Secret Access Key if preferred.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="relative p-6 border-t border-gray-700/50 bg-gray-900/30 flex justify-end flex-shrink-0">
            <button
              @click="showInstructions = false"
              class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all hover:scale-105 shadow-lg"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import apiClient from '@/api/client'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'connected'])

const selectedProvider = ref('')
const showSecret = ref(false)
const loading = ref(false)
const error = ref('')
const showInstructions = ref(false)

const form = ref({
  accountName: '',
  accessKey: '',
  secretKey: '',
  region: ''
})

const canConnect = computed(() => {
  return selectedProvider.value &&
         form.value.accountName.trim() !== '' &&
         form.value.accessKey.trim() !== '' &&
         form.value.secretKey.trim() !== ''
})

const closeModal = () => {
  selectedProvider.value = ''
  form.value = {
    accountName: '',
    accessKey: '',
    secretKey: '',
    region: ''
  }
  error.value = ''
  emit('close')
}

const handleConnect = async () => {
  if (!canConnect.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await apiClient.post('/cloud-accounts/connect', {
      provider: selectedProvider.value,
      accountName: form.value.accountName.trim(),
      accessKey: form.value.accessKey.trim(),
      secretKey: form.value.secretKey.trim(),
      region: form.value.region || null
    })

    if (response.data.success) {
      emit('connected', response.data.data)
      closeModal()
    } else {
      error.value = response.data.message || 'Failed to connect account'
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to connect cloud account. Please try again.'
    console.error('Connect cloud account error:', err)
  } finally {
    loading.value = false
  }
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

/* Form slide transition */
.slide-fade-enter-active {
  transition: all 0.4s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Hover scale effect */
.hover\:scale-102:hover {
  transform: scale(1.02);
}
</style>

