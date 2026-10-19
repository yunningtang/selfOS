<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { select } from 'd3-selection'
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import 'd3-transition'
import { PATHS, SEPHIROTH, otherEnd, pathsOf } from '@/data/sephiroth'
import { useReducedMotion } from '@/composables/useReducedMotion'
import EnergyFlow from '@/components/EnergyFlow/EnergyFlow.vue'
import type { SephirahId, SephirothState } from '@/types'

/**
 * Inner Atlas — the ten sephiroth and 22 paths as a navigable spatial map.
 * Rendering is declarative SVG (Vue); d3-zoom only provides pan / zoom / pinch.
 * Keyboard: arrow keys move between connected nodes, Enter selects, Esc clears, +/− zoom.
 */
const props = defineProps<{
  state: SephirothState | null
  showFlow?: boolean
  /** Space covered by floating panels, so the tree is fitted into the visible region */
  inset?: { top: number; right: number; bottom: number; left: number }
}>()
const selected = defineModel<SephirahId | null>('selected', { default: null })
const selectedPath = defineModel<number | null>('selectedPath', { default: null })

const UX = 150
const UY = 88
const R = 24
const TREE_H = 8.1 * UY

const reduced = useReducedMotion()
const svgRef = ref<SVGSVGElement | null>(null)
const transform = ref<ZoomTransform>(zoomIdentity)
const size = ref({ w: 800, h: 700 })
const focusId = ref<SephirahId>('tiphereth')
let zoomer: ZoomBehavior<SVGSVGElement, unknown> | null = null
let ro: ResizeObserver | null = null
let userMoved = false

const energy = computed(() => {
  const m = new Map<SephirahId, number>()
  props.state?.nodes.forEach((n) => m.set(n.id, n.energy))
  return m
})
const pathState = computed(() => new Map(props.state?.paths.map((p) => [p.id, p]) ?? []))

const nodes = computed(() =>
  SEPHIROTH.map((s) => ({ ...s, px: s.x * UX, py: s.y * UY, energy: energy.value.get(s.id) ?? 0.4 })),
)
const pos = computed(() => new Map(nodes.value.map((n) => [n.id, n])))

const neighbours = computed(() => {
  if (!selected.value) return null
  return new Set([selected.value, ...pathsOf(selected.value).map((p) => otherEnd(p, selected.value!))])
})
const activePaths = computed(() => {
  if (selectedPath.value) return new Set([selectedPath.value])
  if (selected.value) return new Set(pathsOf(selected.value).map((p) => p.id))
  return null
})

const paths = computed(() =>
  PATHS.map((p) => {
    const a = pos.value.get(p.from)!
    const b = pos.value.get(p.to)!
    const st = pathState.value.get(p.id)
    return {
      ...p,
      x1: a.px, y1: a.py, x2: b.px, y2: b.py,
      flow: st?.flow ?? 0,
      weight: st?.weight ?? 0.3,
      stagnant: !!st?.stagnant,
      emphasis: (activePaths.value ? (activePaths.value.has(p.id) ? 'active' : 'dim') : 'none') as 'none' | 'dim' | 'active',
    }
  }),
)

function nodeState(id: SephirahId) {
  if (selected.value === id) return 'selected'
  if (neighbours.value && !neighbours.value.has(id)) return 'dim'
  if (selectedPath.value) {
    const p = PATHS.find((x) => x.id === selectedPath.value)
    if (p && p.from !== id && p.to !== id) return 'dim'
  }
  return ''
}

// ── Zoom ──────────────────────────────────────────────────────────
function visible() {
  const i = props.inset ?? { top: 0, right: 0, bottom: 0, left: 0 }
  const w = Math.max(240, size.value.w - i.left - i.right)
  const h = Math.max(240, size.value.h - i.top - i.bottom)
  return { x: i.left, y: i.top, w, h }
}
function fitTransform() {
  const pad = 56
  const v = visible()
  // Node labels hang ~44px below each centre; include them so Malkuth's label is never clipped.
  const h = TREE_H + 44
  const k = Math.min(v.w / (2 * UX + pad * 2), v.h / (h + pad * 2), 1.5)
  return zoomIdentity.translate(v.x + v.w / 2, v.y + (v.h - h * k) / 2).scale(k)
}
function apply(t: ZoomTransform, animate = true) {
  if (!svgRef.value || !zoomer) return
  const sel = select(svgRef.value)
  if (animate && !reduced.value) sel.transition().duration(520).call(zoomer.transform, t)
  else sel.call(zoomer.transform, t)
}
function zoomBy(f: number) {
  if (!svgRef.value || !zoomer) return
  const sel = select(svgRef.value)
  if (reduced.value) sel.call(zoomer.scaleBy, f)
  else sel.transition().duration(300).call(zoomer.scaleBy, f)
}
function reset() {
  apply(fitTransform())
}
function centerOn(id: SephirahId) {
  const n = pos.value.get(id)
  if (!n) return
  const k = Math.max(transform.value.k, 1.1)
  const v = visible()
  apply(zoomIdentity.translate(v.x + v.w / 2 - n.px * k, v.y + v.h / 2 - n.py * k).scale(k))
}
defineExpose({ zoomIn: () => zoomBy(1.35), zoomOut: () => zoomBy(1 / 1.35), reset, centerOn })

