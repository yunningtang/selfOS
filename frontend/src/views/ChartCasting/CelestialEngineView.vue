<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/ui/PageHeader.vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqField from '@/components/ui/LqField.vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import Notice from '@/components/ui/Notice.vue'
import BirthForm from '@/components/celestial/BirthForm.vue'
import BaZiBoard from '@/components/BaZiChart/BaZiBoard.vue'
import ChartWheel from '@/components/WesternChart/ChartWheel.vue'
import WesternTables from '@/components/WesternChart/WesternTables.vue'
import VedicPanel from '@/components/VedicChart/VedicPanel.vue'
import { HOUSE_SYSTEMS, type BodyId } from '@/engines/western/tables'
import { AYANAMSAS } from '@/engines/vedic/chart'
import { useDivinationStore } from '@/stores/divination'

const div = useDivinationStore()
const { birth, baziOptions, westernSettings, vedicSettings, bazi, western, vedic, loading, error, injected } = storeToRefs(div)

const system = ref<'bazi' | 'western' | 'vedic'>('bazi')
const highlight = ref<BodyId | null>(null)
const injecting = ref(false)

onMounted(() => {
  if (!bazi.value) div.cast()
})

async function inject() {
  injecting.value = true
  try {
    await div.injectAsMemory()
  } finally {
    injecting.value = false
  }
}
</script>

