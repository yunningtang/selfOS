<script setup lang="ts">
import { computed, ref } from 'vue'
import ChartWheel from './ChartWheel.vue'
import LqCollapse from '@/components/ui/LqCollapse.vue'
import { fmtDm, fmtDms } from '@/engines/western/chart'
import { ASPECTS, BODY_META, ELEMENT_ZH, HOUSE_ZH, MODALITY_ZH, SIGNS, type BodyId } from '@/engines/western/tables'
import type { WesternChart } from '@/types'

const props = defineProps<{ chart: WesternChart }>()
const highlight = ref<BodyId | null>(null)

const DIGNITY_ZH: Record<string, string> = { domicile: '入庙', exaltation: '擢升', detriment: '落陷', fall: '弱势' }
const body = (id: BodyId) => props.chart.bodies.find((b) => b.id === id)!
const big3 = computed(() => (['sun', 'moon', 'asc'] as BodyId[]).map(body))
const gridIds = computed(() => props.chart.bodies.filter((b) => ['luminary', 'planet', 'outer'].includes(b.kind) || ['chiron', 'northNode', 'asc', 'mc'].includes(b.id)).map((b) => b.id))
const cell = (a: BodyId, b: BodyId) => props.chart.aspects.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
const shownAspects = computed(() => (highlight.value ? props.chart.aspects.filter((x) => x.a === highlight.value || x.b === highlight.value) : props.chart.aspects.filter((a) => a.def.major)))
const total = computed(() => Object.values(props.chart.tally.elements).reduce((a, v) => a + v.length, 0))
const glyphs = (ids: BodyId[]) => ids.map((id) => BODY_META[id].glyph).join(' ')
const majorCount = computed(() => props.chart.aspects.filter((a) => a.def.major).length)
</script>

