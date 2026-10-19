<script setup lang="ts">
import { ripple as vRipple } from '@/directives/ripple'
import LqIcon from './LqIcon.vue'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'quiet'
    size?: 'sm' | 'md'
    icon?: string
    iconOnly?: boolean
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'secondary', size: 'md', type: 'button' },
)
</script>

<template>
  <button
    v-ripple
    class="lq-btn"
    :class="[`v-${variant}`, `s-${size}`, { 'icon-only': iconOnly, loading }]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="spinner" aria-hidden="true" />
    <LqIcon v-else-if="icon" :name="icon" :size="size === 'sm' ? 16 : 18" />
    <span v-if="!iconOnly" class="label"><slot /></span>
    <span v-else class="visually-hidden"><slot /></span>
  </button>
</template>

<style scoped>
.lq-btn {
  --h: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  height: var(--h);
  padding: 0 var(--sp-4);
  border: 0;
  border-radius: var(--r-pill);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  line-height: 1;
  white-space: nowrap;
  color: var(--text);
  transition:
    transform var(--dur-base) var(--ease-spring),
    background-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out),
    opacity var(--dur-fast);
}
.lq-btn > :not(.lq-ripple) {
  position: relative;
  z-index: 1;
}
.lq-btn:active:not(:disabled) {
  transform: scale(0.965);
  transition-duration: var(--dur-instant);
}
.lq-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.s-sm {
  --h: 32px;
  padding: 0 var(--sp-3);
  font-size: var(--fs-xs);
}
.icon-only {
  width: var(--h);
  padding: 0;
}

/* Primary: a pearlescent liquid fill */
.v-primary {
  color: var(--text-on-accent);
  background:
    radial-gradient(120% 140% at 20% 0%, rgba(255, 255, 255, 0.55), transparent 50%),
    linear-gradient(135deg, var(--c-pearl), var(--c-lavender) 55%, var(--c-mist));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(0, 0, 0, 0.08),
    0 6px 20px -8px rgba(181, 169, 232, 0.6);
}
:root[data-theme='light'] .v-primary {
  color: #fff;
  background:
    radial-gradient(120% 140% at 20% 0%, rgba(255, 255, 255, 0.35), transparent 50%),
    linear-gradient(135deg, #8b7fd0, #6f8fc0);
}
.v-primary:hover:not(:disabled) {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 10px 28px -10px rgba(181, 169, 232, 0.8);
}

.v-secondary {
  background: var(--surface-3);
  box-shadow: inset 0 0 0 1px var(--hairline-2);
}
.v-secondary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--surface-3) 80%, var(--text) 8%);
}

.v-ghost {
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--hairline-2);
}
.v-ghost:hover:not(:disabled) {
  background: var(--accent-soft);
}

.v-quiet {
  background: transparent;
  color: var(--text-2);
}
.v-quiet:hover:not(:disabled) {
  color: var(--text);
  background: var(--accent-soft);
}

.spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  border-right-color: transparent;
  animation: lq-iris-turn 0.8s linear infinite;
}
</style>
