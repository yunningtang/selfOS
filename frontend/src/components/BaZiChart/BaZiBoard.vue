<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import LqCollapse from '@/components/ui/LqCollapse.vue'
import { ELEMENTS } from '@/data/lexicon'
import { computeRelations, type LabelledPillar } from '@/engines/bazi/relations'
import * as tables from '@/engines/bazi/tables'
import { ELEMENT_ZH, HIDDEN_STEMS, STEMS, TEN_GOD_SHORT, tenGod, lifeStage } from '@/engines/bazi/tables'
import { fmt1 } from '@/composables/format'
import { useDivinationStore } from '@/stores/divination'
import type { BaziChart, FiveElement, PillarKey } from '@/types'

const props = defineProps<{ chart: BaziChart }>()
const store = useDivinationStore()
const { luckIndex, annualYear, annual, monthly } = storeToRefs(store)

const PILLAR_ZH: Record<PillarKey, string> = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' }
const el = (e: FiveElement) => ELEMENTS[e].token
const elZh = (list: FiveElement[]) => list.map((e) => ELEMENT_ZH[e]).join(' ')
const thisYear = new Date().getFullYear()

const selectedLuck = computed(() => props.chart.luck.pillars.find((l) => l.index === luckIndex.value) ?? null)
const selectedAnnual = computed(() => annual.value.find((a) => a.year === annualYear.value) ?? null)

interface Column {
  key: string
  label: string
  sub?: string
  stem: number
  branch: number
  stemChar: string
  branchChar: string
  stemTenGod: string
  hidden: { stemChar: string; tenGod: string; element: FiveElement }[]
  lifeStage: string
  selfSeat: string
  naYin: string
  kongWang: boolean
  stemElement: FiveElement
  branchElement: FiveElement
  shensha: string[]
  transit?: boolean
}

const columns = computed<Column[]>(() => {
  const c = props.chart
  const dm = c.dayMaster.stem
  const cols: Column[] = c.pillars.map((p) => ({
    key: p.key, label: PILLAR_ZH[p.key], stem: p.stem, branch: p.branch, stemChar: p.stemChar, branchChar: p.branchChar,
    stemTenGod: p.stemTenGod, hidden: p.hidden.map((h) => ({ stemChar: h.stemChar, tenGod: h.tenGod, element: h.element })),
    lifeStage: p.lifeStage, selfSeat: p.selfSeat, naYin: p.naYin, kongWang: p.kongWang, stemElement: p.stemElement, branchElement: p.branchElement,
    shensha: c.shensha.filter((s) => s.pillars.includes(p.key)).map((s) => s.name),
  }))
  const extra = (key: string, label: string, sub: string, sexa: number) => {
    const s = sexa % 10, b = sexa % 12
    cols.push({
      key, label, sub, stem: s, branch: b, stemChar: STEMS[s], branchChar: tables.BRANCHES[b], stemTenGod: tenGod(dm, s),
      hidden: HIDDEN_STEMS[b].map((h) => ({ stemChar: STEMS[h], tenGod: tenGod(dm, h), element: tables.STEM_ELEMENT[h] })),
      lifeStage: lifeStage(dm, b), selfSeat: lifeStage(s, b), naYin: tables.nayin(sexa), kongWang: tables.xunKong(c.pillars[2].sexagenary).includes(b),
      stemElement: tables.STEM_ELEMENT[s], branchElement: tables.BRANCH_ELEMENT[b], shensha: [], transit: true,
    })
  }
  if (selectedLuck.value) extra('luck', '大运', `${selectedLuck.value.startAge}岁起`, selectedLuck.value.sexagenary)
  if (selectedAnnual.value) extra('annual', '流年', `${selectedAnnual.value.year}`, selectedAnnual.value.sexagenary)
  return cols
})

const transitRelations = computed(() => {
  const c = props.chart
  const pillars: LabelledPillar[] = c.pillars.map((p) => ({ key: p.key, label: PILLAR_ZH[p.key], stem: p.stem, branch: p.branch }))
  if (selectedLuck.value) pillars.push({ key: 'luck', label: '大运', stem: selectedLuck.value.sexagenary % 10, branch: selectedLuck.value.sexagenary % 12 })
  if (selectedAnnual.value) pillars.push({ key: 'annual', label: '流年', stem: selectedAnnual.value.sexagenary % 10, branch: selectedAnnual.value.sexagenary % 12 })
  return computeRelations(pillars).filter((r) => r.members.some((m) => m === 'luck' || m === 'annual'))
})
const label = (k: string) => ({ year: '年', month: '月', day: '日', hour: '时', luck: '运', annual: '流' })[k] ?? k
const shenshaBy = (kind: string) => props.chart.shensha.filter((s) => s.kind === kind)
const ELS: FiveElement[] = ['wood', 'fire', 'earth', 'metal', 'water']
</script>

