<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import LqButton from '@/components/ui/LqButton.vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import Notice from '@/components/ui/Notice.vue'
import BirthWizard from '@/components/celestial/BirthWizard.vue'
import ChartSummaryStrip from '@/components/celestial/ChartSummaryStrip.vue'
import BaZiBoard from '@/components/BaZiChart/BaZiBoard.vue'
import ZiweiPanel from '@/components/ZiweiChart/ZiweiPanel.vue'
import { useLicense } from '@/composables/useLicense'
import { useDivinationStore } from '@/stores/divination'
import { useI18n } from '@/i18n'

const { t, isEn } = useI18n()
const div = useDivinationStore()
const { birth, ready, bazi, ziwei, loading, error } = storeToRefs(div)
const lic = useLicense()
const system = ref<'bazi' | 'ziwei'>('bazi')
const editing = ref(false)
const baziMode = ref<'chart' | 'analysis' | 'forecast' | 'wealth'>('chart')
function go(mode: 'chart' | 'analysis' | 'forecast' | 'wealth') {
  system.value = 'bazi'
  baziMode.value = mode
}
onMounted(async () => {
  await lic.handleReturn()
  if (ready.value && !bazi.value) div.cast()
})
const pad = (n: number) => String(n).padStart(2, '0')
const profileLine = computed(() => `${birth.value.calendar === 'lunar' ? t('农历') + ' ' : ''}${birth.value.year}-${pad(birth.value.month)}-${pad(birth.value.day)} ${pad(birth.value.hour)}:${pad(birth.value.minute)}`)
const tabMeta = computed(() => {
  if (!bazi.value) return ''
  if (system.value === 'bazi') return `${bazi.value.options.trueSolarTime ? t('真太阳时') : t('标准时')} ${bazi.value.time.trueSolar.slice(11, 16)} · ${t('晚子时')}${isEn.value ? ' ' : ''}${bazi.value.options.lateZi === 'next-day' ? t('换日') : t('不换日')}`
  if (system.value === 'ziwei') return ziwei.value ? `${ziwei.value.fiveElementsClass} · ${t('命主')} ${ziwei.value.soul} · ${t('身主')} ${ziwei.value.body}` : ''
  return ''
})
</script>

<template>
  <section class="chart">
    <div v-if="!ready" class="profile lq-glass onboard">
      <div class="onboard-head">
        <h2>{{ t('先输入出生信息') }}</h2>
        <p class="t-muted">{{ t('五步完成，之后随时可改。排盘全部在本地进行。') }}</p>
      </div>
      <BirthWizard mode="onboard" @done="editing = false" />
    </div>
    <div v-else class="profile lq-glass">
      <div v-if="!editing" class="summary">
        <div class="who">
          <span class="name">{{ birth.name || t('出生档案') }}</span>
          <span class="meta t-num">{{ profileLine }} · {{ birth.place || `${birth.latitude}, ${birth.longitude}` }}</span>
          <span v-if="bazi" class="meta t-faint t-num">{{ bazi.time.zoneLabel }} · UTC {{ bazi.time.utc.slice(0, 16) }}<template v-if="bazi.time.dst"> {{ t('· 已按夏令时换算') }}</template></span>
        </div>
        <LqButton variant="secondary" size="sm" @click="editing = true">{{ t('修改出生信息') }}</LqButton>
      </div>
      <div v-else class="form-wrap">
        <BirthWizard mode="edit" @done="editing = false" @cancel="editing = false" />
      </div>
    </div>

    <Notice v-if="error" tone="error">{{ error }}</Notice>

    <template v-if="ready">
      <ChartSummaryStrip v-if="bazi && !editing" :chart="bazi" @go="go" />
      <div class="tabs">
        <LqSegmented v-model="system" :options="[{ value: 'bazi', label: t('八字') }, { value: 'ziwei', label: t('紫微') }]" :label="t('排盘体系')" />
        <p class="t-caption">{{ tabMeta }}</p>
      </div>
      <Transition name="fade" mode="out-in">
        <div v-if="system === 'bazi'" key="bazi" class="panel"><BaZiBoard v-if="bazi" v-model:mode="baziMode" :chart="bazi" gate @edit="editing = true" /><p v-else class="t-muted">{{ loading ? t('正在加载星历并排盘…') : t('尚未排盘。') }}</p></div>
        <div v-else key="ziwei" class="panel"><ZiweiPanel v-if="ziwei" :chart="ziwei" /><p v-else class="t-muted">{{ loading ? t('排盘中…') : t('尚未排盘。') }}</p></div>
      </Transition>
    </template>
  </section>
</template>

<style scoped>
.chart {
  display: grid;
  gap: var(--sp-6);
}
.profile {
  border-radius: var(--r-xl);
}
.onboard {
  display: grid;
  gap: var(--sp-5);
  padding: var(--sp-6) var(--sp-7) var(--sp-7);
}
.onboard-head {
  display: grid;
  gap: 4px;
}
.onboard-head h2 {
  font-size: var(--fs-lg);
}
.summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
  padding: var(--sp-4) var(--sp-6);
}
.who {
  display: grid;
  gap: 2px;
}
.name {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}
.meta {
  font-size: var(--fs-sm);
  color: var(--text-2);
}
.form-wrap {
  padding: var(--sp-6) var(--sp-7) var(--sp-7);
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}
.panel {
  min-width: 0;
}
@media (max-width: 640px) {
  .form-wrap,
  .onboard {
    padding: var(--sp-5) var(--sp-4);
  }
  .summary {
    padding: var(--sp-4);
  }
}
</style>
