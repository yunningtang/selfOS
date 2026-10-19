<script setup lang="ts">
import { useRouter } from 'vue-router'
import BirthWizard from '@/components/celestial/BirthWizard.vue'
import { useDivinationStore } from '@/stores/divination'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const router = useRouter()
const div = useDivinationStore()
</script>

<template>
  <section class="begin">
    <header class="intro">
      <h1>{{ t('输入你的出生时刻') }}</h1>
      <p class="t-muted">{{ t('一个时刻，四套命盘：八字、紫微斗数、西方占星与 Jyotish 都从这里算起。全部在本地计算，不上传任何数据。') }}</p>
    </header>
    <div class="card lq-glass">
      <BirthWizard :mode="div.ready ? 'edit' : 'onboard'" @done="router.push('/chart')" @cancel="router.push('/chart')" />
    </div>
  </section>
</template>

<style scoped>
.begin {
  display: grid;
  gap: var(--sp-6);
}
.intro {
  display: grid;
  gap: var(--sp-2);
  max-width: 60ch;
}
.card {
  padding: var(--sp-7);
  border-radius: var(--r-xl);
}
@media (max-width: 640px) {
  .card {
    padding: var(--sp-5) var(--sp-4);
  }
}
</style>
