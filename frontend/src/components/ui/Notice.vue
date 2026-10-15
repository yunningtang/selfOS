<script setup lang="ts">
import LqIcon from './LqIcon.vue'

defineProps<{ tone?: 'info' | 'error' }>()
</script>

<template>
  <div class="notice" :class="tone ?? 'info'" :role="tone === 'error' ? 'alert' : 'status'">
    <LqIcon name="info" :size="16" />
    <div><slot /></div>
  </div>
</template>

<style scoped>
.notice {
  display: flex;
  gap: var(--sp-2);
  align-items: flex-start;
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--r-md);
  font-size: var(--fs-sm);
  line-height: var(--lh-snug);
  color: var(--text-2);
  background: var(--surface-sunken);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.notice svg {
  flex: none;
  margin-top: 2px;
}
.error {
  color: var(--danger-ink);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--danger-ink) 30%, transparent);
}
</style>
