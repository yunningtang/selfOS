<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import LqButton from '@/components/ui/LqButton.vue'
import LqCollapse from '@/components/ui/LqCollapse.vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import PaywallCard from '@/components/paywall/PaywallCard.vue'
import { ELEMENTS } from '@/data/lexicon'
import { BRANCH_ELEMENT, STEM_ELEMENT, TEN_GOD_SHORT } from '@selfos/destiny-core/bazi/tables'
import { analyseBazi } from '@selfos/destiny-core/bazi/analysis'
import { forecastLuck, forecastMonth, forecastYear, RATING_LABEL, type PeriodForecast, type Rating } from '@selfos/destiny-core/bazi/forecast'
import { useDivinationStore } from '@/stores/divination'
import { useI18n } from '@/i18n'
import type { BaziChart, FiveElement } from '@/types'

/**
 * 运势: the same 大运 / 流年 / 流月 strips as the 排盘 timeline (same cells, same colours, same
 * selection in the store), each cell carrying a rating badge; below, the lines behind the
 * selected period with their basis.
 */
const props = defineProps<{ chart: BaziChart; locked?: boolean }>()
const { t } = useI18n()
const store = useDivinationStore()
const { luckIndex, annualYear, annual, monthly } = storeToRefs(store)
const thisYear = new Date().getFullYear()
const el = (e: FiveElement) => ELEMENTS[e].token

const analysis = computed(() => analyseBazi(props.chart))
const lucks = computed(() => props.chart.luck.pillars.map((l) => ({ l, f: forecastLuck(props.chart, l, analysis.value) })))
const years = computed(() => annual.value.map((a) => ({ a, f: forecastYear(props.chart, a.year, analysis.value) })))
const months = computed(() => monthly.value.map((m) => ({ m, f: forecastMonth(props.chart, m, analysis.value) })))
const selectedLuck = computed(() => lucks.value.find((x) => x.l.index === luckIndex.value) ?? null)
const selectedYear = computed(() => (annualYear.value ? forecastYear(props.chart, annualYear.value, analysis.value) : null))
const monthIndex = ref<number | null>(null)
const selectedMonth = computed(() => months.value.find((x) => x.m.index === monthIndex.value) ?? null)
watch(annualYear, () => (monthIndex.value = null))

/** Which period's lines are shown underneath */
const focus = ref<'luck' | 'year' | 'month'>('year')
watch(monthIndex, (v) => { if (v !== null) focus.value = 'month' })
const detail = computed<PeriodForecast | null>(() => (focus.value === 'luck' ? selectedLuck.value?.f ?? null : focus.value === 'month' ? selectedMonth.value?.f ?? null : selectedYear.value))
const filter = ref<'all' | 'good' | 'bad'>('all')
const lines = computed(() => {
  const ls = detail.value?.lines ?? []
  if (filter.value === 'good') return ls.filter((l) => l.tag === '吉' || l.tag === '佳' || l.tag === '贵')
  if (filter.value === 'bad') return ls.filter((l) => l.tag === '忌' || l.tag === '凶')
  return ls
})

function goToday() {
  const cur = props.chart.luck.pillars.find((l) => l.startYear <= thisYear && thisYear <= l.endYear)
  if (cur) store.selectLuck(cur.index)
  store.selectYear(thisYear)
  focus.value = 'year'
}
function stepYear(delta: number) {
  const y = (annualYear.value ?? thisYear) + delta
  const lp = props.chart.luck.pillars.find((l) => l.startYear <= y && y <= l.endYear)
  if (!lp) return
  if (lp.index !== luckIndex.value) store.selectLuck(lp.index)
  store.selectYear(y)
  focus.value = 'year'
}
function pickLuck(i: number) { store.selectLuck(i); focus.value = 'luck' }
function pickYear(y: number) { store.selectYear(y); focus.value = 'year' }

