<script setup lang="ts">
import { computed, ref } from 'vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import Notice from '@/components/ui/Notice.vue'
import SouthIndianChart from './SouthIndianChart.vue'
import NorthIndianChart from './NorthIndianChart.vue'
import DashaTree from './DashaTree.vue'
import ShadbalaPanel from './ShadbalaPanel.vue'
import { fmtDms } from '@/engines/western/chart'
import { GRAHA_IDS, GRAHA_NAMES, GRAHA_ZH, RASHI, RELATION_NAMES, VARGA_LIST, type VargaD } from '@/engines/vedic/tables'
import type { VedicChart } from '@/types'

const props = defineProps<{ chart: VedicChart }>()
const format = ref<'south' | 'north'>('south')
const varga = ref<VargaD>(1)
const vargaMeta = computed(() => VARGA_LIST.find((v) => v.d === varga.value)!)
const placements = computed(() => Object.fromEntries(props.chart.grahas.map((g) => [g.id, g.vargas[varga.value]])) as Record<string, number>)
const retro = computed(() => Object.fromEntries(props.chart.grahas.map((g) => [g.id, g.retrograde && g.idx < 7])))
const DIGNITY_LABEL: Record<string, string> = {
  exalted: 'Exalted', moolatrikona: 'Moolatrikona', own: 'Own sign', adhimitra: 'Great friend', mitra: 'Friend', sama: 'Neutral', satru: 'Enemy', adhisatru: 'Great enemy', debilitated: 'Debilitated',
}
const SIGN_SHORT = RASHI.map((r) => r.abbr)
</script>

