<script setup lang="ts">
import { useI18n } from '@/i18n'
import { computed, ref, watch } from 'vue'
import { MUTAGENS, type DecadalHoroscope, type YearlyHoroscope, type ZiweiChart, type ZiweiStar } from '@selfos/destiny-core/ziwei'
const { t } = useI18n()

const props = defineProps<{ chart: ZiweiChart }>()
const thisYear = new Date().getFullYear()

/** Grid slot for each 地支: the classic 4×4 board, 寅 at the bottom-left, counted anticlockwise. */
const SLOT: Record<string, [number, number]> = {
  巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4],
  辰: [2, 1], 酉: [2, 4],
  卯: [3, 1], 戌: [3, 4],
  寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4],
}

const decadalIdx = ref(Math.max(0, props.chart.decadals.findIndex((d) => d.yearRange[0] <= thisYear && thisYear <= d.yearRange[1])))
const decadal = computed<DecadalHoroscope>(() => props.chart.decadals[decadalIdx.value])
const years = computed<YearlyHoroscope[]>(() => props.chart.astrolabe.yearlyList(decadalIdx.value))
const year = ref(thisYear)
watch(years, (ys) => {
  if (!ys.some((y) => y.year === year.value)) year.value = ys[0]?.year ?? thisYear
}, { immediate: true })
watch(() => props.chart, () => {
  decadalIdx.value = Math.max(0, props.chart.decadals.findIndex((d) => d.yearRange[0] <= thisYear && thisYear <= d.yearRange[1]))
})
const yearly = computed(() => years.value.find((y) => y.year === year.value) ?? null)

/** 大限 / 流年 四化 for a star: '限禄', '年忌' … */
function flowMutagens(name: string) {
  const out: { label: string; key: string }[] = []
  const d = (decadal.value.mutagen as string[]).indexOf(name)
  if (d >= 0) out.push({ label: `限${MUTAGENS[d]}`, key: MUTAGENS[d] })
  const y = (yearly.value?.mutagen as string[] | undefined)?.indexOf(name) ?? -1
  if (y >= 0) out.push({ label: `年${MUTAGENS[y]}`, key: MUTAGENS[y] })
  return out
}
const flowStars = (i: number): ZiweiStar[] => [...((decadal.value.stars?.[i] ?? []) as ZiweiStar[]), ...((yearly.value?.stars?.[i] ?? []) as ZiweiStar[])]
const STAR_CLASS: Record<string, string> = { major: 'major', soft: 'soft', tough: 'tough', flower: 'flower', helper: 'helper', lucun: 'lucun', tianma: 'tianma', adjective: 'adj' }
const soulPalace = computed(() => props.chart.palaces.find((p) => p.isSoul))
const mut = (k: (typeof MUTAGENS)[number]) => props.chart.mutagen[k] ?? '—'
</script>

