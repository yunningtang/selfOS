<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import LiquidOrb from '@/components/ambient/LiquidOrb.vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqIcon from '@/components/ui/LqIcon.vue'
import { FOUR_WORLDS } from '@/data/lexicon'
import { useGraphStore } from '@/stores/graph'
import { useSimulationStore } from '@/stores/simulation'
import { useReportStore } from '@/stores/report'
import { useDivinationStore } from '@/stores/divination'

const graph = useGraphStore()
const sim = useSimulationStore()
const reports = useReportStore()
const div = useDivinationStore()
const { build, intent } = storeToRefs(graph)
const { ready, birth, bazi } = storeToRefs(div)

onMounted(() => graph.loadMemories())

const status = computed(() => ({
  atzilut: build.value ? `图谱中有 ${build.value.entities} 个实体` : intent.value ? '已设定意图' : '尚未播种',
  beria: ready.value ? `已有命盘${bazi.value ? ' · ' + bazi.value.pillars.map((p) => p.stemChar + p.branchChar).join(' ') : ''}` : '尚未输入出生信息',
  yetzirah: sim.status?.state === 'running' ? `第 ${sim.status.round} / ${sim.status.totalRounds} 轮` : sim.status?.state === 'complete' ? '上次推演已完成' : '议会静默中',
  assiya: reports.reports.length ? `${reports.reports.length} 份报告` : '还没有报告',
}))
const pad = (n: number) => String(n).padStart(2, '0')
const profileLine = computed(() => {
  const b = birth.value
  return `${b.name ? b.name + ' · ' : ''}${b.calendar === 'lunar' ? '农历 ' : ''}${b.year}-${pad(b.month)}-${pad(b.day)} ${pad(b.hour)}:${pad(b.minute)} · ${b.place || `${b.latitude}, ${b.longitude}`}`
})

const STEPS = [
  { n: '01', title: '输入出生时刻', text: '日期、时间、出生地。公历农历皆可，地点自动匹配经纬度与时区。', to: '/begin' },
  { n: '02', title: '排出四套命盘', text: '八字、紫微斗数、西方占星、Jyotish，由瑞士星历在本地精算。', to: '/celestial' },
  { n: '03', title: '阅读分析', text: '断语、格局、喜用神、五行与十神强弱，每一条都标明推断依据。', to: '/celestial' },
  { n: '04', title: '写入先天记忆', text: '把先天参数注入内在图谱，再进入议会推演与自性化报告。', to: '/atlas' },
]
</script>

<template>
  <section class="threshold" aria-labelledby="th-title">
    <div class="hero">
      <div class="orb-wrap" aria-hidden="true">
        <LiquidOrb :material="{ base: '#E7EAF3', depth: '#8C80CC', variant: 'liquid' }" :size="220" :intensity="0.65" />
        <span class="orbit o1 ambient-anim"><LiquidOrb :material="{ base: '#A8C8E0', depth: '#4D6A88', variant: 'liquid' }" :size="26" :intensity="0.4" /></span>
        <span class="orbit o2 ambient-anim"><LiquidOrb :material="{ base: '#A2CDBB', depth: '#4E7E6A', variant: 'liquid' }" :size="18" :intensity="0.4" /></span>
        <span class="orbit o3 ambient-anim"><LiquidOrb :material="{ base: '#6E6790', depth: '#1C1A2A', variant: 'diffuse' }" :size="34" :intensity="0.5" /></span>
      </div>
      <div class="words">
        <p class="t-label eyebrow">selfOS · 内在心灵的数字加速器</p>
        <h1 id="th-title">内在世界的观测台</h1>
        <p class="lede">把记忆、原型与先天命理放进同一个活的结构里：不只看见你「是什么」，更看见「为什么」。</p>
        <p class="quote t-muted">An observatory for the inner world. 理解「为什么」比知道「是什么」更有决策价值。</p>
        <div class="cta">
          <template v-if="ready">
            <RouterLink to="/celestial" custom v-slot="{ navigate }"><LqButton variant="primary" icon="celestial" @click="navigate">查看我的命盘</LqButton></RouterLink>
            <RouterLink to="/begin" custom v-slot="{ navigate }"><LqButton variant="ghost" @click="navigate">修改出生信息</LqButton></RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/begin" custom v-slot="{ navigate }"><LqButton variant="primary" icon="celestial" @click="navigate">开始：输入出生信息</LqButton></RouterLink>
            <RouterLink to="/atlas" custom v-slot="{ navigate }"><LqButton variant="ghost" @click="navigate">先看看示例图谱</LqButton></RouterLink>
          </template>
        </div>
        <p v-if="ready" class="t-caption t-num profile">{{ profileLine }}</p>
      </div>
    </div>

    <ol class="steps" aria-label="使用步骤">
      <li v-for="(s, i) in STEPS" :key="s.n" class="step lq-surface" :class="{ done: ready && i === 0 }">
        <RouterLink :to="s.to">
          <span class="s-n t-num">{{ s.n }}</span>
          <span class="s-title">{{ s.title }}</span>
          <span class="s-text">{{ s.text }}</span>
        </RouterLink>
      </li>
    </ol>

    <nav class="worlds" aria-label="四界">
      <p class="t-label worlds-label">四界 · 从意志到显化</p>
      <div class="cards">
        <RouterLink v-for="(w, i) in FOUR_WORLDS" :key="w.key" :to="w.route" class="world lq-glass">
          <span class="w-top">
            <span class="t-num idx">{{ i + 1 }}</span>
            <span class="t-label">{{ w.theme }}</span>
          </span>
          <span class="w-name">{{ w.zh }} <span class="en">{{ w.name }}</span></span>
          <span class="w-action">{{ w.action }}</span>
          <span class="w-status t-sm t-num">{{ status[w.key] }}</span>
          <LqIcon class="arrow" name="chevron" :size="18" />
        </RouterLink>
      </div>
    </nav>
  </section>