<template>
  <div class="board">
    <!-- Hero: the eight characters -->
    <div class="hero">
      <ol class="pillars" :class="{ wide: columns.length > 4 }">
        <li v-for="c in columns" :key="c.key" class="pillar" :class="{ day: c.key === 'day', transit: c.transit }">
          <span class="p-label">{{ c.label }}<span v-if="c.sub" class="t-faint"> · {{ c.sub }}</span></span>
          <span class="p-god">{{ c.stemTenGod }}</span>
          <span class="p-char" :style="{ '--tone': el(c.stemElement) }">{{ c.stemChar }}</span>
          <span class="p-char" :style="{ '--tone': el(c.branchElement) }">{{ c.branchChar }}</span>
          <span class="p-hidden">
            <span v-for="h in c.hidden" :key="h.stemChar"><b :style="{ color: el(h.element) }">{{ h.stemChar }}</b>{{ TEN_GOD_SHORT[h.tenGod] }}</span>
          </span>
          <span class="p-foot">{{ c.lifeStage }}<template v-if="c.kongWang"> · 空亡</template></span>
        </li>
      </ol>
      <div class="essence">
        <p class="dm">
          <span class="dm-char" :style="{ '--tone': el(chart.dayMaster.element) }">{{ chart.dayMaster.stemChar }}</span>
          <span class="dm-text"><b>{{ ELEMENT_ZH[chart.dayMaster.element] }}命 · {{ chart.strength.verdict }}</b><span class="t-muted">{{ chart.strength.pattern }} · 同党 {{ fmt1(chart.strength.selfParty) }}%</span></span>
        </p>
        <ul class="wx">
          <li v-for="k in ELS" :key="k">
            <span class="wx-k" :style="{ color: el(k) }">{{ ELEMENT_ZH[k] }}</span>
            <span class="wx-track"><span :style="{ width: `${chart.strength.percent[k]}%`, background: el(k) }" /></span>
            <span class="t-num wx-v">{{ fmt1(chart.strength.percent[k]) }}%</span>
            <span class="t-faint wx-s">{{ chart.strength.season[k] }}</span>
          </li>
        </ul>
        <p class="t-sm"><span class="t-muted">喜用</span> {{ elZh(chart.strength.favourable) }} <span class="t-faint">·</span> <span class="t-muted">忌</span> {{ elZh(chart.strength.unfavourable) }} <span class="t-faint">·</span> {{ chart.strength.support.ling ? '得令' : '失令' }} {{ chart.strength.support.di ? '得地' : '失地' }} {{ chart.strength.support.shi ? '得势' : '失势' }}</p>
      </div>
    </div>

    <!-- Facts -->
    <dl class="facts">
      <div><dt>公历</dt><dd class="t-num">{{ chart.time.civil.year }}-{{ String(chart.time.civil.month).padStart(2, '0') }}-{{ String(chart.time.civil.day).padStart(2, '0') }} {{ String(chart.time.civil.hour).padStart(2, '0') }}:{{ String(chart.time.civil.minute).padStart(2, '0') }}<span v-if="chart.time.dst" class="t-faint"> 夏令时</span></dd></div>
      <div><dt>农历</dt><dd>{{ chart.lunar.text }} · 属{{ chart.lunar.animal }} · {{ chart.sunSign }}</dd></div>
      <div><dt>真太阳时</dt><dd class="t-num">{{ chart.time.trueSolar.slice(11, 16) }} <span class="t-faint">较标准时 {{ chart.time.solarCorrectionMinutes > 0 ? '+' : '' }}{{ chart.time.solarCorrectionMinutes }} 分</span></dd></div>
      <div><dt>节气</dt><dd class="t-num">{{ chart.terms.previous.name }} {{ chart.terms.previous.at.slice(5, 16) }} <span class="t-faint">→</span> {{ chart.terms.next.name }} {{ chart.terms.next.at.slice(5, 16) }}</dd></div>
      <div><dt>起运</dt><dd class="t-num">{{ chart.luck.startAge.years }}岁{{ chart.luck.startAge.months }}月{{ chart.luck.startAge.days }}天 · {{ chart.luck.startDate }} · {{ chart.luck.forward ? '顺行' : '逆行' }}</dd></div>
      <div><dt>宫位</dt><dd>命宫 {{ chart.palaces.mingGong }} · 身宫 {{ chart.palaces.shenGong }} · 胎元 {{ chart.palaces.taiYuan }} · 胎息 {{ chart.palaces.taiXi }}</dd></div>
      <div><dt>空亡</dt><dd>日柱 {{ chart.kongWang.day }} · 年柱 {{ chart.kongWang.year }}</dd></div>
      <div><dt>关系</dt><dd>
        <template v-if="chart.relations.length"><span v-for="(r, i) in chart.relations" :key="i" class="rel" :class="r.tone">{{ r.members.map(label).join('') }}{{ r.note }}</span></template>
        <span v-else class="t-muted">四柱之间无合冲刑害</span>
      </dd></div>
    </dl>

    <!-- Timeline -->
    <section class="timeline">
      <header class="tl-head">
        <h3>大运 · 流年 · 流月</h3>
        <p v-if="transitRelations.length" class="t-sm"><span v-for="(r, i) in transitRelations" :key="i" class="rel" :class="r.tone">{{ r.members.map(label).join('') }}{{ r.note }}</span></p>
      </header>
      <ol class="strip">
        <li v-for="l in chart.luck.pillars" :key="l.index">
          <button type="button" class="cell" :class="{ on: l.index === luckIndex, now: l.startYear <= thisYear && thisYear <= l.endYear }" @click="store.selectLuck(l.index)">
            <span class="c-top t-num">{{ l.startAge }}<span class="t-faint">岁</span></span>
            <span class="c-god">{{ TEN_GOD_SHORT[l.stemTenGod] }}</span>
            <span class="c-gz" :style="{ color: el(tables.STEM_ELEMENT[l.sexagenary % 10]) }">{{ l.stemChar }}</span>
            <span class="c-gz" :style="{ color: el(tables.BRANCH_ELEMENT[l.sexagenary % 12]) }">{{ l.branchChar }}</span>
            <span class="c-sub">{{ TEN_GOD_SHORT[l.branchMainTenGod] }} · <span class="t-num">{{ l.startYear }}</span></span>
          </button>
        </li>
      </ol>
      <ol v-if="annual.length" class="strip nested">
        <li v-for="a in annual" :key="a.year">
          <button type="button" class="cell" :class="{ on: a.year === annualYear, now: a.year === thisYear }" @click="store.selectYear(a.year)">
            <span class="c-top t-num">{{ a.year }}</span>
            <span class="c-god">{{ TEN_GOD_SHORT[a.stemTenGod] }}</span>
            <span class="c-gz" :style="{ color: el(tables.STEM_ELEMENT[a.sexagenary % 10]) }">{{ a.stemChar }}</span>
            <span class="c-gz" :style="{ color: el(tables.BRANCH_ELEMENT[a.sexagenary % 12]) }">{{ a.branchChar }}</span>
            <span class="c-sub">{{ TEN_GOD_SHORT[a.branchMainTenGod] }} · {{ a.nominalAge }}虚岁</span>
          </button>
        </li>
      </ol>
      <ol v-if="monthly.length" class="strip nested months">
        <li v-for="m in monthly" :key="m.index">
          <div class="cell static">
            <span class="c-top">{{ m.term }} <span class="t-num t-faint">{{ m.startsAt.slice(5, 10) }}</span></span>
            <span class="c-god">{{ TEN_GOD_SHORT[m.stemTenGod] }}</span>
            <span class="c-gz" :style="{ color: el(tables.STEM_ELEMENT[m.sexagenary % 10]) }">{{ m.stemChar }}</span>
            <span class="c-gz" :style="{ color: el(tables.BRANCH_ELEMENT[m.sexagenary % 12]) }">{{ m.branchChar }}</span>
            <span class="c-sub">{{ TEN_GOD_SHORT[m.branchMainTenGod] }}</span>
          </div>
        </li>
      </ol>
    </section>

    <!-- Detail -->
    <LqCollapse title="四柱详表" summary="藏干 · 星运 · 自坐 · 纳音 · 神煞">
      <div class="tw">
        <table class="detail">
          <thead><tr><th></th><th v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }">{{ c.label }}</th></tr></thead>
          <tbody>
            <tr><th>干支</th><td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }"><b :style="{ color: el(c.stemElement) }">{{ c.stemChar }}</b><b :style="{ color: el(c.branchElement) }">{{ c.branchChar }}</b></td></tr>
            <tr><th>主星</th><td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }">{{ c.stemTenGod }}</td></tr>
            <tr><th>藏干</th><td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }"><span v-for="h in c.hidden" :key="h.stemChar" class="hs"><b :style="{ color: el(h.element) }">{{ h.stemChar }}</b><span class="t-muted">{{ h.tenGod }}</span></span></td></tr>
            <tr><th>星运</th><td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }">{{ c.lifeStage }}</td></tr>
            <tr><th>自坐</th><td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }" class="t-muted">{{ c.selfSeat }}</td></tr>
            <tr><th>空亡</th><td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }">{{ c.kongWang ? '空亡' : '—' }}</td></tr>
            <tr><th>纳音</th><td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }" class="t-muted">{{ c.naYin }}</td></tr>
            <tr><th>神煞</th><td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }" class="ss">{{ c.shensha.join('、') || '—' }}</td></tr>
          </tbody>
        </table>
      </div>
    </LqCollapse>

    <LqCollapse title="神煞" :summary="`吉 ${shenshaBy('auspicious').length} · 凶 ${shenshaBy('inauspicious').length} · 中性 ${shenshaBy('neutral').length}`">
      <div class="ss-groups">
        <div v-for="k in ['auspicious', 'inauspicious', 'neutral']" :key="k" class="ss-group">
          <h4 class="t-label">{{ k === 'auspicious' ? '吉神' : k === 'inauspicious' ? '凶煞' : '中性' }}</h4>
          <ul>
            <li v-for="s in shenshaBy(k)" :key="s.name"><b>{{ s.name }}</b><span class="t-faint">{{ s.pillars.map(label).join('') }}柱</span><span class="t-muted">{{ s.note }}</span></li>
          </ul>
        </div>
      </div>
    </LqCollapse>

    <LqCollapse title="旺衰算法说明">
      <p class="t-sm t-muted algo">每字按位置加权（年干 1.0、月干 1.2、日干 1.0、时干 1.0；年支 1.0、月支 1.6、日支 1.2、时支 1.0），地支取藏干本气 1.0、中气 0.5、余气 0.3，再乘以月令旺相休囚死系数（1.3 / 1.15 / 0.9 / 0.75 / 0.6）。同党为日主与生我之五行；≥55% 为身强，≤45% 为身弱，其余中和。喜用按扶抑法给出，仅作参考，取用仍需结合调候与通关。</p>
    </LqCollapse>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  gap: var(--sp-7);
}

