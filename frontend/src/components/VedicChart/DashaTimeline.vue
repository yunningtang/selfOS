<script setup lang="ts">
import { computed, ref } from 'vue'
import { GRAHAS } from '@/data/lexicon'
import { fmtDate } from '@/composables/format'
import type { DashaPeriod, GrahaId, VedicChart } from '@/types'

/** Vimshottari mahadashas on one time axis, with the antardashas of the chosen period below. */
const props = defineProps<{ chart: VedicChart }>()

const TONES: Record<GrahaId, string> = {
  Su: 'var(--c-sand)', Mo: 'var(--c-pearl)', Ma: 'var(--c-clay)', Me: 'var(--c-sage)', Ju: 'var(--c-mist)',
  Ve: 'var(--c-lavender)', Sa: 'var(--c-slate)', Ra: 'var(--c-ink)', Ke: 'var(--c-ink)',
}

const birth = computed(() => {
  const i = props.chart.input
  return new Date(Date.UTC(i.year, i.month - 1, i.day)).getTime()
})
const end = computed(() => birth.value + 100 * 365.2425 * 86400000)
const now = Date.now()
const t = (iso: string) => new Date(iso).getTime()
const x = (ms: number) => ((Math.min(Math.max(ms, birth.value), end.value) - birth.value) / (end.value - birth.value)) * 100

const visible = computed(() => props.chart.dasha.periods.filter((p) => t(p.end) > birth.value && t(p.start) < end.value))
const currentMaha = computed(() => visible.value.find((p) => t(p.start) <= now && now < t(p.end)) ?? null)
const chosen = ref<DashaPeriod | null>(null)
const open = computed(() => chosen.value ?? currentMaha.value ?? visible.value[0])
const ticks = computed(() => {
  const y0 = new Date(birth.value).getUTCFullYear()
  return Array.from({ length: 6 }, (_, i) => y0 + i * 20)
})
const subX = (p: DashaPeriod, ms: number) => ((ms - t(p.start)) / (t(p.end) - t(p.start))) * 100
const isNow = (p: DashaPeriod) => t(p.start) <= now && now < t(p.end)
</script>

<template>
  <div class="dasha">
    <p class="current">
      <span class="t-label">Now running</span>
      <span class="cur">
        {{ GRAHAS[chart.dasha.current.maha].name }} / {{ GRAHAS[chart.dasha.current.antar].name }}
      </span>
      <span class="t-num t-muted t-sm">{{ fmtDate(chart.dasha.current.since) }} – {{ fmtDate(chart.dasha.current.until) }}</span>
    </p>

    <div class="axis" role="list" aria-label="Mahadashas from birth">
      <button
        v-for="p in visible"
        :key="p.start"
        type="button"
        role="listitem"
        class="seg"
        :class="{ open: open === p, now: isNow(p) }"
        :style="{ left: `${x(t(p.start))}%`, width: `${x(t(p.end)) - x(t(p.start))}%`, '--tone': TONES[p.lord] }"
        :title="`${GRAHAS[p.lord].name} mahadasha · ${fmtDate(p.start)} – ${fmtDate(p.end)}`"
        :aria-label="`${GRAHAS[p.lord].name} mahadasha, ${fmtDate(p.start)} to ${fmtDate(p.end)}`"
        :aria-pressed="open === p"
        @click="chosen = p"
      >
        <span class="lord">{{ p.lord }}</span>
      </button>
      <span class="now-line" :style="{ left: `${x(now)}%` }" aria-hidden="true" />
    </div>
    <div class="ticks t-num t-faint" aria-hidden="true">
      <span v-for="y in ticks" :key="y" :style="{ left: `${x(Date.UTC(y, 0, 1))}%` }">{{ y }}</span>
    </div>

    <div v-if="open?.sub" class="sub">
      <p class="t-label">
        {{ GRAHAS[open.lord].name }} mahadasha · antardashas
        <span class="t-num t-faint">{{ fmtDate(open.start) }} – {{ fmtDate(open.end) }}</span>
      </p>
      <ol class="sub-list">
        <li v-for="s in open.sub" :key="s.start" :class="{ now: isNow(s) }" :aria-current="isNow(s) ? 'true' : undefined">
          <span class="sub-bar">
            <span :style="{ left: `${subX(open, t(s.start))}%`, width: `${subX(open, t(s.end)) - subX(open, t(s.start))}%`, '--tone': TONES[s.lord] }" />
          </span>
          <span class="sub-lord">{{ GRAHAS[open.lord].name.slice(0, 2) }}–{{ GRAHAS[s.lord].name }}</span>
          <span class="t-num t-muted">{{ fmtDate(s.start) }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.dasha {
  display: grid;
  gap: var(--sp-3);
}
.current {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--sp-3);
}
.cur {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}
.axis {
  position: relative;
  height: 40px;
  border-radius: var(--r-sm);
  background: var(--surface-sunken);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.seg {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border: 0;
  padding: 0;
  border-radius: 6px;
  background: color-mix(in srgb, var(--tone) 34%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tone) 55%, transparent);
  /* 2px surface gap between adjacent segments */
  clip-path: inset(0 1px);
  transition: background-color var(--dur-fast), transform var(--dur-base) var(--ease-spring);
  overflow: hidden;
}
.seg:hover,
.seg.open {
  background: color-mix(in srgb, var(--tone) 60%, transparent);
}
.seg.open {
  box-shadow: inset 0 0 0 1.5px var(--text-2);
}
.lord {
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--text);
}
.now-line {
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  margin-left: -1px;
  border-radius: 2px;
  background: var(--text);
  pointer-events: none;
}
.ticks {
  position: relative;
  height: 16px;
  font-size: var(--fs-2xs);
}
.ticks span {
  position: absolute;
  transform: translateX(-50%);
}
.ticks span:first-child {
  transform: none;
}
.sub {
  display: grid;
  gap: var(--sp-2);
}
.sub-list {
  display: grid;
  gap: 2px;
}
.sub-list li {
  display: grid;
  grid-template-columns: 1fr 140px 110px;
  gap: var(--sp-3);
  align-items: center;
  padding: 4px 0;
  font-size: var(--fs-sm);
}
.sub-list li.now {
  color: var(--text);
  font-weight: var(--fw-medium);
}
.sub-list li:not(.now) .sub-lord {
  color: var(--text-2);
}
.sub-bar {
  position: relative;
  height: 6px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
}
.sub-bar span {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: inherit;
  background: var(--tone);
}
.sub-list li .t-num {
  text-align: right;
}
@media (max-width: 560px) {
  .sub-list li {
    grid-template-columns: 1fr 1fr;
  }
  .sub-bar {
    grid-column: 1 / -1;
  }
}
</style>
