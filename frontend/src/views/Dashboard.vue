<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-14 sm:h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <Logo size="xs" :show-text="true" />
            </div>
            <div class="hidden md:ml-6 md:flex md:space-x-8">
              <router-link
                to="/dashboard"
                class="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Dashboard
              </router-link>
              <router-link
                to="/servers"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Servers
              </router-link>
              <router-link
                to="/containers"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Containers
              </router-link>
              <router-link
                to="/costs"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Costs
              </router-link>
            </div>
          </div>
          <div class="flex items-center space-x-2 sm:space-x-4">
            <span class="hidden sm:block text-xs sm:text-sm text-gray-700">
              {{ authStore.user?.name }} ({{ authStore.user?.role }})
            </span>
            <button
              @click="handleLogout"
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Dashboard</h2>
        
        <div class="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-4">
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-3 sm:p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="text-2xl sm:text-3xl">🖥️</div>
                </div>
                <div class="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Servers
                    </dt>
                    <dd class="text-base sm:text-lg font-semibold text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-3 sm:p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="text-2xl sm:text-3xl">🐳</div>
                </div>
                <div class="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Containers
                    </dt>
                    <dd class="text-base sm:text-lg font-semibold text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-3 sm:p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="text-2xl sm:text-3xl">☁️</div>
                </div>
                <div class="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Providers
                    </dt>
                    <dd class="text-base sm:text-lg font-semibold text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-3 sm:p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="text-2xl sm:text-3xl">💰</div>
                </div>
                <div class="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Cost
                    </dt>
                    <dd class="text-base sm:text-lg font-semibold text-gray-900">
                      $0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 sm:mt-8 bg-white shadow rounded-lg p-4 sm:p-6">
          <h3 class="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
            Welcome to CloudEvy! 🎉
          </h3>
          <p class="text-sm sm:text-base text-gray-600">
            Your visual infrastructure control platform is ready. Start by connecting your AWS account or servers.
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Logo from '@/components/Logo.vue'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

