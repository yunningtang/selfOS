<script setup lang="ts">
import { computed } from 'vue'

/**
 * Energy travelling along one Tree of Life path.
 * Motion encodes speed and direction; a mid-path chevron encodes direction for still mode too.
 */
const props = defineProps<{
  x1: number
  y1: number
  x2: number
  y2: number
  /** −1…1 */
  flow: number
  /** 0–1 */
  weight: number
  stagnant?: boolean
  emphasis?: 'none' | 'dim' | 'active'
  /** Draw a mid-path chevron (always on in still mode, where motion can't show direction) */
  showDirection?: boolean
}>()

const mag = computed(() => Math.min(1, Math.abs(props.flow)))
const angle = computed(() => {
  const a = (Math.atan2(props.y2 - props.y1, props.x2 - props.x1) * 180) / Math.PI
  return props.flow < 0 ? a + 180 : a
})
const mid = computed(() => ({ x: (props.x1 + props.x2) / 2, y: (props.y1 + props.y2) / 2 }))
const style = computed(() => ({
  '--flow-to': props.flow >= 0 ? '-72' : '72',
  animationDuration: `${(10 - mag.value * 7).toFixed(2)}s`,
  opacity: 0.3 + props.weight * 0.6,
  strokeWidth: 1.6 + mag.value * 1.6,
}))
</script>

<template>
  <g class="energy" :class="[`e-${emphasis ?? 'none'}`, { stagnant }]">
    <line class="bed" :x1="x1" :y1="y1" :x2="x2" :y2="y2" />
    <line class="stream ambient-anim" :x1="x1" :y1="y1" :x2="x2" :y2="y2" :style="style" />
    <g v-if="showDirection && mag > 0.12" class="chevron" :transform="`translate(${mid.x} ${mid.y}) rotate(${angle})`">
      <path d="M-3.5 -4 L2.5 0 L-3.5 4" />
    </g>
    <circle v-if="stagnant" class="knot" :cx="mid.x" :cy="mid.y" r="3.5" />
  </g>
</template>

<style scoped>
.energy {
  transition: opacity var(--dur-slow) var(--ease-out);
}
.bed {
  stroke: var(--hairline-3);
  stroke-width: 1;
  stroke-linecap: round;
}
.stream {
  stroke: var(--c-mist);
  stroke-linecap: round;
  /* Light motes rather than dashes: zero-length segments with round caps. */
  stroke-dasharray: 0 18;
  animation: lq-flow linear infinite;
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--c-mist) 70%, transparent));
}
.chevron path {
  fill: none;
  stroke: var(--text-2);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.stagnant .stream {
  stroke: var(--tension);
  stroke-dasharray: 0 9;
  animation-duration: 22s !important;
}
.knot {
  fill: var(--bg);
  stroke: var(--tension);
  stroke-width: 1.2;
}
.e-dim {
  opacity: 0.22;
}
.e-active .bed {
  stroke: color-mix(in srgb, var(--c-lavender) 55%, transparent);
  stroke-width: 1.5;
}
.e-active .stream {
  stroke: var(--c-pearl);
}
.e-active .chevron path {
  stroke: var(--text);
}
</style>
