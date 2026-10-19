<script setup lang="ts">
import { computed } from 'vue'
import { ELEMENTS, ELEMENT_ORDER, PILLAR_LABELS } from '@/data/lexicon'
import { fmt1 } from '@/composables/format'
import type { BaziChart, FiveElement, PillarKey } from '@/types'

/**
 * Four Pillars chart. Structure first: a strict grid with row headers,
 * large CJK glyphs, and the element always written as text beside its colour.
 */
const props = defineProps<{ chart: BaziChart }>()

const thisYear = new Date().getFullYear()
const maxEl = computed(() => Math.max(...Object.values(props.chart.fiveElements), 1))
const totalEl = computed(() => Object.values(props.chart.fiveElements).reduce((a, b) => a + b, 0))
const currentLuck = computed(() =>
  props.chart.luckPillars.findIndex((l, i, all) => l.startYear <= thisYear && (all[i + 1]?.startYear ?? 9999) > thisYear),
)
const el = (e: FiveElement) => ELEMENTS[e]
const pillarNames = (keys: PillarKey[]) => keys.map((key) => PILLAR_LABELS[key].zh).join(' · ')
</script>

<template>
  <div class="bazi">
    <dl class="facts">
      <div><dt class="t-label">Solar</dt><dd class="t-num">{{ chart.solarDate }}</dd></div>
      <div><dt class="t-label">Lunar 农历</dt><dd class="t-cjk">{{ chart.lunarDate }}</dd></div>
      <div>
        <dt class="t-label">Day master 日主</dt>
        <dd>
          <span class="t-cjk dm">{{ chart.dayMaster.stem }}</span>
          {{ el(chart.dayMaster.element).zh }} · {{ el(chart.dayMaster.element).label }}
        </dd>
      </div>
      <div><dt class="t-label">Luck begins 起运</dt><dd class="t-cjk">{{ chart.luckStart }}</dd></div>
    </dl>

    <!-- Four pillars -->
    <div class="pillars lq-well" role="table" aria-label="Four pillars">
      <div class="prow head" role="row">
        <span class="rh" role="columnheader"><span class="visually-hidden">Row</span></span>
        <span v-for="p in chart.pillars" :key="p.key" role="columnheader" class="ch" :class="{ day: p.key === 'day' }">
          <span class="t-cjk">{{ PILLAR_LABELS[p.key].zh }}</span>
          <span class="t-faint">{{ PILLAR_LABELS[p.key].en }}</span>
        </span>
      </div>
      <div class="prow" role="row">
        <span class="rh t-cjk" role="rowheader">十神</span>
        <span v-for="p in chart.pillars" :key="p.key" role="cell" class="cell t-cjk god" :class="{ day: p.key === 'day' }">{{ p.stemTenGod }}</span>
      </div>
      <div class="prow glyphs" role="row">
        <span class="rh t-cjk" role="rowheader">天干</span>
        <span v-for="p in chart.pillars" :key="p.key" role="cell" class="cell" :class="{ day: p.key === 'day' }">
          <span class="glyph t-cjk" :style="{ '--el': el(p.stemElement).token }">{{ p.stem }}</span>
          <span class="el-label t-cjk">{{ el(p.stemElement).zh }}</span>
        </span>
      </div>
      <div class="prow glyphs" role="row">
        <span class="rh t-cjk" role="rowheader">地支</span>
        <span v-for="p in chart.pillars" :key="p.key" role="cell" class="cell" :class="{ day: p.key === 'day' }">
          <span class="glyph t-cjk" :style="{ '--el': el(p.branchElement).token }">{{ p.branch }}</span>
          <span class="el-label t-cjk">{{ el(p.branchElement).zh }}</span>
        </span>
      </div>
      <div class="prow" role="row">
        <span class="rh t-cjk" role="rowheader">藏干</span>
        <span v-for="p in chart.pillars" :key="p.key" role="cell" class="cell hidden" :class="{ day: p.key === 'day' }">
          <span v-for="h in p.hiddenStems" :key="h.stem" class="hs t-cjk">
            <span class="hs-stem" :style="{ '--el': el(h.element).token }">{{ h.stem }}</span>
            <span class="t-faint">{{ h.tenGod }}</span>
          </span>
        </span>
      </div>
      <div class="prow" role="row">
        <span class="rh t-cjk" role="rowheader">纳音</span>
        <span v-for="p in chart.pillars" :key="p.key" role="cell" class="cell t-cjk t-muted" :class="{ day: p.key === 'day' }">{{ p.naYin }}</span>
      </div>
      <div class="prow" role="row">
        <span class="rh t-cjk" role="rowheader">星运</span>
        <span v-for="p in chart.pillars" :key="p.key" role="cell" class="cell t-cjk t-muted" :class="{ day: p.key === 'day' }">{{ p.lifeStage }}</span>
      </div>
    </div>

    <div class="split">
      <!-- Five elements -->
      <section class="block" aria-labelledby="wx-title">
        <h3 id="wx-title" class="t-label">Five elements 五行 <span class="t-faint">· stems + weighted hidden stems</span></h3>
        <ul class="wx">
          <li v-for="k in ELEMENT_ORDER" :key="k" :title="`${el(k).label}: ${fmt1(chart.fiveElements[k])} of ${fmt1(totalEl)}`">
            <span class="wx-name">
              <span class="t-cjk">{{ el(k).zh }}</span>
              <span class="t-muted">{{ el(k).label }}</span>
              <span v-if="k === chart.dayMaster.element" class="dm-mark t-faint">日主</span>
            </span>
            <span class="wx-track">
              <span class="wx-fill" :style="{ width: `${(chart.fiveElements[k] / maxEl) * 100}%`, '--el': el(k).token }" />
            </span>
            <span class="t-num wx-val">{{ fmt1(chart.fiveElements[k]) }}</span>
          </li>
        </ul>
      </section>

      <!-- Relations & stars -->
      <section class="block" aria-labelledby="rel-title">
        <h3 id="rel-title" class="t-label">Branch relations 冲刑合会</h3>
        <ul v-if="chart.relations.length" class="plain">
          <li v-for="(r, i) in chart.relations" :key="i">
            <span class="rel-type t-cjk">{{ r.type }}</span>
            <span class="t-cjk">{{ r.branches.join('') }}</span>
            <span v-if="r.note" class="t-cjk t-muted">{{ r.note }}</span>
            <span class="t-faint t-sm">{{ pillarNames(r.pillars) }}</span>
          </li>
        </ul>
        <p v-else class="t-sm t-muted">No clashes, punishments or combinations among the natal branches.</p>

        <h3 class="t-label stars-title">Stars 神煞</h3>
        <ul class="plain">
          <li v-for="s in chart.shensha" :key="s.name" :class="{ absent: !s.pillars.length }">
            <span class="t-cjk">{{ s.name }}</span>
            <span class="t-cjk t-muted">{{ s.branches.join(' ') }}</span>
            <span class="t-sm" :class="s.pillars.length ? 't-muted' : 't-faint'">
              {{ s.pillars.length ? pillarNames(s.pillars) : 'not in natal chart' }}
            </span>
          </li>
        </ul>
      </section>
    </div>

    <!-- Luck cycles -->
    <section class="block" aria-labelledby="dy-title">
      <h3 id="dy-title" class="t-label">Luck pillars 大运</h3>
      <ol class="luck" tabindex="0" aria-label="Ten-year luck pillars">
        <li v-for="(l, i) in chart.luckPillars" :key="l.startYear" :class="{ now: i === currentLuck }" :aria-current="i === currentLuck ? 'true' : undefined">
          <span class="t-num t-faint t-sm">{{ l.startAge }}岁</span>
          <span class="lg t-cjk">{{ l.stem }}<br />{{ l.branch }}</span>
          <span class="t-num t-muted t-sm">{{ l.startYear }}</span>
        </li>
      </ol>
    </section>
    <section class="block" aria-labelledby="ln-title">
      <h3 id="ln-title" class="t-label">Annual pillars 流年 <span class="t-faint">· current luck pillar</span></h3>
      <ol class="annual" tabindex="0" aria-label="Annual pillars">
        <li v-for="a in chart.annualPillars" :key="a.year" :class="{ now: a.year === thisYear }" :aria-current="a.year === thisYear ? 'true' : undefined">
          <span class="t-num">{{ a.year }}</span>
          <span class="t-cjk">{{ a.stem }}{{ a.branch }}</span>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.bazi {
  display: grid;
  gap: var(--sp-6);
}
.facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sp-4);
}
.facts dd {
  margin-top: 2px;
  font-size: var(--fs-sm);
}
.dm {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
  margin-right: 4px;
}
.pillars {
  display: grid;
  padding: var(--sp-2) var(--sp-4);
}
.prow {
  display: grid;
  grid-template-columns: 56px repeat(4, minmax(0, 1fr));
  align-items: center;
  min-height: 40px;
  border-bottom: 1px solid var(--hairline);
}
.prow:last-child {
  border-bottom: 0;
}
.rh {
  font-size: var(--fs-xs);
  color: var(--text-2);
}
.ch {
  display: flex;
  justify-content: center;
  gap: 6px;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  padding: var(--sp-2) 0;
}
.cell {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: var(--sp-2) 4px;
  text-align: center;
  font-size: var(--fs-sm);
  height: 100%;
}
.day {
  background: color-mix(in srgb, var(--c-lavender) 7%, transparent);
}
.head .day {
  border-radius: var(--r-sm) var(--r-sm) 0 0;
}
.god {
  color: var(--text-2);
  font-size: var(--fs-xs);
}
.glyphs .cell {
  flex-direction: column;
  gap: 2px;
  padding: var(--sp-3) 0;
}
.glyph {
  font-size: 32px;
  line-height: 1.1;
  font-weight: 500;
  color: var(--text);
  text-decoration: underline;
  text-decoration-color: var(--el);
  text-decoration-thickness: 2px;
  text-underline-offset: 7px;
}
.el-label {
  margin-top: 6px;
  font-size: var(--fs-2xs);
  color: var(--text-2);
}
.hidden {
  flex-direction: column;
  gap: 2px;
}
.hs {
  display: flex;
  gap: 6px;
  font-size: var(--fs-xs);
}
.hs-stem {
  color: var(--text);
  box-shadow: inset 0 -1.5px 0 var(--el);
}
.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-7);
}
.block {
  display: grid;
  gap: var(--sp-3);
  align-content: start;
  min-width: 0;
}
.wx {
  display: grid;
  gap: var(--sp-3);
}
.wx li {
  display: grid;
  grid-template-columns: 110px 1fr 40px;
  gap: var(--sp-3);
  align-items: center;
}
.wx-name {
  display: flex;
  gap: 6px;
  align-items: baseline;
  font-size: var(--fs-sm);
}
.dm-mark {
  font-size: var(--fs-2xs);
}
.wx-track {
  height: 8px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.wx-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--el);
  transition: width var(--dur-slow) var(--ease-spring);
}
.wx-val {
  text-align: right;
  font-size: var(--fs-sm);
}
.plain {
  display: grid;
}
.plain li {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  align-items: baseline;
  padding: 6px 0;
  border-bottom: 1px solid var(--hairline);
  font-size: var(--fs-sm);
}
.plain li.absent {
  color: var(--text-2);
}
.rel-type {
  font-weight: var(--fw-medium);
  min-width: 2.5em;
}
.stars-title {
  margin-top: var(--sp-3);
}
.luck,
.annual {
  display: flex;
  gap: var(--sp-2);
  overflow-x: auto;
  padding-bottom: var(--sp-2);
}
.luck li {
  display: grid;
  justify-items: center;
  gap: 4px;
  min-width: 68px;
  padding: var(--sp-3) var(--sp-2);
  border-radius: var(--r-md);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.lg {
  font-size: var(--fs-lg);
  line-height: 1.25;
  text-align: center;
}
.annual li {
  display: grid;
  justify-items: center;
  gap: 2px;
  min-width: 64px;
  padding: var(--sp-2);
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.now {
  background: color-mix(in srgb, var(--c-lavender) 12%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c-lavender) 50%, transparent) !important;
}
@media (max-width: 860px) {
  .facts {
    grid-template-columns: 1fr 1fr;
  }
  .split {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .prow {
    grid-template-columns: 40px repeat(4, minmax(0, 1fr));
  }
  .glyph {
    font-size: 26px;
  }
  .wx li {
    grid-template-columns: 90px 1fr 36px;
  }
}
</style>
