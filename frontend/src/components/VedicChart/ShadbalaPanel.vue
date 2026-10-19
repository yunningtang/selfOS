<script setup lang="ts">
import { computed, ref } from 'vue'
import { GRAHA_IDS, GRAHA_NAMES } from '@selfos/destiny-core/vedic/tables'
import type { VedicChart } from '@/types'

const props = defineProps<{ chart: VedicChart }>()
const open = ref<number | null>(null)
const max = computed(() => Math.max(...props.chart.shadbala.map((s) => Math.max(s.rupas, s.required))) * 1.08)
const pct = (v: number) => `${(v / max.value) * 100}%`
const f = (v: number) => v.toFixed(1)
const f2 = (v: number) => v.toFixed(2)
const received = (list: { from: number; value: number }[]) => list.map((a) => `${GRAHA_IDS[a.from]} ${a.value > 0 ? '+' : ''}${a.value.toFixed(0)}`).join(', ') || 'no aspects'
</script>

<template>
  <div class="sb">
    <ul class="bars">
      <li v-for="s in chart.shadbala" :key="s.graha">
        <button type="button" class="bar" :aria-expanded="open === s.graha" @click="open = open === s.graha ? null : s.graha">
          <span class="name">{{ GRAHA_NAMES[s.graha] }}</span>
          <span class="track">
            <span class="fill" :class="{ weak: s.rupas < s.required }" :style="{ width: pct(s.rupas) }" />
            <span class="req" :style="{ left: pct(s.required) }" />
          </span>
          <span class="t-num val">{{ f2(s.rupas) }}</span>
          <span class="t-num t-muted ratio">{{ f2(s.ratio) }}×</span>
        </button>
        <div v-if="open === s.graha" class="detail lq-well">
          <dl>
            <div><dt>Sthana</dt><dd class="t-num">{{ f(s.sthana.total) }} <span class="t-faint">= uchcha {{ f(s.sthana.uchcha) }} + saptavargaja {{ f(s.sthana.saptavargaja) }} + ojayugma {{ s.sthana.ojayugma }} + kendra {{ s.sthana.kendra }} + drekkana {{ s.sthana.drekkana }}</span></dd></div>
            <div><dt>Dig</dt><dd class="t-num">{{ f(s.dig) }}</dd></div>
            <div><dt>Kala</dt><dd class="t-num">{{ f(s.kala.total) }} <span class="t-faint">= nathonnatha {{ f(s.kala.nathonnatha) }} + paksha {{ f(s.kala.paksha) }} + tribhaga {{ s.kala.tribhaga }} + abda {{ s.kala.abda }} + masa {{ s.kala.masa }} + vara {{ s.kala.vara }} + hora {{ s.kala.hora }} + ayana {{ f(s.kala.ayana) }}</span></dd></div>
            <div><dt>Chesta</dt><dd class="t-num">{{ f(s.chesta) }}</dd></div>
            <div><dt>Naisargika</dt><dd class="t-num">{{ f(s.naisargika) }}</dd></div>
            <div><dt>Drik</dt><dd class="t-num">{{ f(s.drik) }} <span class="t-faint">← {{ received(s.aspectsReceived) }}</span></dd></div>
            <div><dt>Total</dt><dd class="t-num"><b>{{ f(s.total) }}</b> shashtiamsa = <b>{{ f2(s.rupas) }}</b> rupas · required {{ s.required }}</dd></div>
          </dl>
        </div>
      </li>
    </ul>
    <p class="t-caption">Bar = total in rupas; tick = required minimum; ratio = total ÷ required. Select a graha for the component breakdown.</p>
  </div>
</template>

<style scoped>
.sb {
  display: grid;
  gap: var(--sp-3);
}
.bars {
  display: grid;
  gap: 4px;
}
.bar {
  display: grid;
  grid-template-columns: 72px 1fr 48px 52px;
  gap: var(--sp-3);
  align-items: center;
  width: 100%;
  padding: 6px var(--sp-2);
  border: 0;
  border-radius: var(--r-sm);
  background: none;
  color: var(--text);
  font-size: var(--fs-sm);
  text-align: left;
}
.bar:hover {
  background: var(--accent-soft);
}
.track {
  position: relative;
  height: 10px;
}
.fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 0 4px 4px 0;
  background: var(--c-mist);
}
.fill.weak {
  background: color-mix(in srgb, var(--c-mist) 45%, transparent);
}
.req {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  margin-left: -1px;
  border-radius: 1px;
  background: var(--text);
}
.val,
.ratio {
  text-align: right;
}
.detail {
  margin: 4px 0 8px;
  padding: var(--sp-3) var(--sp-4);
  font-size: var(--fs-xs);
}
.detail dl {
  display: grid;
  gap: 4px;
}
.detail div {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: var(--sp-2);
}
.detail dt {
  color: var(--text-2);
}
</style>
