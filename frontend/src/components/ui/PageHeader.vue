<script setup lang="ts">
import { useI18n } from '@/i18n'

defineProps<{ title: string; zh?: string; world?: string; lede?: string }>()
const { isEn } = useI18n()
</script>

<template>
  <header class="page-header">
    <div class="titles">
      <p v-if="world" class="world t-label">{{ world }}</p>
      <h1>
        <template v-if="zh">{{ isEn ? title : zh }}<span class="zh">{{ isEn ? zh : title }}</span></template>
        <template v-else>{{ title }}</template>
      </h1>
      <p v-if="lede" class="lede">{{ lede }}</p>
    </div>
    <div v-if="$slots.default" class="actions"><slot /></div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sp-4) var(--sp-6);
}
.titles {
  display: grid;
  gap: var(--sp-2);
  max-width: 62ch;
}
.world {
  color: var(--accent-ink);
}
h1 {
  font-size: var(--fs-2xl);
}
.zh {
  margin-left: var(--sp-2);
  font-size: var(--fs-lg);
  font-weight: var(--fw-regular);
  color: var(--text-2);
}
.lede {
  color: var(--text-2);
  line-height: var(--lh-body);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  align-items: center;
}
@media (max-width: 640px) {
  h1 {
    font-size: var(--fs-xl);
  }
}
</style>
