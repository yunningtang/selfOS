<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import LqButton from '@/components/ui/LqButton.vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import Notice from '@/components/ui/Notice.vue'
import { listTimeZones } from '@/data/cities'
import { fmtOffset, zoneOffsetAt } from '@/engines/ephemeris/time'
import { HOUSE_SYSTEMS } from '@/engines/western/tables'
import { AYANAMSAS } from '@/engines/vedic/chart'
import { usePlaceSearch, type Place } from '@/composables/usePlaceSearch'
import { useDivinationStore } from '@/stores/divination'

/**
 * Birth-data wizard. `onboard` walks a first-time user through four steps and casts at the end;
 * `edit` shows the same steps for an existing profile with explicit 保存 / 取消 — the form never
 * closes on its own.
 */
const props = withDefaults(defineProps<{ mode?: 'onboard' | 'edit' }>(), { mode: 'onboard' })
const emit = defineEmits<{ done: []; cancel: [] }>()

const store = useDivinationStore()
const { birth, baziOptions, westernSettings, vedicSettings, loading, error } = storeToRefs(store)

const STEPS = [
  { key: 'who', title: '出生时间', hint: '公历或农历皆可，时间越准，时柱与上升越准。' },
  { key: 'where', title: '出生地点', hint: '经纬度与时区决定真太阳时和星盘宫位。' },
  { key: 'options', title: '排盘设定', hint: '不确定就保持默认，之后随时可改。' },
  { key: 'confirm', title: '确认排盘', hint: '核对一遍，然后开始。' },
] as const
const step = ref(0)
const zones = listTimeZones()
const { query: cityQuery, matches, searching, clear } = usePlaceSearch()

// Snapshot for cancel in edit mode
const snapshot = JSON.stringify({ b: birth.value, o: baziOptions.value, w: westernSettings.value, v: vedicSettings.value })
function cancel() {
  const s = JSON.parse(snapshot)
  birth.value = s.b
  baziOptions.value = s.o
  westernSettings.value = s.w
  vedicSettings.value = s.v
  emit('cancel')
}

function pickCity(c: Place) {
  birth.value = { ...birth.value, place: c.name, latitude: c.lat, longitude: c.lon, timeZone: c.tz }
  clear()
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
    const off = zoneOffsetAt(b.timeZone, ms)
    const jan = zoneOffsetAt(b.timeZone, Date.UTC(b.year, 0, 1)), jul = zoneOffsetAt(b.timeZone, Date.UTC(b.year, 6, 1))
    const std = Math.min(jan, jul)
    if (off > std) return b.dst === 'ignore' ? `该日期处于夏令时，按标准时 UTC${fmtOffset(std)} 读取` : `该日期处于夏令时，UTC${fmtOffset(off)}`
    return `该日期 UTC${fmtOffset(off)}`
  } catch {
    return ''
  }
})

// Validation per step
const dateError = computed(() => {
  const b = birth.value
  if (!Number.isInteger(b.year) || b.year < 1800 || b.year > 2399) return '年份需在 1800–2399 之间'
  if (!Number.isInteger(b.month) || b.month < 1 || b.month > 12) return '月份需在 1–12 之间'
  if (!Number.isInteger(b.day) || b.day < 1 || b.day > 31) return '日期需在 1–31 之间'
  if (b.calendar === 'solar' && b.day > new Date(Date.UTC(b.year, b.month, 0)).getUTCDate()) return '该月没有这一天'
  if (!Number.isInteger(b.hour) || b.hour < 0 || b.hour > 23) return '小时需在 0–23 之间'
  if (!Number.isInteger(b.minute) || b.minute < 0 || b.minute > 59) return '分钟需在 0–59 之间'
  return ''
})
const placeError = computed(() => {
  const b = birth.value
  if (typeof b.latitude !== 'number' || Number.isNaN(b.latitude) || Math.abs(b.latitude) > 89.9) return '纬度需在 −89.9 到 89.9 之间'
  if (typeof b.longitude !== 'number' || Number.isNaN(b.longitude) || Math.abs(b.longitude) > 180) return '经度需在 −180 到 180 之间'
  if (typeof b.timeZone === 'number' && (b.timeZone < -12 || b.timeZone > 14)) return '时区偏移需在 −12 到 +14 之间'
  return ''
})
const stepError = computed(() => (step.value === 0 ? dateError.value : step.value === 1 ? placeError.value : ''))
const canNext = computed(() => !stepError.value)
const touched = ref(false)

function next() {
  touched.value = true
  if (!canNext.value) return
  touched.value = false
  if (step.value < STEPS.length - 1) step.value += 1
}
function back() {
  if (step.value > 0) step.value -= 1
}
async function finish() {
  touched.value = true
  if (dateError.value) { step.value = 0; return }
  if (placeError.value) { step.value = 1; return }
  await store.commitProfile()
  if (!error.value) emit('done')
}
watch(step, () => (touched.value = false))

