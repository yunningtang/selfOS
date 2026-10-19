<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import LiquidOrb from '@/components/ambient/LiquidOrb.vue'
import LqButton from '@/components/ui/LqButton.vue'
import { useDivinationStore } from '@/stores/divination'
import { useI18n } from '@/i18n'
import PaywallCard from '@/components/paywall/PaywallCard.vue'
import { useLicense } from '@/composables/useLicense'

const { t } = useI18n()
const { ready, birth } = storeToRefs(useDivinationStore())
const lic = useLicense()
const pad = (n: number) => String(n).padStart(2, '0')
const profileLine = computed(() => `${birth.value.name ? birth.value.name + ' · ' : ''}${birth.value.year}-${pad(birth.value.month)}-${pad(birth.value.day)} ${pad(birth.value.hour)}:${pad(birth.value.minute)} · ${birth.value.place}`)
const STEPS = [
  { n: '01', title: '输入出生时刻', text: '日期、时间、出生地。公历农历皆可，地点自动匹配经纬度与时区。' },
  { n: '02', title: '排出四套命盘', text: '八字、紫微斗数、西方占星、Jyotish，由瑞士星历在本地精算。' },
  { n: '03', title: '阅读分析', text: '百余条断语、格局、喜用神、五行与十神强弱，每一条都标明推断依据。' },
]
const SYSTEMS = ['八字 · 四柱、大运流年流月、神煞、调候、古籍', '紫微斗数 · 十二宫、四化、大限流年']
const FREE = ['四柱排盘、大运流年流月', '紫微斗数十二宫与大限流年', '分析前 12 条断语', '命盘要点与当前大运评级']
const PRO = ['全部约 100 条断语与推断依据', '评分、喜用神、五行与十神详表', '运势：逐年、逐月预判与依据', '资产与学业：现实背景校准与检查点', '本机永久解锁，邮箱跨设备恢复']
</script>

<template>
  <section class="home">
    <div class="hero">
      <div class="orb" aria-hidden="true"><LiquidOrb :material="{ base: '#EAF0FF', depth: '#4D6BFE', variant: 'liquid' }" :size="180" :intensity="0.65" /></div>
      <div class="words">
        <p class="t-label eyebrow">{{ t('八字 · 紫微 · 本地计算 · 不上传') }}</p>
        <h1>{{ t('一个出生时刻，排盘、分析、运势、资产') }}</h1>
        <p class="lede">{{ t('八字与紫微斗数由同一个时刻算起，再给出百余条带依据的分析、逐年运势与现实校准的资产判断。') }}</p>
        <div class="cta">
          <template v-if="ready">
            <RouterLink to="/chart" custom v-slot="{ navigate }"><LqButton variant="primary" icon="celestial" @click="navigate">{{ t('查看我的命盘') }}</LqButton></RouterLink>
            <RouterLink to="/begin" custom v-slot="{ navigate }"><LqButton variant="ghost" @click="navigate">{{ t('修改出生信息') }}</LqButton></RouterLink>
          </template>
          <RouterLink v-else to="/begin" custom v-slot="{ navigate }"><LqButton variant="primary" icon="celestial" @click="navigate">{{ t('开始：输入出生信息') }}</LqButton></RouterLink>
        </div>
        <p v-if="ready" class="t-caption t-num">{{ profileLine }}</p>
      </div>
    </div>
    <ol class="steps">
      <li v-for="s in STEPS" :key="s.n" class="lq-surface">
        <span class="s-n t-num">{{ s.n }}</span>
        <span class="s-title">{{ t(s.title) }}</span>
        <span class="s-text">{{ t(s.text) }}</span>
      </li>
    </ol>
    <ul class="systems">
      <li v-for="s in SYSTEMS" :key="s" class="t-sm t-muted">{{ t(s) }}</li>
    </ul>
    <section class="pricing">
      <div class="plan lq-surface">
        <p class="t-label">{{ t('免费') }}</p>
        <h3>{{ t('排盘') }}</h3>
        <ul><li v-for="f in FREE" :key="f">{{ t(f) }}</li></ul>
      </div>
      <div class="plan pro">
        <PaywallCard v-if="!lic.pro.value" :title="t('完整分析')" />
        <div v-else class="lq-surface plan-inner">
          <p class="t-label">{{ t('完整版') }}</p>
          <h3>{{ t('已解锁') }}</h3>
          <ul><li v-for="f in PRO" :key="f">{{ t(f) }}</li></ul>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.home {
  display: grid;
  gap: var(--sp-8);
  padding-top: var(--sp-4);
}
.hero {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: var(--sp-7);
  align-items: center;
}
.orb {
  display: grid;
  place-items: center;
}
.words {
  display: grid;
  gap: var(--sp-4);
  max-width: 58ch;
}
.eyebrow {
  color: var(--accent-ink);
}
h1 {
  font-size: clamp(1.875rem, 3.2vw, 2.5rem);
}
.lede {
  font-size: var(--fs-md);
  color: var(--text-2);
}
.cta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
}
.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sp-3);
}
.steps li {
  display: grid;
  gap: var(--sp-2);
  padding: var(--sp-4) var(--sp-5);
  border-radius: var(--r-lg);
}
.s-n {
  font-size: var(--fs-xs);
  color: var(--accent-ink);
}
.s-title {
  font-weight: var(--fw-medium);
}
.s-text {
  font-size: var(--fs-sm);
  color: var(--text-2);
  line-height: var(--lh-snug);
}
.systems {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-2) var(--sp-6);
}

.pricing {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: var(--sp-4);
  align-items: start;
}
.plan,
.plan-inner {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-5) var(--sp-6);
  border-radius: var(--r-xl);
}
.plan.pro {
  padding: 0;
}
.plan h3 {
  font-size: var(--fs-xl);
}
.plan ul,
.plan-inner ul {
  display: grid;
  gap: 6px;
  font-size: var(--fs-sm);
  color: var(--text-2);
}
.plan li::before,
.plan-inner li::before {
  content: '✓';
  margin-right: 8px;
  color: var(--text-3);
}
@media (max-width: 760px) {
  .pricing {
    grid-template-columns: 1fr;
  }
  .hero {
    grid-template-columns: 1fr;
  }
  .orb {
    transform: scale(0.7);
  }
  .steps,
  .systems {
    grid-template-columns: 1fr;
  }
}
</style>
