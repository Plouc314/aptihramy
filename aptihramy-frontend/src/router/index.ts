// Composables
import HomePage from '../pages/HomePage.vue'
import TrackingChain from '@/pages/TrackingChain.vue'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router' // Correct import for createRouter
import EditPage from '@/pages/EditPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import { checkDiskDataStatus, checkToken, fetchCurrentUserInformation } from '@/core/api'
import { useErrorMessagesStore } from '@/core/stores/errorMessages'
import UploadPage from '@/pages/UploadPage.vue'
import UsersPage from '@/pages/UsersPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'LoginPage',
    component: LoginPage,
  },
  {
    path: '/',
    name: 'UploadPage',
    component: UploadPage,
    meta: { requiresAuth: true },
    beforeEnter: async (to, from) => {
      if (from.name === "LoginPage" || from.fullPath === "UploadPage") {
        const databaseStatus = await checkDiskDataStatus();
        if (databaseStatus.ready) {
          return "/home-page"
        }
      }
      return true
    },
  },
  {
    path: '/home-page',
    name: 'HomePage',
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/tracking-chain/:trackerID',
    name: 'TrackingChain',
    component: TrackingChain,
    props: true,
    meta: { requiresAuth: true }

  },
  {
    path: '/edit-page/:trackerID',
    name: 'EditPage',
    component: EditPage,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/users-page',
    name: 'UsersPage',
    component: UsersPage,
    props: true,
    meta: { requiresAuth: true },
    beforeEnter: async (to, from) => {
      const errorMessageStore = useErrorMessagesStore();
      try {
        const userInfo = await fetchCurrentUserInformation()
        return userInfo.is_superuser

      } catch (error) {
        errorMessageStore.handleError(error)
      }
    },
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from) => {
  const errorMessageStore = useErrorMessagesStore();

  try {
    const isAuthenticated = await checkToken();

    if (to.meta.requiresAuth && !isAuthenticated) {
      errorMessageStore.addErrorMessage('Token expired, redirecting to login page');
      return '/login';
    }
  } catch (error) {
    errorMessageStore.handleError(error)
  }
});

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err: Error | null, to: any) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
