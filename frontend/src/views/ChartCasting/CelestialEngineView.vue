<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/ui/PageHeader.vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import Notice from '@/components/ui/Notice.vue'
import BirthWizard from '@/components/celestial/BirthWizard.vue'
import BaZiBoard from '@/components/BaZiChart/BaZiBoard.vue'
import WesternPanel from '@/components/WesternChart/WesternPanel.vue'
import VedicPanel from '@/components/VedicChart/VedicPanel.vue'
import ZiweiPanel from '@/components/ZiweiChart/ZiweiPanel.vue'
import { HOUSE_SYSTEMS } from '@/engines/western/tables'
import { AYANAMSAS } from '@/engines/vedic/chart'
import { useDivinationStore } from '@/stores/divination'

const div = useDivinationStore()
const { birth, ready, westernSettings, vedicSettings, bazi, western, vedic, ziwei, loading, error, injected } = storeToRefs(div)

const system = ref<'bazi' | 'ziwei' | 'western' | 'vedic'>('bazi')
const editing = ref(false)
const injecting = ref(false)

onMounted(() => {
  if (ready.value && !bazi.value) div.cast()
})

async function inject() {
  injecting.value = true
  try {
    await div.injectAsMemory()
  } finally {
    injecting.value = false
  }
}
const pad = (n: number) => String(n).padStart(2, '0')
const profileLine = computed(() => {
  const b = birth.value
  return `${b.calendar === 'lunar' ? '农历 ' : ''}${b.year} 年 ${b.month} 月 ${b.day} 日 ${pad(b.hour)}:${pad(b.minute)}`
})
const tabMeta = computed(() => {
  if (!bazi.value) return ''
  if (system.value === 'bazi') return `${bazi.value.options.trueSolarTime ? '真太阳时' : '标准时'} ${bazi.value.time.trueSolar.slice(11, 16)} · 晚子时${bazi.value.options.lateZi === 'next-day' ? '换日' : '不换日'}`
  if (system.value === 'ziwei') return ziwei.value ? `${ziwei.value.fiveElementsClass} · 命主${ziwei.value.soul} · 身主${ziwei.value.body} · 按出生地钟表时 ${ziwei.value.time}` : ''
  if (system.value === 'western') return `${HOUSE_SYSTEMS.find((h) => h.code === westernSettings.value.houseSystem)?.zh}宫位制 · ${westernSettings.value.nodeType === 'true' ? '真' : '平'}交点`
  return `${AYANAMSAS[vedicSettings.value.ayanamsa].name} · ${vedicSettings.value.nodeType} node`
})
</script>

<template>
  <section class="celestial" aria-labelledby="cel-title">
    <div class="atmo ambient-anim" aria-hidden="true" />
    <PageHeader title="Celestial Engine" zh="排盘与先天记忆" world="Beria · 创造界" lede="一个出生时刻，四套体系。八字、紫微斗数、西方占星与 Jyotish 皆在本地精算——先天参数，而非宿命。" />

    <!-- No profile yet: onboarding inline -->
    <div v-if="!ready" class="profile lq-glass onboard">
      <div class="onboard-head">
        <h2>先输入出生信息</h2>
        <p class="t-muted">四步完成，之后随时可改。排盘全部在本地进行。</p>
      </div>
      <BirthWizard mode="onboard" @done="editing = false" />
    </div>

    <!-- Profile card: summary, or the wizard in edit mode -->
    <div v-else class="profile lq-glass" :class="{ editing }">
      <div v-if="!editing" class="summary">
        <div class="who">
          <span class="name">{{ birth.name || '出生档案' }}</span>
          <span class="meta t-num">{{ profileLine }} · {{ birth.place || `${birth.latitude}, ${birth.longitude}` }}</span>
          <span v-if="bazi" class="meta t-faint t-num">{{ bazi.time.zoneLabel }} · UTC {{ bazi.time.utc.slice(0, 16) }}<template v-if="bazi.time.dst"> · 已按夏令时换算</template></span>
        </div>
        <div class="row-wrap">
          <span v-if="injected !== null" class="t-sm t-muted" role="status"><span class="t-num">{{ injected }}</span> 条先天锚点已写入图谱</span>
          <LqButton variant="ghost" size="sm" icon="layers" :loading="injecting" :disabled="!bazi" @click="inject">写入先天记忆</LqButton>
          <LqButton variant="secondary" size="sm" @click="editing = true">修改出生信息</LqButton>
        </div>
      </div>
      <div v-else class="form-wrap">
        <BirthWizard mode="edit" @done="editing = false" @cancel="editing = false" />
      </div>
    </div>

    <Notice v-if="error" tone="error">{{ error }}</Notice>

    <template v-if="ready">
      <div class="tabs">
        <LqSegmented v-model="system" :options="[{ value: 'bazi', label: '八字' }, { value: 'ziwei', label: '紫微' }, { value: 'western', label: '占星' }, { value: 'vedic', label: 'Jyotish' }]" label="排盘体系" />
        <p class="t-caption">{{ tabMeta }}</p>
      </div>

      <Transition name="fade" mode="out-in">
        <div v-if="system === 'bazi'" key="bazi" class="panel">
          <BaZiBoard v-if="bazi" :chart="bazi" />
          <p v-else class="t-muted pad">{{ loading ? '正在加载星历并排盘…' : '尚未排盘。' }}</p>
        </div>
        <div v-else-if="system === 'ziwei'" key="ziwei" class="panel">
          <ZiweiPanel v-if="ziwei" :chart="ziwei" />
          <p v-else class="t-muted pad">{{ loading ? '排盘中…' : '尚未排盘。' }}</p>
        </div>
        <div v-else-if="system === 'western'" key="western" class="panel">
          <WesternPanel v-if="western" :chart="western" />
          <p v-else class="t-muted pad">{{ loading ? '排盘中…' : '尚未排盘。' }}</p>
        </div>
        <div v-else key="vedic" class="panel">
          <VedicPanel v-if="vedic" :chart="vedic" />
          <p v-else class="t-muted pad">{{ loading ? 'Casting…' : 'Not cast yet.' }}</p>
        </div>
      </Transition>
    </template>
  </section>
</template>

<style scoped>
.celestial {
  position: relative;
  display: grid;
  gap: var(--sp-6);
}
.atmo {
  position: absolute;
  top: -80px;
  right: -40px;
  z-index: -1;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 36% 30%, rgba(255, 255, 255, 0.18), transparent 30%),
    radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--c-mist) 40%, transparent), transparent 68%);
  filter: blur(8px);
  opacity: 0.6;
  animation:
    lq-morph 26s var(--ease-in-out) infinite,
    lq-breathe 11s var(--ease-in-out) infinite;
  pointer-events: none;
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
.pad {
  padding: var(--sp-4) 0;
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