/* ── Hero ─────────────────────────────────────────────── */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--sp-8);
  align-items: start;
}
.pillars {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sp-3);
}
.pillars.wide {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}
.pillar {
  --tone: var(--text-2);
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: var(--sp-4) var(--sp-2) var(--sp-4);
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.pillar.day {
  background: linear-gradient(180deg, color-mix(in srgb, var(--c-lavender) 10%, var(--surface)), var(--surface));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c-lavender) 35%, transparent);
}
.pillar.transit {
  background: var(--surface-sunken);
}
.p-label {
  font-size: var(--fs-xs);
  color: var(--text-2);
}
.p-god {
  font-size: var(--fs-xs);
  color: var(--text-3);
}
.p-char {
  font-size: 44px;
  line-height: 1.15;
  font-weight: 500;
  color: var(--tone);
  text-shadow: 0 0 22px color-mix(in srgb, var(--tone) 35%, transparent);
}
.p-char + .p-char {
  margin-top: -4px;
}
.p-hidden {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px 8px;
  margin-top: 6px;
  font-size: var(--fs-2xs);
  color: var(--text-2);
}
.p-hidden b {
  font-weight: var(--fw-medium);
  margin-right: 1px;
}
.p-foot {
  font-size: var(--fs-2xs);
  color: var(--text-3);
}
.essence {
  display: grid;
  gap: var(--sp-4);
  padding: var(--sp-5);
  border-radius: var(--r-lg);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.dm {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
}
.dm-char {
  --tone: var(--text-2);
  font-size: 40px;
  line-height: 1;
  font-weight: 500;
  color: var(--tone);
  text-shadow: 0 0 22px color-mix(in srgb, var(--tone) 40%, transparent);
}
.dm-text {
  display: grid;
  gap: 2px;
  font-size: var(--fs-sm);
}
.dm-text b {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}
.wx {
  display: grid;
  gap: 8px;
}
.wx li {
  display: grid;
  grid-template-columns: 20px 1fr 52px 16px;
  gap: var(--sp-2);
  align-items: center;
  font-size: var(--fs-sm);
}
.wx-k {
  font-weight: var(--fw-medium);
}
.wx-track {
  height: 5px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  overflow: hidden;
}
.wx-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width var(--dur-slow) var(--ease-spring);
}
.wx-v {
  text-align: right;
}
.wx-s {
  font-size: var(--fs-2xs);
}

