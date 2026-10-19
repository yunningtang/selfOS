import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    zh?: string
    icon: string
    world?: 'atzilut' | 'beria' | 'yetzirah' | 'assiya'
    /** Softer atmosphere for reading-heavy views */
    quiet?: boolean
    /** Content fills the viewport (spatial views) */
    immersive?: boolean
    /** Shown in the mobile tab bar */
    primary?: boolean
    /** Not listed in navigation */
    hidden?: boolean
  }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'threshold', component: () => import('@/views/Threshold/ThresholdView.vue'), meta: { title: 'Threshold', zh: '入口', icon: 'threshold' } },
  { path: '/begin', name: 'begin', component: () => import('@/views/Begin/BeginView.vue'), meta: { title: 'Begin', zh: '出生信息', icon: 'celestial', quiet: true, hidden: true } },
  { path: '/seed', name: 'seed', component: () => import('@/views/SeedUpload/SeedUploadView.vue'), meta: { title: 'Seed', zh: '生命素材', icon: 'seed', world: 'atzilut', quiet: true } },
  { path: '/atlas', name: 'atlas', component: () => import('@/views/GraphBuilder/InnerAtlasView.vue'), meta: { title: 'Inner Atlas', zh: '生命之树', icon: 'atlas', world: 'beria', immersive: true, primary: true } },
  { path: '/memory', name: 'memory', component: () => import('@/views/MemoryChamber/MemoryChamberView.vue'), meta: { title: 'Memory Chamber', zh: '记忆之室', icon: 'memory', world: 'beria', primary: true } },
  { path: '/celestial', name: 'celestial', component: () => import('@/views/ChartCasting/CelestialEngineView.vue'), meta: { title: 'Celestial Engine', zh: '排盘', icon: 'celestial', world: 'beria', quiet: true, primary: true } },
  { path: '/council', name: 'council', component: () => import('@/views/Simulation/InnerCouncilView.vue'), meta: { title: 'Inner Council', zh: '内在议会', icon: 'council', world: 'yetzirah', primary: true } },
  { path: '/reflection', name: 'reflection', component: () => import('@/views/Report/ReflectionView.vue'), meta: { title: 'Reflection', zh: '自性化报告', icon: 'reflection', world: 'assiya', quiet: true, primary: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  // BASE_URL is '/' locally and '/selfOS/' on GitHub Pages (see VITE_BASE in the Pages workflow).
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.afterEach((to) => {
  document.title = to.meta.title === 'Threshold' ? 'selfOS · 内在世界的观测台' : `${to.meta.zh ?? to.meta.title} · selfOS`
})
