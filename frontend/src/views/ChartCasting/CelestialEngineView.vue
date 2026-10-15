<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/ui/PageHeader.vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqField from '@/components/ui/LqField.vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import Notice from '@/components/ui/Notice.vue'
import BaZiChart from '@/components/BaZiChart/BaZiChart.vue'
import SouthIndianChart from '@/components/VedicChart/SouthIndianChart.vue'
import NorthIndianChart from '@/components/VedicChart/NorthIndianChart.vue'
import PlanetTable from '@/components/VedicChart/PlanetTable.vue'
import DashaTimeline from '@/components/VedicChart/DashaTimeline.vue'
import ShadbalaBars from '@/components/VedicChart/ShadbalaBars.vue'
import { dataSource } from '@/api'
import { useDivinationStore } from '@/stores/divination'
import type { DivisionalKey, GrahaId } from '@/types'

const div = useDivinationStore()
const { birth, bazi, vedic, shadbala, loading, error, injected } = storeToRefs(div)

const system = ref<'bazi' | 'vedic'>('bazi')
const format = ref<'south' | 'north'>('south')
const division = ref<DivisionalKey>('D1')
const injecting = ref(false)

onMounted(() => {
  if (!bazi.value) div.cast()
})

const DIVISION_NAMES: Record<DivisionalKey, string> = { D1: 'Rashi · D1', D9: 'Navamsa · D9', D10: 'Dashamsa · D10' }
const placements = computed(() => vedic.value?.divisional[division.value])
const retro = computed(
  () => Object.fromEntries(vedic.value?.planets.map((p) => [p.id, p.retrograde && p.id !== 'Ra' && p.id !== 'Ke']) ?? []) as Partial<Record<GrahaId, boolean>>,
)

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
      zh="八字 · Jyotish"
      world="Beria · 先天记忆"
      lede="Innate parameters, cast precisely. These charts become initial conditions for the council — not predictions."
    />

    <form class="birth lq-surface pad" @submit.prevent="div.cast()">
      <div class="grid">
        <LqField label="Date" for="b-date"><input id="b-date" v-model="birth.date" class="lq-input" type="date" required /></LqField>
        <LqField label="Local time" for="b-time"><input id="b-time" v-model="birth.time" class="lq-input" type="time" required /></LqField>
        <LqField label="Calendar">
          <LqSegmented v-model="birth.calendar" :options="[{ value: 'solar', label: '公历 Solar' }, { value: 'lunar', label: '农历 Lunar' }]" label="Calendar" size="sm" />
        </LqField>
        <LqField label="Gender (大运 direction)">
          <LqSegmented v-model="birth.gender" :options="[{ value: 'F', label: 'F' }, { value: 'M', label: 'M' }]" label="Gender" size="sm" />
        </LqField>
        <LqField label="Place" for="b-place"><input id="b-place" v-model="birth.place" class="lq-input" /></LqField>
        <LqField label="Latitude" for="b-lat"><input id="b-lat" v-model.number="birth.latitude" class="lq-input" type="number" step="0.0001" min="-90" max="90" /></LqField>
        <LqField label="Longitude" for="b-lon"><input id="b-lon" v-model.number="birth.longitude" class="lq-input" type="number" step="0.0001" min="-180" max="180" /></LqField>
        <LqField label="UTC offset (h)" for="b-tz"><input id="b-tz" v-model.number="birth.timezone" class="lq-input" type="number" step="0.25" min="-12" max="14" /></LqField>
        <LqField label="Ayanamsa" for="b-ay">
          <select id="b-ay" v-model="birth.ayanamsa" class="lq-input">
            <option value="LAHIRI">Lahiri</option>
            <option value="KP">Krishnamurti (KP)</option>
            <option value="TRUE_CHITRA">True Chitra</option>
            <option value="RAMAN">Raman</option>
          </select>
        </LqField>
      </div>
      <div class="row-wrap actions">
        <LqButton type="submit" variant="primary" icon="celestial" :loading="loading">Cast charts</LqButton>
        <LqButton variant="ghost" icon="layers" :loading="injecting" :disabled="!bazi" @click="inject">Anchor as innate memory</LqButton>
        <span v-if="injected !== null" class="t-sm t-muted" role="status">
          <span class="t-num">{{ injected }}</span> innate anchors written to the graph.
        </span>
      </div>
    </form>

    <Notice v-if="error" tone="error">{{ error }}</Notice>

    <div class="tabs">
      <LqSegmented
        v-model="system"
        :options="[{ value: 'bazi', label: '八字 BaZi' }, { value: 'vedic', label: 'Vedic Jyotish' }]"
        label="Chart system"
      />
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="system === 'bazi'" key="bazi" class="panel lq-surface pad-lg">
        <BaZiChart v-if="bazi" :chart="bazi" />
        <p v-else class="t-muted">{{ loading ? 'Casting…' : 'Enter birth data and cast.' }}</p>
      </div>

      <div v-else key="vedic" class="vedic">
        <template v-if="vedic">
          <div class="panel lq-surface pad-lg">
            <div class="vedic-top">
              <div class="chart-col">
                <div class="row-wrap chart-controls">
                  <LqSegmented v-model="format" :options="[{ value: 'south', label: 'South' }, { value: 'north', label: 'North' }]" label="Chart format" size="sm" />
                  <LqSegmented
                    v-model="division"
                    :options="[{ value: 'D1', label: 'D1' }, { value: 'D9', label: 'D9' }, { value: 'D10', label: 'D10' }]"
                    label="Divisional chart"
                    size="sm"
                  />
                </div>
                <SouthIndianChart
                  v-if="format === 'south' && placements"
                  :ascendant="placements.ascendant"
                  :placements="placements.planets"
                  :retro="division === 'D1' ? retro : undefined"
                  :title="DIVISION_NAMES[division]"
                />
                <NorthIndianChart
                  v-else-if="placements"
                  :ascendant="placements.ascendant"
                  :placements="placements.planets"
                  :retro="division === 'D1' ? retro : undefined"
                  :title="DIVISION_NAMES[division]"
                />
                <p class="t-caption">
                  Ayanamsa {{ vedic.ayanamsa.name }} <span class="t-num">{{ vedic.ayanamsa.value.toFixed(4) }}°</span> · whole-sign houses
                </p>
              </div>
              <div class="table-col">
                <h3 class="t-label">Graha positions · D1</h3>
                <PlanetTable :chart="vedic" />
              </div>
            </div>
          </div>

          <div class="panel lq-surface pad-lg">
            <h3 class="t-label section-title">Vimshottari Dasha</h3>
            <DashaTimeline :chart="vedic" />
          </div>

          <div v-if="shadbala" class="panel lq-surface pad-lg">
            <h3 class="t-label section-title">Shadbala</h3>
            <Notice v-if="dataSource.usingDemo" class="demo-note">
              Demo values — illustrative only. Real six-fold strengths are computed by the backend (PyJHora).
            </Notice>
            <ShadbalaBars :result="shadbala" />
          </div>
        </template>
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
/* A single slow liquid body behind the header — atmosphere, never behind data. */
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
.birth {
  display: grid;
  gap: var(--sp-5);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: var(--sp-4);
}
.actions {
  gap: var(--sp-3);
}
.tabs {
  display: flex;
}
.panel {
  display: grid;
  gap: var(--sp-4);
}
.vedic {
  display: grid;
  gap: var(--sp-5);
}
.vedic-top {
  display: grid;
  grid-template-columns: minmax(280px, 400px) minmax(0, 1fr);
  gap: var(--sp-7);
  align-items: start;
}
.chart-col,
.table-col {
  display: grid;
  gap: var(--sp-3);
  min-width: 0;
}
.chart-controls {
  justify-content: space-between;
}
.section-title {
  margin-bottom: var(--sp-1);
}
@media (max-width: 980px) {
  .vedic-top {
    grid-template-columns: 1fr;
  }
  .chart-col {
    max-width: 440px;
  }
}
</style>
