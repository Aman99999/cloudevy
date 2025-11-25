<template>
  <div class="min-h-screen bg-gray-900 relative overflow-hidden">
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-blob top-0 -left-20"></div>
      <div class="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-2000 top-0 right-0"></div>
      <div class="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-blob animation-delay-4000 bottom-0 left-20"></div>
    </div>
    
    <!-- Grid Pattern -->
    <div class="absolute inset-0 bg-grid-pattern opacity-10"></div>
    <!-- Navigation -->
    <nav class="fixed w-full bg-gray-900/60 backdrop-blur-xl border-b border-white/10 z-50">
      <div class="px-4 sm:px-6 lg:px-16">
        <div class="flex justify-between items-center h-16 lg:h-20">
          <Logo size="sm" :icon-only="false" class="hover:scale-105 transition-transform cursor-pointer" />
          <div class="hidden lg:flex space-x-8">
            <a href="#features" class="text-gray-300 hover:text-white transition">Features</a>
            <a href="#pricing" class="text-gray-300 hover:text-white transition">Pricing</a>
            <a href="#about" class="text-gray-300 hover:text-white transition">About</a>
          </div>
          <div class="flex items-center space-x-2 sm:space-x-4">
            <router-link 
              to="/login" 
              class="text-gray-300 hover:text-white transition font-medium text-sm sm:text-base"
            >
              Sign In
            </router-link>
            <router-link
              to="/login"
              class="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg overflow-hidden group text-sm sm:text-base"
            >
              <span class="relative z-10">Get Started</span>
              <div class="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-16">
      <div class="w-full">
        <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-[1600px] mx-auto">
          <!-- Left Content -->
          <div class="text-center lg:text-left">
            <div class="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full mb-4 sm:mb-6 animate-pulse">
              <span class="text-indigo-400 text-xs sm:text-sm font-semibold">🚀 Now in Public Beta</span>
            </div>
            <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 sm:mb-6 leading-tight">
              Manage Your Cloud
              <span class="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Like a Boss
              </span>
            </h1>
            <p class="text-base sm:text-lg lg:text-xl text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0">
              Visual infrastructure control for <span class="text-indigo-400 font-semibold">AWS</span>, <span class="text-blue-400 font-semibold">Azure</span>, <span class="text-red-400 font-semibold">GCP</span> & on-premise. No terminal. No commands. Just pure power.
            </p>
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <router-link
                to="/login"
                class="group relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold overflow-hidden transform hover:scale-105 transition"
              >
                <span class="relative z-10 flex items-center justify-center">
                  Start Free Trial
                  <svg class="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </span>
                <div class="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </router-link>
              <a
                href="#features"
                class="border-2 border-gray-700 text-gray-300 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:border-indigo-500 hover:text-white transition flex items-center justify-center backdrop-blur-sm"
              >
                <svg class="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
                </svg>
                Watch Demo
              </a>
            </div>
          </div>

          <!-- Right Visual -->
          <div class="relative hidden lg:block">
            <div class="relative w-full h-[600px] flex items-center justify-center">
              
              <!-- Main Dashboard Screen Mockup -->
              <div class="absolute top-0 left-0 w-[480px] h-[320px] animate-float">
                <div class="bg-gray-800 rounded-2xl shadow-2xl border-4 border-gray-700 overflow-hidden">
                  <!-- Browser Bar -->
                  <div class="bg-gray-900 px-4 py-3 flex items-center space-x-2 border-b border-gray-700">
                    <div class="flex space-x-2">
                      <div class="w-3 h-3 rounded-full bg-red-500"></div>
                      <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div class="flex-1 bg-gray-800 rounded px-3 py-1 text-xs text-gray-400 ml-3">
                      cloudevy.io/dashboard
                    </div>
                  </div>
                  <!-- Dashboard Content -->
                  <div class="p-6 bg-gradient-to-br from-gray-900 to-gray-800 h-[290px]">
                    <!-- Header -->
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-white font-bold text-lg">Infrastructure</h3>
                      <div class="flex space-x-1">
                        <div class="w-6 h-6 bg-green-500 rounded animate-pulse"></div>
                        <div class="w-6 h-6 bg-green-500 rounded animate-pulse animation-delay-500"></div>
                      </div>
                    </div>
                    <!-- Stats Grid -->
                    <div class="grid grid-cols-3 gap-3 mb-4">
                      <div class="bg-indigo-600/20 border border-indigo-500/30 rounded-lg p-3">
                        <div class="text-xs text-indigo-300 mb-1">Servers</div>
                        <div class="text-xl font-bold text-white">247</div>
                      </div>
                      <div class="bg-cyan-600/20 border border-cyan-500/30 rounded-lg p-3">
                        <div class="text-xs text-cyan-300 mb-1">Containers</div>
                        <div class="text-xl font-bold text-white">156</div>
                      </div>
                      <div class="bg-purple-600/20 border border-purple-500/30 rounded-lg p-3">
                        <div class="text-xs text-purple-300 mb-1">Clusters</div>
                        <div class="text-xl font-bold text-white">12</div>
                      </div>
                    </div>
                    <!-- Chart Area -->
                    <div class="bg-gray-950/50 rounded-lg p-3 border border-gray-700">
                      <div class="flex items-end space-x-2 h-20">
                        <div class="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t" style="height: 60%"></div>
                        <div class="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t" style="height: 80%"></div>
                        <div class="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t" style="height: 45%"></div>
                        <div class="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t" style="height: 90%"></div>
                        <div class="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t" style="height: 70%"></div>
                        <div class="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t" style="height: 55%"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Container Management Screen -->
              <div class="absolute top-0 right-0 w-[380px] h-[260px] animate-float animation-delay-2000">
                <div class="bg-gray-800 rounded-2xl shadow-2xl border-4 border-gray-700 overflow-hidden">
                  <!-- Header -->
                  <div class="bg-cyan-600 px-4 py-2.5 flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185"/>
                      </svg>
                      <span class="text-white font-bold text-sm">Docker Containers</span>
                    </div>
                    <span class="text-xs bg-white/20 px-2 py-1 rounded text-white">156 Running</span>
                  </div>
                  <!-- Container List -->
                  <div class="p-4 bg-gray-900 space-y-2">
                    <div class="flex items-center justify-between bg-gray-800 rounded-lg p-2.5 border border-gray-700">
                      <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span class="text-white text-xs font-medium">web-app-prod</span>
                      </div>
                      <div class="flex space-x-1">
                        <div class="w-5 h-5 bg-blue-600 rounded"></div>
                        <div class="w-5 h-5 bg-green-600 rounded"></div>
                        <div class="w-5 h-5 bg-red-600 rounded"></div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between bg-gray-800 rounded-lg p-2.5 border border-gray-700">
                      <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span class="text-white text-xs font-medium">api-service</span>
                      </div>
                      <div class="flex space-x-1">
                        <div class="w-5 h-5 bg-blue-600 rounded"></div>
                        <div class="w-5 h-5 bg-green-600 rounded"></div>
                        <div class="w-5 h-5 bg-red-600 rounded"></div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between bg-gray-800 rounded-lg p-2.5 border border-gray-700">
                      <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span class="text-white text-xs font-medium">database-cache</span>
                      </div>
                      <div class="flex space-x-1">
                        <div class="w-5 h-5 bg-blue-600 rounded"></div>
                        <div class="w-5 h-5 bg-green-600 rounded"></div>
                        <div class="w-5 h-5 bg-red-600 rounded"></div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between bg-gray-800 rounded-lg p-2.5 border border-gray-700">
                      <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span class="text-white text-xs font-medium">worker-queue</span>
                      </div>
                      <div class="flex space-x-1">
                        <div class="w-5 h-5 bg-blue-600 rounded"></div>
                        <div class="w-5 h-5 bg-green-600 rounded"></div>
                        <div class="w-5 h-5 bg-red-600 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Cost Analytics Screen -->
              <div class="absolute bottom-0 left-0 w-[400px] h-[280px] animate-float animation-delay-4000">
                <div class="bg-gray-800 rounded-2xl shadow-2xl border-4 border-gray-700 overflow-hidden">
                  <!-- Header -->
                  <div class="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5">
                    <div class="flex items-center justify-between">
                      <span class="text-white font-bold text-sm">Cost Analytics</span>
                      <span class="text-xs bg-white/20 px-2 py-1 rounded text-white">Live</span>
                    </div>
                  </div>
                  <!-- Content -->
                  <div class="p-4 bg-gray-900">
                    <!-- Big Number -->
                    <div class="text-center mb-3">
                      <div class="text-xs text-gray-400 mb-1">Total Savings This Month</div>
                      <div class="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        $12,847
                      </div>
                    </div>
                    <!-- Mini Charts -->
                    <div class="grid grid-cols-3 gap-2 mb-3">
                      <div class="bg-gray-800 rounded-lg p-2 border border-gray-700">
                        <div class="text-xs text-gray-400 mb-1">AWS</div>
                        <div class="text-sm font-bold text-green-400">-32%</div>
                      </div>
                      <div class="bg-gray-800 rounded-lg p-2 border border-gray-700">
                        <div class="text-xs text-gray-400 mb-1">Azure</div>
                        <div class="text-sm font-bold text-green-400">-28%</div>
                      </div>
                      <div class="bg-gray-800 rounded-lg p-2 border border-gray-700">
                        <div class="text-xs text-gray-400 mb-1">GCP</div>
                        <div class="text-sm font-bold text-green-400">-41%</div>
                      </div>
                    </div>
                    <!-- Chart -->
                    <div class="bg-gray-950/50 rounded-lg p-3 border border-gray-700">
                      <div class="flex items-end space-x-1.5 h-16">
                        <div class="flex-1 bg-gradient-to-t from-green-600 to-emerald-500 rounded-t" style="height: 40%"></div>
                        <div class="flex-1 bg-gradient-to-t from-green-600 to-emerald-500 rounded-t" style="height: 60%"></div>
                        <div class="flex-1 bg-gradient-to-t from-green-600 to-emerald-500 rounded-t" style="height: 50%"></div>
                        <div class="flex-1 bg-gradient-to-t from-green-600 to-emerald-500 rounded-t" style="height: 80%"></div>
                        <div class="flex-1 bg-gradient-to-t from-green-600 to-emerald-500 rounded-t" style="height: 70%"></div>
                        <div class="flex-1 bg-gradient-to-t from-green-600 to-emerald-500 rounded-t" style="height: 90%"></div>
                        <div class="flex-1 bg-gradient-to-t from-green-600 to-emerald-500 rounded-t" style="height: 65%"></div>
                        <div class="flex-1 bg-gradient-to-t from-green-600 to-emerald-500 rounded-t" style="height: 85%"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Kubernetes Dashboard -->
              <div class="absolute bottom-0 right-0 w-[360px] h-[240px] animate-float animation-delay-1000">
                <div class="bg-gray-800 rounded-2xl shadow-2xl border-4 border-gray-700 overflow-hidden">
                  <!-- Header -->
                  <div class="bg-blue-600 px-4 py-2.5 flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10.204 14.35l.007.01-.999 2.413a5.171 5.171 0 0 1-2.075-2.597l2.578-.437.004.005a.44.44 0 0 1 .484.606z"/>
                      </svg>
                      <span class="text-white font-bold text-sm">Kubernetes</span>
                    </div>
                    <span class="text-xs bg-white/20 px-2 py-1 rounded text-white">12 Clusters</span>
                  </div>
                  <!-- Content -->
                  <div class="p-4 bg-gray-900">
                    <!-- Cluster Stats -->
                    <div class="grid grid-cols-2 gap-2 mb-3">
                      <div class="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2">
                        <div class="text-xs text-blue-300">Pods</div>
                        <div class="text-lg font-bold text-white">342</div>
                      </div>
                      <div class="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2">
                        <div class="text-xs text-blue-300">Nodes</div>
                        <div class="text-lg font-bold text-white">48</div>
                      </div>
                    </div>
                    <!-- Pod List -->
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between bg-gray-800 rounded px-2 py-1.5 text-xs border border-gray-700">
                        <span class="text-green-400">● prod-web-7f8d9</span>
                        <span class="text-gray-400">Running</span>
                      </div>
                      <div class="flex items-center justify-between bg-gray-800 rounded px-2 py-1.5 text-xs border border-gray-700">
                        <span class="text-green-400">● api-service-4k2m</span>
                        <span class="text-gray-400">Running</span>
                      </div>
                      <div class="flex items-center justify-between bg-gray-800 rounded px-2 py-1.5 text-xs border border-gray-700">
                        <span class="text-yellow-400">● cache-redis-9x1p</span>
                        <span class="text-gray-400">Pending</span>
                      </div>
                      <div class="flex items-center justify-between bg-gray-800 rounded px-2 py-1.5 text-xs border border-gray-700">
                        <span class="text-green-400">● worker-job-5h3n</span>
                        <span class="text-gray-400">Running</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16 lg:mt-20 max-w-[1600px] mx-auto">
          <div class="text-center p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl hover:border-indigo-500 transition group">
            <div class="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition">3+</div>
            <div class="text-gray-400 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">Cloud Providers</div>
          </div>
          <div class="text-center p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl hover:border-indigo-500 transition group">
            <div class="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition">100%</div>
            <div class="text-gray-400 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">No-Code</div>
          </div>
          <div class="text-center p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl hover:border-indigo-500 transition group">
            <div class="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition">24/7</div>
            <div class="text-gray-400 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">Monitoring</div>
          </div>
          <div class="text-center p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl hover:border-indigo-500 transition group">
            <div class="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition">∞</div>
            <div class="text-gray-400 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">Scalability</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-16">
      <div class="w-full">
        <div class="text-center mb-10 sm:mb-12 lg:mb-16 max-w-4xl mx-auto">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Everything You Need. <span class="text-indigo-400">Nothing You Don't.</span>
          </h2>
          <p class="text-base sm:text-lg lg:text-xl text-gray-400">
            Powerful features that make infrastructure management a breeze
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-[1800px] mx-auto">
          <!-- Feature 1 -->
          <div class="group p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-2">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
              </svg>
            </div>
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Multi-Cloud</h3>
            <p class="text-sm sm:text-base text-gray-400">
              Manage AWS, Azure, GCP, and on-premise infrastructure from a single dashboard. One platform to rule them all.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="group p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-2">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Container Control</h3>
            <p class="text-sm sm:text-base text-gray-400">
              Start, stop, restart Docker and Podman containers with a single click. View logs instantly. No SSH needed.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="group p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-2">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Real-time Metrics</h3>
            <p class="text-sm sm:text-base text-gray-400">
              Monitor CPU, memory, storage, and network in beautiful dashboards. Get alerts before issues become problems.
            </p>
          </div>

          <!-- Feature 4 -->
          <div class="group p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-2">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Cost Tracking</h3>
            <p class="text-sm sm:text-base text-gray-400">
              See exactly where your money goes. Get optimization suggestions. Detect cost spikes before they hurt.
            </p>
          </div>

          <!-- Feature 5 -->
          <div class="group p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-2">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">RBAC Built-in</h3>
            <p class="text-sm sm:text-base text-gray-400">
              Role-based access control out of the box. Give team members exactly the permissions they need.
            </p>
          </div>

          <!-- Feature 6 -->
          <div class="group p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-2">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all">
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Lightning Fast</h3>
            <p class="text-sm sm:text-base text-gray-400">
              Built on modern tech stack. Vue 3, Node.js, PostgreSQL. Blazing fast UI that your team will love.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-12 sm:py-16 lg:py-20 overflow-hidden px-4 sm:px-6 lg:px-8">
      <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-10"></div>
      <div class="text-center relative z-10">
        <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
          Ready to Take Control?
        </h2>
        <p class="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 px-4">
          Join teams managing infrastructure the modern way. <span class="text-indigo-400 font-semibold">No credit card required.</span>
        </p>
        <router-link
          to="/login"
          class="inline-flex items-center bg-white text-gray-900 px-8 sm:px-10 py-4 sm:py-5 rounded-xl text-base sm:text-lg font-bold hover:shadow-2xl hover:shadow-white/20 transition transform hover:-translate-y-1 hover:scale-105"
        >
          Start Your Free Trial
          <svg class="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </router-link>
      </div>
    </section>

    <!-- Footer -->
    <footer class="relative border-t border-gray-800 bg-gray-900/80 backdrop-blur-xl py-8 sm:py-12 px-4 sm:px-6 lg:px-16">
      <div class="max-w-[1600px] mx-auto">
        <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div class="sm:col-span-2 md:col-span-1">
            <Logo size="sm" :icon-only="false" class="mb-3 sm:mb-4" />
            <p class="text-sm sm:text-base text-gray-400">Visual Infrastructure Control Platform</p>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
            <ul class="space-y-1.5 sm:space-y-2 text-gray-400 text-sm sm:text-base">
              <li><a href="#features" class="hover:text-white transition">Features</a></li>
              <li><a href="#pricing" class="hover:text-white transition">Pricing</a></li>
              <li><a href="#" class="hover:text-white transition">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
            <ul class="space-y-1.5 sm:space-y-2 text-gray-400 text-sm sm:text-base">
              <li><a href="#about" class="hover:text-white transition">About</a></li>
              <li><a href="#" class="hover:text-white transition">Blog</a></li>
              <li><a href="#" class="hover:text-white transition">Contact</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-gray-800 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
          <p>© 2025 CloudEvy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import Logo from '@/components/Logo.vue'
</script>

<style scoped>
@keyframes blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-500 {
  animation-delay: 0.5s;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

.animation-delay-3000 {
  animation-delay: 3s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

.bg-grid-pattern {
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
}
</style>

