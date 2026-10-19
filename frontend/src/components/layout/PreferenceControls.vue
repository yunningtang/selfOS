<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUiStore, type MotionPref, type ThemePref } from '@/stores/ui'
import LqSegmented from '@/components/ui/LqSegmented.vue'

const { themePref, motionPref } = storeToRefs(useUiStore())

const themeOptions: { value: ThemePref; label: string; icon?: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'light', label: 'Light', icon: 'sun' },
]
const motionOptions: { value: MotionPref; label: string; icon?: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'full', label: 'Fluid', icon: 'wave' },
  { value: 'reduced', label: 'Still', icon: 'still' },
]
</script>

<template>
  <div class="prefs">
    <div class="pref">
      <span class="t-label">Appearance</span>
      <LqSegmented v-model="themePref" :options="themeOptions" label="Appearance" size="sm" />
    </div>
    <div class="pref">
      <span class="t-label">Motion</span>
      <LqSegmented v-model="motionPref" :options="motionOptions" label="Motion" size="sm" />
    </div>
  </div>
</template>

<style scoped>
.prefs {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-2) 0;
  border-top: 1px solid var(--hairline);
}
.pref {
  display: grid;
  gap: 6px;
}
.pref :deep(.seg) {
  width: 100%;
}
@media (max-width: 1100px) and (min-width: 761px) {
  .prefs {
    display: none;
  }
}
</style>