</template>

<style scoped>
.threshold {
  display: grid;
  gap: var(--sp-8);
  padding-top: var(--sp-6);
}
.hero {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: var(--sp-8);
  align-items: center;
}
.orb-wrap {
  position: relative;
  display: grid;
  place-items: center;
  height: 320px;
}
.orbit {
  position: absolute;
  inset: 0;
  display: grid;
  justify-items: center;
  animation: lq-iris-turn 70s linear infinite;
}
.o1 {
  inset: 10px;
}
.o2 {
  inset: 34px;
  animation-duration: 52s;
  animation-direction: reverse;
}
.o3 {
  inset: 0;
  animation-duration: 95s;
  animation-delay: -40s;
}
.words {
  display: grid;
  gap: var(--sp-4);
  max-width: 58ch;
}
.eyebrow {
  color: var(--accent-ink);
}
.words h1 {
  font-size: clamp(1.875rem, 3.2vw, 2.5rem);
}
.lede {
  font-size: var(--fs-md);
  line-height: var(--lh-body);
  color: var(--text-2);
}
.quote {
  font-size: var(--fs-sm);
}
.cta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  padding-top: var(--sp-2);
}
.profile {
  margin-top: calc(-1 * var(--sp-2));
}
.steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sp-3);
}
.step a {
  display: grid;
  gap: var(--sp-2);
  height: 100%;
  padding: var(--sp-4) var(--sp-5);
  border-radius: var(--r-lg);
  color: var(--text);
  text-decoration: none;
  transition: transform var(--dur-slow) var(--ease-spring), background-color var(--dur-fast);
}
.step:hover a {
  transform: translateY(-2px);
}
.step.done .s-n {
  color: var(--wx-wood);
}
.s-n {
  font-size: var(--fs-xs);
  color: var(--accent-ink);
}
.s-title {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}
.s-text {
  font-size: var(--fs-sm);
  color: var(--text-2);
  line-height: var(--lh-snug);
}
.worlds {
  display: grid;
  gap: var(--sp-3);
}
.cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sp-4);
}
.world {
  position: relative;
  display: grid;
  gap: var(--sp-2);
  padding: var(--sp-5);
  color: var(--text);
  text-decoration: none;
  transition: transform var(--dur-slow) var(--ease-spring);
}
.world:hover {
  transform: translateY(-3px);
}
.world:active {
  transform: scale(0.98);
}
.w-top {
  display: flex;
  justify-content: space-between;
}
.idx {
  font-size: var(--fs-xs);
  color: var(--text-3);
}
.w-name {
  font-size: var(--fs-lg);
  font-weight: var(--fw-medium);
}
.en {
  font-size: var(--fs-sm);
  color: var(--text-2);
  font-weight: var(--fw-regular);
}
.w-action {
  font-size: var(--fs-sm);
  color: var(--text-2);
  min-height: 2.8em;
  line-height: var(--lh-snug);
}
.w-status {
  padding-top: var(--sp-3);
  border-top: 1px solid var(--hairline);
  color: var(--text-2);
}
.arrow {
  position: absolute;
  right: var(--sp-4);
  bottom: var(--sp-5);
  color: var(--text-3);
  transition: transform var(--dur-base) var(--ease-spring), color var(--dur-fast);
}
.world:hover .arrow {
  transform: translateX(3px);
  color: var(--text);
}
@media (max-width: 1100px) {
  .cards,
  .steps {
    grid-template-columns: 1fr 1fr;
  }
  .hero {
    grid-template-columns: 240px 1fr;
  }
  .orb-wrap {
    height: 240px;
    transform: scale(0.75);
  }
}
@media (max-width: 640px) {
  .hero {
    grid-template-columns: 1fr;
    gap: var(--sp-2);
  }
  .orb-wrap {
    height: 200px;
    transform: scale(0.62);
  }
  .cards,
  .steps {
    grid-template-columns: 1fr;
  }
}
</style>
