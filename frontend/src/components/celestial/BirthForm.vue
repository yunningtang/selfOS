<script setup lang="ts">
import { computed, ref } from 'vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import { CITIES, listTimeZones } from '@/data/cities'
import { fmtOffset, zoneOffsetAt } from '@/engines/ephemeris/time'
import type { BirthProfile } from '@/types'

const birth = defineModel<BirthProfile>({ required: true })
defineProps<{ loading?: boolean }>()
const emit = defineEmits<{ cast: [] }>()

const zones = listTimeZones()
const cityQuery = ref('')
const matches = computed(() => {
  const q = cityQuery.value.trim().toLowerCase()
  if (!q) return []
  return CITIES.filter((c) => c.name.includes(q) || c.en.toLowerCase().includes(q)).slice(0, 8)
})
function pickCity(name: string) {
  const c = CITIES.find((x) => x.name === name || x.en === name)
  if (!c) return
  birth.value = { ...birth.value, place: c.name, latitude: c.lat, longitude: c.lon, timeZone: c.tz }
  cityQuery.value = ''
}
const fixedOffset = computed({
  get: () => (typeof birth.value.timeZone === 'number' ? birth.value.timeZone : 8),
  set: (v: number) => (birth.value = { ...birth.value, timeZone: v }),
})
const zoneMode = computed({
  get: () => (typeof birth.value.timeZone === 'number' ? 'fixed' : 'iana'),
  set: (m: 'iana' | 'fixed') => (birth.value = { ...birth.value, timeZone: m === 'fixed' ? 8 : 'Asia/Shanghai' }),
})
const offsetNote = computed(() => {
  const b = birth.value
  if (typeof b.timeZone === 'number') return `UTC${fmtOffset(b.timeZone * 60)}`
  try {
    const ms = Date.UTC(b.year, b.month - 1, b.day, b.hour, b.minute)
    return `该日期 UTC${fmtOffset(zoneOffsetAt(b.timeZone, ms))}`
  } catch {
    return ''
  }
})
</script>

