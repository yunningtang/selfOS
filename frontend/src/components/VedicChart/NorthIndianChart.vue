<script setup lang="ts">
import { computed } from 'vue'
import { GRAHAS, SIGNS } from '@/data/lexicon'

type GrahaId = keyof typeof GRAHAS

/** North Indian format: houses fixed (1st at top centre, counter-clockwise), sign numbers rotate. */
const props = defineProps<{
  ascendant: number
  placements: Record<string, number>
  retro?: Record<string, boolean>
  title: string
}>()

const S = 400
// Polygons for houses 1–12 and the anchor for each house's sign number.
const HOUSES: { pts: [number, number][]; label: [number, number]; num: [number, number] }[] = [
  { pts: [[200, 0], [300, 100], [200, 200], [100, 100]], label: [200, 92], num: [200, 175] },
  { pts: [[0, 0], [200, 0], [100, 100]], label: [100, 38], num: [100, 82] },
  { pts: [[0, 0], [100, 100], [0, 200]], label: [36, 100], num: [80, 100] },
  { pts: [[0, 200], [100, 100], [200, 200], [100, 300]], label: [92, 200], num: [175, 200] },
  { pts: [[0, 200], [100, 300], [0, 400]], label: [36, 300], num: [80, 300] },
  { pts: [[0, 400], [100, 300], [200, 400]], label: [100, 366], num: [100, 322] },
  { pts: [[200, 400], [100, 300], [200, 200], [300, 300]], label: [200, 312], num: [200, 228] },
  { pts: [[200, 400], [300, 300], [400, 400]], label: [300, 366], num: [300, 322] },
  { pts: [[400, 400], [300, 300], [400, 200]], label: [364, 300], num: [320, 300] },
  { pts: [[400, 200], [300, 300], [200, 200], [300, 100]], label: [308, 200], num: [225, 200] },
  { pts: [[400, 200], [300, 100], [400, 0]], label: [364, 100], num: [320, 100] },
  { pts: [[400, 0], [300, 100], [200, 0]], label: [300, 38], num: [300, 82] },
]

const houses = computed(() =>
  HOUSES.map((h, i) => {
    const sign = (props.ascendant + i) % 12
    const grahas = (Object.entries(props.placements) as [GrahaId, number][])
      .filter(([, s]) => s === sign)
      .map(([g]) => g)
    return { ...h, house: i + 1, sign, grahas }
  }),
)
const desc = computed(() =>
  houses.value
    .filter((h) => h.grahas.length)
    .map((h) => `House ${h.house} (${SIGNS[h.sign].name}): ${h.grahas.map((g) => GRAHAS[g].name).join(', ')}`)
    .join('; '),
)
</script>

<template>
  <svg class="north" :viewBox="`-1 -1 ${S + 2} ${S + 2}`" role="img" :aria-label="`${title}, North Indian format. ${desc}`">
    <rect x="0" y="0" :width="S" :height="S" rx="10" class="frame" />
    <g v-for="h in houses" :key="h.house" :class="{ asc: h.house === 1 }">
      <polygon :points="h.pts.map((p) => p.join(',')).join(' ')" class="house">
        <title>House {{ h.house }} · {{ SIGNS[h.sign].name }}</title>
      </polygon>
      <text :x="h.num[0]" :y="h.num[1]" class="num" text-anchor="middle" dominant-baseline="middle">{{ h.sign + 1 }}</text>
      <text :x="h.label[0]" :y="h.label[1]" class="gr" text-anchor="middle" dominant-baseline="middle">
        <tspan v-for="(g, i) in h.grahas" :key="g" :dx="i ? 6 : 0">{{ g }}<tspan v-if="retro?.[g]" class="r" dy="-5">R</tspan><tspan v-if="retro?.[g]" dy="5"></tspan></tspan>
      </text>
    </g>
    <text x="200" y="64" class="asc-label" text-anchor="middle">Asc</text>
  </svg>
</template>

<style scoped>
.north {
  width: 100%;
  aspect-ratio: 1;
  font-family: var(--font-sans);
}
.frame {
  fill: var(--surface-sunken);
  stroke: var(--hairline-3);
}
.house {
  fill: transparent;
  stroke: var(--hairline-3);
  stroke-width: 1;
  transition: fill var(--dur-fast);
}
.house:hover {
  fill: var(--accent-soft);
}
.asc .house {
  fill: color-mix(in srgb, var(--c-lavender) 9%, transparent);
}
.num {
  font-size: 12px;
  fill: var(--text-3);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}
.gr {
  font-size: 14px;
  font-weight: 500;
  fill: var(--text);
  pointer-events: none;
}
.r {
  font-size: 9px;
  fill: var(--text-2);
}
.asc-label {
  font-size: 11px;
  font-weight: 500;
  fill: var(--accent-ink);
}
</style>
