<script setup lang="ts" generic="T extends string">
import LqIcon from './LqIcon.vue'

/** Radio-group segmented control with a sliding liquid thumb. Arrow keys move the selection. */
const props = defineProps<{
  options: { value: T; label: string; icon?: string }[]
  label: string
  size?: 'sm' | 'md'
}>()
const model = defineModel<T>({ required: true })

function onKey(e: KeyboardEvent) {
  const i = props.options.findIndex((o) => o.value === model.value)
  let n = i
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % props.options.length
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + props.options.length) % props.options.length
  else return
  e.preventDefault()
  model.value = props.options[n].value
  const btns = (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role=radio]')
  btns[n]?.focus()
}
</script>

<template>
  <div
    class="seg"
    :class="`s-${size ?? 'md'}`"
    role="radiogroup"
    :aria-label="label"
    :style="{
      '--n': options.length,
      '--i': Math.max(0, options.findIndex((o) => o.value === model)),
    }"
    @keydown="onKey"
  >
    <span class="thumb" aria-hidden="true" />
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      :tabindex="model === o.value ? 0 : -1"
      @click="model = o.value"
    >
      <LqIcon v-if="o.icon" :name="o.icon" :size="16" />
      <span>{{ o.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.seg {
  --pad: 3px;
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  padding: var(--pad);
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  box-shadow: inset 0 0 0 1px var(--hairline);
  isolation: isolate;
}
.thumb {
  position: absolute;
  z-index: -1;
  top: var(--pad);
  bottom: var(--pad);
  left: var(--pad);
  width: calc((100% - 2 * var(--pad)) / var(--n));
  border-radius: var(--r-pill);
  background: var(--surface-3);
  box-shadow:
    inset 0 1px 0 var(--glass-highlight),
    inset 0 0 0 1px var(--hairline-2),
    var(--shadow-1);
  transform: translateX(calc(100% * var(--i)));
  transition: transform var(--dur-slow) var(--ease-spring);
}
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 var(--sp-3);
  border: 0;
  background: none;
  border-radius: var(--r-pill);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--text-2);
  white-space: nowrap;
  transition: color var(--dur-fast);
}
.s-sm button {
  height: 28px;
  font-size: var(--fs-xs);
  padding: 0 var(--sp-2);
}
button[aria-checked='true'] {
  color: var(--text);
}
button:hover {
  color: var(--text);
}
</style>