<template>
  <div class="western">
    <div class="top">
      <div class="wheel-col">
        <ChartWheel :chart="chart" :highlight="highlight" @select="highlight = $event" />
      </div>
      <div class="side">
        <ul class="big3">
          <li v-for="b in big3" :key="b.id">
            <span class="b3-glyph">{{ b.glyph }}</span>
            <span class="b3-text">
              <span class="t-label">{{ b.zh }}</span>
              <span class="b3-sign">{{ SIGNS[b.sign].zh }} <span class="t-num t-muted">{{ fmtDm(b.signDeg) }}</span></span>
              <span class="t-caption" v-if="b.id !== 'asc'">第 {{ b.house }} 宫 · {{ HOUSE_ZH[b.house - 1] }}</span>
              <span class="t-caption" v-else>{{ chart.isDayChart ? '日生盘' : '夜生盘' }} · 月相 {{ chart.moonPhase.zh }}</span>
            </span>
          </li>
        </ul>
        <div class="tally">
          <div v-for="(ids, k) in chart.tally.elements" :key="k" class="t-row">
            <span class="t-k">{{ ELEMENT_ZH[k] }}</span>
            <span class="t-track"><span :style="{ width: `${(ids.length / total) * 100}%` }" /></span>
            <span class="t-num t-n">{{ ids.length }}</span>
            <span class="t-who">{{ glyphs(ids) }}</span>
          </div>
          <div class="t-sep" />
          <div v-for="(ids, k) in chart.tally.modalities" :key="k" class="t-row">
            <span class="t-k">{{ MODALITY_ZH[k] }}</span>
            <span class="t-track"><span :style="{ width: `${(ids.length / total) * 100}%` }" /></span>
            <span class="t-num t-n">{{ ids.length }}</span>
            <span class="t-who">{{ glyphs(ids) }}</span>
          </div>
        </div>
        <p class="t-caption">点选轮盘或表格中的星体，只显示它的相位。</p>
      </div>
    </div>

    <div class="tables">
      <section class="block">
        <h3 class="t-label">行星</h3>
        <table>
          <tbody>
            <tr v-for="b in chart.bodies" :key="b.id" :class="{ hi: highlight === b.id }" @click="highlight = highlight === b.id ? null : b.id">
              <th scope="row"><span class="glyph">{{ b.glyph }}</span>{{ b.zh }}</th>
              <td><span class="glyph sign">{{ SIGNS[b.sign].glyph }}</span>{{ SIGNS[b.sign].zh }}</td>
              <td class="r t-num">{{ fmtDms(b.signDeg) }}</td>
              <td class="r t-num t-muted">{{ b.house }}宫</td>
              <td class="t-muted tag"><span v-if="b.retrograde">℞</span> {{ b.dignity ? DIGNITY_ZH[b.dignity] : '' }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="block">
        <h3 class="t-label">宫位</h3>
        <table>
          <tbody>
            <tr v-for="h in chart.houses" :key="h.n">
              <th scope="row"><span class="t-num hn">{{ h.n }}</span>{{ HOUSE_ZH[h.n - 1] }}</th>
              <td><span class="glyph sign">{{ SIGNS[h.sign].glyph }}</span>{{ SIGNS[h.sign].zh }}</td>
              <td class="r t-num">{{ fmtDms(h.signDeg) }}</td>
              <td class="t-muted"><span class="glyph">{{ BODY_META[h.ruler].glyph }}</span>{{ BODY_META[h.ruler].zh }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <LqCollapse :title="highlight ? `${BODY_META[highlight].zh}的相位` : '相位'" :summary="`主相位 ${majorCount} · 全部 ${chart.aspects.length}`">
      <div class="asp-wrap">
        <ul class="asp-list">
          <li v-for="(a, i) in shownAspects" :key="i">
            <span class="glyph">{{ BODY_META[a.a].glyph }}</span><span>{{ BODY_META[a.a].zh }}</span>
            <span class="asp" :class="a.def.tone">{{ a.def.glyph }}</span>
            <span class="glyph">{{ BODY_META[a.b].glyph }}</span><span>{{ BODY_META[a.b].zh }}</span>
            <span class="t-muted">{{ a.def.zh }}</span>
            <span class="t-num t-faint">{{ a.orb.toFixed(2) }}° {{ a.applying ? '入' : '出' }}</span>
          </li>
        </ul>
        <div class="tw">
          <table class="grid">
            <thead><tr><th></th><th v-for="id in gridIds" :key="id"><span class="glyph">{{ BODY_META[id].glyph }}</span></th></tr></thead>
            <tbody>
              <tr v-for="(ra, i) in gridIds" :key="ra">
                <th><span class="glyph">{{ BODY_META[ra].glyph }}</span></th>
                <td v-for="(cb, j) in gridIds" :key="cb" :class="{ blank: j >= i, hi: highlight === ra || highlight === cb }">
                  <span v-if="j < i && cell(ra, cb)" class="asp" :class="cell(ra, cb)!.def.tone" :title="`${BODY_META[ra].zh}${cell(ra, cb)!.def.zh}${BODY_META[cb].zh} ${cell(ra, cb)!.orb.toFixed(2)}°`">{{ cell(ra, cb)!.def.glyph }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </LqCollapse>

    <LqCollapse title="相位设定">
      <ul class="orbs">
        <li v-for="a in ASPECTS" :key="a.id"><span class="asp" :class="a.tone">{{ a.glyph }}</span> {{ a.zh }} <span class="t-num t-muted">{{ a.angle }}° ± {{ chart.settings.orbs?.[a.id] ?? a.orb }}°</span></li>
      </ul>
      <p class="t-caption">日月相位容许度 +{{ chart.settings.luminaryBonus }}°；交点、福点、上升、天顶只取主相位，容许度不超过 5°。东 {{ chart.tally.hemispheres.east }} 西 {{ chart.tally.hemispheres.west }} · 南 {{ chart.tally.hemispheres.south }} 北 {{ chart.tally.hemispheres.north }} · 阳 {{ chart.tally.polarity.positive.length }} 阴 {{ chart.tally.polarity.negative.length }}。</p>
    </LqCollapse>
  </div>
</template>

<style scoped>
.western {
  display: grid;
  gap: var(--sp-7);
}
.top {
  display: grid;
  grid-template-columns: minmax(300px, 520px) minmax(260px, 1fr);
  gap: var(--sp-8);
  align-items: center;
}
.side {
  display: grid;
  gap: var(--sp-5);
}
.big3 {
  display: grid;
  gap: var(--sp-3);
}
.big3 li {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.b3-glyph {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 22px;
  color: var(--accent-ink);
  background: var(--accent-soft);
}
.b3-text {
  display: grid;
  gap: 1px;
}
.b3-sign {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}
.tally {
  display: grid;
  gap: 6px;
  padding: var(--sp-4);
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.t-row {
  display: grid;
  grid-template-columns: 36px 1fr 20px 1fr;
  gap: var(--sp-2);
  align-items: center;
  font-size: var(--fs-xs);
}
.t-k {
  color: var(--text-2);
}
.t-track {
  height: 4px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  overflow: hidden;
}
.t-track span {
  display: block;
  height: 100%;
  background: var(--c-lavender);
}
.t-n {
  text-align: right;
}
.t-who {
  color: var(--accent-ink);
  letter-spacing: 0.12em;
}
.t-sep {
  height: 1px;
  margin: 4px 0;
  background: var(--hairline);
}
.tables {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-8);
}
.block {
  display: grid;
  gap: var(--sp-2);
  min-width: 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}
th,
td {
  padding: 7px 6px;
  text-align: left;
  border-bottom: 1px solid var(--hairline);
  white-space: nowrap;
}
tbody th {
  font-weight: var(--fw-medium);
}
tbody tr.hi {
  background: var(--accent-soft);
}
.block tbody tr {
  cursor: pointer;
}
.r {
  text-align: right;
}
.glyph {
  display: inline-block;
  width: 1.5em;
  color: var(--accent-ink);
}
.glyph.sign {
  color: var(--text-2);
}
.hn {
  display: inline-block;
  width: 1.5em;
  color: var(--text-3);
}
.tag {
  font-size: var(--fs-xs);
}
.asp {
  display: inline-block;
  min-width: 1.4em;
  text-align: center;
  font-weight: var(--fw-medium);
}
.asp.harmony {
  color: var(--sage-ink);
}
.asp.tension {
  color: var(--clay-ink);
}
.asp.neutral {
  color: var(--accent-ink);
}
.asp-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--sp-8);
  align-items: start;
}
.asp-list {
  display: grid;
  gap: 2px;
}
.asp-list li {
  display: grid;
  grid-template-columns: 1.5em 56px 1.6em 1.5em 56px 1fr auto;
  gap: 4px;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid var(--hairline);
  font-size: var(--fs-sm);
}
.tw {
  overflow-x: auto;
}
.grid th,
.grid td {
  text-align: center;
  padding: 2px;
  width: 24px;
  height: 24px;
  border: 0;
  font-size: var(--fs-xs);
}
.grid td.blank {
  background: transparent;
}
.grid td:not(.blank) {
  background: var(--surface-sunken);
}
.grid td.hi:not(.blank) {
  background: var(--accent-soft);
}
.orbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 4px;
  font-size: var(--fs-sm);
  margin-bottom: var(--sp-3);
}
@media (max-width: 1000px) {
  .top,
  .tables,
  .asp-wrap {
    grid-template-columns: 1fr;
  }
  .wheel-col {
    max-width: 520px;
    margin: 0 auto;
  }
}
</style>
