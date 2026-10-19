<script setup lang="ts">
/** Label + control + hint. Put any input/select/textarea in the default slot with class="lq-input". */
defineProps<{ label: string; hint?: string; for?: string }>()
</script>

<template>
  <div class="field">
    <label class="t-label" :for="$props.for">{{ label }}</label>
    <slot />
    <p v-if="hint" class="t-caption">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 6px;
  min-width: 0;
}
</style>
