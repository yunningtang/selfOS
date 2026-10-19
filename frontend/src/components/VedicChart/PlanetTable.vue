<script setup lang="ts">
import { GRAHAS, SIGNS } from '@/data/lexicon'
import { fmtDeg } from '@/composables/format'
import type { VedicChart } from '@/types'

defineProps<{ chart: VedicChart }>()
</script>

<template>
  <div class="wrap" tabindex="0" role="region" aria-label="Graha positions">
    <table>
      <caption class="visually-hidden">Sidereal positions of the grahas</caption>
      <thead>
        <tr>
          <th scope="col">Graha</th>
          <th scope="col">Sign</th>
          <th scope="col" class="r">Degree</th>
          <th scope="col">Nakshatra</th>
          <th scope="col" class="r">Pada</th>
          <th scope="col" class="r">House</th>
          <th scope="col">Dignity</th>
        </tr>
      </thead>
      <tbody>
        <tr class="asc">
          <th scope="row">Ascendant <span class="t-faint">Lagna</span></th>
          <td>{{ SIGNS[chart.ascendant.sign].name }}</td>
          <td class="r t-num">{{ fmtDeg(chart.ascendant.longitude % 30) }}</td>
          <td>{{ chart.ascendant.nakshatra }}</td>
          <td class="r t-num">{{ chart.ascendant.pada }}</td>
          <td class="r t-num">1</td>
          <td />
        </tr>
        <tr v-for="p in chart.planets" :key="p.id">
          <th scope="row">
            <span class="abbr">{{ p.id }}</span> {{ GRAHAS[p.id].name }}
            <span v-if="p.retrograde" class="retro" :title="'Retrograde'">R</span>
          </th>
          <td>{{ SIGNS[p.sign].name }}</td>
          <td class="r t-num">{{ fmtDeg(p.longitude % 30) }}</td>
          <td>{{ p.nakshatra }}</td>
          <td class="r t-num">{{ p.pada }}</td>
          <td class="r t-num">{{ p.house }}</td>
          <td class="t-muted">{{ p.dignity ?? '' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
}
th,
td {
  padding: 8px 10px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--hairline);
}
thead th {
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--text-2);
  border-bottom-color: var(--hairline-2);
}
tbody th {
  font-weight: var(--fw-medium);
}
.r {
  text-align: right;
}
.abbr {
  display: inline-block;
  width: 2em;
  color: var(--accent-ink);
}
.retro {
  margin-left: 4px;
  padding: 0 5px;
  border-radius: var(--r-xs);
  font-size: var(--fs-2xs);
  color: var(--text-2);
  box-shadow: inset 0 0 0 1px var(--hairline-2);
}
.asc th,
.asc td {
  background: color-mix(in srgb, var(--c-lavender) 6%, transparent);
}
</style>
