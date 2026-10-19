<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { dataSource } from '@/api'
import { useUiStore } from '@/stores/ui'
import LqButton from '@/components/ui/LqButton.vue'
import PipelineTrack from './PipelineTrack.vue'
import { useI18n } from '@/i18n'

const { t, isEn, locale } = useI18n()

const emit = defineEmits<{ menu: [] }>()
const route = useRoute()
const ui = useUiStore()
const title = computed(() => (isEn.value ? route.meta.title : (route.meta.zh ?? route.meta.title)))

function cycleTheme() {
  ui.themePref = ui.theme === 'dark' ? 'light' : 'dark'
}
function toggleMotion() {
  ui.motionPref = ui.reducedMotion ? 'full' : 'reduced'
}
</script>

<template>
  <header class="topbar">
    <LqButton class="menu" variant="quiet" icon="list" icon-only @click="emit('menu')">Open navigation</LqButton>
    <p class="crumb">
      <span class="t-muted">selfOS</span>
      <span class="sep" aria-hidden="true">/</span>
      <span>{{ title }}</span>
    </p>
    <PipelineTrack class="track" />
    <div class="end">
      <span
        v-if="dataSource.usingDemo"
        class="demo"
        tabindex="0"
        :title="t('未连接 selfOS 后端，图谱、记忆与议会内容为内置示例；命盘全部由本地计算，是真实结果。')"
      >
        <span class="pip" aria-hidden="true" />
        {{ t('示例数据') }}
      </span>
      <button type="button" class="lang" :aria-label="t('切换语言')" @click="locale = isEn ? 'zh' : 'en'">{{ isEn ? '中文' : 'EN' }}</button>
      <LqButton
        class="quick"
        variant="quiet"
        size="sm"
        :icon="ui.reducedMotion ? 'still' : 'wave'"
        icon-only
        :aria-pressed="!ui.reducedMotion"
        @click="toggleMotion"
      >
        Ambient motion {{ ui.reducedMotion ? 'off' : 'on' }}
      </LqButton>
      <LqButton class="quick" variant="quiet" size="sm" :icon="ui.theme === 'dark' ? 'moon' : 'sun'" icon-only @click="cycleTheme">
        Switch to {{ ui.theme === 'dark' ? 'light' : 'dark' }} appearance
      </LqButton>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: relative;
  z-index: var(--z-float);
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  height: var(--topbar-h);
  padding: 0 var(--sp-7);
}
.crumb {
  display: flex;
  gap: var(--sp-2);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  white-space: nowrap;
}
.sep {
  color: var(--text-3);
}
.track {
  margin-left: auto;
}
.end {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
}
.demo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  margin-right: var(--sp-2);
  border-radius: var(--r-pill);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--text-2);
  box-shadow: inset 0 0 0 1px var(--hairline-2);
  cursor: help;
}
.pip {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-sand);
}
.menu {
  display: none;
}
@media (max-width: 1100px) {
  .topbar {
    padding: 0 var(--sp-5);
  }
}
@media (max-width: 760px) {
  .topbar {
    padding: 0 var(--sp-3);
    gap: var(--sp-2);
  }
  .menu {
    display: inline-flex;
  }
  .crumb .t-muted,
  .crumb .sep,
  .track {
    display: none;
  }
  .end {
    margin-left: auto;
  }
}
.lang {
  height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--r-pill);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline-2);
  color: var(--text-2);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
}
.lang:hover {
  color: var(--text);
  box-shadow: inset 0 0 0 1px var(--hairline-3);
}
</style>
