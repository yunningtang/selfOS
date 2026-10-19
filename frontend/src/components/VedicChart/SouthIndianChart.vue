<script setup lang="ts">
import { computed } from 'vue'
import { GRAHAS, SIGNS } from '@/data/lexicon'

type GrahaId = keyof typeof GRAHAS

/** South Indian format: signs fixed in a 4×4 frame, Pisces top-left, running clockwise. */
const props = defineProps<{
  ascendant: number
  placements: Record<string, number>
  retro?: Record<string, boolean>
  title: string
}>()

// [sign, row, col]
const CELLS: [number, number, number][] = [
  [11, 0, 0], [0, 0, 1], [1, 0, 2], [2, 0, 3],
  [10, 1, 0], [3, 1, 3],
  [9, 2, 0], [4, 2, 3],
  [8, 3, 0], [7, 3, 1], [6, 3, 2], [5, 3, 3],
]
const bySign = computed(() => {
  const m = new Map<number, GrahaId[]>()
  for (const [id, s] of Object.entries(props.placements) as [GrahaId, number][]) m.set(s, [...(m.get(s) ?? []), id])
  return m
})
const label = (sign: number) => {
  const g = bySign.value.get(sign) ?? []
  const parts = [SIGNS[sign].name, sign === props.ascendant ? 'ascendant' : '', ...g.map((x) => GRAHAS[x].name)]
  return parts.filter(Boolean).join(', ')
}
</script>

<template>
  <div class="south" role="img" :aria-label="`${title}, South Indian format`">
    <div
      v-for="[sign, r, c] in CELLS"
      :key="sign"
      class="cell"
      :class="{ asc: sign === ascendant }"
      :style="{ gridRow: r + 1, gridColumn: c + 1 }"
      :title="label(sign)"
    >
      <span class="sign">{{ SIGNS[sign].abbr }}</span>
      <span v-if="sign === ascendant" class="asc-mark">Asc</span>
      <span class="grahas">
        <span v-for="g in bySign.get(sign) ?? []" :key="g" class="g">{{ g }}<sup v-if="retro?.[g]">R</sup></span>
      </span>
    </div>
    <div class="centre">
      <span class="t-label">{{ title }}</span>
    </div>
  </div>
</template>

<style scoped>
.south {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  aspect-ratio: 1;
  width: 100%;
  border-radius: var(--r-md);
  overflow: hidden;
  background: var(--hairline-2);
  gap: 1px;
  box-shadow: inset 0 0 0 1px var(--hairline-2);
}
.cell {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 6px 8px;
  background: var(--surface-sunken);
  min-width: 0;
}
.asc {
  background: color-mix(in srgb, var(--c-lavender) 10%, var(--surface-sunken));
}
.asc::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, transparent 49%, var(--accent) 50%, transparent 52%);
}
.sign {
  font-size: var(--fs-2xs);
  color: var(--text-3);
  align-self: flex-end;
}
.asc-mark {
  position: absolute;
  top: 6px;
  left: 18px;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-medium);
  color: var(--accent-ink);
}
.grahas {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
  margin-top: auto;
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
}
sup {
  font-size: 0.65em;
  color: var(--text-2);
  margin-left: 1px;
}
.centre {
  grid-row: 2 / span 2;
  grid-column: 2 / span 2;
  display: grid;
  place-items: center;
  background: var(--surface);
}
@media (max-width: 480px) {
  .grahas {
    font-size: var(--fs-xs);
  }
}
</style>
