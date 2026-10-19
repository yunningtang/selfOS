<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FOUR_WORLDS } from '@/data/lexicon'

/** The four-world pipeline as a quiet wayfinding element. */
const route = useRoute()
const current = computed(() => FOUR_WORLDS.findIndex((w) => w.key === route.meta.world))
</script>

<template>
  <nav class="pipeline" aria-label="Four worlds pipeline">
    <ol>
      <li v-for="(w, i) in FOUR_WORLDS" :key="w.key" :class="{ here: i === current, past: current > -1 && i < current }">
        <RouterLink :to="w.route" :aria-current="i === current ? 'step' : undefined" :title="`${w.name} — ${w.action}`">
          <span class="bead" aria-hidden="true" />
          <span class="name">{{ w.name }}</span>
        </RouterLink>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
ol {
  display: flex;
  align-items: center;
}
li {
  display: flex;
  align-items: center;
}
li + li::before {
  content: '';
  width: 20px;
  height: 1px;
  margin: 0 var(--sp-1);
  background: linear-gradient(90deg, var(--hairline-2), var(--hairline-3), var(--hairline-2));
}
a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 var(--sp-2);
  border-radius: var(--r-pill);
  color: var(--text-3);
  text-decoration: none;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  transition: color var(--dur-fast), background-color var(--dur-fast);
}
a:hover {
  color: var(--text);
  background: var(--accent-soft);
}
.bead {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--hairline-3);
  transition: all var(--dur-slow) var(--ease-spring);
}
.past a {
  color: var(--text-2);
}
.past .bead {
  background: var(--c-sage);
}
.here a {
  color: var(--text);
}
.here .bead {
  transform: scale(1.3);
  background: radial-gradient(circle at 35% 30%, #fff, var(--c-lavender));
  box-shadow: 0 0 10px var(--c-lavender);
}
@media (max-width: 1240px) {
  li:not(.here) .name {
    display: none;
  }
}
</style>
