<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { routes } from '@/router'
import { FOUR_WORLDS } from '@/data/lexicon'
import LqIcon from '@/components/ui/LqIcon.vue'
import PreferenceControls from './PreferenceControls.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const groups = computed(() => {
  const items = routes.filter((r) => r.meta?.title && !r.meta.hidden)
  return [
    { key: 'home', label: '', items: items.filter((r) => !r.meta!.world) },
    ...FOUR_WORLDS.map((w) => ({
      key: w.key,
      label: `${w.name} · ${w.zh}`,
      items: items.filter((r) => r.meta!.world === w.key),
    })),
  ]
})

const sheet = ref<HTMLElement | null>(null)
watch(
  () => props.open,
  async (o) => {
    if (o) {
      await nextTick()
      sheet.value?.querySelector<HTMLElement>('a')?.focus()
    }
  },
)
</script>

<template>
  <div class="nav-root">
    <Transition name="fade">
      <div v-if="open" class="scrim" @click="emit('close')" />
    </Transition>
    <nav
      ref="sheet"
      class="rail lq-glass"
      :class="{ open }"
      aria-label="Primary"
      @keydown.esc="emit('close')"
    >
      <RouterLink to="/" class="brand" aria-label="selfOS home">
        <span class="mark" aria-hidden="true"><span class="core ambient-anim" /></span>
        <span class="word">selfOS</span>
      </RouterLink>

      <div class="groups">
        <section v-for="g in groups" :key="g.key" class="group">
          <p v-if="g.label" class="group-label t-label">{{ g.label }}</p>
          <ul>
            <li v-for="r in g.items" :key="String(r.name)">
              <RouterLink :to="r.path" class="link" :title="`${r.meta!.zh ?? ''} ${r.meta!.title}`" @click="emit('close')">
                <LqIcon :name="r.meta!.icon" />
                <span class="text">{{ r.meta!.zh ?? r.meta!.title }}<span class="en">{{ r.meta!.zh ? r.meta!.title : '' }}</span></span>
              </RouterLink>
            </li>
          </ul>
        </section>
      </div>

      <a class="source" href="https://github.com/yunningtang/selfOS" target="_blank" rel="noopener" title="Source code (AGPL-3.0)">
        <LqIcon name="file" :size="16" />
        <span class="text">Source · AGPL-3.0</span>
      </a>
      <PreferenceControls class="prefs" />
    </nav>
  </div>
</template>

<style scoped>
.nav-root {
  display: contents;
}
.rail {
  align-self: start;
  position: sticky;
  top: var(--sp-3);
  z-index: var(--z-nav);
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  height: calc(100dvh - var(--sp-3) * 2);
  margin: var(--sp-3) 0 var(--sp-3) var(--sp-3);
  padding: var(--sp-5) var(--sp-3) var(--sp-4);
  border-radius: var(--r-xl);
  overflow-y: auto;
}
.brand {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 0 var(--sp-2);
  color: var(--text);
  text-decoration: none;
  font-size: var(--fs-md);
  font-weight: var(--fw-semibold);
  letter-spacing: -0.01em;
}
.mark {
  position: relative;
  width: 28px;
  height: 28px;
  flex: none;
}
.core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.9) 0 8%, transparent 30%),
    radial-gradient(circle at 40% 38%, var(--c-pearl), var(--c-lavender) 55%, #3b3f5c 100%);
  box-shadow:
    inset -3px -4px 8px rgba(0, 0, 0, 0.3),
    0 0 18px rgba(181, 169, 232, 0.45);
  animation:
    lq-morph 14s var(--ease-in-out) infinite,
    lq-breathe var(--dur-breathe) var(--ease-in-out) infinite;
}
.groups {
  display: grid;
  gap: var(--sp-4);
  flex: 1;
  align-content: start;
}
.group {
  display: grid;
  gap: var(--sp-1);
}
.group-label {
  padding: 0 var(--sp-3);
  color: var(--text-3);
  font-size: var(--fs-2xs);
}
.link {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  min-height: 40px;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  color: var(--text-2);
  text-decoration: none;
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  transition:
    color var(--dur-fast),
    background-color var(--dur-fast);
}
.link svg {
  flex: none;
}
.text {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.link:hover {
  color: var(--text);
  background: var(--accent-soft);
}
.link.router-link-exact-active {
  color: var(--text);
  background: color-mix(in srgb, var(--surface-3) 80%, transparent);
  box-shadow:
    inset 0 1px 0 var(--glass-highlight),
    inset 0 0 0 1px var(--hairline);
}
.link.router-link-exact-active::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  width: 4px;
  height: 18px;
  border-radius: var(--r-pill);
  transform: translateY(-50%);
  background: linear-gradient(var(--c-pearl), var(--c-lavender));
  box-shadow: 0 0 10px var(--c-lavender);
}
.source {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-1) var(--sp-3);
  border-radius: var(--r-sm);
  color: var(--text-3);
  font-size: var(--fs-xs);
  text-decoration: none;
  transition: color var(--dur-fast);
}
.source:hover {
  color: var(--text);
}
.scrim {
  display: none;
}

@media (max-width: 1100px) and (min-width: 761px) {
  .rail {
    align-items: center;
    padding: var(--sp-4) var(--sp-2);
  }
  .word,
  .text,
  .group-label {
    display: none;
  }
  .brand {
    padding: 0;
  }
  .link {
    justify-content: center;
    width: 48px;
    padding: 0;
  }
  .group {
    padding-top: var(--sp-2);
    border-top: 1px solid var(--hairline);
  }
  .group:first-child {
    border-top: 0;
  }
}

@media (max-width: 760px) {
  .rail {
    position: fixed;
    top: var(--sp-2);
    left: var(--sp-2);
    bottom: var(--sp-2);
    width: min(300px, calc(100vw - 32px));
    height: auto;
    margin: 0;
    z-index: var(--z-overlay);
    transform: translateX(calc(-100% - 24px));
    visibility: hidden;
    transition:
      transform var(--dur-slow) var(--ease-spring),
      visibility 0s linear var(--dur-slow);
  }
  .rail.open {
    transform: none;
    visibility: visible;
    transition:
      transform var(--dur-slow) var(--ease-spring),
      visibility 0s;
  }
  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-overlay) - 1);
    background: rgba(5, 6, 10, 0.5);
  }
}
.en {
  display: block;
  font-size: var(--fs-2xs);
  color: var(--text-3);
  line-height: 1.2;
}
</style>