const pad = (n: number) => String(n).padStart(2, '0')
const summary = computed(() => {
  const b = birth.value
  return {
    when: `${b.calendar === 'lunar' ? '农历 ' : ''}${b.year} 年 ${b.month} 月 ${b.day} 日${b.lunarLeap && b.calendar === 'lunar' ? '（闰月）' : ''} ${pad(b.hour)}:${pad(b.minute)}`,
    where: `${b.place || '未命名地点'} · ${b.latitude.toFixed(4)}, ${b.longitude.toFixed(4)}`,
    zone: typeof b.timeZone === 'number' ? `UTC${fmtOffset(b.timeZone * 60)}` : `${b.timeZone} · 夏令时${b.dst === 'auto' ? '按历史换算' : '不换算'}`,
    options: `${baziOptions.value.trueSolarTime ? '真太阳时' : '标准时'} · 晚子时${baziOptions.value.lateZi === 'next-day' ? '换日' : '不换日'} · ${HOUSE_SYSTEMS.find((h) => h.code === westernSettings.value.houseSystem)?.zh}宫位制 · ${AYANAMSAS[vedicSettings.value.ayanamsa].name}`,
  }
})
</script>

<template>
  <div class="wizard" :class="mode">
    <ol class="steps" aria-label="步骤">
      <li v-for="(s, i) in STEPS" :key="s.key" :class="{ here: i === step, done: i < step }">
        <button type="button" :disabled="i > step && !canNext" @click="i < step ? (step = i) : i === step + 1 ? next() : undefined">
          <span class="n t-num">{{ i + 1 }}</span>
          <span class="s-title">{{ s.title }}</span>
        </button>
      </li>
    </ol>

    <form class="body" @submit.prevent="step === STEPS.length - 1 ? finish() : next()">
      <header class="head">
        <h2>{{ STEPS[step].title }}</h2>
        <p class="t-muted">{{ STEPS[step].hint }}</p>
      </header>

      <!-- Step 1: when -->
      <div v-if="step === 0" class="grid">
        <div class="field span">
          <label class="lbl" for="w-name">姓名 <span class="t-faint">可选</span></label>
          <input id="w-name" v-model="birth.name" class="lq-input" autocomplete="off" placeholder="用于显示" />
        </div>
        <div class="field">
          <span class="lbl">性别</span>
          <LqSegmented v-model="birth.gender" :options="[{ value: 'F', label: '女' }, { value: 'M', label: '男' }]" label="性别" />
          <span class="t-caption">性别决定八字大运顺逆与紫微大限方向。</span>
        </div>
        <div class="field">
          <span class="lbl">历法</span>
          <div class="row-wrap">
            <LqSegmented v-model="birth.calendar" :options="[{ value: 'solar', label: '公历' }, { value: 'lunar', label: '农历' }]" label="历法" />
            <label v-if="birth.calendar === 'lunar'" class="check"><input v-model="birth.lunarLeap" type="checkbox" /> 闰月</label>
          </div>
        </div>
        <div class="field span">
          <span class="lbl">{{ birth.calendar === 'lunar' ? '农历出生日期' : '出生日期' }}</span>
          <div class="ymd">
            <input v-model.number="birth.year" class="lq-input t-num big" type="number" inputmode="numeric" min="1800" max="2399" aria-label="年" placeholder="2000" required />
            <span class="unit">年</span>
            <input v-model.number="birth.month" class="lq-input t-num big" type="number" inputmode="numeric" min="1" max="12" aria-label="月" placeholder="1" required />
            <span class="unit">月</span>
            <input v-model.number="birth.day" class="lq-input t-num big" type="number" inputmode="numeric" min="1" max="31" aria-label="日" placeholder="1" required />
            <span class="unit">日</span>
          </div>
        </div>
        <div class="field span">
          <span class="lbl">出生时间 <span class="t-faint">24 小时制，按出生地当地钟表时间</span></span>
          <div class="hm">
            <input v-model.number="birth.hour" class="lq-input t-num big" type="number" inputmode="numeric" min="0" max="23" aria-label="时" placeholder="12" required />
            <span class="unit">:</span>
            <input v-model.number="birth.minute" class="lq-input t-num big" type="number" inputmode="numeric" min="0" max="59" aria-label="分" placeholder="00" required />
          </div>
          <span class="t-caption">不知道具体时间时可先填 12:00，时柱与上升星座会不准确。</span>
        </div>
      </div>

      <!-- Step 2: where -->
      <div v-else-if="step === 1" class="grid">
        <div class="field span city">
          <label class="lbl" for="w-city">搜索城市或地名</label>
          <input id="w-city" v-model="cityQuery" class="lq-input big" :placeholder="birth.place ? `当前：${birth.place}，输入新地名可替换` : '例如：北京、上海、Tokyo、New York'" autocomplete="off" />
          <ul v-if="matches.length || searching" class="city-list lq-surface" role="listbox">
            <li v-for="c in matches" :key="c.name + c.lat">
              <button type="button" role="option" @click="pickCity(c)">{{ c.name }} <span class="t-muted">{{ c.detail }}</span> <span class="t-faint t-num">{{ c.lat.toFixed(2) }}, {{ c.lon.toFixed(2) }}</span></button>
            </li>
            <li v-if="searching" class="t-caption searching">搜索中…</li>
          </ul>
          <span class="t-caption">选中后自动填入经纬度与时区；也可以手动修改下面的数值。</span>
        </div>
        <div class="field">
          <label class="lbl" for="w-lat">纬度</label>
          <input id="w-lat" v-model.number="birth.latitude" class="lq-input t-num" type="number" step="0.0001" min="-89.9" max="89.9" />
        </div>
        <div class="field">
          <label class="lbl" for="w-lon">经度</label>
          <input id="w-lon" v-model.number="birth.longitude" class="lq-input t-num" type="number" step="0.0001" min="-180" max="180" />
        </div>
        <div class="field span">
          <span class="lbl">时区 <span class="t-faint">{{ offsetNote }}</span></span>
          <div class="tz">
            <LqSegmented v-model="zoneMode" :options="[{ value: 'iana', label: '按地区' }, { value: 'fixed', label: '固定偏移' }]" label="时区方式" size="sm" />
            <select v-if="zoneMode === 'iana'" v-model="birth.timeZone" class="lq-input" aria-label="时区">
              <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
            </select>
            <input v-else v-model.number="fixedOffset" class="lq-input t-num" type="number" step="0.25" min="-12" max="14" aria-label="UTC 偏移小时" />
          </div>
        </div>
        <div class="field span">
          <span class="lbl">夏令时</span>
          <LqSegmented v-model="birth.dst" :options="[{ value: 'auto', label: '按历史自动换算' }, { value: 'ignore', label: '不换算' }]" label="夏令时" size="sm" />
          <span class="t-caption">中国 1986–1991 年等时期实行过夏令时。多数八字 App 默认不换算；占星软件一般换算。</span>
        </div>
      </div>

      <!-- Step 3: options -->
      <div v-else-if="step === 2" class="grid">
        <div class="field">
          <span class="lbl">八字时间标准</span>
          <LqSegmented v-model="baziOptions.trueSolarTime" :options="[{ value: true as any, label: '真太阳时' }, { value: false as any, label: '标准时' }]" label="八字时间标准" size="sm" />
          <span class="t-caption">真太阳时按出生地经度与均时差修正，问真八字等软件默认使用。</span>
        </div>
        <div class="field">
          <span class="lbl">晚子时（23:00–24:00）</span>
          <LqSegmented v-model="baziOptions.lateZi" :options="[{ value: 'next-day', label: '换日' }, { value: 'same-day', label: '不换日' }]" label="晚子时" size="sm" />
          <span class="t-caption">传统以 23 点换日柱；「不换日」只换时柱。</span>
        </div>
        <div class="field">
          <span class="lbl">占星宫位制</span>
          <select v-model="westernSettings.houseSystem" class="lq-input" aria-label="宫位制"><option v-for="h in HOUSE_SYSTEMS" :key="h.code" :value="h.code">{{ h.zh }} · {{ h.en }}</option></select>
        </div>
        <div class="field">
          <span class="lbl">月交点</span>
          <LqSegmented v-model="westernSettings.nodeType" :options="[{ value: 'true', label: '真交点' }, { value: 'mean', label: '平交点' }]" label="交点" size="sm" />
        </div>
        <div class="field">
          <span class="lbl">Jyotish 岁差（Ayanamsa）</span>
          <select v-model="vedicSettings.ayanamsa" class="lq-input" aria-label="Ayanamsa"><option v-for="(a, k) in AYANAMSAS" :key="k" :value="k">{{ a.name }}</option></select>
        </div>
        <div class="field">
          <span class="lbl">Dasha 年长</span>
          <LqSegmented v-model="vedicSettings.dashaYearDays" :options="[{ value: 365.25 as any, label: '365.25' }, { value: 360 as any, label: '360' }, { value: 365.2564 as any, label: '恒星年' }]" label="Dasha year" size="sm" />
        </div>
        <div class="field span checks">
          <label class="check"><input v-model="westernSettings.asteroids" type="checkbox" /> 星盘加入四大小行星</label>
          <label class="check"><input v-model="westernSettings.modernRulers" type="checkbox" /> 使用现代守护星</label>
        </div>
      </div>

      <!-- Step 4: confirm -->
      <div v-else class="confirm">
        <dl class="sum">
          <div><dt>姓名</dt><dd>{{ birth.name || '—' }} · {{ birth.gender === 'F' ? '女' : '男' }}</dd></div>
          <div><dt>出生时间</dt><dd class="t-num">{{ summary.when }}</dd></div>
          <div><dt>出生地</dt><dd class="t-num">{{ summary.where }}</dd></div>
          <div><dt>时区</dt><dd class="t-num">{{ summary.zone }}</dd></div>
          <div><dt>排盘设定</dt><dd>{{ summary.options }}</dd></div>
        </dl>
        <p class="t-caption">排盘全部在你的浏览器本地完成，出生信息只保存在本机。点击任一步骤标题可返回修改。</p>
      </div>

      <Notice v-if="touched && stepError" tone="error">{{ stepError }}</Notice>
      <Notice v-if="error" tone="error">{{ error }}</Notice>

      <footer class="foot">
        <div class="left">
          <LqButton v-if="step > 0" variant="ghost" @click="back">上一步</LqButton>
          <LqButton v-else-if="mode === 'edit'" variant="ghost" @click="cancel">取消</LqButton>
        </div>
        <div class="right">
          <LqButton v-if="mode === 'edit' && step < STEPS.length - 1" variant="secondary" :loading="loading" @click="finish">直接保存</LqButton>
          <LqButton v-if="step < STEPS.length - 1" type="submit" variant="primary">下一步</LqButton>
          <LqButton v-else type="submit" variant="primary" icon="celestial" :loading="loading">{{ mode === 'edit' ? '保存并重新排盘' : '开始排盘' }}</LqButton>
        </div>
      </footer>
    </form>
  </div>
