// Composables
import HomePage from '../pages/HomePage.vue'
import TrackingChain from '@/pages/TrackingChain.vue'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router' // Correct import for createRouter
import EditPage from '@/pages/EditPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import { useErrorMessagesStore } from '@/core/stores/errorMessages'
import UploadDownloadPage from '@/pages/UploadDownloadPage.vue'
import UsersPage from '@/pages/UsersPage.vue'
import UpdatesPage from '@/pages/UpdatesPage.vue'
import { checkDiskDataStatus } from '@/core/api/disk'
import { checkToken } from '@/core/api/auth'
import { fetchCurrentUserInformation } from '@/core/api/users'

async function isSuperUser() {
  const errorMessageStore = useErrorMessagesStore();
  try {
    const userInfo = await fetchCurrentUserInformation()
    return userInfo.is_superuser

  } catch (error) {
    errorMessageStore.handleError(error)
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'LoginPage',
    component: LoginPage,
  },
  {
    path: '/',
    name: 'UploadDownloadPage',
    component: UploadDownloadPage,
    meta: { requiresAuth: true },
    beforeEnter: async (to, from) => {
      if (from.name === "LoginPage" || from.fullPath === "UploadPage") {
        const databaseStatus = await checkDiskDataStatus();
        if (databaseStatus.ready) {
          return "/home"
        }
      }
      return true
    },
  },
  {
    path: '/home',
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
    path: '/edit/:trackerID',
    name: 'EditPage',
    component: EditPage,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'UsersPage',
    component: UsersPage,
    props: true,
    meta: { requiresAuth: true },
    beforeEnter: async (to, from) => {
      return isSuperUser()
    },
  },
  {
    path: '/updates',
    name: 'UpdatesPage',
    component: UpdatesPage,
    props: true,
    meta: { requiresAuth: true },
    beforeEnter: async (to, from) => {
      return isSuperUser()
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
