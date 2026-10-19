<script setup lang="ts">
import { computed } from 'vue'
import { fmtDms } from '@/engines/western/chart'
import { ASPECTS, BODY_META, ELEMENT_ZH, HOUSE_ZH, MODALITY_ZH, SIGNS, type BodyId } from '@/engines/western/tables'
import type { WesternChart } from '@/types'

const props = defineProps<{ chart: WesternChart; highlight?: BodyId | null }>()
const emit = defineEmits<{ select: [id: BodyId | null] }>()

const DIGNITY_ZH: Record<string, string> = { domicile: '入庙', exaltation: '擢升', detriment: '落陷', fall: '弱势' }
const gridIds = computed(() => props.chart.bodies.filter((b) => ['luminary', 'planet', 'outer', 'asteroid'].includes(b.kind) || ['chiron', 'northNode', 'asc', 'mc'].includes(b.id)).map((b) => b.id))
const cell = (a: BodyId, b: BodyId) => props.chart.aspects.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
const aspectsOf = (id: BodyId) => props.chart.aspects.filter((x) => x.a === id || x.b === id)
const glyphs = (ids: BodyId[]) => ids.map((id) => BODY_META[id].glyph).join(' ')
const total = computed(() => Object.values(props.chart.tally.elements).reduce((a, v) => a + v.length, 0))
</script>

