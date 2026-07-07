<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Team Members</h1>
          <p class="text-gray-400">Manage your workspace team and invitations</p>
        </div>
        <button
          @click="showInviteModal = true"
          class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>Invite Member</span>
        </button>
      </div>

      <!-- Members List -->
      <div class="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
        <h2 class="text-xl font-bold text-white mb-4">Active Members</h2>
        
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>

        <div v-else-if="members.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <p class="text-gray-400">No team members yet</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="member in members"
            :key="member.id"
            class="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
          >
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span class="text-blue-400 font-bold text-lg">{{ getInitials(member.fullName) }}</span>
              </div>
              <div>
                <h3 class="text-white font-semibold">{{ member.fullName }}</h3>
                <p class="text-gray-400 text-sm">{{ member.email }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <span :class="[
                'px-3 py-1 rounded-full text-xs font-medium',
                getRoleBadgeColor(member.role)
              ]">
                {{ member.role }}
              </span>
              <span class="text-gray-500 text-sm">
                Joined {{ formatDate(member.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Invitations -->
      <div class="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <h2 class="text-xl font-bold text-white mb-4">Pending Invitations</h2>
        
        <div v-if="invitations.length === 0" class="text-center py-8">
          <p class="text-gray-400">No pending invitations</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="invitation in invitations"
            :key="invitation.id"
            class="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
          >
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-white font-semibold">{{ invitation.email }}</h3>
                <p class="text-gray-400 text-sm">
                  Invited by {{ invitation.inviter.fullName }} · Expires {{ formatDate(invitation.expiresAt) }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <span :class="[
                'px-3 py-1 rounded-full text-xs font-medium',
                getRoleBadgeColor(invitation.role)
              ]">
                {{ invitation.role }}
              </span>
              <button
                @click="revokeInvitation(invitation.id)"
                class="text-red-400 hover:text-red-300 transition-colors"
                title="Revoke invitation"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-white">Invite Team Member</h3>
          <button
            @click="showInviteModal = false"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form @submit.prevent="sendInvitation" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              v-model="inviteForm.email"
              type="email"
              required
              placeholder="colleague@example.com"
              class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <select
              v-model="inviteForm.role"
              class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="viewer">Viewer - Read-only access</option>
              <option value="member">Member - Can manage resources</option>
              <option value="admin">Admin - Full access</option>
            </select>
          </div>

          <div v-if="inviteError" class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p class="text-red-400 text-sm">{{ inviteError }}</p>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              @click="showInviteModal = false"
              class="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="inviteSending"
              class="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ inviteSending ? 'Sending...' : 'Send Invitation' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '../api/client';

const loading = ref(true);
const members = ref([]);
const invitations = ref([]);
const showInviteModal = ref(false);
const inviteSending = ref(false);
const inviteError = ref('');

const inviteForm = ref({
  email: '',
  role: 'member'
});

async function fetchTeamData() {
  loading.value = true;
  try {
    // Fetch workspace members
    const membersRes = await apiClient.get('/team/members');
    members.value = membersRes.data.data || [];

    // Fetch pending invitations
    const invitationsRes = await apiClient.get('/team/invitations?status=pending');
    invitations.value = invitationsRes.data.data || [];
  } catch (error) {
    console.error('Failed to fetch team data:', error);
  } finally {
    loading.value = false;
  }
}

async function sendInvitation() {
  inviteError.value = '';
  inviteSending.value = true;

  try {
    await apiClient.post('/team/invitations', inviteForm.value);
    
    // Reset form
    inviteForm.value = { email: '', role: 'member' };
    showInviteModal.value = false;
    
    // Refresh data
    await fetchTeamData();
  } catch (error) {
    inviteError.value = error.response?.data?.message || 'Failed to send invitation';
  } finally {
    inviteSending.value = false;
  }
}

async function revokeInvitation(invitationId) {
  if (!confirm('Are you sure you want to revoke this invitation?')) return;

  try {
    await apiClient.delete(`/team/invitations/${invitationId}`);
    await fetchTeamData();
  } catch (error) {
    console.error('Failed to revoke invitation:', error);
    alert('Failed to revoke invitation');
  }
}

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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
  fetchTeamData();
});
</script>