<template>
  <div class="vedic">
    <div class="top">
      <div class="chart-col">
        <div class="row-wrap controls">
          <LqSegmented v-model="format" :options="[{ value: 'south', label: 'South' }, { value: 'north', label: 'North' }]" label="Chart format" size="sm" />
          <label class="varga-pick">
            <span class="visually-hidden">Divisional chart</span>
            <select v-model.number="varga" class="lq-input">
              <option v-for="v in VARGA_LIST" :key="v.d" :value="v.d">D{{ v.d }} · {{ v.name }} — {{ v.about }}</option>
            </select>
          </label>
        </div>
        <SouthIndianChart v-if="format === 'south'" :ascendant="chart.lagna.vargas[varga]" :placements="placements" :retro="retro" :title="`${vargaMeta.name} · D${varga}`" />
        <NorthIndianChart v-else :ascendant="chart.lagna.vargas[varga]" :placements="placements" :retro="retro" :title="`${vargaMeta.name} · D${varga}`" />
        <p class="t-caption">
          {{ chart.ayanamsa.name }} <span class="t-num">{{ chart.ayanamsa.value.toFixed(4) }}°</span> · {{ chart.settings.nodeType }} node · whole-sign houses, chalit {{ chart.chalit.system }}
        </p>
        <dl class="panch lq-well">
          <div><dt>Lagna</dt><dd>{{ RASHI[chart.lagna.sign].en }} <span class="t-num">{{ fmtDms(chart.lagna.signDeg) }}</span> · {{ chart.lagna.nakshatraName }} {{ chart.lagna.pada }}</dd></div>
          <div><dt>Tithi</dt><dd>{{ chart.panchanga.tithi.paksha }} {{ chart.panchanga.tithi.name }} <span class="t-faint t-num">({{ Math.round(chart.panchanga.tithi.elapsed * 100) }}%)</span></dd></div>
          <div><dt>Vara</dt><dd>{{ chart.panchanga.vara.name }} · {{ GRAHA_NAMES[chart.panchanga.vara.lord] }}</dd></div>
          <div><dt>Nakshatra</dt><dd>{{ chart.panchanga.nakshatra.name }} {{ chart.panchanga.nakshatra.pada }} · {{ GRAHA_NAMES[chart.panchanga.nakshatra.lord] }}</dd></div>
          <div><dt>Yoga</dt><dd>{{ chart.panchanga.yoga.name }}</dd></div>
          <div><dt>Karana</dt><dd>{{ chart.panchanga.karana.name }}</dd></div>
          <div><dt>Sunrise / set</dt><dd class="t-num">{{ chart.panchanga.sunrise.slice(11) }} / {{ chart.panchanga.sunset.slice(11) }} · {{ chart.panchanga.isDaytime ? 'day birth' : 'night birth' }}</dd></div>
        </dl>
      </div>

      <div class="table-col">
        <h3 class="t-label">Grahas · D1</h3>
        <div class="tw">
          <table>
            <thead>
              <tr><th scope="col">Graha</th><th scope="col">Sign</th><th scope="col" class="r">Degree</th><th scope="col">Nakshatra</th><th scope="col" class="r">House</th><th scope="col" class="r">Chalit</th><th scope="col">Dignity</th><th scope="col">D9</th></tr>
            </thead>
            <tbody>
              <tr v-for="g in chart.grahas" :key="g.id">
                <th scope="row"><span class="abbr">{{ g.id }}</span> {{ g.name }} <span class="t-faint">{{ GRAHA_ZH[g.idx] }}</span> <span v-if="g.retrograde && g.idx < 7" class="badge">R</span><span v-if="g.combust" class="badge">C</span></th>
                <td>{{ RASHI[g.sign].en }}</td>
                <td class="r t-num">{{ fmtDms(g.signDeg) }}</td>
                <td>{{ g.nakshatraName }} <span class="t-num">{{ g.pada }}</span> <span class="t-faint">{{ GRAHA_IDS[g.nakshatraLord] }}</span></td>
                <td class="r t-num">{{ g.house }}</td>
                <td class="r t-num">{{ g.chalitHouse }}</td>
                <td class="t-muted">{{ DIGNITY_LABEL[g.dignity] }}</td>
                <td>{{ SIGN_SHORT[g.vargas[9]] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3 class="t-label">Vargas <span class="t-faint">· sign in each divisional chart</span></h3>
        <div class="tw">
          <table class="vargas">
            <thead><tr><th scope="col"></th><th v-for="v in VARGA_LIST" :key="v.d" scope="col" class="c">D{{ v.d }}</th></tr></thead>
            <tbody>
              <tr><th scope="row">Lg</th><td v-for="v in VARGA_LIST" :key="v.d" class="c">{{ SIGN_SHORT[chart.lagna.vargas[v.d]] }}</td></tr>
              <tr v-for="g in chart.grahas" :key="g.id"><th scope="row">{{ g.id }}</th><td v-for="v in VARGA_LIST" :key="v.d" class="c">{{ SIGN_SHORT[g.vargas[v.d]] }}</td></tr>
            </tbody>
          </table>
        </div>
        <h3 class="t-label">Relationships <span class="t-faint">· compound (natural + temporal)</span></h3>
        <div class="tw">
          <table class="rel">
            <thead><tr><th scope="col"></th><th v-for="j in 7" :key="j" scope="col" class="c">{{ GRAHA_IDS[j - 1] }}</th></tr></thead>
            <tbody>
              <tr v-for="i in 7" :key="i">
                <th scope="row">{{ GRAHA_IDS[i - 1] }}</th>
                <td v-for="j in 7" :key="j" class="c" :class="i === j ? 'self' : ['adhisatru', 'satru', 'sama', 'mitra', 'adhimitra'][chart.grahas[i - 1].relation[j - 1]]" :title="i === j ? '' : RELATION_NAMES[chart.grahas[i - 1].relation[j - 1]]">
                  {{ i === j ? '·' : ['−−', '−', '○', '+', '++'][chart.grahas[i - 1].relation[j - 1]] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <section class="block">
      <h3 class="t-label">Vimshottari Dasha <span class="t-faint">· {{ chart.settings.dashaYearDays }}-day years</span></h3>
      <DashaTree :chart="chart" />
    </section>

    <section class="block">
      <h3 class="t-label">Shadbala <span class="t-faint">· six-fold strength (BPHS)</span></h3>
      <ShadbalaPanel :chart="chart" />
    </section>

    <section class="block">
      <h3 class="t-label">Ashtakavarga</h3>
      <div class="tw">
        <table class="av">
          <thead><tr><th scope="col"></th><th v-for="(r, i) in RASHI" :key="i" scope="col" class="c">{{ r.abbr }}</th><th scope="col" class="c">Σ</th></tr></thead>
          <tbody>
            <tr v-for="p in 7" :key="p">
              <th scope="row">{{ GRAHA_IDS[p - 1] }}</th>
              <td v-for="(v, s) in chart.ashtakavarga.bav[p - 1]" :key="s" class="c t-num" :class="{ lo: v <= 2, hi: v >= 5 }">{{ v }}</td>
              <td class="c t-num t-muted">{{ chart.ashtakavarga.bav[p - 1].reduce((a, b) => a + b, 0) }}</td>
            </tr>
            <tr class="sav">
              <th scope="row">SAV</th>
              <td v-for="(v, s) in chart.ashtakavarga.sav" :key="s" class="c t-num" :class="{ lo: v < 25, hi: v > 30 }">{{ v }}</td>
              <td class="c t-num">{{ chart.ashtakavarga.sav.reduce((a, b) => a + b, 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Notice>Sarvashtakavarga above 28 bindus in a sign is considered supportive; below 25, lean. Lagna contributes to each planet's table as the eighth reference.</Notice>
    </section>
  </div>
</template>

<style scoped>
.vedic {
  display: grid;
  gap: var(--sp-6);
}
.top {
  display: grid;
  grid-template-columns: minmax(280px, 400px) minmax(0, 1fr);
  gap: var(--sp-7);
  align-items: start;
}
.chart-col,
.table-col,
.block {
  display: grid;
  gap: var(--sp-3);
  min-width: 0;
}
.controls {
  justify-content: space-between;
}
.varga-pick select {
  height: 32px;
  font-size: var(--fs-xs);
}
.panch {
  display: grid;
  gap: 6px;
  padding: var(--sp-3) var(--sp-4);
  font-size: var(--fs-sm);
}
.panch div {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: var(--sp-2);
}
.panch dt {
  color: var(--text-2);
}
.tw {
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
  padding: 6px 8px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--hairline);
}
thead th {
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--text-2);
}
tbody th {
  font-weight: var(--fw-medium);
}
.r {
  text-align: right;
}
.c {
  text-align: center;
}
.abbr {
  display: inline-block;
  width: 2em;
  color: var(--accent-ink);
}
.badge {
  margin-left: 4px;
  padding: 0 5px;
  border-radius: var(--r-xs);
  font-size: var(--fs-2xs);
  color: var(--text-2);
  box-shadow: inset 0 0 0 1px var(--hairline-2);
}
.vargas td,
.rel td,
.av td {
  padding: 4px 6px;
  font-size: var(--fs-xs);
}
.rel .adhimitra,
.rel .mitra {
  color: var(--sage-ink);
}
.rel .satru,
.rel .adhisatru {
  color: var(--clay-ink);
}
.rel .self {
  color: var(--text-3);
}
.av .lo {
  color: var(--clay-ink);
}
.av .hi {
  color: var(--sage-ink);
}
.av .sav td,
.av .sav th {
  border-top: 1px solid var(--hairline-2);
  font-weight: var(--fw-medium);
}
@media (max-width: 980px) {
  .top {
    grid-template-columns: 1fr;
  }
  .chart-col {
    max-width: 440px;
  }
}
</style>
