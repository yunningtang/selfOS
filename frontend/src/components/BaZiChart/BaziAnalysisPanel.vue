<script setup lang="ts">
import { useI18n } from '@/i18n'
import { computed, ref } from 'vue'
import LqCollapse from '@/components/ui/LqCollapse.vue'
import PaywallCard from '@/components/paywall/PaywallCard.vue'
import { ELEMENTS } from '@/data/lexicon'
import { ELEMENT_ZH } from '@selfos/destiny-core/bazi/tables'
import { analyseBazi, PILLAR_ZH, KEYS } from '@selfos/destiny-core/bazi/analysis'
import { computeVerdicts, type Verdict } from '@selfos/destiny-core/bazi/verdicts'
import { VERDICT_EN } from '@selfos/destiny-core/bazi/verdicts.en'
import type { BaziChart, FiveElement } from '@/types'
const { t, isEn } = useI18n()

const props = defineProps<{ chart: BaziChart; locked?: boolean }>()
const el = (e: FiveElement) => ELEMENTS[e].token
const analysis = computed(() => analyseBazi(props.chart))
const verdicts = computed(() => computeVerdicts(props.chart, analysis.value))
const topics = computed(() => Array.from(new Set(verdicts.value.map((v) => v.topic))))
const topic = ref<string>('全部')
const FREE_ROWS = 12
const allShown = computed(() => (topic.value === '全部' ? verdicts.value : verdicts.value.filter((v) => v.topic === topic.value)))
const shown = computed(() => (props.locked ? allShown.value.slice(0, FREE_ROWS) : allShown.value))
const hidden = computed(() => allShown.value.length - shown.value.length)
const tagClass = (v: Verdict) => (v.tag && ['吉', '贵', '富', '佳'].includes(v.tag) ? 'good' : v.tag && ['忌', '凶'].includes(v.tag) ? 'bad' : 'plain')
const rowsFor = (k: string) => analysis.value.elementRows.filter((r) => r.pillar === k)
const pillarGz = (k: string) => { const p = props.chart.pillars.find((x) => x.key === k)!; return p.stemChar + p.branchChar }
const signed = (n: number) => (n > 0 ? `+${n}` : n === 0 ? '0' : `${n}`)
const verdictClass = (v: string) => (/太旺|过旺|从强/.test(v) ? 'hot' : /太弱|从弱|偏弱/.test(v) ? 'cold' : '')
</script>

