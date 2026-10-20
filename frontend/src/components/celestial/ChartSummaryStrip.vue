<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ELEMENTS } from '@/data/lexicon'
import { ELEMENT_ZH } from '@selfos/destiny-core/bazi/tables'
import { analyseBazi } from '@selfos/destiny-core/bazi/analysis'
import { forecastLuck, forecastYear, RATING_LABEL } from '@selfos/destiny-core/bazi/forecast'
import { assessWealth, DEFAULT_CONTEXT } from '@selfos/destiny-core/bazi/wealth'
import { useDivinationStore } from '@/stores/divination'
import { useI18n } from '@/i18n'
import type { BaziChart } from '@/types'

/** One line of conclusions that stays the same across 排盘 / 分析 / 运势 / 资产, so the tabs read as one story. */
const props = defineProps<{ chart: BaziChart }>()
const emit = defineEmits<{ go: [mode: 'chart' | 'analysis' | 'forecast' | 'wealth'] }>()
const { t } = useI18n()
const { birth } = storeToRefs(useDivinationStore())
const thisYear = new Date().getFullYear()
const analysis = computed(() => analyseBazi(props.chart))
const luck = computed(() => props.chart.luck.pillars.find((l) => l.startYear <= thisYear && thisYear <= l.endYear))
const luckF = computed(() => (luck.value ? forecastLuck(props.chart, luck.value, analysis.value) : null))
const yearF = computed(() => forecastYear(props.chart, thisYear, analysis.value))
const wealth = computed(() => assessWealth(props.chart, analysis.value, birth.value.context ?? DEFAULT_CONTEXT))
const el = ELEMENTS[props.chart.dayMaster.element].token
const items = computed(() => [
  { k: '日主', v: `${props.chart.dayMaster.stemChar}${ELEMENT_ZH[props.chart.dayMaster.element]} · ${t(props.chart.strength.verdict)}`, mode: 'chart' as const, tone: el },
  { k: '格局', v: analysis.value.patterns.slice(0, 2).map((p) => p.name).join(' · '), mode: 'analysis' as const },
  { k: '喜用', v: `${analysis.value.effective.favourable.map((e) => ELEMENT_ZH[e]).join('')} · ${t(analysis.value.effective.source)}${analysis.value.effective.notes.length ? '+' : ''}`, mode: 'analysis' as const },
  { k: '当前大运', v: luck.value && luckF.value ? `${luck.value.stemChar}${luck.value.branchChar} · ${t(RATING_LABEL[luckF.value.rating])}` : '—', mode: 'forecast' as const },
  { k: '今年', v: `${yearF.value.stemChar}${yearF.value.branchChar} · ${t(RATING_LABEL[yearF.value.rating])}`, mode: 'forecast' as const },
  { k: '资产层级', v: wealth.value.band.name, mode: 'wealth' as const },
])
</script>

<template>
  <ul class="strip cjk-prose" :aria-label="t('命盘要点')">
    <li v-for="i in items" :key="i.k">
      <button type="button" @click="emit('go', i.mode)">
        <span class="k">{{ t(i.k) }}</span>
        <span class="v" :style="i.tone ? { color: i.tone } : undefined">{{ i.v }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--sp-2);
}
button {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
  color: var(--text);
  text-align: left;
  transition: box-shadow var(--dur-fast);
}
button:hover {
  box-shadow: inset 0 0 0 1px var(--hairline-3);
}
.k {
  font-size: var(--fs-2xs);
  color: var(--text-3);
}
.v {
  font-size: var(--fs-sm);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
@media (max-width: 900px) {
  .strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 520px) {
  .strip {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