<template>
  <section class="celestial" aria-labelledby="cel-title">
    <div class="atmo ambient-anim" aria-hidden="true" />
    <PageHeader
      title="Celestial Engine"
      zh="八字 · 占星 · Jyotish"
      world="Beria · 先天记忆"
      lede="Three systems cast from one birth moment with the Swiss Ephemeris. Innate parameters for the council — precise, inspectable, never fate."
    />

    <BirthForm v-model="birth" :loading="loading" @cast="div.cast()">
      <template #options>
        <div class="options">
          <div class="opt" role="group" aria-label="八字选项">
            <h4 class="t-label">八字选项</h4>
            <LqField label="时间标准">
              <LqSegmented
                v-model="baziOptions.trueSolarTime"
                :options="[{ value: true as any, label: '真太阳时' }, { value: false as any, label: '标准时' }]"
                label="Time standard"
                size="sm"
              />
            </LqField>
            <LqField label="晚子时（23:00 后）">
              <LqSegmented
                v-model="baziOptions.lateZi"
                :options="[{ value: 'next-day', label: '换日' }, { value: 'same-day', label: '不换日' }]"
                label="Late 子时 rule"
                size="sm"
              />
            </LqField>
          </div>
          <div class="opt" role="group" aria-label="占星选项">
            <h4 class="t-label">占星选项</h4>
            <LqField label="宫位制" for="o-house">
              <select id="o-house" v-model="westernSettings.houseSystem" class="lq-input">
                <option v-for="h in HOUSE_SYSTEMS" :key="h.code" :value="h.code">{{ h.zh }} {{ h.en }}</option>
              </select>
            </LqField>
            <LqField label="交点">
              <LqSegmented v-model="westernSettings.nodeType" :options="[{ value: 'true', label: '真交点' }, { value: 'mean', label: '平交点' }]" label="Node type" size="sm" />
            </LqField>
            <label class="check"><input v-model="westernSettings.asteroids" type="checkbox" /> 四大小行星</label>
            <label class="check"><input v-model="westernSettings.modernRulers" type="checkbox" /> 现代守护星</label>
          </div>
          <div class="opt" role="group" aria-label="Jyotish options">
            <h4 class="t-label">Jyotish options</h4>
            <LqField label="Ayanamsa" for="o-ay">
              <select id="o-ay" v-model="vedicSettings.ayanamsa" class="lq-input">
                <option v-for="(a, k) in AYANAMSAS" :key="k" :value="k">{{ a.name }}</option>
              </select>
            </LqField>
            <LqField label="Nodes">
              <LqSegmented v-model="vedicSettings.nodeType" :options="[{ value: 'true', label: 'True' }, { value: 'mean', label: 'Mean' }]" label="Node type" size="sm" />
            </LqField>
            <LqField label="Dasha year">
              <LqSegmented
                v-model="vedicSettings.dashaYearDays"
                :options="[{ value: 365.25 as any, label: '365.25' }, { value: 360 as any, label: '360' }, { value: 365.2564 as any, label: 'Sidereal' }]"
                label="Dasha year length"
                size="sm"
              />
            </LqField>
            <LqField label="Bhava chalit">
              <LqSegmented v-model="vedicSettings.chalit" :options="[{ value: 'sripati', label: 'Sripati' }, { value: 'kp', label: 'KP' }]" label="Chalit" size="sm" />
            </LqField>
          </div>
        </div>
      </template>
      <template #actions>
        <LqButton variant="ghost" icon="layers" :loading="injecting" :disabled="!bazi" @click="inject">Anchor as innate memory</LqButton>
        <span v-if="injected !== null" class="t-sm t-muted" role="status"><span class="t-num">{{ injected }}</span> innate anchors written to the graph.</span>
      </template>
    </BirthForm>

    <Notice v-if="error" tone="error">{{ error }}</Notice>

    <div class="tabs">
      <LqSegmented
        v-model="system"
        :options="[{ value: 'bazi', label: '八字 BaZi' }, { value: 'western', label: '占星 Western' }, { value: 'vedic', label: 'Jyotish' }]"
        label="Chart system"
      />
      <p v-if="bazi" class="t-caption stamp">
        {{ bazi.time.zoneLabel }} · UTC {{ bazi.time.utc.slice(0, 16) }} · Swiss Ephemeris 2.10
      </p>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="system === 'bazi'" key="bazi" class="panel lq-surface pad-lg">
        <BaZiBoard v-if="bazi" :chart="bazi" />
        <p v-else class="t-muted">{{ loading ? '正在加载星历并排盘…' : '填写出生信息后排盘。' }}</p>
      </div>

      <div v-else-if="system === 'western'" key="western" class="panel lq-surface pad-lg">
        <template v-if="western">
          <div class="w-top">
            <div class="wheel-col">
              <ChartWheel :chart="western" :highlight="highlight" @select="highlight = $event" />
              <p class="t-caption">
                {{ HOUSE_SYSTEMS.find((h) => h.code === western!.settings.houseSystem)?.zh }}宫位制 · {{ western.isDayChart ? '日生盘' : '夜生盘' }} · 点选星体以聚焦其相位
              </p>
            </div>
            <WesternTables :chart="western" :highlight="highlight" @select="highlight = $event" />
          </div>
        </template>
        <p v-else class="t-muted">{{ loading ? 'Casting…' : 'Enter birth data and cast.' }}</p>
      </div>

      <div v-else key="vedic" class="panel lq-surface pad-lg">
        <VedicPanel v-if="vedic" :chart="vedic" />
        <p v-else class="t-muted">{{ loading ? 'Casting…' : 'Enter birth data and cast.' }}</p>
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
.options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--sp-4);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--hairline);
}
.opt {
  display: grid;
  gap: var(--sp-3);
  align-content: start;
  padding: var(--sp-3) var(--sp-4) var(--sp-4);
  border-radius: var(--r-md);
  background: var(--surface-sunken);
}
.opt :deep(.seg) {
  justify-self: start;
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
  display: grid;
  gap: var(--sp-4);
}
.w-top {
  display: grid;
  grid-template-columns: minmax(300px, 460px) minmax(0, 1fr);
  gap: var(--sp-7);
  align-items: start;
}
.wheel-col {
  display: grid;
  gap: var(--sp-3);
  position: sticky;
  top: var(--sp-4);
}
@media (max-width: 1180px) {
  .w-top {
    grid-template-columns: 1fr;
  }
  .wheel-col {
    position: static;
    max-width: 560px;
    margin: 0 auto;
  }
}
</style>
