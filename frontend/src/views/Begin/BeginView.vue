<script setup lang="ts">
import { useRouter } from 'vue-router'
import BirthWizard from '@/components/celestial/BirthWizard.vue'
import { useDivinationStore } from '@/stores/divination'

const router = useRouter()
const div = useDivinationStore()
function done() {
  router.push('/celestial')
}
</script>

<template>
  <section class="begin" aria-labelledby="begin-title">
    <header class="intro">
      <p class="t-label eyebrow">第一步 · 出生信息</p>
      <h1 id="begin-title">输入你的出生时刻</h1>
      <p class="lede">一个时刻，四套命盘：八字、紫微斗数、西方占星与 Jyotish 都从这里算起。全部在本地计算，不上传任何数据。</p>
    </header>
    <div class="card lq-glass">
      <BirthWizard :mode="div.ready ? 'edit' : 'onboard'" @done="done" @cancel="router.push('/celestial')" />
    </div>
  </section>
</template>

<style scoped>
.begin {
  display: grid;
  gap: var(--sp-6);
  padding-top: var(--sp-4);
}
.intro {
  display: grid;
  gap: var(--sp-2);
  max-width: 60ch;
}
.eyebrow {
  color: var(--accent-ink);
}
.lede {
  color: var(--text-2);
  line-height: var(--lh-body);
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
