<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <!-- Loading State -->
      <div v-if="loading" class="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p class="text-gray-400">Verifying invitation...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-gray-800/50 border border-red-500/30 rounded-2xl p-8 text-center">
        <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h2 class="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
        <p class="text-gray-400 mb-6">{{ error }}</p>
        <router-link
          to="/login"
          class="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          Go to Login
        </router-link>
      </div>

      <!-- Success State - Show Invitation Details -->
      <div v-else class="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-white mb-2">You're Invited! 🎉</h1>
          <p class="text-gray-400">
            <strong class="text-white">{{ invitation.inviterName }}</strong> has invited you to join
          </p>
          <p class="text-2xl font-bold text-blue-400 mt-2">{{ invitation.workspaceName }}</p>
        </div>

        <div class="bg-gray-900/50 border border-gray-700 rounded-xl p-4 mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-400">Email</span>
            <span class="text-white font-medium">{{ invitation.email }}</span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-400">Role</span>
            <span :class="[
              'px-3 py-1 rounded-full text-xs font-medium',
              getRoleBadgeColor(invitation.role)
            ]">
              {{ invitation.role }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-400">Expires</span>
            <span class="text-white font-medium">{{ formatDate(invitation.expiresAt) }}</span>
          </div>
        </div>

        <!-- Account Creation / Login -->
        <div v-if="!hasAccount" class="space-y-4">
          <p class="text-gray-400 text-sm text-center mb-4">Create your account to join the workspace</p>
          
          <form @submit.prevent="createAccountAndAccept" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                v-model="signupForm.fullName"
                type="text"
                required
                placeholder="John Doe"
                class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                v-model="signupForm.password"
                type="password"
                required
                minlength="6"
                placeholder="••••••••"
                class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div v-if="acceptError" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p class="text-red-400 text-sm">{{ acceptError }}</p>
            </div>

            <button
              type="submit"
              :disabled="accepting"
              class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ accepting ? 'Creating Account...' : 'Create Account & Join' }}
            </button>
          </form>

          <div class="text-center">
            <p class="text-gray-400 text-sm">
              Already have an account?
              <button @click="hasAccount = true" class="text-blue-400 hover:text-blue-300">
                Sign In
              </button>
            </p>
          </div>
        </div>

        <div v-else class="space-y-4">
          <p class="text-gray-400 text-sm text-center mb-4">Sign in to accept the invitation</p>
          
          <form @submit.prevent="loginAndAccept" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                v-model="loginForm.password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div v-if="acceptError" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p class="text-red-400 text-sm">{{ acceptError }}</p>
            </div>

            <button
              type="submit"
              :disabled="accepting"
              class="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ accepting ? 'Signing In...' : 'Sign In & Join' }}
            </button>
          </form>

          <div class="text-center">
            <p class="text-gray-400 text-sm">
              Don't have an account?
              <button @click="hasAccount = false" class="text-blue-400 hover:text-blue-300">
                Create One
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '../api/client';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref('');
const invitation = ref(null);
const hasAccount = ref(false);
const accepting = ref(false);
const acceptError = ref('');

const signupForm = ref({
  fullName: '',
  password: ''
});

const loginForm = ref({
  password: ''
});

async function verifyInvitation() {
  const token = route.query.token;
  
  if (!token) {
    error.value = 'No invitation token provided';
    loading.value = false;
    return;
  }

  try {
    const response = await apiClient.get(`/team/invitations/verify/${token}`);
    invitation.value = response.data.data;
    loading.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to verify invitation';
    loading.value = false;
  }
}

async function createAccountAndAccept() {
  acceptError.value = '';
  accepting.value = true;

  try {
    const token = route.query.token;
    
    // Create account
    const signupRes = await apiClient.post('/auth/signup-invited', {
      email: invitation.value.email,
      password: signupForm.value.password,
      fullName: signupForm.value.fullName,
      inviteToken: token
    });

    // Store token and user data
    localStorage.setItem('token', signupRes.data.token);
    localStorage.setItem('user', JSON.stringify(signupRes.data.user));

    // Redirect to workspace dashboard
    const workspaceSlug = signupRes.data.user.workspace.slug;
    router.push(`/${workspaceSlug}`);
  } catch (err) {
    console.error('Create account error:', err);
    acceptError.value = err.response?.data?.message || 'Failed to create account';
  } finally {
    accepting.value = false;
  }
}

async function loginAndAccept() {
  acceptError.value = '';
  accepting.value = true;

  try {
    const token = route.query.token;
    
    // Login
    const loginRes = await apiClient.post('/auth/login', {
      email: invitation.value.email,
      password: loginForm.value.password
    });

    // Store token and user data
    localStorage.setItem('token', loginRes.data.token);
    localStorage.setItem('user', JSON.stringify(loginRes.data.user));

    // Accept invitation
    await apiClient.post(`/team/invitations/accept/${token}`, {
      userId: loginRes.data.user.id
    });

    // Redirect to workspace dashboard
    const workspaceSlug = loginRes.data.user.workspace.slug;
    router.push(`/${workspaceSlug}`);
  } catch (err) {
    console.error('Login error:', err);
    acceptError.value = err.response?.data?.message || 'Failed to sign in';
  } finally {
    accepting.value = false;
  }
}

function getRoleBadgeColor(role) {
  switch (role) {
    case 'admin':
      return 'bg-purple-500/20 text-purple-400';
    case 'member':
      return 'bg-blue-500/20 text-blue-400';
    case 'viewer':
      return 'bg-gray-500/20 text-gray-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

onMounted(() => {
  verifyInvitation();
});
</script>