/* ── Facts ────────────────────────────────────────────── */
.facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 var(--sp-8);
}
.facts div {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: var(--sp-3);
  padding: 10px 0;
  border-top: 1px solid var(--hairline);
  font-size: var(--fs-sm);
}
.facts dt {
  color: var(--text-2);
}
.facts dd {
  min-width: 0;
}
.rel {
  display: inline-block;
  margin: 0 8px 2px 0;
}
.rel.harmony {
  color: var(--sage-ink);
}
.rel.tension {
  color: var(--clay-ink);
}

/* ── Timeline ─────────────────────────────────────────── */
.timeline {
  display: grid;
  gap: var(--sp-3);
}
.tl-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
}
.tl-head h3 {
  font-size: var(--fs-md);
}
.strip {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.strip.nested {
  padding-left: var(--sp-4);
  border-left: 2px solid var(--hairline-2);
}
.cell {
  display: grid;
  justify-items: center;
  gap: 1px;
  min-width: 76px;
  padding: 10px 8px;
  border: 0;
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
  color: var(--text);
  transition: background-color var(--dur-fast), box-shadow var(--dur-fast), transform var(--dur-base) var(--ease-spring);
}
button.cell:hover {
  box-shadow: inset 0 0 0 1px var(--hairline-3);
}
button.cell:active {
  transform: scale(0.97);
}
.cell.on {
  background: color-mix(in srgb, var(--c-lavender) 12%, var(--surface));
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c-lavender) 55%, transparent);
}
.cell.now .c-top::after {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-left: 5px;
  border-radius: 50%;
  background: var(--c-sage);
  vertical-align: middle;
}
.c-top {
  font-size: var(--fs-2xs);
  color: var(--text-2);
  white-space: nowrap;
}
.c-god {
  font-size: var(--fs-2xs);
  color: var(--text-3);
}
.c-gz {
  font-size: 26px;
  line-height: 1.1;
  font-weight: var(--fw-medium);
}
.c-sub {
  font-size: var(--fs-2xs);
  color: var(--text-3);
  white-space: nowrap;
}
.months .cell {
  min-width: 68px;
}

