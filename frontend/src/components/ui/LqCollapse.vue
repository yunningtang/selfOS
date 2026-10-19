<script setup lang="ts">
import { ref } from 'vue'

/** A quiet disclosure section: hairline-separated, chevron, optional summary on the right. */
const props = defineProps<{ title: string; summary?: string; open?: boolean }>()
const isOpen = ref(!!props.open)
</script>

<template>
  <section class="collapse" :class="{ open: isOpen }">
    <button type="button" class="head" :aria-expanded="isOpen" @click="isOpen = !isOpen">
      <span class="chev" aria-hidden="true">›</span>
      <span class="title">{{ title }}</span>
      <span v-if="summary" class="summary t-muted">{{ summary }}</span>
    </button>
    <div v-if="isOpen" class="body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.collapse {
  border-top: 1px solid var(--hairline);
}
.head {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: var(--sp-4) 0;
  border: 0;
  background: none;
  color: var(--text);
  text-align: left;
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}
.chev {
  display: inline-block;
  width: 14px;
  color: var(--text-3);
  transition: transform var(--dur-base) var(--ease-spring);
}
.open .chev {
  transform: rotate(90deg);
}
.summary {
  margin-left: auto;
  font-size: var(--fs-sm);
  font-weight: var(--fw-regular);
}
.body {
  padding: 0 0 var(--sp-6);
}
</style>
