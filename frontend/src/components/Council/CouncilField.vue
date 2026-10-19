<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import LiquidOrb from '@/components/ambient/LiquidOrb.vue'
import { ARCHETYPES } from '@/data/lexicon'
import { fmtPct } from '@/composables/format'
import type { Agent, AgentRelation } from '@/types'

/**
 * The council as a spatial field: Self at the centre, other archetypes on a slow ring.
 * Relations are drawn as fine filaments — sage for alliance, clay (dashed) for opposition.
 */
const props = defineProps<{
  agents: Agent[]
  relations: AgentRelation[]
  /** Agents involved in the most recent event — they pulse briefly. */
  speaking?: string[]
}>()
const selected = defineModel<string | null>('selected', { default: null })

const ORDER = ['observer', 'creator', 'anima', 'shadow', 'ego', 'persona', 'limiter']

const placed = computed(() => {
  const ring = props.agents
    .filter((a) => a.archetype !== 'self')
    .sort((a, b) => ORDER.indexOf(a.archetype) - ORDER.indexOf(b.archetype))
  const out = new Map<string, { x: number; y: number; agent: Agent; i: number }>()
  ring.forEach((agent, i) => {
    const t = -Math.PI / 2 + (i / ring.length) * Math.PI * 2
    out.set(agent.id, { x: 50 + Math.cos(t) * 37, y: 50 + Math.sin(t) * 38, agent, i })
  })
  const self = props.agents.find((a) => a.archetype === 'self')
  if (self) out.set(self.id, { x: 50, y: 50, agent: self, i: ring.length })
  return out
})

const lines = computed(() =>
  props.relations
    .map((r) => {
      const a = placed.value.get(r.source)
      const b = placed.value.get(r.target)
      if (!a || !b) return null
      const focus = selected.value && (r.source === selected.value || r.target === selected.value)
      return { ...r, a, b, focus, dim: !!selected.value && !focus }
    })
    .filter((l) => l !== null),
)

// Orbs scale with the field so the ring never crowds on narrow screens.
const root = ref<HTMLElement | null>(null)
const scale = ref(1)
let ro: ResizeObserver | null = null
onMounted(() => {
  ro = new ResizeObserver(([e]) => (scale.value = Math.max(0.55, Math.min(1, e.contentRect.width / 720))))
  ro.observe(root.value!)
})
onBeforeUnmount(() => ro?.disconnect())
const size = (a: Agent) => Math.round((46 + a.activation * 46) * scale.value)
</script>

<template>
  <div ref="root" class="field">
    <svg class="filaments" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line
        v-for="l in lines"
        :key="`${l.source}-${l.target}`"
        :x1="l.a.x" :y1="l.a.y" :x2="l.b.x" :y2="l.b.y"
        class="filament"
        :class="{ oppose: l.tension < 0, focus: l.focus, dim: l.dim }"
        :style="{ opacity: 0.2 + Math.abs(l.tension) * 0.6, strokeWidth: 0.6 + Math.abs(l.tension) * 1.6 }"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <button
      v-for="[id, p] in placed"
      :key="id"
      type="button"
      class="agent"
      :class="[`st-${p.agent.state}`, { selected: selected === id, speaking: speaking?.includes(id) }]"
      :style="{ left: `${p.x}%`, top: `${p.y}%`, '--orb': `${size(p.agent)}px` }"
      :aria-pressed="selected === id"
      :aria-label="`${p.agent.name}, ${ARCHETYPES[p.agent.archetype].role}. Activation ${fmtPct(p.agent.activation)}, state ${p.agent.state}.`"
      @click="selected = selected === id ? null : id"
    >
      <LiquidOrb
        :material="ARCHETYPES[p.agent.archetype].material"
        :size="size(p.agent)"
        :intensity="p.agent.activation"
        :selected="selected === id"
        :tension="p.agent.state === 'conflict'"
        :phase="p.i * 1.3"
      />
      <span class="name">{{ p.agent.name }}</span>
      <span class="meta t-num">{{ fmtPct(p.agent.activation) }}<template v-if="p.agent.state !== 'active'"> · {{ p.agent.state }}</template></span>
    </button>
  </div>
</template>

<style scoped>
.field {
  position: relative;
  width: 100%;
  aspect-ratio: 1.25;
  min-height: 380px;
  max-height: 620px;
}
.filaments {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.filament {
  stroke: var(--harmony);
  stroke-linecap: round;
  transition: opacity var(--dur-slow) var(--ease-out);
}
.filament.oppose {
  stroke: var(--tension);
  stroke-dasharray: 2 5;
}
.filament.focus {
  opacity: 0.95 !important;
}
.filament.dim {
  opacity: 0.08 !important;
}
.agent {
  position: absolute;
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: var(--sp-2);
  border: 0;
  border-radius: var(--r-lg);
  background: none;
  transform: var(--anchor);
  --anchor: translate(-50%, calc(var(--orb) / -2 - var(--sp-2)));
  transition: transform var(--dur-base) var(--ease-spring);
}
.agent:hover {
  transform: var(--anchor) scale(1.04);
}
.agent:active {
  transform: var(--anchor) scale(0.97);
}
.agent:focus-visible {
  outline-offset: 0;
}
.name {
  margin-top: 6px;
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  white-space: nowrap;
}
.name,
.meta {
  text-shadow: 0 0 8px var(--bg), 0 0 3px var(--bg);
}
.meta {
  font-size: var(--fs-xs);
  color: var(--text-2);
  white-space: nowrap;
}
.st-conflict .meta {
  color: var(--clay-ink);
}
.st-integrating .meta {
  color: var(--sage-ink);
}
.speaking :deep(.halo) {
  opacity: 0.85;
}
@media (max-width: 640px) {
  .field {
    aspect-ratio: 0.9;
    min-height: 340px;
    margin-bottom: var(--sp-5);
  }
  .name {
    font-size: var(--fs-xs);
  }
}
</style>