<template>
  <div class="tables">
    <section class="block">
      <h3 class="t-label">行星 Planets</h3>
      <div class="tw">
        <table>
          <thead>
            <tr><th scope="col">星体</th><th scope="col">星座</th><th scope="col" class="r">度数</th><th scope="col" class="r">宫位</th><th scope="col">状态</th></tr>
          </thead>
          <tbody>
            <tr v-for="b in chart.bodies" :key="b.id" :class="{ hi: highlight === b.id }" @click="emit('select', highlight === b.id ? null : b.id)">
              <th scope="row"><span class="glyph">{{ b.glyph }}</span> {{ b.zh }} <span class="t-faint">{{ b.en }}</span></th>
              <td><span class="glyph">{{ SIGNS[b.sign].glyph }}</span> {{ SIGNS[b.sign].zh }}</td>
              <td class="r t-num">{{ fmtDms(b.signDeg) }}</td>
              <td class="r t-num">{{ b.house }}</td>
              <td class="t-muted">
                <span v-if="b.retrograde" class="badge">℞ 逆行</span>
                <span v-if="b.dignity" class="badge">{{ DIGNITY_ZH[b.dignity] }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="block">
      <h3 class="t-label">宫位 Houses · {{ chart.settings.houseSystem }}</h3>
      <div class="tw">
        <table>
          <thead><tr><th scope="col">宫</th><th scope="col">宫头星座</th><th scope="col" class="r">度数</th><th scope="col">宫主星</th></tr></thead>
          <tbody>
            <tr v-for="h in chart.houses" :key="h.n">
              <th scope="row"><span class="t-num">{{ h.n }}</span> <span class="t-faint">{{ HOUSE_ZH[h.n - 1] }}</span></th>
              <td><span class="glyph">{{ SIGNS[h.sign].glyph }}</span> {{ SIGNS[h.sign].zh }}</td>
              <td class="r t-num">{{ fmtDms(h.signDeg) }}</td>
              <td><span class="glyph">{{ BODY_META[h.ruler].glyph }}</span> {{ BODY_META[h.ruler].zh }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="block wide">
      <h3 class="t-label">相位 Aspects <span class="t-faint">· {{ chart.aspects.length }} 个</span></h3>
      <div class="tw">
        <table class="grid">
          <thead>
            <tr><th></th><th v-for="id in gridIds" :key="id" scope="col"><span class="glyph">{{ BODY_META[id].glyph }}</span></th></tr>
          </thead>
          <tbody>
            <tr v-for="(ra, i) in gridIds" :key="ra">
              <th scope="row"><span class="glyph">{{ BODY_META[ra].glyph }}</span></th>
              <td v-for="(cb, j) in gridIds" :key="cb" :class="{ blank: j >= i, hi: highlight === ra || highlight === cb }">
                <template v-if="j < i && cell(ra, cb)">
                  <span class="asp" :class="cell(ra, cb)!.def.tone" :title="`${BODY_META[ra].zh}${cell(ra, cb)!.def.zh}${BODY_META[cb].zh} 容许度 ${cell(ra, cb)!.orb.toFixed(2)}°`">{{ cell(ra, cb)!.def.glyph }}</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <details class="list">
        <summary class="t-sm">{{ highlight ? `${BODY_META[highlight].zh}的相位` : '相位列表' }}</summary>
        <ul>
          <li v-for="(a, i) in highlight ? aspectsOf(highlight) : chart.aspects" :key="i">
            <span class="glyph">{{ BODY_META[a.a].glyph }}</span> {{ BODY_META[a.a].zh }}
            <span class="asp" :class="a.def.tone">{{ a.def.glyph }}</span> {{ a.def.zh }}
            <span class="glyph">{{ BODY_META[a.b].glyph }}</span> {{ BODY_META[a.b].zh }}
            <span class="t-num t-muted">{{ a.orb.toFixed(2) }}° {{ a.applying ? '入相' : '出相' }}</span>
          </li>
        </ul>
      </details>
    </section>

    <section class="block">
      <h3 class="t-label">元素 · 模式 <span class="t-faint">· 十大行星 + 上升</span></h3>
      <ul class="tally">
        <li v-for="(ids, k) in chart.tally.elements" :key="k">
          <span class="tk">{{ ELEMENT_ZH[k] }}</span>
          <span class="track"><span :style="{ width: `${(ids.length / total) * 100}%` }" /></span>
          <span class="t-num">{{ ids.length }}</span>
          <span class="who">{{ glyphs(ids) }}</span>
        </li>
      </ul>
      <ul class="tally">
        <li v-for="(ids, k) in chart.tally.modalities" :key="k">
          <span class="tk">{{ MODALITY_ZH[k] }}</span>
          <span class="track"><span :style="{ width: `${(ids.length / total) * 100}%` }" /></span>
          <span class="t-num">{{ ids.length }}</span>
          <span class="who">{{ glyphs(ids) }}</span>
        </li>
      </ul>
      <p class="t-caption">
        阳性 {{ chart.tally.polarity.positive.length }} · 阴性 {{ chart.tally.polarity.negative.length }} ·
        东 {{ chart.tally.hemispheres.east }} 西 {{ chart.tally.hemispheres.west }} · 南 {{ chart.tally.hemispheres.south }} 北 {{ chart.tally.hemispheres.north }} ·
        月相 {{ chart.moonPhase.zh }} {{ chart.moonPhase.illumination }}%
      </p>
    </section>
    <section class="block">
      <h3 class="t-label">相位设定</h3>
      <ul class="orbs">
        <li v-for="a in ASPECTS" :key="a.id"><span class="asp" :class="a.tone">{{ a.glyph }}</span> {{ a.zh }} <span class="t-num t-muted">{{ a.angle }}° ± {{ chart.settings.orbs?.[a.id] ?? a.orb }}°</span></li>
      </ul>
      <p class="t-caption">日月相位容许度 +{{ chart.settings.luminaryBonus }}°；交点、福点、上升、天顶只取主相位，容许度 ≤ 5°。</p>
    </section>
  </div>
</template>

<style scoped>
.tables {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-6);
}
.block {
  display: grid;
  gap: var(--sp-3);
  align-content: start;
  min-width: 0;
}
.wide {
  grid-column: 1 / -1;
}
.tw {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}
th,
td {
  padding: 7px 8px;
  text-align: left;
  border-bottom: 1px solid var(--hairline);
  white-space: nowrap;
}
thead th {
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--text-2);
}
tbody th {
  font-weight: var(--fw-medium);
}
tbody tr {
  cursor: pointer;
}
tbody tr.hi {
  background: var(--accent-soft);
}
.r {
  text-align: right;
}
.glyph {
  display: inline-block;
  min-width: 1.2em;
  text-align: center;
  color: var(--accent-ink);
}
.badge {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 6px;
  border-radius: var(--r-xs);
  font-size: var(--fs-2xs);
  box-shadow: inset 0 0 0 1px var(--hairline-2);
}
.grid th,
.grid td {
  text-align: center;
  padding: 4px;
  width: 28px;
  height: 28px;
}
.grid td.blank {
  background: var(--surface-sunken);
}
.grid td.hi {
  background: var(--accent-soft);
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
.list summary {
  cursor: pointer;
  color: var(--text-2);
}
.list ul {
  display: grid;
  gap: 4px;
  margin-top: var(--sp-2);
  font-size: var(--fs-sm);
}
.tally {
  display: grid;
  gap: 6px;
}
.tally li {
  display: grid;
  grid-template-columns: 40px 1fr 24px 1fr;
  gap: var(--sp-2);
  align-items: center;
  font-size: var(--fs-sm);
}
.tk {
  color: var(--text-2);
}
.track {
  height: 6px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  overflow: hidden;
}
.track span {
  display: block;
  height: 100%;
  background: var(--c-lavender);
}
.who {
  color: var(--accent-ink);
  letter-spacing: 0.1em;
}
.orbs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  font-size: var(--fs-sm);
}
@media (max-width: 900px) {
  .tables {
    grid-template-columns: 1fr;
  }
}
</style>