const cls = (r: Rating) => (r >= 2 ? 'r3' : r === 1 ? 'r2' : r === 0 ? 'r1' : r === -1 ? 'r-1' : r === -2 ? 'r-2' : 'r-3')
const label = (r: Rating) => t(RATING_LABEL[r])
const tagClass = (tag?: string) => (tag && ['吉', '贵', '富', '佳'].includes(tag) ? 'good' : tag && ['忌', '凶'].includes(tag) ? 'bad' : 'plain')
const stemEl = (sexa: number) => el(STEM_ELEMENT[sexa % 10])
const branchEl = (sexa: number) => el(BRANCH_ELEMENT[sexa % 12])
const detailTitle = computed(() => {
  if (!detail.value) return ''
  if (focus.value === 'luck' && selectedLuck.value) return `${selectedLuck.value.l.stemChar}${selectedLuck.value.l.branchChar}${t('大运')} · ${selectedLuck.value.f.label}`
  if (focus.value === 'month' && selectedMonth.value) return `${selectedMonth.value.m.term}${t('月')} ${selectedMonth.value.m.stemChar}${selectedMonth.value.m.branchChar} · ${annualYear.value}`
  return `${detail.value.stemChar}${detail.value.branchChar}${t('流年')} · ${detail.value.label}`
})
</script>

