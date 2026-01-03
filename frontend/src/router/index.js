import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('../views/Landing.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('../views/Signup.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/accept-invitation',
    name: 'AcceptInvitation',
    component: () => import('../views/AcceptInvitation.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/:workspaceSlug',
    component: () => import('../layouts/WorkspaceLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'servers',
        name: 'Servers',
        component: () => import('../views/Servers.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'containers',
        name: 'Containers',
        component: () => import('../views/Containers.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'costs',
        name: 'Costs',
        component: () => import('../views/Costs.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'team',
        name: 'Team',
        component: () => import('../views/Team.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  // Legacy routes (redirect to workspace slug)
  {
    path: '/dashboard',
    redirect: async (to) => {
      const authStore = useAuthStore()
      if (authStore.isAuthenticated && !authStore.user) {
        await authStore.fetchCurrentUser()
      }
      const slug = authStore.user?.workspace?.slug
      if (slug) {
        return `/${slug}`
      }
      return '/login'
    }
  },
  {
    path: '/servers',
    redirect: async (to) => {
      const authStore = useAuthStore()
      if (authStore.isAuthenticated && !authStore.user) {
        await authStore.fetchCurrentUser()
      }
      const slug = authStore.user?.workspace?.slug
      if (slug) {
        return `/${slug}/servers`
      }
      return '/login'
    }
  },
  {
    path: '/containers',
    redirect: async (to) => {
      const authStore = useAuthStore()
      if (authStore.isAuthenticated && !authStore.user) {
        await authStore.fetchCurrentUser()
      }
      const slug = authStore.user?.workspace?.slug
      if (slug) {
        return `/${slug}/containers`
      }
      return '/login'
    }
  },
  {
    path: '/costs',
    redirect: async (to) => {
      const authStore = useAuthStore()
      if (authStore.isAuthenticated && !authStore.user) {
        await authStore.fetchCurrentUser()
      }
      const slug = authStore.user?.workspace?.slug
      if (slug) {
        return `/${slug}/costs`
      }
      return '/login'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // If authenticated but user data not loaded, fetch it first
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchCurrentUser()
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/signup') && authStore.isAuthenticated) {
    // Redirect to workspace dashboard - ensure we have the slug
    const slug = authStore.user?.workspace?.slug
    if (!slug) {
      // If no slug, fetch user data first
      await authStore.fetchCurrentUser()
      const finalSlug = authStore.user?.workspace?.slug
      if (finalSlug) {
        next(`/${finalSlug}`)
      } else {
        // Fallback - should not happen, but handle gracefully
        console.error('No workspace slug found')
        next('/login')
      }
    } else {
      next(`/${slug}`)
    }
  } else if (to.params.workspaceSlug && authStore.isAuthenticated) {
    // Verify workspace slug matches user's workspace
    const userSlug = authStore.user?.workspace?.slug
    if (!userSlug) {
      // Fetch user data if not available
      await authStore.fetchCurrentUser()
      const finalSlug = authStore.user?.workspace?.slug
      if (finalSlug && to.params.workspaceSlug !== finalSlug) {
        next(`/${finalSlug}${to.path.split('/').slice(2).join('/') || ''}`)
      } else {
        next()
      }
    } else if (userSlug && to.params.workspaceSlug !== userSlug) {
      // Wrong workspace, redirect to correct one
      const currentPath = to.path.split('/').slice(2).join('/')
      next(`/${userSlug}${currentPath ? '/' + currentPath : ''}`)
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router