onMounted(() => {
  const svg = svgRef.value!
  zoomer = d3zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.45, 4])
    .filter((e: Event) => {
      // Wheel needs a modifier-free scroll inside the map; don't hijack keyboard or right-click.
      if (e.type === 'dblclick') return false
      return !(e as MouseEvent).button
    })
    .on('zoom', (e) => {
      transform.value = e.transform
      if (e.sourceEvent) userMoved = true
    })
  select(svg).call(zoomer).on('dblclick.zoom', null)

  let fitted = false
  ro = new ResizeObserver(([entry]) => {
    size.value = { w: entry.contentRect.width, h: entry.contentRect.height }
    // Refit until the user has moved the map themselves.
    if (!fitted || !userMoved) apply(fitTransform(), false)
    fitted = true
  })
  ro.observe(svg)
})
onBeforeUnmount(() => ro?.disconnect())

watch(
  () => props.inset,
  () => {
    if (!userMoved) apply(fitTransform())
  },
  { deep: true },
)

watch(selected, (id) => {
  if (id) focusId.value = id
})

// ── Keyboard ─────────────────────────────────────────────────────
const nodeEls = new Map<SephirahId, SVGGElement>()
function setNodeEl(id: SephirahId, el: unknown) {
  if (el) nodeEls.set(id, el as SVGGElement)
}

function step(from: SephirahId, dx: number, dy: number): SephirahId {
  const a = pos.value.get(from)!
  let best: SephirahId = from
  let score = Infinity
  for (const p of pathsOf(from)) {
    const id = otherEnd(p, from)
    const b = pos.value.get(id)!
    const vx = b.px - a.px
    const vy = b.py - a.py
    const len = Math.hypot(vx, vy)
    const cos = (vx * dx + vy * dy) / len
    if (cos < 0.3) continue
    const s = len * (1.6 - cos)
    if (s < score) {
      score = s
      best = id
    }
  }
  return best
}

function onKey(e: KeyboardEvent, id: SephirahId) {
  const dirs: Record<string, [number, number]> = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  }
  if (dirs[e.key]) {
    e.preventDefault()
    const next = step(id, ...dirs[e.key])
    focusId.value = next
    nodeEls.get(next)?.focus()
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    select_(id)
  } else if (e.key === 'Escape') {
    selected.value = null
    selectedPath.value = null
  } else if (e.key === '+' || e.key === '=') zoomBy(1.35)
  else if (e.key === '-') zoomBy(1 / 1.35)
}

function select_(id: SephirahId) {
  selectedPath.value = null
  selected.value = selected.value === id ? null : id
}
function selectPath(id: number) {
  selectedPath.value = selectedPath.value === id ? null : id
}

const pct = (v: number) => `${Math.round(v * 100)}%`
</script>