<template>
  <div class="ziwei cjk-prose">
    <div class="board-wrap">
      <div class="board">
        <div v-for="p in chart.palaces" :key="p.index" class="palace" :class="{ soul: p.isSoul, body: p.isBody }" :style="{ gridRow: SLOT[p.branch][0], gridColumn: SLOT[p.branch][1] }">
          <div class="stars">
            <span v-for="s in p.majorStars" :key="s.name" class="star major">
              <b>{{ s.name }}</b><sup v-if="s.brightness" class="bri">{{ s.brightness }}</sup>
              <i v-if="s.mutagen" class="mu" :data-m="s.mutagen">{{ s.mutagen }}</i>
              <i v-for="f in flowMutagens(s.name)" :key="f.label" class="mu flow" :data-m="f.key">{{ f.label }}</i>
            </span>
            <span v-for="s in p.minorStars" :key="s.name" class="star" :class="STAR_CLASS[s.type]">
              {{ s.name }}<sup v-if="s.brightness" class="bri">{{ s.brightness }}</sup>
              <i v-if="s.mutagen" class="mu" :data-m="s.mutagen">{{ s.mutagen }}</i>
              <i v-for="f in flowMutagens(s.name)" :key="f.label" class="mu flow" :data-m="f.key">{{ f.label }}</i>
            </span>
            <span v-for="s in p.adjectiveStars" :key="s.name" class="star" :class="STAR_CLASS[s.type]">{{ s.name }}</span>
          </div>
          <p v-if="flowStars(p.index).length" class="flow-stars t-faint">
            <span v-for="s in flowStars(p.index)" :key="s.scope + s.name">{{ s.name }}</span>
          </p>
          <div class="foot">
            <span class="pname">{{ p.name }}<em v-if="p.isSoul">{{ t('命') }}</em><em v-if="p.isBody">{{ t('身') }}</em><em v-if="p.isOrigin" class="origin">{{ t('来因') }}</em></span>
            <span class="overlay">
              <span class="ov d">{{ decadal.palaceNames[p.index] }}</span>
              <span v-if="yearly" class="ov y">{{ yearly.palaceNames[p.index] }}</span>
            </span>
            <span class="gz"><b>{{ p.stem }}{{ p.branch }}</b><span class="t-faint t-num">{{ p.decadal.range[0] }}–{{ p.decadal.range[1] }}</span><span class="t-faint">{{ p.changsheng12 }}</span></span>
          </div>
        </div>

        <div class="centre">
          <p class="c-title"><b>{{ chart.fiveElementsClass }}</b><span class="t-muted">{{ t(chart.gender + '命') }} · {{ t('属') }}{{ chart.zodiac }} · {{ chart.sign }}</span></p>
          <dl class="c-facts">
            <div><dt>{{ t('公历') }}</dt><dd class="t-num">{{ chart.solarDate }} {{ chart.time }}<span class="t-faint">（{{ chart.timeRange }}）</span></dd></div>
            <div><dt>{{ t('农历') }}</dt><dd>{{ chart.lunarDate }}</dd></div>
            <div><dt>{{ t('四柱') }}</dt><dd>{{ chart.chineseDate }}</dd></div>
            <div><dt>{{ t('命身') }}</dt><dd>命宫 {{ chart.soulBranch }} · 身宫 {{ chart.bodyBranch }}</dd></div>
            <div><dt>{{ t('命主') }}</dt><dd>{{ chart.soul }} · 身主 {{ chart.body }}</dd></div>
            <div><dt>{{ t('命宫主星') }}</dt><dd>{{ soulPalace?.majorStars.map((s) => s.name).join(' ') || t('空宫（借对宫）') }}</dd></div>
          </dl>
          <p class="hua"><span class="t-muted">{{ t('本命四化') }}</span>
            <span v-for="k in MUTAGENS" :key="k" class="hua-chip" :data-m="k"><i>{{ k }}</i>{{ mut(k) }}</span>
          </p>
          <p class="hua"><span class="t-muted">{{ t('大限') }} {{ decadal.heavenlyStem }}{{ decadal.earthlyBranch }}</span>
            <span v-for="(n, i) in decadal.mutagen" :key="n" class="hua-chip" :data-m="MUTAGENS[i]"><i>{{ MUTAGENS[i] }}</i>{{ n }}</span>
          </p>
          <p v-if="yearly" class="hua"><span class="t-muted">{{ t('流年') }} {{ yearly.heavenlyStem }}{{ yearly.earthlyBranch }}</span>
            <span v-for="(n, i) in yearly.mutagen" :key="n" class="hua-chip" :data-m="MUTAGENS[i]"><i>{{ MUTAGENS[i] }}</i>{{ n }}</span>
          </p>
        </div>
      </div>
    </div>

    <section class="timeline">
      <header class="tl-head"><h3>{{ t('大限 · 流年') }}</h3><p class="t-caption">{{ t('点选大限与流年，盘面叠加运限宫名与流曜（运禄、流羊…），四化以「限」「年」标注。') }}</p></header>
      <ol class="strip">
        <li v-for="(d, i) in chart.decadals" :key="i">
          <button type="button" class="cell" :class="{ on: i === decadalIdx, now: d.yearRange[0] <= thisYear && thisYear <= d.yearRange[1] }" @click="decadalIdx = i">
            <span class="c-top t-num">{{ d.ageRange[0] }}–{{ d.ageRange[1] }}</span>
            <span class="c-gz">{{ d.heavenlyStem }}</span>
            <span class="c-gz">{{ d.earthlyBranch }}</span>
            <span class="c-sub">{{ d.palaceName }}</span>
            <span class="c-sub t-num t-faint">{{ d.yearRange[0] }}</span>
          </button>
        </li>
      </ol>
      <ol class="strip nested">
        <li v-for="y in years" :key="y.year">
          <button type="button" class="cell" :class="{ on: y.year === year, now: y.year === thisYear }" @click="year = y.year">
            <span class="c-top t-num">{{ y.year }}</span>
            <span class="c-gz">{{ y.heavenlyStem }}</span>
            <span class="c-gz">{{ y.earthlyBranch }}</span>
            <span class="c-sub">{{ y.palaceNames[chart.palaces.findIndex((p) => p.isSoul)] }}</span>
            <span class="c-sub t-num t-faint">{{ y.age }}{{ t('岁') }}</span>
          </button>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.ziwei {
  display: grid;
  gap: var(--sp-6);
}
.board-wrap {
  overflow-x: auto;
  padding-bottom: 4px;
}
.board {
  display: grid;
  grid-template-columns: repeat(4, minmax(170px, 1fr));
  grid-template-rows: repeat(4, minmax(168px, auto));
  gap: 4px;
  min-width: 720px;
}
.palace {
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto auto;
  gap: 6px;
  padding: 10px 10px 8px;
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
  min-width: 0;
}
.palace.soul {
  background: color-mix(in srgb, var(--c-lavender) 12%, var(--surface));
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c-lavender) 55%, transparent);
}
.palace.body:not(.soul) {
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c-sage) 50%, transparent);
}
.stars {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 2px 8px;
  font-size: var(--fs-xs);
  color: var(--text-2);
}
.star {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  white-space: nowrap;
}
.star.major {
  font-size: var(--fs-base);
  color: var(--text);
}
.star.major b {
  font-weight: 500;
}
.star.soft,
.star.helper {
  color: var(--wx-wood);
}
.star.tough {
  color: var(--wx-fire);
}
.star.flower {
  color: color-mix(in srgb, var(--c-lavender) 80%, var(--text));
}
.star.lucun,
.star.tianma {
  color: var(--wx-metal);
}
.star.adj {
  color: var(--text-3);
}
.bri {
  font-size: 11px;
  line-height: 1;
  color: var(--text-3);
  font-style: normal;
}
.mu {
  display: inline-block;
  min-width: 16px;
  padding: 0 4px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 16px;
  font-style: normal;
  color: var(--text-on-accent);
  background: var(--text-3);
}
.mu.flow {
  color: var(--text);
  background: transparent;
  box-shadow: inset 0 0 0 1px currentColor;
}
[data-m='禄'] { --m: var(--wx-wood); }
[data-m='权'] { --m: var(--wx-water); }
[data-m='科'] { --m: var(--wx-metal); }
[data-m='忌'] { --m: var(--wx-fire); }
.mu[data-m] {
  background: var(--m);
}
.mu.flow[data-m] {
  color: var(--m);
  background: transparent;
}
.flow-stars {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 6px;
  font-size: var(--fs-2xs);
}
.foot {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: end;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--hairline);
  font-size: var(--fs-xs);
}
.pname {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  font-weight: 500;
}
.pname em {
  padding: 0 4px;
  border-radius: 4px;
  font-size: 11px;
  font-style: normal;
  line-height: 16px;
  color: var(--text-on-accent);
  background: var(--accent);
}
.pname em.origin {
  color: var(--text-2);
  background: var(--surface-3);
}
.overlay {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 11px;
}
.ov {
  padding: 0 4px;
  border-radius: 4px;
  line-height: 15px;
}
.ov.d {
  color: var(--accent-ink);
  background: var(--accent-soft);
}
.ov.y {
  color: var(--text-2);
  background: var(--surface-3);
}
.gz {
  display: grid;
  justify-items: end;
  font-size: var(--fs-2xs);
  line-height: 1.3;
}
.gz b {
  font-size: var(--fs-sm);
  font-weight: 500;
}
.centre {
  grid-row: 2 / 4;
  grid-column: 2 / 4;
  display: grid;
  align-content: center;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  border-radius: var(--r-md);
  background: var(--surface-sunken);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.c-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--sp-3);
  font-size: var(--fs-lg);
}
.c-title span {
  font-size: var(--fs-sm);
}
.c-facts {
  display: grid;
  gap: 2px;
}
.c-facts div {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: var(--sp-2);
  font-size: var(--fs-sm);
}
.c-facts dt {
  color: var(--text-3);
}
.hua {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-sm);
}
.hua-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px 1px 2px;
  border-radius: var(--r-pill);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.hua-chip i {
  display: inline-grid;
  place-items: center;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  font-size: 11px;
  font-style: normal;
  color: var(--text-on-accent);
  background: var(--m);
}
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
  display: grid;
  justify-items: center;
  gap: 1px;
  min-width: 68px;
  padding: 10px 8px;
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
.c-gz {
  font-size: 22px;
  line-height: 1.15;
  font-weight: 500;
}
.c-sub {
  font-size: var(--fs-2xs);
  color: var(--text-2);
}
</style>
