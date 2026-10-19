<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import LqCollapse from '@/components/ui/LqCollapse.vue'
import PaywallCard from '@/components/paywall/PaywallCard.vue'
import { analyseBazi } from '@selfos/destiny-core/bazi/analysis'
import { forecastLuck, forecastMonth, forecastYear, RATING_LABEL, type PeriodForecast, type Rating } from '@selfos/destiny-core/bazi/forecast'
import { useDivinationStore } from '@/stores/divination'
import { useI18n } from '@/i18n'
import type { BaziChart } from '@/types'

const props = defineProps<{ chart: BaziChart; locked?: boolean }>()
const { t } = useI18n()
const store = useDivinationStore()
const { luckIndex, annualYear, annual, monthly } = storeToRefs(store)
const thisYear = new Date().getFullYear()

const analysis = computed(() => analyseBazi(props.chart))
const lucks = computed(() => props.chart.luck.pillars.map((l) => ({ l, f: forecastLuck(props.chart, l, analysis.value) })))
const years = computed(() => annual.value.map((a) => ({ a, f: forecastYear(props.chart, a.year, analysis.value) })))
const selectedYear = computed(() => (annualYear.value ? forecastYear(props.chart, annualYear.value, analysis.value) : null))
const selectedLuck = computed(() => lucks.value.find((x) => x.l.index === luckIndex.value) ?? null)
const months = computed(() => monthly.value.map((m) => ({ m, f: forecastMonth(props.chart, m, analysis.value) })))

const cls = (r: Rating) => (r >= 2 ? 'r3' : r === 1 ? 'r2' : r === 0 ? 'r1' : r === -1 ? 'r-1' : r === -2 ? 'r-2' : 'r-3')
const label = (r: Rating) => t(RATING_LABEL[r])
const tagClass = (tag?: string) => (tag && ['吉', '贵', '富', '佳'].includes(tag) ? 'good' : tag && ['忌', '凶'].includes(tag) ? 'bad' : 'plain')
const lines = (f: PeriodForecast | null) => f?.lines ?? []
</script>

<template>
  <div class="fc cjk-prose">
    <p class="intro t-sm t-muted">{{ t('以下为规则推导的大致预判：按大运、流年、流月的干支与命局的喜忌、太岁、冲合刑害、伏吟反吟、神煞给出倾向与评级，供参考而非定论。点选大运与流年查看依据。') }}</p>

    <section class="block">
      <h3>{{ t('大运') }}</h3>
      <ol class="strip">
        <li v-for="{ l, f } in lucks" :key="l.index">
          <button type="button" class="cell" :class="[cls(f.rating), { on: l.index === luckIndex, now: l.startYear <= thisYear && thisYear <= l.endYear }]" @click="store.selectLuck(l.index)">
            <span class="c-top t-num">{{ l.startAge }}–{{ l.startAge + 9 }}{{ t('岁') }}</span>
            <span class="c-gz">{{ l.stemChar }}</span>
            <span class="c-gz">{{ l.branchChar }}</span>
            <span class="badge">{{ label(f.rating) }}</span>
            <span class="c-sub t-num">{{ l.startYear }}</span>
          </button>
        </li>
      </ol>
      <p v-if="selectedLuck" class="sum"><b>{{ selectedLuck.l.stemChar }}{{ selectedLuck.l.branchChar }}{{ t('大运') }}</b> <span class="t-muted">{{ selectedLuck.f.label }}</span> · <span class="badge inline" :class="cls(selectedLuck.f.rating)">{{ label(selectedLuck.f.rating) }}</span> {{ selectedLuck.f.summary }}</p>
    </section>

    <section class="block">
      <h3>{{ t('流年') }} <span class="t-muted t-sm">{{ selectedLuck ? `${selectedLuck.l.startYear}–${selectedLuck.l.endYear}` : '' }}</span></h3>
      <ol class="strip nested">
        <li v-for="{ a, f } in years" :key="a.year">
          <button type="button" class="cell" :class="[cls(f.rating), { on: a.year === annualYear, now: a.year === thisYear }]" @click="store.selectYear(a.year)">
            <span class="c-top t-num">{{ a.year }}</span>
            <span class="c-gz">{{ a.stemChar }}</span>
            <span class="c-gz">{{ a.branchChar }}</span>
            <span class="badge">{{ label(f.rating) }}</span>
            <span class="c-sub">{{ f.tags.slice(0, 2).join(' ') || t(f.stemGod) }}</span>
          </button>
        </li>
      </ol>
    </section>

    <PaywallCard v-if="locked" :title="t('解锁逐年、逐月预判与依据')" />
    <section v-else-if="selectedYear" class="block detail lq-surface">
      <header class="d-head">
        <h3>{{ selectedYear.stemChar }}{{ selectedYear.branchChar }} <span class="t-muted t-sm">{{ selectedYear.label }}</span></h3>
        <span class="badge inline" :class="cls(selectedYear.rating)">{{ label(selectedYear.rating) }}</span>
      </header>
      <p class="d-sum">{{ selectedYear.summary }}</p>
      <p v-if="selectedYear.tags.length" class="tags"><span v-for="g in selectedYear.tags" :key="g" class="chip">{{ g }}</span></p>
      <div class="tw">
        <table class="vt">
          <thead><tr><th>{{ t('预判') }}</th><th>{{ t('推断依据') }}</th></tr></thead>
          <tbody>
            <tr v-for="(l, i) in lines(selectedYear)" :key="i"><td><span v-if="l.tag" class="tag" :class="tagClass(l.tag)">【{{ t(l.tag) }}】</span>{{ l.text }}</td><td class="t-muted basis">{{ l.basis }}</td></tr>
          </tbody>
        </table>
      </div>
      <LqCollapse v-if="months.length" :title="t('流月')" :summary="months.map((x) => label(x.f.rating)).join(' ')">
        <ol class="strip months">
          <li v-for="{ m, f } in months" :key="m.index">
            <div class="cell static" :class="cls(f.rating)">
              <span class="c-top">{{ m.term }} <span class="t-num">{{ m.startsAt.slice(5, 10) }}</span></span>
              <span class="c-gz">{{ m.stemChar }}</span>
              <span class="c-gz">{{ m.branchChar }}</span>
              <span class="badge">{{ label(f.rating) }}</span>
              <span class="c-sub">{{ f.tags.slice(0, 2).join(' ') || t(m.stemTenGod) }}</span>
            </div>
          </li>
        </ol>
        <ul class="m-list">
          <li v-for="{ m, f } in months" :key="m.index" class="t-sm"><b>{{ m.term }} {{ m.stemChar }}{{ m.branchChar }}</b> <span class="badge inline" :class="cls(f.rating)">{{ label(f.rating) }}</span> {{ f.summary }}</li>
        </ul>
      </LqCollapse>
    </section>

    <LqCollapse v-if="selectedLuck && !locked" :title="`${selectedLuck.l.stemChar}${selectedLuck.l.branchChar}${t('大运')} · ${t('依据')}`">
      <div class="tw">
        <table class="vt">
          <tbody>
            <tr v-for="(l, i) in lines(selectedLuck.f)" :key="i"><td><span v-if="l.tag" class="tag" :class="tagClass(l.tag)">【{{ t(l.tag) }}】</span>{{ l.text }}</td><td class="t-muted basis">{{ l.basis }}</td></tr>
          </tbody>
        </table>
      </div>
    </LqCollapse>
  </div>
