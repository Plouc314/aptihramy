// Composables
import HomePage from '../pages/HomePage.vue'
import TrackingChain from '@/pages/TrackingChain.vue'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router' // Correct import for createRouter
import EditPage from '@/pages/EditPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import { getToken } from '@/core/auth'
import { checkDiskDataStatus, checkToken } from '@/core/api'
import { useErrorMessagesStore } from '@/core/stores/errorMessages'
import UploadPage from '@/pages/UploadPage.vue'
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
    meta: { requiresAuth: true }
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
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const errorMessageStore = useErrorMessagesStore();

  try {
    const isAuthenticated = await checkToken();

    if (to.meta.requiresAuth && !isAuthenticated) {
      errorMessageStore.addErrorMessage('Token expired, redirecting to login page');
      return next('/login');
    }

    // First time opening the web site
    if (from.fullPath === '/' && to.fullPath === '/' && isAuthenticated) {
      const databaseStatus = await checkDiskDataStatus();

      if (databaseStatus.ready) {
        return next('/home-page');
      }
    }

    next(); // default proceed
  } catch (error) {
    // Handle any unexpected errors, optionally show message or log
    errorMessageStore.addErrorMessage('An unexpected error occurred during navigation.');
    console.error('Router guard error:', error);
    next(false); // Cancel navigation on error
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
