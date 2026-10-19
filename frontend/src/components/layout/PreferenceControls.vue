<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUiStore, type MotionPref, type ThemePref } from '@/stores/ui'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import { useI18n, type Locale } from '@/i18n'
import { computed } from 'vue'

const { t, locale } = useI18n()
const langOptions: { value: Locale; label: string }[] = [{ value: 'zh', label: '中文' }, { value: 'en', label: 'English' }]

const { themePref, motionPref } = storeToRefs(useUiStore())

const themeOptions = computed<{ value: ThemePref; label: string; icon?: string }[]>(() => [
  { value: 'system', label: t('自动') },
  { value: 'dark', label: t('深色'), icon: 'moon' },
  { value: 'light', label: t('浅色'), icon: 'sun' },
])
const motionOptions = computed<{ value: MotionPref; label: string; icon?: string }[]>(() => [
  { value: 'system', label: t('自动') },
  { value: 'full', label: t('流动'), icon: 'wave' },
  { value: 'reduced', label: t('静止'), icon: 'still' },
])
</script>

<template>
  <div class="prefs">
    <div class="pref">
      <span class="t-label">{{ t('语言') }}</span>
      <LqSegmented v-model="locale" :options="langOptions" :label="t('语言')" size="sm" />
    </div>
    <div class="pref">
      <span class="t-label">{{ t('外观') }}</span>
      <LqSegmented v-model="themePref" :options="themeOptions" :label="t('外观')" size="sm" />
    </div>
    <div class="pref">
      <span class="t-label">{{ t('动效') }}</span>
      <LqSegmented v-model="motionPref" :options="motionOptions" :label="t('动效')" size="sm" />
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
