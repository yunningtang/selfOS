<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import LqCollapse from '@/components/ui/LqCollapse.vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqSelect from '@/components/ui/LqSelect.vue'
import PaywallCard from '@/components/paywall/PaywallCard.vue'
import { analyseBazi } from '@selfos/destiny-core/bazi/analysis'
import { assessWealth, BANDS, CITY_TIERS, EDUCATIONS, FAMILIES, OCCUPATIONS, DEFAULT_CONTEXT, type RealityContext } from '@selfos/destiny-core/bazi/wealth'
import { useDivinationStore } from '@/stores/divination'
import { useI18n } from '@/i18n'
import type { BaziChart } from '@/types'

const props = defineProps<{ chart: BaziChart; locked?: boolean }>()
const emit = defineEmits<{ edit: [] }>()
const { t } = useI18n()
const { birth } = storeToRefs(useDivinationStore())
const ctx = computed<RealityContext>({
  get: () => birth.value.context ?? DEFAULT_CONTEXT,
  set: (v) => (birth.value = { ...birth.value, context: v }),
})
const ctxOptions = (list: { value: string; label: string; note: string }[]) => list.map((o) => ({ value: o.value, label: o.label, hint: o.note || undefined }))
const ctxModel = (k: keyof RealityContext) => computed({ get: () => ctx.value[k] as string, set: (v: string) => (ctx.value = { ...ctx.value, [k]: v } as RealityContext) })
const cityTier = ctxModel('cityTier'), family = ctxModel('family'), education = ctxModel('education'), occupation = ctxModel('occupation')
const analysis = computed(() => analyseBazi(props.chart))
const w = computed(() => assessWealth(props.chart, analysis.value, ctx.value))
const filled = computed(() => Object.values(ctx.value).some((v) => v !== 'unknown'))
const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`)
</script>

<template>
  <div class="wealth cjk-prose">
    <p class="intro t-sm t-muted">{{ t('资产与学业判断把三件事放在一起看：你的现实起点（城市、家庭、学历、职业）、命局本身承载财富的能力、以及工作年龄段的运势。三部分各自打分并列出依据，相加后对应到家庭净资产的六个层级。它回答的是「命局与起点相称到什么程度、何时抬升」，不是一个精确数字。') }}</p>

    <PaywallCard v-if="locked" :title="t('解锁资产与学业判断')" />
    <template v-else>
    <section class="ctx lq-surface">
      <header class="ctx-head">
        <h3>{{ t('现实背景') }}</h3>
        <span class="t-caption">{{ filled ? t('已填写，可随时修改') : t('未填写时按全国中位起点计算') }}</span>
      </header>
      <div class="ctx-grid">
        <div class="f"><span class="lbl">{{ t('出生 / 成长城市') }}</span><LqSelect v-model="cityTier" :options="ctxOptions(CITY_TIERS)" :label="t('出生 / 成长城市')" /></div>
        <div class="f"><span class="lbl">{{ t('家庭背景') }}</span><LqSelect v-model="family" :options="ctxOptions(FAMILIES)" :label="t('家庭背景')" /></div>
        <div class="f"><span class="lbl">{{ t('学历') }}</span><LqSelect v-model="education" :options="ctxOptions(EDUCATIONS)" :label="t('学历')" /></div>
        <div class="f"><span class="lbl">{{ t('职业') }}</span><LqSelect v-model="occupation" :options="ctxOptions(OCCUPATIONS)" :label="t('职业')" /></div>
      </div>
    </section>

    <section class="result lq-glass">
      <div class="band">
        <span class="t-label">{{ t('综合资产层级') }}</span>
        <p class="band-name">{{ w.band.name }} <span class="t-muted t-sm">{{ w.rangesForCity[w.band.level - 1] }}</span></p>
        <p class="t-sm t-muted">{{ w.band.note }}</p>
      </div>
      <div class="plain">
        <p v-for="(n, i) in w.plain" :key="i">{{ n }}</p>
      </div>
      <ol class="scale" :aria-label="t('六级')">
        <li v-for="b in BANDS" :key="b.level" :class="{ on: b.level === w.band.level, base: b.level === w.baselineBand.level, chart: b.level === w.chartBand.level }">
          <span class="dot" /><span class="nm">{{ b.name }}</span><span class="rg t-faint">{{ w.rangesForCity[b.level - 1].replace('家庭净资产 ', '') }}</span><span class="nt t-caption">{{ b.note }}</span>
          <span class="mk" aria-hidden="true"><span v-if="b.level === w.band.level" class="k on">{{ t('综合') }}</span><span v-if="b.level === w.baselineBand.level" class="k base">{{ t('起点') }}</span><span v-if="b.level === w.chartBand.level" class="k chart">{{ t('命局') }}</span></span>
        </li>
      </ol>
      <p class="legend t-caption"><span class="k on">●</span> {{ t('综合') }}：{{ w.band.name }} <span class="k base">●</span> {{ t('仅现实起点') }}：{{ w.baselineBand.name }} <span class="k chart">●</span> {{ t('仅命局与运势') }}：{{ w.chartBand.name }}</p>
    </section>

    <LqCollapse :title="t('计分明细')" :summary="`${t('合计')} ${sign(w.total)} → ${w.band.name}`">
      <div class="cols">
        <div v-for="(col, i) in [['现实起点', w.baseline], ['命局财力', w.chart], ['运势加成', w.luck]] as const" :key="i" class="col">
          <h4>{{ t(col[0]) }} <b class="t-num" :class="{ pos: col[1].score > 0, neg: col[1].score < 0 }">{{ sign(col[1].score) }}</b></h4>
          <ul>
            <li v-for="p in col[1].parts" :key="p.name"><span class="pn">{{ p.name }}</span><b class="t-num" :class="{ pos: p.score > 0, neg: p.score < 0 }">{{ sign(p.score) }}</b><span class="pr t-muted">{{ p.reason }}</span></li>
          </ul>
        </div>
      </div>
      <div class="narr">
        <p v-for="(n, i) in w.narrative" :key="i" class="t-sm t-muted">{{ n }}</p>
      </div>
    </LqCollapse>

    <section class="cps">
      <h3>{{ t('阶段检查点') }}</h3>
      <ol class="cp-list">
        <li v-for="c in w.checkpoints" :key="c.age" class="lq-surface">
          <span class="cp-age t-num">{{ c.age }}{{ t('岁') }} · {{ c.year }}</span>
          <span class="cp-band">{{ c.band.name }} <span class="t-muted t-sm">{{ w.rangesForCity[c.band.level - 1] }}</span></span>
          <span class="t-caption">{{ c.note }}</span>
        </li>
      </ol>
      <p class="t-caption">{{ t('每个年龄点按前后十年的运势在综合层级上微调；30 岁前还在积累期，按惯例压低两档，40 岁压低一档。') }}</p>
    </section>

    <section class="edu lq-surface">
      <h3>{{ t('学业') }} <b class="t-num" :class="{ pos: w.education.score > 0, neg: w.education.score < 0 }">{{ sign(w.education.score) }}</b></h3>
      <p class="t-sm"><b>{{ w.education.verdict }}</b></p>
      <p class="t-sm t-muted">{{ w.education.comparison }}</p>
      <ul class="edu-parts">
        <li v-for="p in w.education.parts" :key="p.name" class="t-sm"><span class="pn">{{ p.name }}</span><b class="t-num" :class="{ pos: p.score > 0, neg: p.score < 0 }">{{ sign(p.score) }}</b><span class="t-muted">{{ p.reason }}</span></li>
      </ul>
    </section>

    <LqCollapse :title="t('算法说明')">
      <div class="algo t-sm t-muted">
        <p>{{ t('现实起点：城市 −1…+3、家庭 −2…+3、学历 −2…+3、职业 −1…+2，按选项固定分值相加。') }}</p>
        <p>{{ t('命局财力：财星占比与身财平衡（从财格 +3；财旺身能任 +2；财中和 +1；财多身弱 −1；财弱 −1）、食伤生财 +1、比劫夺财 −1、禄神 +1、调候得用 +1、财官双美 +1、专旺从强 +1、印星太旺 −1、伤官见官 −1，截到 −3…+4。') }}</p>
        <p>{{ t('运势加成：25–55 岁逐年评级（见「运势」页），偏吉年数减偏忌年数占比 >30% 记 +2、>10% 记 +1、<−10% 记 −1、<−30% 记 −2；该段内有财星大运 +1；有两步以上吉大运 +1，截到 −2…+3。') }}</p>
        <p>{{ t('层级映射：合计 ≤−2 艰难、≤1 温饱、≤4 小康、≤7 中产、≤10 富裕、≥11 高净值。区间为全国家庭净资产（含房产）的量级参考，并按所选城市的价格水平缩放：一线 ×2.2、新一线 ×1.5、二线 ×1.2、三四线 ×0.85、县乡 ×0.5。') }}</p>
        <p>{{ t('学业：印星占比、文昌学堂国印太极、官印或伤印相配、伤官见官、15–22 岁流年评级；与实际学历对照给出「潜力未释放 / 相符 / 后天补足」。') }}</p>
      </div>
    </LqCollapse>

    </template>
    <p v-if="!locked" class="t-caption foot">{{ t('出生地与出生信息在上方档案中修改；现实背景只保存在本机。') }} <LqButton variant="ghost" size="sm" @click="emit('edit')">{{ t('修改出生信息') }}</LqButton></p>
  </div>
</template>

<style scoped>
.wealth {
  display: grid;
  gap: var(--sp-5);
  min-width: 0;
}
.wealth > * {
  min-width: 0;
}
.intro {
  line-height: 1.85;
}
.ctx {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  border-radius: var(--r-lg);
}
.ctx-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
}
h3 {
  font-size: var(--fs-md);
  font-weight: 500;
}
.ctx-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sp-3);
}
.f {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.lbl {
  font-size: var(--fs-xs);
  color: var(--text-2);
}
.result {
  display: grid;
  gap: var(--sp-5);
  padding: var(--sp-5) var(--sp-6);
  border-radius: var(--r-xl);
}
.band {
  display: grid;
  gap: 6px;
}
.band-name {
  font-size: var(--fs-2xl);
  font-weight: 500;
  line-height: 1.2;
}
.plain {
  display: grid;
  gap: 6px;
  max-width: 72ch;
}
.plain p {
  line-height: 1.85;
}
.plain p:first-child {
  font-weight: 500;
}
/* six-level ladder: horizontal on wide screens, vertical rows on phones */
.scale {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  margin: var(--sp-2) 0 0;
  padding: 14px 0 0;
}
.scale::before {
  content: '';
  position: absolute;
  top: 7px;
  left: 8%;
  right: 8%;
  height: 2px;
  background: var(--hairline-3);
}
.scale li {
  display: grid;
  justify-items: center;
  gap: 2px;
  font-size: var(--fs-xs);
  color: var(--text-3);
  text-align: center;
}
.scale .nt,
.scale .mk {
  display: none;
}
.rg {
  font-size: var(--fs-2xs);
  white-space: nowrap;
}
.mk .k {
  display: inline-block;
  padding: 0 6px;
  border-radius: var(--r-pill);
  font-size: var(--fs-2xs);
  line-height: 18px;
  color: var(--text-on-accent);
}
.mk .k.on { background: var(--accent); }
.mk .k.base { background: var(--wx-earth); }
.mk .k.chart { background: var(--c-mist); }
@media (max-width: 640px) {
  .scale {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    padding: 0;
  }
  .scale::before {
    display: none;
  }
  .scale li {
    grid-template-columns: 14px auto minmax(0, 1fr) auto;
    grid-template-areas: 'dot nm rg mk' '. nt nt nt';
    align-items: center;
    justify-items: start;
    column-gap: 8px;
    row-gap: 0;
    padding: 8px 0;
    border-top: 1px solid var(--hairline);
    text-align: left;
  }
  .scale li:first-child {
    border-top: 0;
  }
  .scale .dot { grid-area: dot; top: 0; }
  .scale .nm { grid-area: nm; font-size: var(--fs-sm); color: var(--text-2); }
  .scale .rg { grid-area: rg; min-width: 0; font-size: var(--fs-xs); white-space: normal; line-height: 1.3; }
  .scale .nt { grid-area: nt; display: block; }
  .scale .mk { grid-area: mk; display: inline-flex; gap: 4px; }
  .scale li.on {
    background: color-mix(in srgb, var(--accent) 6%, transparent);
    margin: 0 calc(-1 * var(--sp-3));
    padding-left: var(--sp-3);
    padding-right: var(--sp-3);
  }
  .scale li.on .dot {
    top: 0;
    width: 10px;
    height: 10px;
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
  .scale li.on .nm {
    color: var(--text);
  }
}
.scale .dot {
  position: relative;
  top: -18px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--hairline-3);
}
.scale li.base .dot {
  background: var(--wx-earth);
}
.scale li.chart .dot {
  background: var(--c-mist);
}
.scale li.on .dot {
  width: 14px;
  height: 14px;
  top: -21px;
  background: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}
.scale li.on .nm {
  color: var(--text);
  font-weight: 500;
}

.legend .k.on {
  color: var(--accent);
}
.legend .k.base {
  color: var(--wx-earth);
}
.legend .k.chart {
  color: var(--c-mist);
}
.cols {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-5);
}
.col h4 {
  display: flex;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--hairline);
  font-size: var(--fs-sm);
  font-weight: 500;
}
.col ul {
  display: grid;
  gap: 8px;
  padding-top: 8px;
}
.col li {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 8px;
  font-size: var(--fs-sm);
}
.pr {
  grid-column: 1 / -1;
  font-size: var(--fs-xs);
  line-height: 1.6;
}
.pos {
  color: var(--wx-wood);
}
.neg {
  color: var(--wx-fire);
}
.total {
  padding-top: var(--sp-3);
  border-top: 1px solid var(--hairline);
}
.narr {
  display: grid;
  gap: 6px;
  margin-top: var(--sp-4);
  padding-top: var(--sp-3);
  border-top: 1px solid var(--hairline);
  line-height: 1.85;
}
.cps {
  display: grid;
  gap: var(--sp-3);
}
.cp-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-3);
}
.cp-list li {
  display: grid;
  gap: 4px;
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--r-md);
}
.cp-age {
  font-size: var(--fs-xs);
  color: var(--text-2);
}
.cp-band {
  font-size: var(--fs-md);
  font-weight: 500;
}
.edu {
  display: grid;
  gap: 6px;
  padding: var(--sp-4) var(--sp-5);
  border-radius: var(--r-lg);
}
.edu h3 {
  display: flex;
  justify-content: space-between;
}
.edu-parts {
  display: grid;
  gap: 4px;
  padding-top: 4px;
}
.edu-parts li {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 8px;
  align-items: baseline;
}
.algo {
  display: grid;
  gap: 6px;
  line-height: 1.8;
}
.foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
}
@media (max-width: 900px) {
  .ctx-grid,
  .cols,
  .cp-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .ctx-grid,
  .cols,
  .cp-list {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
