<script setup lang="ts">
import { computed, ref } from 'vue'
import { subPeriods } from '@selfos/destiny-core/vedic/chart'
import { GRAHA_NAMES } from '@selfos/destiny-core/vedic/tables'
import { zoneOffsetAt } from '@selfos/destiny-core/ephemeris/time'
import type { DashaPeriod, VedicChart } from '@/types'

const props = defineProps<{ chart: VedicChart }>()
const openMaha = ref<number | null>(props.chart.dasha.current[0]?.lord ?? null)
const openAntar = ref<string | null>(props.chart.dasha.current[1] ? `${props.chart.dasha.current[0].lord}-${props.chart.dasha.current[1].lord}` : null)
const offset = computed(() => {
  const tz = props.chart.input.timeZone
  return typeof tz === 'number' ? tz * 60 : zoneOffsetAt(tz, Date.now())
})
const nowJd = Date.now() / 86400000 + 2440587.5
const isNow = (p: DashaPeriod) => p.startJd <= nowJd && nowJd < p.endJd
const pratyantar = (antar: DashaPeriod) => subPeriods(antar, offset.value)
const years = (p: DashaPeriod) => ((p.endJd - p.startJd) / props.chart.settings.dashaYearDays).toFixed(2)
</script>

<template>
  <div class="dasha">
    <p class="current">
      <span class="t-label">Running now</span>
      <span v-for="(p, i) in chart.dasha.current" :key="i" class="cur">
        <span v-if="i" class="t-faint">/</span> {{ GRAHA_NAMES[p.lord] }}
      </span>
      <span v-if="chart.dasha.current.length" class="t-num t-muted t-sm">until {{ chart.dasha.current[chart.dasha.current.length - 1].end }}</span>
    </p>
    <ol class="mahas">
      <li v-for="m in chart.dasha.periods" :key="m.lord" :class="{ now: isNow(m) }">
        <button type="button" class="row" :aria-expanded="openMaha === m.lord" @click="openMaha = openMaha === m.lord ? null : m.lord">
          <span class="chev" :class="{ open: openMaha === m.lord }" aria-hidden="true">›</span>
          <b>{{ GRAHA_NAMES[m.lord] }}</b>
          <span class="t-num t-muted">{{ m.start }} – {{ m.end }}</span>
          <span class="t-num t-faint">{{ years(m) }} y</span>
        </button>
        <ol v-if="openMaha === m.lord && m.sub" class="antars">
          <li v-for="a in m.sub" :key="a.lord" :class="{ now: isNow(a) }">
            <button type="button" class="row sub" :aria-expanded="openAntar === `${m.lord}-${a.lord}`" @click="openAntar = openAntar === `${m.lord}-${a.lord}` ? null : `${m.lord}-${a.lord}`">
              <span class="chev" :class="{ open: openAntar === `${m.lord}-${a.lord}` }" aria-hidden="true">›</span>
              <span>{{ GRAHA_NAMES[m.lord].slice(0, 2) }}–{{ GRAHA_NAMES[a.lord] }}</span>
              <span class="t-num t-muted">{{ a.start }} – {{ a.end }}</span>
            </button>
            <ol v-if="openAntar === `${m.lord}-${a.lord}`" class="prats">
              <li v-for="p in pratyantar(a)" :key="p.lord" :class="{ now: isNow(p) }">
                <span>{{ GRAHA_NAMES[m.lord].slice(0, 2) }}–{{ GRAHA_NAMES[a.lord].slice(0, 2) }}–{{ GRAHA_NAMES[p.lord] }}</span>
                <span class="t-num t-muted">{{ p.start }} – {{ p.end }}</span>
              </li>
            </ol>
          </li>
        </ol>
      </li>
    </ol>
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
  gap: var(--sp-2);
}
.cur {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}
.mahas,
.antars,
.prats {
  display: grid;
}
.row {
  display: grid;
  grid-template-columns: 14px 120px 1fr auto;
  gap: var(--sp-3);
  align-items: center;
  width: 100%;
  padding: 8px var(--sp-2);
  border: 0;
  border-bottom: 1px solid var(--hairline);
  background: none;
  text-align: left;
  font-size: var(--fs-sm);
  color: var(--text);
}
.row:hover {
  background: var(--accent-soft);
}
.row.sub {
  padding-left: var(--sp-6);
  grid-template-columns: 14px 120px 1fr;
}
.prats li {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--sp-3);
  padding: 5px var(--sp-2) 5px calc(var(--sp-6) + 24px);
  font-size: var(--fs-xs);
  border-bottom: 1px solid var(--hairline);
}
.chev {
  display: inline-block;
  color: var(--text-3);
  transition: transform var(--dur-base) var(--ease-spring);
}
.chev.open {
  transform: rotate(90deg);
}
li.now > .row,
li.now > span,
.prats li.now {
  background: color-mix(in srgb, var(--c-lavender) 10%, transparent);
}
li.now > .row b,
.prats li.now {
  color: var(--accent-ink);
}
@media (max-width: 560px) {
  .row {
    grid-template-columns: 14px 1fr;
  }
  .row > :nth-child(3),
  .row > :nth-child(4) {
    grid-column: 2;
  }
  .row.sub {
    grid-template-columns: 14px 1fr;
  }
  .prats li {
    grid-template-columns: 1fr;
  }
}
</style>