<template>
  <form class="birth" @submit.prevent="emit('cast')">
    <div class="col">
      <h3 class="t-label">出生时间</h3>
      <div class="field">
        <label class="lbl" for="b-name">姓名</label>
        <input id="b-name" v-model="birth.name" class="lq-input" autocomplete="off" placeholder="可选" />
      </div>
      <div class="field">
        <span class="lbl">历法 · 性别</span>
        <div class="row-wrap">
          <LqSegmented v-model="birth.calendar" :options="[{ value: 'solar', label: '公历' }, { value: 'lunar', label: '农历' }]" label="历法" size="sm" />
          <LqSegmented v-model="birth.gender" :options="[{ value: 'F', label: '女' }, { value: 'M', label: '男' }]" label="性别" size="sm" />
          <label v-if="birth.calendar === 'lunar'" class="check"><input v-model="birth.lunarLeap" type="checkbox" /> 闰月</label>
        </div>
      </div>
      <div class="field">
        <span class="lbl">{{ birth.calendar === 'lunar' ? '农历日期' : '日期' }}</span>
        <div class="ymd">
          <input v-model.number="birth.year" class="lq-input t-num" type="number" min="1800" max="2399" aria-label="年" required />
          <span class="unit">年</span>
          <input v-model.number="birth.month" class="lq-input t-num" type="number" min="1" max="12" aria-label="月" required />
          <span class="unit">月</span>
          <input v-model.number="birth.day" class="lq-input t-num" type="number" min="1" max="31" aria-label="日" required />
          <span class="unit">日</span>
        </div>
      </div>
      <div class="field">
        <span class="lbl">时间</span>
        <div class="hm">
          <input v-model.number="birth.hour" class="lq-input t-num" type="number" min="0" max="23" aria-label="时" required />
          <span class="unit">:</span>
          <input v-model.number="birth.minute" class="lq-input t-num" type="number" min="0" max="59" aria-label="分" required />
        </div>
      </div>
    </div>

    <div class="col">
      <h3 class="t-label">出生地与时区</h3>
      <div class="field city">
        <label class="lbl" for="b-city">城市</label>
        <input id="b-city" v-model="cityQuery" class="lq-input" :placeholder="birth.place || '搜索城市，自动填入经纬度与时区'" autocomplete="off" />
        <ul v-if="matches.length" class="city-list lq-surface" role="listbox">
          <li v-for="c in matches" :key="c.en">
            <button type="button" role="option" @click="pickCity(c.en)">{{ c.name }} <span class="t-muted">{{ c.en }}</span></button>
          </li>
        </ul>
      </div>
      <div class="field two">
        <div>
          <label class="lbl" for="b-lat">纬度</label>
          <input id="b-lat" v-model.number="birth.latitude" class="lq-input t-num" type="number" step="0.0001" min="-89.9" max="89.9" />
        </div>
        <div>
          <label class="lbl" for="b-lon">经度</label>
          <input id="b-lon" v-model.number="birth.longitude" class="lq-input t-num" type="number" step="0.0001" min="-180" max="180" />
        </div>
      </div>
      <div class="field">
        <span class="lbl">时区 <span class="t-faint">{{ offsetNote }}</span></span>
        <div class="tz">
          <LqSegmented v-model="zoneMode" :options="[{ value: 'iana', label: '地区' }, { value: 'fixed', label: '固定偏移' }]" label="时区方式" size="sm" />
          <select v-if="zoneMode === 'iana'" v-model="birth.timeZone" class="lq-input" aria-label="时区">
            <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
          </select>
          <input v-else v-model.number="fixedOffset" class="lq-input t-num" type="number" step="0.25" min="-12" max="14" aria-label="UTC 偏移小时" />
        </div>
      </div>
    </div>

    <div class="col side">
      <slot name="options" />
      <div class="actions">
        <LqButton type="submit" variant="primary" icon="celestial" :loading="loading">排盘</LqButton>
        <slot name="actions" />
      </div>
    </div>
  </form>
</template>

<style scoped>
.birth {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--sp-7);
}
.col {
  display: grid;
  gap: var(--sp-4);
  align-content: start;
  min-width: 0;
}
.side {
  padding-left: var(--sp-7);
  border-left: 1px solid var(--hairline);
}
.field {
  display: grid;
  gap: 6px;
}
.field.two {
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}
.field.two > div {
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
.ymd {
  display: grid;
  grid-template-columns: minmax(72px, 1.4fr) auto minmax(44px, 1fr) auto minmax(44px, 1fr) auto;
  gap: 6px;
  align-items: center;
}
.hm {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 6px;
  align-items: center;
  max-width: 200px;
}
.unit {
  font-size: var(--fs-sm);
  color: var(--text-3);
}
.birth input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
  padding: 0 var(--sp-2);
  text-align: center;
}
.birth input[type='number']::-webkit-inner-spin-button,
.birth input[type='number']::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}
.city {
  position: relative;
}
.city-list {
  position: absolute;
  z-index: var(--z-float);
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  padding: var(--sp-1);
  box-shadow: var(--shadow-float);
}
.city-list button {
  display: block;
  width: 100%;
  padding: var(--sp-2) var(--sp-3);
  border: 0;
  border-radius: var(--r-sm);
  background: none;
  text-align: left;
  font-size: var(--fs-sm);
}
.city-list button:hover {
  background: var(--accent-soft);
}
.tz {
  display: grid;
  gap: var(--sp-2);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  align-items: center;
  padding-top: var(--sp-2);
}
@media (max-width: 1000px) {
  .birth {
    grid-template-columns: 1fr 1fr;
  }
  .side {
    grid-column: 1 / -1;
    padding-left: 0;
    padding-top: var(--sp-5);
    border-left: 0;
    border-top: 1px solid var(--hairline);
  }
}
@media (max-width: 600px) {
  .birth {
    grid-template-columns: 1fr;
  }
}
</style>
