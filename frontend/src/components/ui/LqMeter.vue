<script setup lang="ts">
import { computed } from 'vue'
import { fmt2 } from '@/composables/format'

/** A horizontal liquid meter. Value 0–1 (or −1…1 when `signed`). */
const props = withDefaults(
  defineProps<{ label: string; value: number; tone?: string; signed?: boolean; hint?: string; compact?: boolean }>(),
  { tone: 'var(--c-lavender)' },
)
const fill = computed(() => (props.signed ? Math.abs(props.value) / 2 : Math.max(0, Math.min(1, props.value))))
const offset = computed(() => (props.signed ? (props.value < 0 ? 0.5 - fill.value : 0.5) : 0))
</script>

<template>
  <div class="meter" :class="{ compact }">
    <div class="head">
      <span class="t-label">{{ label }}</span>
      <span class="val t-num">{{ signed && value > 0 ? '+' : '' }}{{ fmt2(value) }}</span>
    </div>
    <div
      class="track"
      role="meter"
      :aria-label="label"
      :aria-valuenow="Number(value.toFixed(2))"
      :aria-valuemin="signed ? -1 : 0"
      :aria-valuemax="1"
      :title="hint"
    >
      <span v-if="signed" class="mid" />
      <span class="fill" :style="{ left: `${offset * 100}%`, width: `${fill * 100}%`, '--tone': tone }" />
    </div>
  </div>
</template>

<style scoped>
.meter {
  display: grid;
  gap: 6px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.val {
  font-size: var(--fs-sm);
  color: var(--text);
}
.track {
  position: relative;
  height: 6px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  box-shadow: inset 0 0 0 1px var(--hairline);
  overflow: hidden;
}
.compact .track {
  height: 4px;
}
.fill {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, color-mix(in srgb, var(--tone) 55%, transparent), var(--tone));
  box-shadow: 0 0 12px -2px var(--tone);
  transition:
    width var(--dur-slow) var(--ease-spring),
    left var(--dur-slow) var(--ease-spring);
}
.mid {
  position: absolute;
  left: 50%;
  top: -2px;
  bottom: -2px;
  width: 1px;
  background: var(--hairline-3);
}
</style>
