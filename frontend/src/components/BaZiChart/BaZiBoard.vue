<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import LqTag from '@/components/ui/LqTag.vue'
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
    const { STEM_ELEMENT, BRANCH_ELEMENT, nayin } = tables
    cols.push({
      key, label, sub, stem: s, branch: b, stemChar: STEMS[s], branchChar: tables.BRANCHES[b], stemTenGod: tenGod(dm, s),
      hidden: HIDDEN_STEMS[b].map((h) => ({ stemChar: STEMS[h], tenGod: tenGod(dm, h), element: STEM_ELEMENT[h] })),
      lifeStage: lifeStage(dm, b), selfSeat: lifeStage(s, b), naYin: nayin(sexa), kongWang: tables.xunKong(c.pillars[2].sexagenary).includes(b),
      stemElement: STEM_ELEMENT[s], branchElement: BRANCH_ELEMENT[b], shensha: [], transit: true,
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
const label = (k: string) => ({ year: '年', month: '月', day: '日', hour: '时', luck: '大运', annual: '流年' })[k] ?? k

const seasonZh: Record<string, string> = { 旺: '旺', 相: '相', 休: '休', 囚: '囚', 死: '死' }
const thisYear = new Date().getFullYear()
</script>

<template>
  <div class="board">
    <!-- Header facts -->
    <dl class="facts">
      <div><dt>公历</dt><dd class="t-num">{{ chart.time.civil.year }}-{{ String(chart.time.civil.month).padStart(2, '0') }}-{{ String(chart.time.civil.day).padStart(2, '0') }} {{ String(chart.time.civil.hour).padStart(2, '0') }}:{{ String(chart.time.civil.minute).padStart(2, '0') }} <span class="t-faint">{{ chart.time.dst ? '夏令时' : '' }}</span></dd></div>
      <div><dt>农历</dt><dd class="t-cjk">{{ chart.lunar.text }} · 属{{ chart.lunar.animal }}</dd></div>
      <div><dt>真太阳时</dt><dd class="t-num">{{ chart.time.trueSolar.slice(11) }} <span class="t-faint">({{ chart.time.solarCorrectionMinutes > 0 ? '+' : '' }}{{ chart.time.solarCorrectionMinutes }} 分钟)</span></dd></div>
      <div><dt>排盘依据</dt><dd>{{ chart.options.trueSolarTime ? '真太阳时' : '标准时' }} · 晚子时{{ chart.options.lateZi === 'next-day' ? '换日' : '不换日' }} · {{ chart.sunSign }}</dd></div>
      <div><dt>节气</dt><dd class="t-num">{{ chart.terms.previous.name }} {{ chart.terms.previous.at.slice(0, 16) }} → {{ chart.terms.next.name }} {{ chart.terms.next.at.slice(0, 16) }}</dd></div>
      <div><dt>起运</dt><dd class="t-num">出生后 {{ chart.luck.startAge.years }}年{{ chart.luck.startAge.months }}月{{ chart.luck.startAge.days }}天 · {{ chart.luck.startDate }} 交运 · {{ chart.luck.forward ? '顺行' : '逆行' }}</dd></div>
      <div><dt>命宫 / 身宫</dt><dd class="t-cjk">{{ chart.palaces.mingGong }} / {{ chart.palaces.shenGong }}</dd></div>
      <div><dt>胎元 / 胎息</dt><dd class="t-cjk">{{ chart.palaces.taiYuan }} / {{ chart.palaces.taiXi }}</dd></div>
      <div><dt>空亡</dt><dd class="t-cjk">日柱 {{ chart.kongWang.day }} · 年柱 {{ chart.kongWang.year }}</dd></div>
    </dl>

    <!-- Pillar grid -->
    <div class="grid-wrap lq-well">
      <table class="pillars" :style="{ '--cols': columns.length }">
        <thead>
          <tr>
            <th scope="col" class="rh"></th>
            <th v-for="c in columns" :key="c.key" scope="col" :class="{ day: c.key === 'day', transit: c.transit }">
              <span class="t-cjk">{{ c.label }}</span>
              <span v-if="c.sub" class="t-faint sub">{{ c.sub }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" class="rh">主星</th>
            <td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }" class="t-cjk small">{{ c.stemTenGod }}</td>
          </tr>
          <tr class="glyph-row">
            <th scope="row" class="rh">天干</th>
            <td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }">
              <span class="glyph" :style="{ color: el(c.stemElement) }">{{ c.stemChar }}</span>
              <span class="el t-cjk">{{ ELEMENT_ZH[c.stemElement] }}</span>
            </td>
          </tr>
          <tr class="glyph-row">
            <th scope="row" class="rh">地支</th>
            <td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }">
              <span class="glyph" :style="{ color: el(c.branchElement) }">{{ c.branchChar }}</span>
              <span class="el t-cjk">{{ ELEMENT_ZH[c.branchElement] }}</span>
            </td>
          </tr>
          <tr>
            <th scope="row" class="rh">藏干</th>
            <td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }">
              <div class="hidden">
                <span v-for="h in c.hidden" :key="h.stemChar" class="hs">
                  <b :style="{ color: el(h.element) }">{{ h.stemChar }}</b><span class="t-muted">{{ TEN_GOD_SHORT[h.tenGod] }}</span>
                </span>
              </div>
            </td>
          </tr>
          <tr>
            <th scope="row" class="rh">星运</th>
            <td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }" class="t-cjk small">{{ c.lifeStage }}</td>
          </tr>
          <tr>
            <th scope="row" class="rh">自坐</th>
            <td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }" class="t-cjk small t-muted">{{ c.selfSeat }}</td>
          </tr>
          <tr>
            <th scope="row" class="rh">空亡</th>
            <td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }" class="small">{{ c.kongWang ? '空亡' : '—' }}</td>
          </tr>
          <tr>
            <th scope="row" class="rh">纳音</th>
            <td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }" class="t-cjk small t-muted">{{ c.naYin }}</td>
          </tr>
          <tr>
            <th scope="row" class="rh">神煞</th>
            <td v-for="c in columns" :key="c.key" :class="{ day: c.key === 'day' }">
              <div class="ss">
                <span v-for="s in c.shensha" :key="s" class="t-cjk">{{ s }}</span>
                <span v-if="!c.shensha.length" class="t-faint">—</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Relations -->
    <section class="block">
      <h3 class="t-label">干支关系 <span class="t-faint">命局</span></h3>
      <div v-if="chart.relations.length" class="row-wrap">
        <LqTag v-for="(r, i) in chart.relations" :key="i" :tone="r.tone === 'harmony' ? 'var(--harmony)' : 'var(--tension)'">
          {{ r.members.map(label).join('') }} {{ r.note }}
        </LqTag>
      </div>
      <p v-else class="t-sm t-muted">命局四柱之间没有合冲刑害。</p>
      <template v-if="transitRelations.length">
        <h3 class="t-label">大运 / 流年 与命局</h3>
        <div class="row-wrap">
          <LqTag v-for="(r, i) in transitRelations" :key="'t' + i" :tone="r.tone === 'harmony' ? 'var(--harmony)' : 'var(--tension)'">
            {{ r.members.map(label).join('·') }} {{ r.note }}
          </LqTag>
        </div>
      </template>
    </section>

    <!-- Five elements & strength -->
    <div class="split">
      <section class="block">
        <h3 class="t-label">五行旺衰 <span class="t-faint">· 按位置权重与月令旺相休囚死加权</span></h3>
        <ul class="wx">
          <li v-for="k in (['wood', 'fire', 'earth', 'metal', 'water'] as FiveElement[])" :key="k">
            <span class="wx-name"><b class="t-cjk" :style="{ color: el(k) }">{{ ELEMENT_ZH[k] }}</b> <span class="t-faint t-sm">{{ seasonZh[chart.strength.season[k]] }}</span></span>
            <span class="wx-track"><span class="wx-fill" :style="{ width: `${chart.strength.percent[k]}%`, background: el(k) }" /></span>
            <span class="t-num wx-val">{{ fmt1(chart.strength.percent[k]) }}%</span>
            <span class="t-num t-faint wx-cnt">{{ chart.strength.counts[k] }}个</span>
          </li>
        </ul>
      </section>
      <section class="block">
        <h3 class="t-label">日主强弱 · 格局</h3>
        <p class="verdict">
          <b class="t-cjk">{{ chart.dayMaster.stemChar }}{{ ELEMENT_ZH[chart.dayMaster.element] }}</b>日主
          <span class="big t-cjk">{{ chart.strength.verdict }}</span>
          <span class="t-num t-muted">同党 {{ fmt1(chart.strength.selfParty) }}%</span>
        </p>
        <div class="row-wrap">
          <LqTag :tone="chart.strength.support.ling ? 'var(--harmony)' : 'var(--text-3)'">{{ chart.strength.support.ling ? '得令' : '失令' }}</LqTag>
          <LqTag :tone="chart.strength.support.di ? 'var(--harmony)' : 'var(--text-3)'">{{ chart.strength.support.di ? '得地' : '失地' }}</LqTag>
          <LqTag :tone="chart.strength.support.shi ? 'var(--harmony)' : 'var(--text-3)'">{{ chart.strength.support.shi ? '得势' : '失势' }}</LqTag>
        </div>
        <dl class="kv">
          <div><dt>格局</dt><dd class="t-cjk">{{ chart.strength.pattern }}</dd></div>
          <div><dt>喜用</dt><dd class="t-cjk">{{ elZh(chart.strength.favourable) }}</dd></div>
          <div><dt>忌神</dt><dd class="t-cjk">{{ elZh(chart.strength.unfavourable) }}</dd></div>
        </dl>
        <p class="t-caption">扶抑法参考：身强喜克泄耗，身弱喜生扶。取用仍需结合调候与通关。</p>
      </section>
    </div>

    <!-- Luck cycles -->
    <section class="block">
      <h3 class="t-label">大运 <span class="t-faint">· 点选查看流年</span></h3>
      <ol class="strip">
        <li v-for="l in chart.luck.pillars" :key="l.index">
          <button type="button" class="cell" :class="{ on: l.index === luckIndex, now: l.startYear <= thisYear && thisYear <= l.endYear }" @click="store.selectLuck(l.index)">
            <span class="t-num t-faint top">{{ l.startAge }}岁 · {{ l.startYear }}</span>
            <span class="tg t-cjk">{{ TEN_GOD_SHORT[l.stemTenGod] }}</span>
            <span class="gz t-cjk"><b :style="{ color: el(tables.STEM_ELEMENT[l.sexagenary % 10]) }">{{ l.stemChar }}</b><b :style="{ color: el(tables.BRANCH_ELEMENT[l.sexagenary % 12]) }">{{ l.branchChar }}</b></span>
            <span class="tg t-cjk t-muted">{{ TEN_GOD_SHORT[l.branchMainTenGod] }} · {{ l.lifeStage }}</span>
          </button>
        </li>
      </ol>
    </section>
    <section v-if="annual.length" class="block">
      <h3 class="t-label">流年 <span class="t-faint">· {{ selectedLuck?.stemChar }}{{ selectedLuck?.branchChar }}运 · 点选查看流月</span></h3>
      <ol class="strip">
        <li v-for="a in annual" :key="a.year">
          <button type="button" class="cell" :class="{ on: a.year === annualYear, now: a.year === thisYear }" @click="store.selectYear(a.year)">
            <span class="t-num t-faint top">{{ a.year }} · {{ a.nominalAge }}虚岁</span>
            <span class="tg t-cjk">{{ TEN_GOD_SHORT[a.stemTenGod] }}</span>
            <span class="gz t-cjk"><b :style="{ color: el(tables.STEM_ELEMENT[a.sexagenary % 10]) }">{{ a.stemChar }}</b><b :style="{ color: el(tables.BRANCH_ELEMENT[a.sexagenary % 12]) }">{{ a.branchChar }}</b></span>
            <span class="tg t-cjk t-muted">{{ TEN_GOD_SHORT[a.branchMainTenGod] }} · {{ a.lifeStage }}</span>
          </button>
        </li>
      </ol>
    </section>
    <section v-if="monthly.length" class="block">
      <h3 class="t-label">流月 <span class="t-faint">· {{ annualYear }}年 · 以节气为界</span></h3>
      <ol class="strip months">
        <li v-for="m in monthly" :key="m.index">
          <div class="cell static">
            <span class="t-faint top t-cjk">{{ m.term }} <span class="t-num">{{ m.startsAt.slice(5, 10) }}</span></span>
            <span class="tg t-cjk">{{ TEN_GOD_SHORT[m.stemTenGod] }}</span>
            <span class="gz t-cjk"><b :style="{ color: el(tables.STEM_ELEMENT[m.sexagenary % 10]) }">{{ m.stemChar }}</b><b :style="{ color: el(tables.BRANCH_ELEMENT[m.sexagenary % 12]) }">{{ m.branchChar }}</b></span>
            <span class="tg t-cjk t-muted">{{ TEN_GOD_SHORT[m.branchMainTenGod] }}</span>
          </div>
        </li>
      </ol>
    </section>

    <!-- Shensha detail -->
    <section class="block">
      <h3 class="t-label">神煞详解</h3>
      <ul class="ss-list">
        <li v-for="s in chart.shensha" :key="s.name">
          <span class="dot" :class="s.kind" aria-hidden="true" />
          <b class="t-cjk">{{ s.name }}</b>
          <span class="t-faint t-sm">{{ s.pillars.map(label).join('·') }}柱</span>
          <span class="t-muted t-sm t-cjk">{{ s.note }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  gap: var(--sp-6);
}
.facts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--sp-3) var(--sp-5);
}
.facts dt {
  font-size: var(--fs-xs);
  color: var(--text-2);
}
.facts dd {
  font-size: var(--fs-sm);
  margin-top: 2px;
}
.grid-wrap {
  overflow-x: auto;
  padding: var(--sp-2) var(--sp-3);
}
.pillars {
  width: 100%;
  min-width: calc(72px + var(--cols) * 112px);
  border-collapse: collapse;
}
.pillars th,
.pillars td {
  padding: 8px 6px;
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px solid var(--hairline);
}
.pillars tbody tr:last-child td {
  border-bottom: 0;
}
.rh {
  width: 64px;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--text-2);
  text-align: left !important;
}
thead th {
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  display: table-cell;
}
thead th .sub {
  display: block;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-regular);
}
.day {
  background: color-mix(in srgb, var(--c-lavender) 8%, transparent);
}
thead th.transit {
  color: var(--accent-ink);
}
.small {
  font-size: var(--fs-xs);
}
.glyph-row td {
  padding: 10px 6px;
}
.glyph {
  display: block;
  font-size: 34px;
  line-height: 1.1;
  font-weight: 500;
}
.el {
  display: block;
  margin-top: 2px;
  font-size: var(--fs-2xs);
  color: var(--text-3);
}
.hidden {
  display: grid;
  gap: 2px;
  justify-items: center;
}
.hs {
  display: inline-flex;
  gap: 4px;
  font-size: var(--fs-xs);
}
.hs b {
  font-weight: var(--fw-medium);
}
.ss {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px 8px;
  font-size: var(--fs-2xs);
  color: var(--text-2);
  max-width: 120px;
  margin: 0 auto;
}
.block {
  display: grid;
  gap: var(--sp-3);
}
.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-7);
}
.wx {
  display: grid;
  gap: var(--sp-2);
}
.wx li {
  display: grid;
  grid-template-columns: 64px 1fr 56px 36px;
  gap: var(--sp-3);
  align-items: center;
  font-size: var(--fs-sm);
}
.wx-track {
  height: 8px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  box-shadow: inset 0 0 0 1px var(--hairline);
  overflow: hidden;
}
.wx-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition: width var(--dur-slow) var(--ease-spring);
}
.wx-val {
  text-align: right;
}
.wx-cnt {
  font-size: var(--fs-xs);
  text-align: right;
}
.verdict {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--sp-2);
}
.big {
  font-size: var(--fs-xl);
  font-weight: var(--fw-medium);
}
.kv {
  display: grid;
  gap: 6px;
  font-size: var(--fs-sm);
}
.kv div {
  display: flex;
  gap: var(--sp-3);
}
.kv dt {
  width: 3em;
  color: var(--text-2);
}
.strip {
  display: flex;
  gap: var(--sp-2);
  overflow-x: auto;
  padding-bottom: var(--sp-2);
}
.cell {
  display: grid;
  justify-items: center;
  gap: 2px;
  min-width: 92px;
  padding: var(--sp-2) var(--sp-2) var(--sp-3);
  border: 0;
  border-radius: var(--r-md);
  background: none;
  box-shadow: inset 0 0 0 1px var(--hairline);
  color: var(--text);
  transition: background-color var(--dur-fast), box-shadow var(--dur-fast), transform var(--dur-base) var(--ease-spring);
}
button.cell:hover {
  background: var(--accent-soft);
}
button.cell:active {
  transform: scale(0.97);
}
.cell.on {
  background: color-mix(in srgb, var(--c-lavender) 14%, transparent);
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c-lavender) 60%, transparent);
}
.cell.now .top::after {
  content: ' ●';
  color: var(--c-sage);
}
.top {
  font-size: var(--fs-2xs);
  white-space: nowrap;
}
.tg {
  font-size: var(--fs-2xs);
}
.gz {
  font-size: 22px;
  line-height: 1.2;
}
.gz b {
  font-weight: var(--fw-medium);
}
.months .cell {
  min-width: 78px;
}
.ss-list {
  display: grid;
  gap: 4px;
}
.ss-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--sp-2);
  padding: 6px 0;
  border-bottom: 1px solid var(--hairline);
  font-size: var(--fs-sm);
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-3);
}
.dot.auspicious {
  background: var(--c-sage);
}
.dot.inauspicious {
  background: var(--c-clay);
}
@media (max-width: 860px) {
  .split {
    grid-template-columns: 1fr;
  }
  .glyph {
    font-size: 28px;
  }
}
</style>