</template>

<style scoped>
.wizard {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--sp-7);
}
.steps {
  display: grid;
  gap: 4px;
  align-content: start;
}
.steps button {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: var(--r-md);
  background: none;
  color: var(--text-3);
  text-align: left;
  font-size: var(--fs-sm);
  transition: background-color var(--dur-fast), color var(--dur-fast);
}
.steps button:disabled {
  cursor: default;
}
.steps .n {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: var(--fs-xs);
  box-shadow: inset 0 0 0 1px var(--hairline-3);
}
.steps .done button {
  color: var(--text-2);
}
.steps .done .n {
  color: var(--text-on-accent);
  background: var(--text-3);
  box-shadow: none;
}
.steps .here button {
  color: var(--text);
  background: var(--accent-soft);
}
.steps .here .n {
  color: var(--text-on-accent);
  background: var(--accent);
  box-shadow: none;
}
.body {
  display: grid;
  gap: var(--sp-5);
  min-width: 0;
}
.head {
  display: grid;
  gap: 4px;
}
.head h2 {
  font-size: var(--fs-xl);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-5) var(--sp-6);
}
.span {
  grid-column: 1 / -1;
}
.field {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.lbl {
  font-size: var(--fs-sm);
  color: var(--text-2);
}
.check {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: var(--fs-sm);
}
.checks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-4);
}
.ymd {
  display: grid;
  grid-template-columns: minmax(96px, 1.6fr) auto minmax(64px, 1fr) auto minmax(64px, 1fr) auto;
  gap: 8px;
  align-items: center;
  max-width: 480px;
}
.hm {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
  max-width: 220px;
}
.unit {
  font-size: var(--fs-sm);
  color: var(--text-3);
}
.lq-input.big {
  height: 48px;
  font-size: var(--fs-md);
}
.wizard input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
  padding: 0 var(--sp-2);
  text-align: center;
}
.wizard input[type='number']::-webkit-inner-spin-button,
.wizard input[type='number']::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}
.city {
  position: relative;
}
.city-list {
  position: absolute;
  z-index: var(--z-float);
  top: 76px;
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
.searching {
  padding: var(--sp-2) var(--sp-3);
}
.tz {
  display: grid;
  gap: var(--sp-2);
  max-width: 420px;
}
.confirm {
  display: grid;
  gap: var(--sp-4);
}
.sum div {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: var(--sp-3);
  padding: 10px 0;
  border-top: 1px solid var(--hairline);
  font-size: var(--fs-sm);
}
.sum dt {
  color: var(--text-2);
}
.foot {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-3);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--hairline);
}
.left,
.right {
  display: flex;
  gap: var(--sp-2);
}
@media (max-width: 760px) {
  .wizard {
    grid-template-columns: 1fr;
    gap: var(--sp-5);
  }
  .steps {
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 2px;
  }
  .steps button {
    flex-direction: column;
    gap: 4px;
    padding: 8px 4px;
    font-size: var(--fs-2xs);
    text-align: center;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
