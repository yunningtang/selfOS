<script setup lang="ts">
import { computed } from 'vue'
import { SIGNS, type BodyId } from '@/engines/western/tables'
import { norm } from '@/engines/ephemeris/swe'
import type { WesternChart } from '@/types'

/**
 * Natal wheel: Ascendant on the left, houses counter-clockwise, signs on the outer ring,
 * planets on the middle ring, aspects drawn inside. Pure SVG, scales to its container.
 */
const props = defineProps<{ chart: WesternChart; highlight?: BodyId | null }>()
const emit = defineEmits<{ select: [id: BodyId | null] }>()

const R = 100
const cx = 0, cy = 0
const toAngle = (lon: number) => ((180 - (lon - props.chart.angles.asc)) * Math.PI) / 180
const pt = (lon: number, r: number) => ({ x: cx + r * Math.cos(toAngle(lon)), y: cy - r * Math.sin(toAngle(lon)) })

const signSegments = computed(() =>
  SIGNS.map((s, i) => {
    const a = pt(i * 30, R), b = pt(i * 30 + 30, R)
    const a2 = pt(i * 30, R * 0.88), b2 = pt(i * 30 + 30, R * 0.88)
    const mid = pt(i * 30 + 15, R * 0.94)
    return { i, s, d: `M${a.x} ${a.y} A${R} ${R} 0 0 0 ${b.x} ${b.y} L${b2.x} ${b2.y} A${R * 0.88} ${R * 0.88} 0 0 1 ${a2.x} ${a2.y} Z`, mid }
  }),
)
const ticks = computed(() => {
  const out: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = []
  for (let d = 0; d < 360; d += 5) {
    const major = d % 10 === 0
    const a = pt(d, R * 0.88), b = pt(d, R * (major ? 0.85 : 0.865))
    out.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, major })
  }
  return out
})
const cusps = computed(() =>
  props.chart.houses.map((h) => {
    const inner = pt(h.lon, R * 0.42), outer = pt(h.lon, R * 0.85)
    const next = props.chart.houses[h.n % 12]
    const midLon = norm(h.lon + norm(next.lon - h.lon) / 2)
    const lab = pt(midLon, R * 0.47)
    return { n: h.n, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, lab, angle: h.n === 1 || h.n === 4 || h.n === 7 || h.n === 10 }
  }),
)

/** Planet glyph positions with simple collision spreading. */
const placed = computed(() => {
  const shown = props.chart.bodies.filter((b) => b.kind !== 'angle' || b.id === 'asc' || b.id === 'mc')
  const items = shown.map((b) => ({ b, lon: b.lon, disp: b.lon })).sort((x, y) => norm(x.lon - props.chart.angles.asc) - norm(y.lon - props.chart.angles.asc))
  const MIN = 7
  for (let pass = 0; pass < 4; pass++)
    for (let i = 1; i < items.length; i++) {
      const gap = norm(items[i].disp - items[i - 1].disp)
      if (gap < MIN) items[i].disp = norm(items[i - 1].disp + MIN)
    }
  return items.map(({ b, lon, disp }) => {
    const g = pt(disp, R * 0.72)
    const tick = pt(lon, R * 0.85)
    const tickIn = pt(lon, R * 0.81)
    const deg = pt(disp, R * 0.62)
    return { b, g, tick, tickIn, deg, degText: `${Math.floor(b.signDeg)}°` }
  })
})
const aspectLines = computed(() =>
  props.chart.aspects
    .filter((a) => a.def.major)
    .map((a) => {
      const A = props.chart.bodies.find((b) => b.id === a.a)!
      const B = props.chart.bodies.find((b) => b.id === a.b)!
      const p1 = pt(A.lon, R * 0.4), p2 = pt(B.lon, R * 0.4)
      const dim = props.highlight && a.a !== props.highlight && a.b !== props.highlight
      return { a, p1, p2, dim, w: 0.25 + a.strength * 0.55 }
    }),
)
const elementTone: Record<string, string> = { fire: 'var(--clay-ink)', earth: 'var(--el-earth)', air: 'var(--accent-ink)', water: 'var(--mist-ink)' }
</script>

