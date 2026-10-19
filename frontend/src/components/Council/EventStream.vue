<script setup lang="ts">
import { computed, ref } from 'vue'
import LqTag from '@/components/ui/LqTag.vue'
import { EVENT_TYPES } from '@/data/lexicon'
import { PATH_BY_ID } from '@/data/sephiroth'
import { fmtTime } from '@/composables/format'
import type { Agent, SimEvent, SimEventType } from '@/types'

const props = defineProps<{ events: SimEvent[]; agents: Map<string, Agent>; focusAgent?: string | null }>()
const filter = ref<SimEventType | 'all'>('all')
const onlyFocus = ref(false)

const types = computed(() => [...new Set(props.events.map((e) => e.type))])
const shown = computed(() =>
  [...props.events]
    .reverse()
    .filter((e) => filter.value === 'all' || e.type === filter.value)
    .filter((e) => !onlyFocus.value || !props.focusAgent || e.agents.includes(props.focusAgent)),
)
</script>

<template>
  <section class="stream" aria-labelledby="stream-title">
    <header class="head">
      <h2 id="stream-title" class="t-label">Simulation events</h2>
      <div class="row-wrap filters" role="group" aria-label="Filter events">
        <LqTag as="button" :pressed="filter === 'all'" @click="filter = 'all'">All</LqTag>
        <LqTag v-for="t in types" :key="t" as="button" :tone="EVENT_TYPES[t].tone" :pressed="filter === t" @click="filter = t">
          {{ EVENT_TYPES[t].label }}
        </LqTag>
        <LqTag v-if="focusAgent" as="button" :pressed="onlyFocus" tone="var(--c-pearl)" @click="onlyFocus = !onlyFocus">
          Only {{ agents.get(focusAgent)?.name }}
        </LqTag>
      </div>
    </header>
    <p v-if="!events.length" class="empty t-muted t-sm">No events yet. Start a run to let the council deliberate.</p>
    <TransitionGroup v-else tag="ol" name="list" class="events" aria-live="polite" aria-relevant="additions">
      <li v-for="e in shown" :key="e.id" class="event" :style="{ '--tone': EVENT_TYPES[e.type].tone }">
        <div class="when">
          <span class="t-num round">R{{ e.round }}</span>
          <span class="t-num t-faint t-sm">{{ fmtTime(e.at) }}</span>
        </div>
        <div class="what">
          <p class="kind">
            <span class="dot" aria-hidden="true" />
            {{ EVENT_TYPES[e.type].label }}
            <span class="t-faint">·</span>
            <span class="t-muted">{{ e.agents.map((a) => agents.get(a)?.name ?? a).join(', ') }}</span>
            <template v-if="e.path">
              <span class="t-faint">·</span>
              <span class="t-muted">path <span class="t-num">{{ e.path }}</span> <span lang="he">{{ PATH_BY_ID[e.path]?.letter }}</span></span>
            </template>
          </p>
          <p class="text">{{ e.text }}</p>
        </div>
      </li>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.stream {
  display: grid;
  gap: var(--sp-3);
}
.head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--sp-2);
}
.events {
  display: grid;
}
.event {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: var(--sp-4);
  padding: var(--sp-3) 0;
  border-top: 1px solid var(--hairline);
}
.when {
  display: grid;
  align-content: start;
  gap: 2px;
}
.round {
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
}
.kind {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tone);
  box-shadow: 0 0 8px var(--tone);
}
.text {
  margin-top: 4px;
  font-size: var(--fs-sm);
  line-height: var(--lh-body);
}
.empty {
  padding: var(--sp-5) 0;
}
@media (max-width: 640px) {
  .event {
    grid-template-columns: 1fr;
    gap: var(--sp-1);
  }
  .when {
    grid-auto-flow: column;
    justify-content: start;
    gap: var(--sp-2);
  }
}
</style>