<template>
  <div class="atlas" :class="{ 'flow-off': !showFlow }">
    <svg
      ref="svgRef"
      class="canvas"
      role="application"
      aria-roledescription="Tree of Life map"
      aria-label="Inner Atlas. Use arrow keys to move between connected sephiroth, Enter to select, plus and minus to zoom."
      @click.self="(selected = null), (selectedPath = null)"
    >
      <defs>
        <radialGradient v-for="n in nodes" :id="`body-${n.id}`" :key="`b-${n.id}`" cx="38%" cy="32%" r="75%">
          <stop offset="0%" style="stop-color: #fff; stop-opacity: 0.9" />
          <stop offset="22%" :style="{ stopColor: n.tone, stopOpacity: 0.95 }" />
          <stop offset="78%" :style="{ stopColor: n.tone, stopOpacity: 0.32 }" />
          <stop offset="100%" :style="{ stopColor: n.tone, stopOpacity: 0.12 }" />
        </radialGradient>
        <radialGradient v-for="n in nodes" :id="`halo-${n.id}`" :key="`h-${n.id}`">
          <stop offset="0%" :style="{ stopColor: n.tone, stopOpacity: 0.55 }" />
          <stop offset="100%" :style="{ stopColor: n.tone, stopOpacity: 0 }" />
        </radialGradient>
      </defs>

      <g :transform="transform.toString()">
        <!-- paths -->
        <g class="paths">
          <g v-for="p in paths" :key="p.id" class="path" :class="{ selected: selectedPath === p.id }">
            <EnergyFlow
              :x1="p.x1" :y1="p.y1" :x2="p.x2" :y2="p.y2"
              :flow="showFlow ? p.flow : 0"
              :weight="p.weight"
              :stagnant="showFlow && p.stagnant"
              :emphasis="p.emphasis"
              :show-direction="reduced || p.emphasis === 'active'"
            />
            <line class="hit" :x1="p.x1" :y1="p.y1" :x2="p.x2" :y2="p.y2" @click.stop="selectPath(p.id)">
              <title>Path {{ p.id }} · {{ p.letterName }}</title>
            </line>
            <g
              v-if="p.emphasis === 'active'"
              class="path-label"
              :transform="`translate(${(p.x1 + p.x2) / 2} ${(p.y1 + p.y2) / 2})`"
            >
              <rect x="-17" y="-22" width="34" height="16" rx="8" />
              <text y="-10.5" text-anchor="middle">
                <tspan class="num">{{ p.id }}</tspan> {{ p.letter }}
              </text>
            </g>
          </g>
        </g>

        <!-- nodes -->
        <g
          v-for="(n, i) in nodes"
          :key="n.id"
          :ref="(el) => setNodeEl(n.id, el)"
          class="node"
          :class="nodeState(n.id)"
          :transform="`translate(${n.px} ${n.py})`"
          role="button"
          :tabindex="focusId === n.id ? 0 : -1"
          :aria-pressed="selected === n.id"
          :aria-label="`${n.name}, ${n.meaning}. Energy ${pct(n.energy)}. ${n.psyche}`"
          @click.stop="select_(n.id)"
          @keydown="onKey($event, n.id)"
          @focus="focusId = n.id"
        >
          <circle class="halo ambient-anim" :r="R + 14 + n.energy * 30" :fill="`url(#halo-${n.id})`" :style="{ animationDelay: `${-i * 0.9}s` }" />
          <circle class="ring" :r="R + 7" />
          <circle class="body" :r="R" :fill="`url(#body-${n.id})`" />
          <circle class="rim" :r="R" />
          <ellipse class="spec" cx="-8" cy="-11" rx="7.5" ry="4.5" transform="rotate(-28 -8 -11)" />
          <text class="idx num" y="4.5" text-anchor="middle">{{ n.index }}</text>
          <text class="label" :y="R + 20" text-anchor="middle">{{ n.name }}</text>
          <text class="sub num" :y="R + 35" text-anchor="middle">{{ n.meaning }} · {{ pct(n.energy) }}</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.atlas {
  position: absolute;
  inset: 0;
}
.canvas {
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.canvas:active {
  cursor: grabbing;
}
.canvas:focus-visible {
  outline: none;
}
.hit {
  stroke: transparent;
  stroke-width: 14;
  cursor: pointer;
}
.path-label rect {
  fill: var(--surface);
  stroke: var(--hairline-2);
}
.path-label text {
  fill: var(--text);
  font-size: 10px;
  font-weight: 500;
}
.num {
  font-variant-numeric: tabular-nums;
}

.node {
  cursor: pointer;
  transition: opacity var(--dur-slow) var(--ease-out);
  outline: none;
}
.node.dim {
  opacity: 0.3;
}
.halo {
  transform-box: fill-box;
  transform-origin: center;
  animation: lq-breathe var(--dur-breathe) var(--ease-in-out) infinite;
}
.body {
  transition: transform var(--dur-base) var(--ease-spring);
  transform-box: fill-box;
  transform-origin: center;
}
.rim {
  fill: none;
  stroke: rgba(255, 255, 255, 0.28);
  stroke-width: 1;
}
:root[data-theme='light'] .rim {
  stroke: rgba(40, 44, 70, 0.22);
}
.spec {
  fill: rgba(255, 255, 255, 0.7);
  pointer-events: none;
}
.ring {
  fill: none;
  stroke: transparent;
  stroke-width: 1;
  transition: stroke var(--dur-fast);
}
.idx {
  font-size: 11px;
  font-weight: 600;
  fill: rgba(17, 19, 26, 0.72);
  pointer-events: none;
}
.label {
  fill: var(--text);
  font-size: 12.5px;
  font-weight: 500;
}
.sub {
  fill: var(--text-2);
  font-size: 10.5px;
}
.node:hover .body {
  transform: scale(1.06);
}
.node:hover .ring {
  stroke: var(--hairline-3);
}
.node:focus-visible .ring {
  stroke: var(--focus);
  stroke-width: 2;
}
.node.selected .ring {
  stroke: var(--c-pearl);
  stroke-width: 1.5;
}
.node.selected .body {
  transform: scale(1.08);
}
</style>
