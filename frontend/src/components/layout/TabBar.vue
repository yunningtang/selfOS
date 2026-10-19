<script setup lang="ts">
import { routes } from '@/router'
import LqIcon from '@/components/ui/LqIcon.vue'
import { useI18n } from '@/i18n'

const { isEn } = useI18n()

const items = routes.filter((r) => r.meta?.primary)
</script>

<template>
  <nav class="tabbar lq-glass" aria-label="Core interfaces">
    <RouterLink v-for="r in items" :key="String(r.name)" :to="r.path" class="tab">
      <LqIcon :name="r.meta!.icon" :size="22" />
      <span>{{ isEn ? r.meta!.title.split(' ').slice(-1)[0] : (r.meta!.zh ?? r.meta!.title) }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  left: var(--sp-2);
  right: var(--sp-2);
  bottom: calc(var(--sp-2) + env(safe-area-inset-bottom));
  z-index: var(--z-nav);
  height: var(--tabbar-h);
  padding: 0 var(--sp-1);
  border-radius: var(--r-xl);
  align-items: stretch;
  justify-content: space-around;
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: var(--r-lg);
  color: var(--text-2);
  text-decoration: none;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-medium);
  transition: color var(--dur-fast), transform var(--dur-base) var(--ease-spring);
}
.tab:active {
  transform: scale(0.94);
}
.tab.router-link-active {
  color: var(--text);
}
.tab.router-link-active svg {
  filter: drop-shadow(0 0 6px var(--c-lavender));
}
</style>
