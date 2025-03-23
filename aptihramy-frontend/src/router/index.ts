// Composables
import EditPage from '@/pages/EditPage.vue'
import { parseTupleString } from '@/core/utils'
import HomePage from '../pages/HomePage.vue'
import TrackingChain from '@/pages/TrackingChain.vue'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router' // Correct import for createRouter
import EditPageTest from '@/pages/EditPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage,
  },
  {
    path: '/tracking-chain/:trackerID_1/:trackerID_2',
    name: 'TrackingChain',
    component: TrackingChain,
    props: true
  },
  {
    path: '/edit-page/:trackedPersonIndex',
    name: 'EditPage',
    component: EditPageTest,
    props: (route) => ({ trackedPersonIndex: Number(route.params.trackedPersonIndex) }),
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
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