<template>
  <div class="fc cjk-prose">
    <header class="fc-head">
      <p class="t-sm t-muted">{{ t('以下为规则推导的大致预判：按大运、流年、流月的干支与命局的喜忌、太岁、冲合刑害、伏吟反吟、神煞给出倾向与评级，供参考而非定论。点选大运与流年查看依据。') }}</p>
      <div class="tools">
        <LqButton variant="ghost" size="sm" @click="stepYear(-1)">‹ {{ t('上一年') }}</LqButton>
        <LqButton variant="secondary" size="sm" @click="goToday">{{ t('回到今年') }}</LqButton>
        <LqButton variant="ghost" size="sm" @click="stepYear(1)">{{ t('下一年') }} ›</LqButton>
      </div>
    </header>

    <section class="timeline">
      <h3>{{ t('大运') }} <span class="t-caption">{{ t('点选切换，评级为该段十年的综合倾向') }}</span></h3>
      <ol class="strip">
        <li v-for="{ l, f } in lucks" :key="l.index">
          <button type="button" class="cell" :class="[cls(f.rating), { on: l.index === luckIndex, now: l.startYear <= thisYear && thisYear <= l.endYear, focus: focus === 'luck' && l.index === luckIndex }]" @click="pickLuck(l.index)">
            <span class="c-top t-num">{{ l.startAge }}<span class="t-faint">{{ t('岁') }}</span></span>
            <span class="c-god">{{ TEN_GOD_SHORT[l.stemTenGod] }}</span>
            <span class="c-gz" :style="{ color: stemEl(l.sexagenary) }">{{ l.stemChar }}</span>
            <span class="c-gz" :style="{ color: branchEl(l.sexagenary) }">{{ l.branchChar }}</span>
            <span class="c-sub">{{ TEN_GOD_SHORT[l.branchMainTenGod] }} · <span class="t-num">{{ l.startYear }}</span></span>
            <span class="badge">{{ label(f.rating) }}</span>
          </button>
        </li>
      </ol>
      <h3>{{ t('流年') }} <span class="t-caption t-num">{{ selectedLuck ? `${selectedLuck.l.startYear}–${selectedLuck.l.endYear}` : '' }}</span></h3>
      <ol class="strip nested">
        <li v-for="{ a, f } in years" :key="a.year">
          <button type="button" class="cell" :class="[cls(f.rating), { on: a.year === annualYear, now: a.year === thisYear, focus: focus === 'year' && a.year === annualYear }]" @click="pickYear(a.year)">
            <span class="c-top t-num">{{ a.year }}</span>
            <span class="c-god">{{ TEN_GOD_SHORT[a.stemTenGod] }}</span>
            <span class="c-gz" :style="{ color: stemEl(a.sexagenary) }">{{ a.stemChar }}</span>
            <span class="c-gz" :style="{ color: branchEl(a.sexagenary) }">{{ a.branchChar }}</span>
            <span class="c-sub">{{ TEN_GOD_SHORT[a.branchMainTenGod] }} · {{ a.nominalAge }}{{ t('虚岁') }}</span>
            <span class="badge">{{ label(f.rating) }}</span>
          </button>
        </li>
      </ol>
      <h3>{{ t('流月') }} <span class="t-caption">{{ t('点选查看该月依据') }}</span></h3>
      <ol class="strip nested months">
        <li v-for="{ m, f } in months" :key="m.index">
          <button type="button" class="cell" :class="[cls(f.rating), { on: m.index === monthIndex, focus: focus === 'month' && m.index === monthIndex }]" @click="monthIndex = m.index">
            <span class="c-top">{{ m.term }} <span class="t-num t-faint">{{ m.startsAt.slice(5, 10) }}</span></span>
            <span class="c-god">{{ TEN_GOD_SHORT[m.stemTenGod] }}</span>
            <span class="c-gz" :style="{ color: stemEl(m.sexagenary) }">{{ m.stemChar }}</span>
            <span class="c-gz" :style="{ color: branchEl(m.sexagenary) }">{{ m.branchChar }}</span>
            <span class="c-sub">{{ TEN_GOD_SHORT[m.branchMainTenGod] }}</span>
            <span class="badge">{{ label(f.rating) }}</span>
          </button>
        </li>
      </ol>
    </section>

    <PaywallCard v-if="locked" :title="t('解锁逐年、逐月预判与依据')" />
    <section v-else-if="detail" class="detail lq-surface">
      <header class="d-head">
        <div class="d-title">
          <LqSegmented v-model="focus" :options="[{ value: 'luck', label: t('大运') }, { value: 'year', label: t('流年') }, { value: 'month', label: t('流月') }]" :label="t('查看')" size="sm" />
          <h3>{{ detailTitle }} <span class="badge inline" :class="cls(detail.rating)">{{ label(detail.rating) }}</span></h3>
        </div>
        <LqSegmented v-model="filter" :options="[{ value: 'all', label: t('全部') }, { value: 'good', label: t('吉') }, { value: 'bad', label: t('忌') }]" :label="t('筛选')" size="sm" />
      </header>
      <p class="d-sum">{{ detail.summary }}</p>
      <p v-if="detail.tags.length" class="tags"><span v-for="g in detail.tags" :key="g" class="chip">{{ g }}</span></p>
      <p v-if="focus === 'month' && !selectedMonth" class="t-caption">{{ t('在上方流月条点选一个月份。') }}</p>
      <div class="tw">
        <table class="vt">
          <thead><tr><th>{{ t('预判') }}</th><th class="num">{{ t('可信度') }}</th><th>{{ t('推断依据') }}</th></tr></thead>
          <tbody>
            <tr v-for="(l, i) in lines" :key="i"><td><span v-if="l.tag" class="tag" :class="tagClass(l.tag)">【{{ t(l.tag) }}】</span>{{ l.text }}</td><td class="num t-num">{{ l.confidence }}%</td><td class="t-muted basis">{{ l.basis }}</td></tr>
            <tr v-if="!lines.length"><td colspan="3" class="t-muted">{{ t('该筛选下没有条目。') }}</td></tr>
          </tbody>
        </table>
      </div>
      <LqCollapse v-if="months.length" :title="t('本年十二月概览')">
        <ul class="m-list">
          <li v-for="{ m, f } in months" :key="m.index" class="t-sm"><button type="button" class="m-btn" @click="monthIndex = m.index"><b>{{ m.term }} {{ m.stemChar }}{{ m.branchChar }}</b> <span class="badge inline" :class="cls(f.rating)">{{ label(f.rating) }}</span> {{ f.summary }}</button></li>
        </ul>
      </LqCollapse>
    </section>
  </div>