/* ── Detail table ─────────────────────────────────────── */
.tw {
  overflow-x: auto;
}
.detail {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}
.detail th,
.detail td {
  padding: 9px 8px;
  text-align: center;
  border-bottom: 1px solid var(--hairline);
  vertical-align: top;
}
.detail thead th {
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--text-2);
}
.detail tbody th {
  width: 56px;
  text-align: left;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--text-2);
}
.detail .day {
  background: color-mix(in srgb, var(--c-lavender) 6%, transparent);
}
.detail b {
  font-weight: var(--fw-medium);
}
.hs {
  display: inline-flex;
  gap: 3px;
  margin: 0 5px;
  font-size: var(--fs-xs);
}
.ss {
  font-size: var(--fs-xs);
  color: var(--text-2);
  max-width: 160px;
  line-height: 1.7;
}
.ss-groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-6);
}
.ss-group ul {
  display: grid;
  gap: 2px;
  margin-top: var(--sp-2);
}
.ss-group li {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: var(--sp-2);
  align-items: baseline;
  padding: 6px 0;
  border-bottom: 1px solid var(--hairline);
  font-size: var(--fs-sm);
}
.ss-group li .t-faint,
.ss-group li .t-muted {
  font-size: var(--fs-xs);
}
.algo {
  max-width: 70ch;
  line-height: var(--lh-body);
}
@media (max-width: 1000px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .ss-groups {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .pillars,
  .pillars.wide {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }
  .pillars.wide {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .p-char {
    font-size: 34px;
  }
  .facts {
    grid-template-columns: 1fr;
  }
}
</style>
