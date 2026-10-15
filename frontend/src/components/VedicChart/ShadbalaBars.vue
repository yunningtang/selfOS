<script setup lang="ts">
import { computed } from 'vue'
import { GRAHAS } from '@/data/lexicon'
import { fmt2 } from '@/composables/format'
import type { ShadbalaResult } from '@/types'

/** Total Shadbala per graha (rupas) against its required minimum. Single series: one hue. */
const props = defineProps<{ result: ShadbalaResult }>()
const max = computed(() => Math.max(...props.result.planets.map((p) => Math.max(p.total, p.required))) * 1.08)
const pct = (v: number) => `${(v / max.value) * 100}%`
</script>

<template>
  <div class="shadbala">
    <ul class="bars">
      <li
        v-for="p in result.planets"
        :key="p.planet"
        :title="`Sthana ${fmt2(p.sthana)} · Dig ${fmt2(p.dig)} · Kala ${fmt2(p.kala)} · Chesta ${fmt2(p.chesta)} · Naisargika ${fmt2(p.naisargika)} · Drik ${fmt2(p.drik)}`"
      >
        <span class="name">{{ GRAHAS[p.planet].name }}</span>
        <span class="track">
          <span class="fill" :class="{ weak: p.total < p.required }" :style="{ width: pct(p.total) }" />
          <span class="req" :style="{ left: pct(p.required) }" />
        </span>
        <span class="val t-num">{{ fmt2(p.total) }}</span>
        <span class="ratio t-num t-muted">{{ fmt2(p.total / p.required) }}×</span>
      </li>
    </ul>
    <p class="t-caption">
      Total strength in rupas. The tick marks each graha’s required minimum; the ratio is total ÷ required. Hover a row for the six components.
    </p>
    <details class="table-view">
      <summary class="t-sm">Show table</summary>
      <div class="tw">
        <table>
          <thead>
            <tr>
              <th scope="col">Graha</th><th scope="col">Sthana</th><th scope="col">Dig</th><th scope="col">Kala</th>
              <th scope="col">Chesta</th><th scope="col">Naisargika</th><th scope="col">Drik</th><th scope="col">Total</th><th scope="col">Required</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in result.planets" :key="p.planet">
              <th scope="row">{{ GRAHAS[p.planet].name }}</th>
              <td>{{ fmt2(p.sthana) }}</td><td>{{ fmt2(p.dig) }}</td><td>{{ fmt2(p.kala) }}</td><td>{{ fmt2(p.chesta) }}</td>
              <td>{{ fmt2(p.naisargika) }}</td><td>{{ fmt2(p.drik) }}</td><td>{{ fmt2(p.total) }}</td><td>{{ fmt2(p.required) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </div>
</template>

<style scoped>
.shadbala {
  display: grid;
  gap: var(--sp-3);
}
.bars {
  display: grid;
  gap: var(--sp-2);
}
.bars li {
  display: grid;
  grid-template-columns: 72px 1fr 44px 48px;
  gap: var(--sp-3);
  align-items: center;
  font-size: var(--fs-sm);
  padding: 2px 0;
  border-radius: var(--r-xs);
}
.bars li:hover {
  background: var(--accent-soft);
}
.track {
  position: relative;
  height: 10px;
}
.fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 0 4px 4px 0;
  background: var(--c-mist);
  transition: width var(--dur-slow) var(--ease-spring);
}
.fill.weak {
  background: color-mix(in srgb, var(--c-mist) 45%, transparent);
}
.req {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  margin-left: -1px;
  background: var(--text);
  border-radius: 1px;
}
.val,
.ratio {
  text-align: right;
}
.table-view summary {
  cursor: pointer;
  color: var(--text-2);
}
.tw {
  overflow-x: auto;
  margin-top: var(--sp-2);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-xs);
  font-variant-numeric: tabular-nums;
}
th,
td {
  padding: 6px 8px;
  text-align: right;
  border-bottom: 1px solid var(--hairline);
  white-space: nowrap;
}
th[scope='row'],
thead th:first-child {
  text-align: left;
}
thead th {
  color: var(--text-2);
  font-weight: var(--fw-medium);
}
</style>