</template>

<style scoped>
.fc {
  display: grid;
  gap: var(--sp-5);
}
.fc-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-3);
}
.fc-head p {
  max-width: 72ch;
  line-height: 1.8;
}
.tools {
  display: flex;
  gap: var(--sp-2);
  flex: none;
}
.timeline {
  display: grid;
  gap: var(--sp-3);
}
.timeline h3 {
  display: flex;
  align-items: baseline;
  gap: var(--sp-3);
  font-size: var(--fs-md);
  font-weight: 500;
}
/* Same cells as the 排盘 timeline */
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
  --tone: var(--text-3);
  display: grid;
  justify-items: center;
  gap: 1px;
  min-width: 76px;
  padding: 10px 8px 8px;
  border: 0;
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
  color: var(--text);
  transition: background-color var(--dur-fast), box-shadow var(--dur-fast), transform var(--dur-base) var(--ease-spring);
}
.cell:hover {
  box-shadow: inset 0 0 0 1px var(--hairline-3);
}
.cell:active {
  transform: scale(0.97);
}
.cell.on {
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--accent) 55%, transparent);
}
.cell.focus {
  box-shadow: inset 0 0 0 2px var(--accent);
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
.months .cell {
  min-width: 88px;
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
  font-family: var(--font-cjk);
  font-size: 26px;
  line-height: 1.1;
  font-weight: 500;
  letter-spacing: 0;
}
.c-sub {
  font-size: var(--fs-2xs);
  color: var(--text-2);
  white-space: nowrap;
}
.badge {
  margin-top: 4px;
  padding: 1px 8px;
  border-radius: var(--r-pill);
  font-size: var(--fs-2xs);
  color: var(--text-on-accent);
  background: var(--tone);
}
.badge.inline {
  display: inline-block;
  margin: 0 0 0 6px;
  vertical-align: middle;
}
.r3 { --tone: var(--wx-wood); }
.r2 { --tone: color-mix(in srgb, var(--wx-wood) 70%, var(--text-2)); }
.r1 { --tone: var(--text-3); }
.r-1 { --tone: var(--wx-earth); }
.r-2 { --tone: color-mix(in srgb, var(--wx-fire) 70%, var(--wx-earth)); }
.r-3 { --tone: var(--wx-fire); }
.detail {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  border-radius: var(--r-lg);
}
.d-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}
.d-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-3);
}
.d-title h3 {
  font-size: var(--fs-md);
  font-weight: 500;
}
.d-sum {
  font-size: var(--fs-sm);
  line-height: 1.8;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 2px 10px;
  border-radius: var(--r-pill);
  font-size: var(--fs-xs);
  color: var(--text-2);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
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
  padding: 10px 12px;
  border-top: 1px solid var(--hairline);
  text-align: left;
  vertical-align: top;
  line-height: 1.8;
}
thead th {
  border-top: 0;
  color: var(--text-2);
  font-weight: 400;
  font-size: var(--fs-xs);
}
.num {
  text-align: right;
  white-space: nowrap;
}
.basis {
  min-width: 140px;
  max-width: 280px;
  line-height: 1.6;
}
.tag {
  margin-right: 2px;
  font-weight: 500;
}
.tag.good {
  color: var(--wx-wood);
}
.tag.bad {
  color: var(--wx-fire);
}
.m-list {
  display: grid;
  gap: 4px;
  padding-top: var(--sp-2);
}
.m-btn {
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: var(--r-sm);
  background: none;
  color: var(--text);
  text-align: left;
  line-height: 1.7;
}
.m-btn:hover {
  background: var(--accent-soft);
}
@media (max-width: 640px) {
  .tools {
    width: 100%;
  }
}
</style>
