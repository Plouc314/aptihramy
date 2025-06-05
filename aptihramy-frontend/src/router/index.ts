// Composables
import HomePage from '../pages/HomePage.vue'
import TrackingChain from '@/pages/TrackingChain.vue'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router' // Correct import for createRouter
import EditPage from '@/pages/EditPage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import { getToken } from '@/core/auth'
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'LoginPage',
    component: LoginPage,
  },
  {
    path: '/',
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

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!getToken()

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})
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
