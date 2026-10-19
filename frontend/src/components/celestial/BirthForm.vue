<script setup lang="ts">
import { computed, ref } from 'vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqField from '@/components/ui/LqField.vue'
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
    return `UTC${fmtOffset(zoneOffsetAt(b.timeZone, ms))} on that date`
  } catch {
    return ''
  }
})
</script>

<template>
  <form class="birth lq-surface pad-lg" @submit.prevent="emit('cast')">
    <div class="grid">
      <LqField label="Name 姓名（可选）" for="b-name">
        <input id="b-name" v-model="birth.name" class="lq-input" autocomplete="off" />
      </LqField>
      <LqField label="Calendar 历法">
        <LqSegmented v-model="birth.calendar" :options="[{ value: 'solar', label: '公历 Solar' }, { value: 'lunar', label: '农历 Lunar' }]" label="Calendar" size="sm" />
      </LqField>
      <LqField label="Gender 性别">
        <LqSegmented v-model="birth.gender" :options="[{ value: 'F', label: '女 F' }, { value: 'M', label: '男 M' }]" label="Gender" size="sm" />
      </LqField>
      <LqField :label="birth.calendar === 'lunar' ? 'Lunar date 农历' : 'Date 日期'">
        <div class="ymd">
          <input v-model.number="birth.year" class="lq-input t-num" type="number" min="1800" max="2399" aria-label="Year" required />
          <input v-model.number="birth.month" class="lq-input t-num" type="number" min="1" max="12" aria-label="Month" required />
          <input v-model.number="birth.day" class="lq-input t-num" type="number" min="1" max="31" aria-label="Day" required />
          <label v-if="birth.calendar === 'lunar'" class="leap"><input v-model="birth.lunarLeap" type="checkbox" /> 闰月</label>
        </div>
      </LqField>
      <LqField label="Local time 出生时间">
        <div class="hm">
          <input v-model.number="birth.hour" class="lq-input t-num" type="number" min="0" max="23" aria-label="Hour" required />
          <span class="t-muted">:</span>
          <input v-model.number="birth.minute" class="lq-input t-num" type="number" min="0" max="59" aria-label="Minute" required />
        </div>
      </LqField>
      <LqField label="Place 出生地" for="b-city" hint="Pick a city to fill coordinates and zone, or type them directly.">
        <div class="city">
          <input id="b-city" v-model="cityQuery" class="lq-input" :placeholder="birth.place || '搜索城市…'" autocomplete="off" />
          <ul v-if="matches.length" class="city-list lq-surface" role="listbox">
            <li v-for="c in matches" :key="c.en">
              <button type="button" role="option" @click="pickCity(c.en)">{{ c.name }} <span class="t-muted">{{ c.en }}</span></button>
            </li>
          </ul>
        </div>
      </LqField>
      <LqField label="Latitude 纬度" for="b-lat"><input id="b-lat" v-model.number="birth.latitude" class="lq-input t-num" type="number" step="0.0001" min="-89.9" max="89.9" /></LqField>
      <LqField label="Longitude 经度" for="b-lon"><input id="b-lon" v-model.number="birth.longitude" class="lq-input t-num" type="number" step="0.0001" min="-180" max="180" /></LqField>
      <LqField label="Time zone 时区" :hint="offsetNote">
        <div class="tz">
          <LqSegmented v-model="zoneMode" :options="[{ value: 'iana', label: '地区' }, { value: 'fixed', label: '固定偏移' }]" label="Time zone mode" size="sm" />
          <select v-if="zoneMode === 'iana'" v-model="birth.timeZone" class="lq-input" aria-label="IANA time zone">
            <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
          </select>
          <input v-else v-model.number="fixedOffset" class="lq-input t-num" type="number" step="0.25" min="-12" max="14" aria-label="UTC offset hours" />
        </div>
      </LqField>
    </div>
    <slot name="options" />
    <div class="row-wrap actions">
      <LqButton type="submit" variant="primary" icon="celestial" :loading="loading">Cast all charts 排盘</LqButton>
      <slot name="actions" />
    </div>
  </form>
</template>

<style scoped>
.birth input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
  padding: 0 var(--sp-2);
}
.birth input[type='number']::-webkit-inner-spin-button,
.birth input[type='number']::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}
.birth {
  display: grid;
  gap: var(--sp-5);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--sp-4);
}
.ymd {
  display: grid;
  grid-template-columns: minmax(76px, 1.4fr) minmax(52px, 1fr) minmax(52px, 1fr) auto;
  gap: var(--sp-2);
  align-items: center;
}
.leap {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: var(--fs-xs);
  white-space: nowrap;
}
.hm {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--sp-2);
  align-items: center;
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
  gap: var(--sp-3);
}
</style>