<template>
  <svg class="wheel" viewBox="-104 -104 208 208" role="img" aria-label="Natal chart wheel">
    <circle :r="R" class="ring-out" />
    <circle :r="R * 0.88" class="ring" />
    <circle :r="R * 0.85" class="ring-thin" />
    <circle :r="R * 0.42" class="ring" />
    <circle :r="R * 0.4" class="disc" />

    <g class="signs">
      <path v-for="s in signSegments" :key="s.i" :d="s.d" />
      <text v-for="s in signSegments" :key="'t' + s.i" :x="s.mid.x" :y="s.mid.y" class="sign-glyph" :style="{ fill: elementTone[s.s.element] }" text-anchor="middle" dominant-baseline="central">{{ s.s.glyph }}</text>
    </g>
    <g class="ticks">
      <line v-for="(t, i) in ticks" :key="i" :x1="t.x1" :y1="t.y1" :x2="t.x2" :y2="t.y2" :class="{ major: t.major }" />
    </g>
    <g class="cusps">
      <line v-for="c in cusps" :key="c.n" :x1="c.x1" :y1="c.y1" :x2="c.x2" :y2="c.y2" :class="{ angle: c.angle }" />
      <text v-for="c in cusps" :key="'n' + c.n" :x="c.lab.x" :y="c.lab.y" class="house-num" text-anchor="middle" dominant-baseline="central">{{ c.n }}</text>
    </g>
    <g class="aspects">
      <line
        v-for="(l, i) in aspectLines"
        :key="i"
        :x1="l.p1.x" :y1="l.p1.y" :x2="l.p2.x" :y2="l.p2.y"
        :class="[l.a.def.tone, { dim: l.dim }]"
        :style="{ strokeWidth: l.w }"
      />
    </g>
    <g class="planets">
      <g
        v-for="p in placed"
        :key="p.b.id"
        class="planet"
        :class="{ hi: highlight === p.b.id, retro: p.b.retrograde }"
        role="button"
        tabindex="0"
        :aria-label="`${p.b.en} ${p.degText} ${SIGNS[p.b.sign].en}`"
        @click="emit('select', highlight === p.b.id ? null : p.b.id)"
        @keydown.enter="emit('select', p.b.id)"
      >
        <line :x1="p.tick.x" :y1="p.tick.y" :x2="p.tickIn.x" :y2="p.tickIn.y" class="ptick" />
        <circle :cx="p.g.x" :cy="p.g.y" r="5.2" class="halo" />
        <text :x="p.g.x" :y="p.g.y" class="pglyph" text-anchor="middle" dominant-baseline="central">{{ p.b.glyph }}</text>
        <text :x="p.deg.x" :y="p.deg.y" class="pdeg" text-anchor="middle" dominant-baseline="central">{{ p.degText }}<tspan v-if="p.b.retrograde" class="r">R</tspan></text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.wheel {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  font-family: var(--font-sans);
  user-select: none;
}
.ring-out {
  fill: var(--surface);
  stroke: var(--hairline-2);
  stroke-width: 0.4;
}
.ring {
  fill: none;
  stroke: var(--hairline-3);
  stroke-width: 0.5;
}
.ring-thin {
  fill: none;
  stroke: var(--hairline-2);
  stroke-width: 0.3;
}
.disc {
  fill: var(--surface-sunken);
  stroke: none;
}
.signs path {
  fill: var(--surface-sunken);
  stroke: var(--hairline-2);
  stroke-width: 0.3;
}
.sign-glyph {
  font-size: 6.5px;
  opacity: 0.9;
}
.ticks line {
  stroke: var(--hairline-3);
  stroke-width: 0.35;
}
.ticks line.major {
  stroke-width: 0.5;
}
.cusps line {
  stroke: var(--hairline-3);
  stroke-width: 0.4;
}
.cusps line.angle {
  stroke: var(--text-2);
  stroke-width: 0.8;
}
.house-num {
  font-size: 4.2px;
  fill: var(--text-3);
  font-variant-numeric: tabular-nums;
}
.aspects line {
  stroke-linecap: round;
  opacity: 0.55;
  transition: opacity var(--dur-fast);
}
.aspects line.harmony {
  stroke: var(--harmony);
}
.aspects line.tension {
  stroke: var(--tension);
}
.aspects line.neutral {
  stroke: var(--c-lavender);
}
.aspects line.dim {
  opacity: 0.1;
}
.ptick {
  stroke: var(--text-2);
  stroke-width: 0.5;
}
.halo {
  fill: var(--surface);
  stroke: var(--hairline-3);
  stroke-width: 0.4;
  transition: stroke var(--dur-fast), fill var(--dur-fast);
}
.planet {
  cursor: pointer;
  outline: none;
}
.planet:hover .halo,
.planet:focus-visible .halo,
.planet.hi .halo {
  stroke: var(--c-lavender);
  stroke-width: 0.8;
  fill: var(--accent-soft);
}
.pglyph {
  font-size: 6.4px;
  fill: var(--text);
  pointer-events: none;
}
.pdeg {
  font-size: 3.6px;
  fill: var(--text-2);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}
.r {
  fill: var(--clay-ink);
  font-size: 2.8px;
}
</style>
