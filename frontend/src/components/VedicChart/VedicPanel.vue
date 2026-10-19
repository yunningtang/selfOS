<script setup lang="ts">
import { computed, ref } from 'vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import LqCollapse from '@/components/ui/LqCollapse.vue'
import SouthIndianChart from './SouthIndianChart.vue'
import NorthIndianChart from './NorthIndianChart.vue'
import DashaTree from './DashaTree.vue'
import ShadbalaPanel from './ShadbalaPanel.vue'
import { fmtDm, fmtDms } from '@selfos/destiny-core/western/chart'
import { GRAHA_IDS, GRAHA_NAMES, RASHI, RELATION_NAMES, VARGA_LIST, type VargaD } from '@selfos/destiny-core/vedic/tables'
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
const moon = computed(() => props.chart.grahas[1])
const dashaChain = computed(() => props.chart.dasha.current.map((p) => GRAHA_NAMES[p.lord]).join(' › '))
const weak = computed(() => props.chart.shadbala.filter((s) => s.rupas < s.required).map((s) => GRAHA_NAMES[s.graha]))
</script>

<template>
  <div class="vedic">
    <div class="top">
      <div class="chart-col">
        <div class="controls">
          <LqSegmented v-model="format" :options="[{ value: 'south', label: 'South' }, { value: 'north', label: 'North' }]" label="Chart format" size="sm" />
          <select v-model.number="varga" class="lq-input varga" aria-label="Divisional chart">
            <option v-for="v in VARGA_LIST" :key="v.d" :value="v.d">D{{ v.d }} · {{ v.name }}</option>
          </select>
        </div>
        <SouthIndianChart v-if="format === 'south'" :ascendant="chart.lagna.vargas[varga]" :placements="placements" :retro="retro" :title="`${vargaMeta.name} · D${varga}`" />
        <NorthIndianChart v-else :ascendant="chart.lagna.vargas[varga]" :placements="placements" :retro="retro" :title="`${vargaMeta.name} · D${varga}`" />
        <p class="t-caption">{{ vargaMeta.about }} · {{ chart.ayanamsa.name }} <span class="t-num">{{ chart.ayanamsa.value.toFixed(4) }}°</span></p>
      </div>

      <div class="side">
        <ul class="cards">
          <li>
            <span class="k">Lagna</span>
            <span class="v">{{ RASHI[chart.lagna.sign].en }} <span class="t-num t-muted">{{ fmtDm(chart.lagna.signDeg) }}</span></span>
            <span class="t-caption">{{ chart.lagna.nakshatraName }} {{ chart.lagna.pada }} · {{ RASHI[chart.lagna.sign].sk }}</span>
          </li>
          <li>
            <span class="k">Moon</span>
            <span class="v">{{ chart.panchanga.nakshatra.name }} <span class="t-num t-muted">pada {{ chart.panchanga.nakshatra.pada }}</span></span>
            <span class="t-caption">{{ RASHI[moon.sign].en }} {{ fmtDm(moon.signDeg) }} · {{ chart.panchanga.tithi.paksha }} {{ chart.panchanga.tithi.name }}</span>
          </li>
          <li>
            <span class="k">Dasha now</span>
            <span class="v">{{ dashaChain }}</span>
            <span class="t-caption t-num">until {{ chart.dasha.current[chart.dasha.current.length - 1]?.end }}</span>
          </li>
        </ul>
        <dl class="panch">
          <div><dt>Vara</dt><dd>{{ chart.panchanga.vara.name }}</dd></div>
          <div><dt>Yoga</dt><dd>{{ chart.panchanga.yoga.name }}</dd></div>
          <div><dt>Karana</dt><dd>{{ chart.panchanga.karana.name }}</dd></div>
          <div><dt>Sunrise</dt><dd class="t-num">{{ chart.panchanga.sunrise.slice(11) }}</dd></div>
          <div><dt>Sunset</dt><dd class="t-num">{{ chart.panchanga.sunset.slice(11) }}</dd></div>
          <div><dt>Birth</dt><dd>{{ chart.panchanga.isDaytime ? 'day' : 'night' }}</dd></div>
        </dl>
      </div>
    </div>

    <section class="block">
      <h3 class="t-label">Grahas</h3>
      <div class="tw">
        <table>
          <thead>
            <tr><th>Graha</th><th>Sign</th><th class="r">Degree</th><th>Nakshatra</th><th class="r">House</th><th class="r">Chalit</th><th>Dignity</th><th>D9</th></tr>
          </thead>
          <tbody>
            <tr v-for="g in chart.grahas" :key="g.id">
              <th scope="row"><span class="abbr">{{ g.id }}</span>{{ g.name }} <span v-if="g.retrograde && g.idx < 7" class="badge">R</span><span v-if="g.combust" class="badge">C</span></th>
              <td>{{ RASHI[g.sign].en }}</td>
              <td class="r t-num">{{ fmtDms(g.signDeg) }}</td>
              <td>{{ g.nakshatraName }} <span class="t-num">{{ g.pada }}</span> <span class="t-faint">{{ GRAHA_IDS[g.nakshatraLord] }}</span></td>
              <td class="r t-num">{{ g.house }}</td>
              <td class="r t-num t-muted">{{ g.chalitHouse }}</td>
              <td class="t-muted">{{ DIGNITY_LABEL[g.dignity] }}</td>
              <td class="t-muted">{{ SIGN_SHORT[g.vargas[9]] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <LqCollapse title="Vimshottari Dasha" :summary="`${dashaChain} · ${chart.settings.dashaYearDays}-day years`">
      <DashaTree :chart="chart" />
    </LqCollapse>

    <LqCollapse title="Shadbala" :summary="weak.length ? `below requirement: ${weak.join(', ')}` : 'all grahas above requirement'">
      <ShadbalaPanel :chart="chart" />
    </LqCollapse>

    <LqCollapse title="Ashtakavarga" :summary="`SAV ${chart.ashtakavarga.sav.reduce((a, b) => a + b, 0)} bindus`">
      <div class="tw">
        <table class="av">
          <thead><tr><th></th><th v-for="(r, i) in RASHI" :key="i" class="c">{{ r.abbr }}</th><th class="c">Σ</th></tr></thead>
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
      <p class="t-caption">Above 28 bindus in a sign reads as supportive, below 25 as lean. Lagna is the eighth contributor to every table.</p>
    </LqCollapse>

    <LqCollapse title="Vargas" summary="sign of lagna and each graha in the sixteen divisional charts">
      <div class="tw">
        <table class="vargas">
          <thead><tr><th></th><th v-for="v in VARGA_LIST" :key="v.d" class="c">D{{ v.d }}</th></tr></thead>
          <tbody>
            <tr><th scope="row">Lg</th><td v-for="v in VARGA_LIST" :key="v.d" class="c">{{ SIGN_SHORT[chart.lagna.vargas[v.d]] }}</td></tr>
            <tr v-for="g in chart.grahas" :key="g.id"><th scope="row">{{ g.id }}</th><td v-for="v in VARGA_LIST" :key="v.d" class="c">{{ SIGN_SHORT[g.vargas[v.d]] }}</td></tr>
          </tbody>
        </table>
      </div>
    </LqCollapse>

    <LqCollapse title="Relationships" summary="compound: natural + temporal">
      <div class="tw">
        <table class="rel">
          <thead><tr><th></th><th v-for="j in 7" :key="j" class="c">{{ GRAHA_IDS[j - 1] }}</th></tr></thead>
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
    </LqCollapse>
  </div>
</template>

<style scoped>
.vedic {
  display: grid;
  gap: var(--sp-7);
}
.top {
  display: grid;
  grid-template-columns: minmax(280px, 420px) minmax(260px, 1fr);
  gap: var(--sp-8);
  align-items: start;
}
.chart-col,
.side {
  display: grid;
  gap: var(--sp-3);
  min-width: 0;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  justify-content: space-between;
}
.varga {
  width: auto;
  height: 32px;
  font-size: var(--fs-xs);
}
.cards {
  display: grid;
  gap: var(--sp-3);
}
.cards li {
  display: grid;
  gap: 2px;
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.k {
  font-size: var(--fs-xs);
  color: var(--text-2);
}
.v {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}
.panch {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-2) var(--sp-4);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
  font-size: var(--fs-sm);
}
.panch dt {
  font-size: var(--fs-2xs);
  color: var(--text-3);
}
.block {
  display: grid;
  gap: var(--sp-2);
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
  padding: 7px 8px;
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
  width: 2.2em;
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
  padding: 5px 6px;
  font-size: var(--fs-xs);
}
.rel .adhimitra,
.rel .mitra,
.av .hi {
  color: var(--sage-ink);
}
.rel .satru,
.rel .adhisatru,
.av .lo {
  color: var(--clay-ink);
}
.rel .self {
  color: var(--text-3);
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
