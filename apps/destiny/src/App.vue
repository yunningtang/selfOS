<script setup lang="ts">
import { useRoute } from 'vue-router'
import AmbientField from '@/components/ambient/AmbientField.vue'
import LqButton from '@/components/ui/LqButton.vue'
import { useUiStore } from '@/stores/ui'
import { useI18n } from '@/i18n'

const ui = useUiStore()
const route = useRoute()
const { t, isEn, locale } = useI18n()
</script>

<template>
  <AmbientField :quiet="route.name !== 'home'" />
  <div class="shell">
    <header class="top lq-glass">
      <RouterLink to="/" class="brand">
        <span class="mark" aria-hidden="true" />
        <span class="word">{{ isEn ? 'Destiny' : '命盘' }}</span>
        <span class="sub t-faint">{{ isEn ? '八字 · 紫微 · 占星 · Jyotish' : 'BaZi · Zi Wei · Western · Jyotish' }}</span>
      </RouterLink>
      <nav class="links" :aria-label="t('导航')">
        <RouterLink to="/chart">{{ t('排盘') }}</RouterLink>
        <RouterLink to="/begin">{{ t('出生信息') }}</RouterLink>
      </nav>
      <div class="end">
        <button type="button" class="lang" :aria-label="t('切换语言')" @click="locale = isEn ? 'zh' : 'en'">{{ isEn ? '中文' : 'EN' }}</button>
        <LqButton variant="quiet" size="sm" :icon="ui.theme === 'dark' ? 'moon' : 'sun'" icon-only @click="ui.themePref = ui.theme === 'dark' ? 'light' : 'dark'">{{ t('切换外观') }}</LqButton>
      </div>
    </header>
    <main id="main" class="main">
      <RouterView v-slot="{ Component, route: r }">
        <Transition name="route" mode="out-in">
          <component :is="Component" :key="r.name" />
        </Transition>
      </RouterView>
    </main>
    <footer class="foot t-caption">
      <span>{{ t('排盘全部在你的浏览器本地完成，出生信息只保存在本机。') }}</span>
      <a href="https://github.com/yunningtang/selfOS/tree/main/packages/destiny-core" target="_blank" rel="noopener">@selfos/destiny-core · AGPL-3.0</a>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
.top {
  position: sticky;
  top: var(--sp-3);
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  gap: var(--sp-5);
  width: min(var(--content-max), calc(100% - var(--sp-6)));
  margin: var(--sp-3) auto 0;
  padding: var(--sp-2) var(--sp-4);
  border-radius: var(--r-xl);
}
.brand {
  display: inline-flex;
  align-items: baseline;
  gap: var(--sp-2);
  color: var(--text);
  text-decoration: none;
}
.mark {
  align-self: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff, var(--c-lavender) 55%, var(--c-ink));
}
.word {
  font-weight: var(--fw-medium);
}
.sub {
  font-size: var(--fs-xs);
}
.links {
  display: flex;
  gap: var(--sp-2);
}
.links a {
  padding: 6px 12px;
  border-radius: var(--r-pill);
  color: var(--text-2);
  text-decoration: none;
  font-size: var(--fs-sm);
}
.links a.router-link-active {
  color: var(--text);
  background: var(--accent-soft);
}
.end {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-left: auto;
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
.main {
  flex: 1;
  width: min(var(--content-max), calc(100% - var(--sp-6)));
  margin: 0 auto;
  padding: var(--sp-6) 0 var(--sp-9);
}
.foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--sp-3);
  width: min(var(--content-max), calc(100% - var(--sp-6)));
  margin: 0 auto;
  padding: var(--sp-4) 0 var(--sp-6);
  border-top: 1px solid var(--hairline);
}
@media (max-width: 640px) {
  .sub,
  .links {
    display: none;
  }
}
</style>
