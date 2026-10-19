<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/ui/PageHeader.vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import Notice from '@/components/ui/Notice.vue'
import BirthForm from '@/components/celestial/BirthForm.vue'
import BaZiBoard from '@/components/BaZiChart/BaZiBoard.vue'
import WesternPanel from '@/components/WesternChart/WesternPanel.vue'
import VedicPanel from '@/components/VedicChart/VedicPanel.vue'
import ZiweiPanel from '@/components/ZiweiChart/ZiweiPanel.vue'
import { HOUSE_SYSTEMS } from '@/engines/western/tables'
import { AYANAMSAS } from '@/engines/vedic/chart'
import { useDivinationStore } from '@/stores/divination'

const div = useDivinationStore()
const { birth, baziOptions, westernSettings, vedicSettings, bazi, western, vedic, ziwei, loading, error, injected } = storeToRefs(div)

const system = ref<'bazi' | 'ziwei' | 'western' | 'vedic'>('bazi')
const editing = ref(false)
const injecting = ref(false)

onMounted(() => {
  if (!bazi.value) div.cast()
})
watch(bazi, (v) => {
  if (v) editing.value = false
})

async function cast() {
  if (!bazi.value) await div.cast()
  editing.value = false
}
async function inject() {
  injecting.value = true
  try {
    await div.injectAsMemory()
  } finally {
    injecting.value = false
  }
}
const profileLine = computed(() => {
  const b = birth.value
  const d = `${b.year}年${b.month}月${b.day}日 ${String(b.hour).padStart(2, '0')}:${String(b.minute).padStart(2, '0')}`
  return `${b.calendar === 'lunar' ? '农历 ' : ''}${d}`
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
    <PageHeader title="Celestial Engine" zh="先天记忆" world="Beria · 创造界" lede="一个出生时刻，四套体系。八字、紫微斗数、西方占星与 Jyotish 皆在本地精算——先天参数，而非宿命。" />

    <!-- Profile card: collapsed once a chart exists -->
    <div class="profile lq-glass" :class="{ editing }">
      <div v-if="!editing && bazi" class="summary">
        <div class="who">
          <span class="name">{{ birth.name || '出生档案' }}</span>
          <span class="meta t-num">{{ profileLine }} · {{ birth.place || `${birth.latitude}, ${birth.longitude}` }}</span>
          <span class="meta t-faint t-num">{{ bazi.time.zoneLabel }} · UTC {{ bazi.time.utc.slice(0, 16) }}<template v-if="bazi.time.dst"> · 已按夏令时换算</template></span>
        </div>
        <div class="row-wrap">
          <LqButton variant="ghost" size="sm" icon="layers" :loading="injecting" @click="inject">写入先天记忆</LqButton>
          <LqButton variant="secondary" size="sm" @click="editing = true">修改出生信息</LqButton>
        </div>
      </div>
      <div v-else class="form-wrap">
        <BirthForm v-model="birth" :loading="loading" @cast="cast">
          <template #options>
            <div class="opts">
              <h3 class="t-label">排盘设定</h3>
              <div class="opt-row"><span class="lbl">八字时间标准</span>
                <LqSegmented v-model="baziOptions.trueSolarTime" :options="[{ value: true as any, label: '真太阳时' }, { value: false as any, label: '标准时' }]" label="八字时间标准" size="sm" /></div>
              <div class="opt-row"><span class="lbl">晚子时</span>
                <LqSegmented v-model="baziOptions.lateZi" :options="[{ value: 'next-day', label: '换日' }, { value: 'same-day', label: '不换日' }]" label="晚子时" size="sm" /></div>
              <div class="opt-row"><span class="lbl">占星宫位制</span>
                <select v-model="westernSettings.houseSystem" class="lq-input" aria-label="宫位制"><option v-for="h in HOUSE_SYSTEMS" :key="h.code" :value="h.code">{{ h.zh }} · {{ h.en }}</option></select></div>
              <div class="opt-row"><span class="lbl">交点</span>
                <LqSegmented v-model="westernSettings.nodeType" :options="[{ value: 'true', label: '真交点' }, { value: 'mean', label: '平交点' }]" label="交点" size="sm" /></div>
              <div class="opt-row"><span class="lbl">Ayanamsa</span>
                <select v-model="vedicSettings.ayanamsa" class="lq-input" aria-label="Ayanamsa"><option v-for="(a, k) in AYANAMSAS" :key="k" :value="k">{{ a.name }}</option></select></div>
              <div class="opt-row"><span class="lbl">Dasha 年长</span>
                <LqSegmented v-model="vedicSettings.dashaYearDays" :options="[{ value: 365.25 as any, label: '365.25' }, { value: 360 as any, label: '360' }, { value: 365.2564 as any, label: '恒星年' }]" label="Dasha year" size="sm" /></div>
              <label class="check"><input v-model="westernSettings.asteroids" type="checkbox" /> 加入四大小行星</label>
              <label class="check"><input v-model="westernSettings.modernRulers" type="checkbox" /> 现代守护星</label>
            </div>
          </template>
          <template #actions>
            <span v-if="bazi" class="t-caption">修改会即时重新排盘</span>
            <span v-if="injected !== null" class="t-sm t-muted" role="status"><span class="t-num">{{ injected }}</span> 条先天锚点已写入图谱</span>
          </template>
        </BirthForm>
      </div>
    </div>

    <Notice v-if="error" tone="error">{{ error }}</Notice>

    <div class="tabs">
      <LqSegmented v-model="system" :options="[{ value: 'bazi', label: '八字' }, { value: 'ziwei', label: '紫微' }, { value: 'western', label: '占星' }, { value: 'vedic', label: 'Jyotish' }]" label="排盘体系" />
      <p class="t-caption">{{ tabMeta }}</p>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="system === 'bazi'" key="bazi" class="panel">
        <BaZiBoard v-if="bazi" :chart="bazi" />
        <p v-else class="t-muted pad">{{ loading ? '正在加载星历并排盘…' : '填写出生信息后排盘。' }}</p>
      </div>
      <div v-else-if="system === 'ziwei'" key="ziwei" class="panel">
        <ZiweiPanel v-if="ziwei" :chart="ziwei" />
        <p v-else class="t-muted pad">{{ loading ? '排盘中…' : '填写出生信息后排盘。' }}</p>
      </div>
      <div v-else-if="system === 'western'" key="western" class="panel">
        <WesternPanel v-if="western" :chart="western" />
        <p v-else class="t-muted pad">{{ loading ? '排盘中…' : '填写出生信息后排盘。' }}</p>
      </div>
      <div v-else key="vedic" class="panel">
        <VedicPanel v-if="vedic" :chart="vedic" />
        <p v-else class="t-muted pad">{{ loading ? 'Casting…' : 'Enter birth data and cast.' }}</p>
      </div>
    </Transition>
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
.opts {
  display: grid;
  gap: var(--sp-3);
}
.opt-row {
  display: grid;
  gap: 6px;
}
.lbl {
  font-size: var(--fs-xs);
  color: var(--text-2);
}
.check {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: var(--fs-sm);
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
  .form-wrap {
    padding: var(--sp-5) var(--sp-4);
  }
  .summary {
    padding: var(--sp-4);
  }
}
</style>
