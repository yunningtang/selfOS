<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import LiquidOrb from '@/components/ambient/LiquidOrb.vue'
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
const { memories, build, intent } = storeToRefs(graph)

onMounted(() => graph.loadMemories())

const status = computed(() => ({
  atzilut: build.value ? `${build.value.entities} entities in the graph` : intent.value ? 'Intent set' : 'Not yet seeded',
  beria: `${memories.value.length} memories${div.bazi ? ' · charts cast' : ''}`,
  yetzirah: sim.status?.state === 'running' ? `Round ${sim.status.round} of ${sim.status.totalRounds}` : sim.status?.state === 'complete' ? 'Last run complete' : 'Council at rest',
  assiya: reports.reports.length ? `${reports.reports.length} report${reports.reports.length > 1 ? 's' : ''}` : 'No reports yet',
}))
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
        <h1 id="th-title">An observatory for the inner world.</h1>
        <p class="lede">
          Memories, archetypes and innate patterns, held as one living structure — so you can see not only <em>what</em> you are, but <em>why</em>.
        </p>
        <p class="quote t-muted">“理解‘为什么’比知道‘是什么’更有决策价值。”</p>
      </div>
    </div>

    <nav class="worlds" aria-label="The four worlds">
      <RouterLink v-for="(w, i) in FOUR_WORLDS" :key="w.key" :to="w.route" class="world lq-glass">
        <span class="w-top">
          <span class="t-num idx">{{ i + 1 }}</span>
          <span class="t-label">{{ w.theme }}</span>
        </span>
        <span class="w-name">{{ w.name }} <span class="t-cjk zh">{{ w.zh }}</span></span>
        <span class="w-action">{{ w.action }}</span>
        <span class="w-status t-sm t-num">{{ status[w.key] }}</span>
        <LqIcon class="arrow" name="chevron" :size="18" />
      </RouterLink>
    </nav>
  </section>
</template>

<style scoped>
.threshold {
  display: grid;
  gap: var(--sp-9);
  padding-top: var(--sp-6);
}
.hero {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: var(--sp-8);
  align-items: center;
}
.orb-wrap {
  position: relative;
  display: grid;
  place-items: center;
  height: 340px;
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
  max-width: 56ch;
}
.eyebrow {
  color: var(--accent-ink);
}
.words h1 {
  font-size: clamp(1.875rem, 3.2vw, 2.5rem);
  letter-spacing: -0.022em;
}
.lede {
  font-size: var(--fs-md);
  line-height: var(--lh-body);
  color: var(--text-2);
}
.lede em {
  font-style: normal;
  color: var(--text);
}
.quote {
  font-size: var(--fs-sm);
}
.worlds {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sp-4);
}
.world {
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
.zh {
  font-size: var(--fs-sm);
  color: var(--text-2);
  font-weight: var(--fw-regular);
}
.w-action {
  font-size: var(--fs-sm);
  color: var(--text-2);
  min-height: 2.8em;
}
.w-status {
  padding-top: var(--sp-3);
  border-top: 1px solid var(--hairline);
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
  .worlds {
    grid-template-columns: 1fr 1fr;
  }
  .hero {
    grid-template-columns: 260px 1fr;
  }
  .orb-wrap {
    height: 260px;
    transform: scale(0.8);
  }
}
@media (max-width: 640px) {
  .hero {
    grid-template-columns: 1fr;
    gap: var(--sp-4);
  }
  .orb-wrap {
    height: 220px;
    transform: scale(0.7);
  }
  .worlds {
    grid-template-columns: 1fr;
  }
}
</style>
