import { createRouter, createWebHashHistory } from 'vue-router'
import { locale } from '@/i18n'

export const router = createRouter({
  // Hash history: the site lives under a sub-path of the selfOS Pages site, which has no per-folder 404 fallback.
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('~/views/HomeView.vue') },
    { path: '/begin', name: 'begin', component: () => import('~/views/BeginView.vue') },
    { path: '/chart', name: 'chart', component: () => import('~/views/ChartView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.afterEach((to) => {
  const en = locale.value === 'en'
  const names: Record<string, [string, string]> = { home: ['命盘', 'Charts'], begin: ['出生信息', 'Birth data'], chart: ['排盘与分析', 'Charts and analysis'] }
  const n = names[String(to.name)] ?? names.home
  document.title = `${en ? n[1] : n[0]} · ${en ? 'Destiny' : '命盘'}`
})
