<script setup lang="ts">
defineProps<{ tone?: string; as?: 'span' | 'button'; pressed?: boolean }>()
</script>

<template>
  <component
    :is="as ?? 'span'"
    class="tag"
    :class="{ interactive: as === 'button', pressed }"
    :type="as === 'button' ? 'button' : undefined"
    :aria-pressed="as === 'button' ? !!pressed : undefined"
    :style="{ '--tone': tone ?? 'var(--text-2)' }"
  >
    <span class="dot" aria-hidden="true" />
    <slot />
  </component>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--tone) 12%, transparent);
  color: var(--text);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  white-space: nowrap;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tone);
  box-shadow: 0 0 8px var(--tone);
}
.interactive {
  height: 30px;
  padding: 0 12px;
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--hairline-2);
  color: var(--text-2);
  transition:
    background-color var(--dur-fast),
    color var(--dur-fast),
    transform var(--dur-base) var(--ease-spring);
}
.interactive:hover {
  color: var(--text);
}
.interactive:active {
  transform: scale(0.96);
}
.interactive.pressed {
  background: color-mix(in srgb, var(--tone) 16%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tone) 45%, transparent);
  color: var(--text);
}
</style>