</template>

<style scoped>
.fc {
  display: grid;
  gap: var(--sp-5);
}
.intro {
  line-height: 1.8;
}
.block {
  display: grid;
  gap: var(--sp-3);
}
.block h3 {
  font-size: var(--fs-md);
  font-weight: 500;
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
  --tone: var(--text-3);
  display: grid;
  justify-items: center;
  gap: 2px;
  min-width: 76px;
  padding: 10px 8px;
  border: 0;
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
  color: var(--text);
  transition: background-color var(--dur-fast), box-shadow var(--dur-fast);
}
button.cell:hover {
  box-shadow: inset 0 0 0 1px var(--hairline-3);
}
.cell.on {
  background: color-mix(in srgb, var(--tone) 12%, var(--surface));
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--tone) 60%, transparent);
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
.r3 { --tone: var(--wx-wood); }
.r2 { --tone: color-mix(in srgb, var(--wx-wood) 70%, var(--text-2)); }
.r1 { --tone: var(--text-3); }
.r-1 { --tone: var(--wx-earth); }
.r-2 { --tone: color-mix(in srgb, var(--wx-fire) 70%, var(--wx-earth)); }
.r-3 { --tone: var(--wx-fire); }
.c-top {
  font-size: var(--fs-2xs);
  color: var(--text-2);
  white-space: nowrap;
}
.c-gz {
  font-size: 24px;
  line-height: 1.15;
  font-weight: 500;
  letter-spacing: 0;
}
.c-sub {
  font-size: var(--fs-2xs);
  color: var(--text-2);
  white-space: nowrap;
}
.badge {
  padding: 1px 8px;
  border-radius: var(--r-pill);
  font-size: var(--fs-2xs);
  color: var(--text-on-accent);
  background: var(--tone);
}
.badge.inline {
  display: inline-block;
  vertical-align: middle;
}
.sum,
.d-sum {
  font-size: var(--fs-sm);
  line-height: 1.8;
}
.detail {
  padding: var(--sp-4) var(--sp-5);
  border-radius: var(--r-lg);
}
.d-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-3);
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
.months .cell {
  min-width: 88px;
}
.m-list {
  display: grid;
  gap: 6px;
  padding-top: var(--sp-3);
}
</style>