<template>
  <div class="an cjk-prose">
    <blockquote class="overview">
      <p>{{ analysis.overview }}</p>
      <p class="t-muted">{{ analysis.relationsLine }}</p>
    </blockquote>
    <div class="legend lq-surface t-sm t-muted">
      <p>{{ t('以下断语按规则由四柱十神、神煞、宫位与旺衰推出，同一个字常常吉凶并存。可信度表示该口诀在传统命理中的可靠程度，并非概率。') }}</p>
      <p>{{ t('【吉】【忌】【凶】【贵】【富】表示富贵与吉凶倾向；【★】表示重要；【格】表示可信度较高的格局判断。推断依据供懂四柱者核对。') }}</p>
    </div>

    <section class="verdicts">
      <header class="v-head">
        <h3>{{ t('断语') }} <span class="t-muted t-num">{{ shown.length }}{{ t(' 条') }}</span></h3>
        <div class="chips" role="tablist">
          <button v-for="tp in ['全部', ...topics]" :key="tp" type="button" class="chip" :class="{ on: topic === tp }" @click="topic = tp">{{ t(tp) }}</button>
        </div>
      </header>
      <div class="tw">
        <table class="vt">
          <thead><tr><th>{{ t('断语') }}</th><th class="num">{{ t('可信度') }}</th><th>{{ t('推断依据（不懂四柱的不用看）') }}</th></tr></thead>
          <tbody>
            <tr v-for="(v, i) in shown" :key="i">
              <td><span v-if="v.tag" class="tag" :class="tagClass(v)">【{{ t(v.tag) }}<template v-if="v.star"> ★</template>】</span>{{ isEn ? (VERDICT_EN[v.text] ?? v.text) : v.text }}</td>
              <td class="num t-num">{{ v.confidence }}%</td>
              <td class="basis t-muted">{{ v.basis }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaywallCard v-if="locked" compact :title="`${t('还有')} ${hidden} ${t('条断语、评分、喜用神与五行十神详表')}`" />
    </section>

    <LqCollapse v-if="!locked" :title="t('命局分析评分')" :summary="`${t('总计')} ${analysis.totalScore} / 345`" open>
      <div class="tw">
        <table class="st">
          <thead><tr><th>{{ t('命局分析') }}</th><th class="num">{{ t('得分范围') }}</th><th class="num">{{ t('实际得分') }}</th><th>{{ t('说明') }}</th></tr></thead>
          <tbody>
            <tr v-for="s in analysis.scores" :key="s.name"><td>{{ t(s.name) }}</td><td class="num t-num">0–{{ s.max }}</td><td class="num t-num" :class="{ strong: s.score >= s.max * 0.7, weak: s.score === 0 }">+{{ s.score }}</td><td class="t-muted">{{ s.note }}</td></tr>
            <tr class="total"><td>{{ t('总计') }}</td><td></td><td class="num t-num">+{{ analysis.totalScore }}</td><td class="t-muted">{{ t('一般越高越好；总分高不如某一单项 ≥ 50（通常为中上等命）。') }}</td></tr>
          </tbody>
        </table>
      </div>
    </LqCollapse>

    <LqCollapse v-if="!locked" :title="t('喜用神 · 忌神')" :summary="analysis.tiaohou.stems.length ? `${t('调候')} ${analysis.tiaohou.stems.join(' ')}` : ''" open>
      <div class="tw">
        <table class="st">
          <thead><tr><th>{{ t('类型') }}</th><th>{{ t('喜用神') }}</th><th>{{ t('忌神') }}</th><th>{{ t('说明：为空表示没有') }}</th></tr></thead>
          <tbody>
            <tr v-for="u in analysis.useGods" :key="u.type"><td>{{ t(u.type) }}</td><td class="good">{{ u.favourable.join('、') }}</td><td class="bad">{{ u.unfavourable.join('、') }}</td><td class="t-muted">{{ u.note }}</td></tr>
          </tbody>
        </table>
      </div>
      <p class="t-sm t-muted pad">{{ t('可依喜用神后天调节：大运流年逢喜用神多顺，逢忌神多阻。甲年尾数 4、乙 5、丙 6、丁 7、戊 8、己 9、庚 0、辛 1、壬 2、癸 3（自立春起算）。') }}</p>
    </LqCollapse>

    <LqCollapse v-if="!locked" :title="t('格局')" :summary="analysis.patterns.map((p) => p.name).join(' · ')">
      <ul class="patterns">
        <li v-for="p in analysis.patterns" :key="p.name"><b>{{ p.name }}</b><span class="t-faint">{{ t(p.kind) }}</span><span class="t-muted">{{ p.note }}</span></li>
      </ul>
      <p v-if="analysis.tiaohou.stems.length" class="t-sm pad"><span class="t-muted">{{ chart.dayMaster.stemChar }}{{ t('日') }} {{ chart.classics.key[1] }}{{ t('月生，调候用神') }} {{ analysis.tiaohou.stems.join('、') }}。</span> {{ analysis.tiaohou.line }} <span class="t-muted">{{ analysis.tiaohou.text }}</span></p>
    </LqCollapse>

    <LqCollapse v-if="!locked" :title="t('五行旺衰明细')" :summary="t('本命 · 同柱 · 月令 · 邻干 · 合化 · 近日主 · 通根 · 时坐')">
      <div class="tw">
        <table class="wt">
          <thead><tr><th>{{ t('五行旺衰') }}</th><th></th><th class="num">{{ t('本命包含') }}</th><th class="num">{{ t('同柱影响') }}</th><th class="num">{{ t('月令影响') }}</th><th class="num">{{ t('天干邻柱') }}</th><th class="num">{{ t('地支合化相生') }}</th><th class="num">{{ t('离日主近') }}</th><th class="num">{{ t('通根影响') }}</th><th class="num">{{ t('时坐影响') }}</th><th class="num">{{ t('总计') }}</th></tr></thead>
          <tbody>
            <template v-for="k in KEYS" :key="k">
              <tr v-for="(r, i) in rowsFor(k)" :key="r.element" :class="{ zero: r.base === 0 }">
                <th v-if="i === 0" :rowspan="5" class="pk">{{ PILLAR_ZH[k] }}<br /><span class="gz">{{ pillarGz(k) }}</span></th>
                <td class="wx" :style="{ color: el(r.element) }">{{ ELEMENT_ZH[r.element] }}</td>
                <td class="num t-num">{{ r.base }}</td><td class="num t-num">{{ signed(r.samePillar) }}</td><td class="num t-num">{{ signed(r.month) }}</td><td class="num t-num">{{ signed(r.adjStem) }}</td><td class="num t-num">{{ signed(r.branchCombo) }}</td><td class="num t-num">{{ signed(r.proximity) }}</td><td class="num t-num">{{ signed(r.root) }}</td><td class="num t-num">{{ signed(r.hourSeat) }}</td><td class="num t-num total">{{ r.total }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div class="tw">
        <table class="st sum">
          <thead><tr><th>{{ t('四柱总计') }}</th><th class="num">{{ t('数量') }}</th><th>{{ t('天透地藏') }}</th><th class="num">{{ t('数值') }}</th><th class="num">{{ t('占比') }}</th><th>{{ t('旺衰总结') }}</th></tr></thead>
          <tbody>
            <tr v-for="s in analysis.elementSummary" :key="s.element"><td><b :style="{ color: el(s.element) }">{{ ELEMENT_ZH[s.element] }}</b><span class="t-muted">（{{ t(s.role) }}）</span></td><td class="num t-num">{{ s.count }}</td><td>{{ t(s.exposure) }}</td><td class="num t-num">{{ s.value }}</td><td class="num t-num">{{ s.percent }}%</td><td :class="verdictClass(s.verdict)">{{ t(s.verdict) }}</td></tr>
          </tbody>
        </table>
      </div>
      <p class="t-sm t-muted pad">{{ t('本模型：天干 36，藏干本气 60、中气 30、余气 10；月令旺相休囚死分别 +40% / +20% / −15% / −30% / −45%；同柱、邻干、地支合冲、通根、时坐为固定分值修正。身旺身弱是绝对占比，实际需综合财官印食之间的相对强弱。') }}</p>
    </LqCollapse>

    <LqCollapse v-if="!locked" :title="t('十神强弱')" :summary="t('数量 · 天透地藏 · 基础 · 月令 · 时柱 · 藏透根 · 特性')">
      <div class="tw">
        <table class="st">
          <thead><tr><th>{{ t('十神') }}</th><th class="num">{{ t('数量') }}</th><th>{{ t('天透地藏') }}</th><th class="num">{{ t('基础数值') }}</th><th class="num">{{ t('基础占比') }}</th><th class="num">{{ t('月柱影响') }}</th><th class="num">{{ t('时柱影响') }}</th><th class="num">{{ t('藏透、根') }}</th><th class="num">{{ t('十神特性') }}</th><th class="num">{{ t('综合数值') }}</th><th class="num">{{ t('综合占比') }}</th></tr></thead>
          <tbody>
            <tr v-for="g in analysis.tenGods" :key="g.name" :class="{ zero: g.base === 0 }"><td>{{ t(g.name) }}</td><td class="num t-num">{{ g.count }}</td><td>{{ t(g.exposure) }}</td><td class="num t-num">{{ g.base }}</td><td class="num t-num">{{ g.basePercent }}%</td><td class="num t-num">{{ signed(g.month) }}</td><td class="num t-num">{{ signed(g.hour) }}</td><td class="num t-num">{{ signed(g.rootBonus) }}</td><td class="num t-num">{{ signed(g.trait) }}</td><td class="num t-num total">{{ g.total }}</td><td class="num t-num">{{ g.percent }}%</td></tr>
          </tbody>
        </table>
      </div>
    </LqCollapse>
  </div>
</template>

<style scoped>
.an {
  display: grid;
  gap: var(--sp-5);
}
.overview {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: var(--sp-2) var(--sp-4);
  border-left: 3px solid var(--accent);
  font-size: var(--fs-sm);
  line-height: 1.8;
}
.legend {
  display: grid;
  gap: 4px;
  padding: var(--sp-3) var(--sp-4);
  line-height: 1.7;
}
.verdicts {
  display: grid;
  gap: var(--sp-3);
}
.v-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}
.v-head h3 {
  font-size: var(--fs-md);
  font-weight: 500;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 3px 10px;
  border: 0;
  border-radius: var(--r-pill);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
  color: var(--text-2);
  font-size: var(--fs-xs);
}
.chip.on {
  color: var(--accent-ink);
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent);
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
  padding: 12px 12px;
  border-top: 1px solid var(--hairline);
  text-align: left;
  vertical-align: top;
}
thead th {
  border-top: 0;
  color: var(--text-2);
  font-weight: 400;
  font-size: var(--fs-xs);
  background: var(--surface-sunken);
}
.num {
  text-align: right;
  white-space: nowrap;
}
.vt td:first-child {
  line-height: 1.9;
  font-size: var(--fs-base);
}
.vt .basis {
  line-height: 1.7;
}
.vt .basis {
  min-width: 180px;
  max-width: 320px;
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
.st .total td {
  font-weight: 500;
}
.strong {
  color: var(--wx-wood);
}
.weak {
  color: var(--text-3);
}
.good {
  color: var(--wx-wood);
}
.bad {
  color: var(--wx-fire);
}
.wt .pk {
  vertical-align: middle;
  white-space: nowrap;
  color: var(--text-2);
}
.wt .gz {
  color: var(--text);
  font-weight: 500;
}
.wt .wx {
  font-weight: 500;
}
.zero td {
  color: var(--text-3);
}
.total {
  font-weight: 500;
}
.hot {
  color: var(--wx-fire);
}
.cold {
  color: var(--wx-water);
}
.sum {
  margin-top: var(--sp-3);
}
.patterns {
  display: grid;
  gap: 6px;
  font-size: var(--fs-sm);
}
.patterns li {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: var(--sp-3);
  align-items: baseline;
}
.pad {
  padding-top: var(--sp-3);
  line-height: 1.7;
}
</style>
