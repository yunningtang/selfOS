<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AmbientField from '@/components/ambient/AmbientField.vue'
import NavRail from './NavRail.vue'
import TopBar from './TopBar.vue'
import TabBar from './TabBar.vue'
import { useUiStore } from '@/stores/ui'

useUiStore()
const route = useRoute()
const menuOpen = ref(false)
const immersive = computed(() => !!route.meta.immersive)
watch(() => route.fullPath, () => (menuOpen.value = false))
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <AmbientField :quiet="!!route.meta.quiet" />
  <div class="shell" :class="{ immersive }">
    <NavRail class="rail" :open="menuOpen" @close="menuOpen = false" />
    <div class="column">
      <TopBar @menu="menuOpen = true" />
      <main id="main" tabindex="-1" class="main">
        <RouterView v-slot="{ Component, route: r }">
          <Transition name="route" mode="out-in">
            <component :is="Component" :key="r.name" />
          </Transition>
        </RouterView>
      </main>
    </div>
    <TabBar class="tabbar" />
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  z-index: var(--z-content);
  display: grid;
  grid-template-columns: var(--rail-w) minmax(0, 1fr);
  min-height: 100dvh;
}
.column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.main {
  flex: 1;
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--sp-2) var(--sp-7) var(--sp-9);
}
.immersive .main {
  max-width: none;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.main:focus {
  outline: none;
}
.tabbar {
  display: none;
}

@media (max-width: 1100px) {
  .shell {
    grid-template-columns: var(--rail-w-compact) minmax(0, 1fr);
  }
}
@media (max-width: 760px) {
  .shell {
    grid-template-columns: minmax(0, 1fr);
  }
  .main {
    padding: var(--sp-2) var(--sp-4) calc(var(--tabbar-h) + var(--sp-7) + env(safe-area-inset-bottom));
  }
  .immersive .main {
    padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
  }
  .tabbar {
    display: flex;
  }
}
</style>
