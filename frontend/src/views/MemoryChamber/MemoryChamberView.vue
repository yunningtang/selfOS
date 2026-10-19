<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/ui/PageHeader.vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import LqTag from '@/components/ui/LqTag.vue'
import LqMeter from '@/components/ui/LqMeter.vue'
import LqIcon from '@/components/ui/LqIcon.vue'
import Notice from '@/components/ui/Notice.vue'
import { MEMORY_KINDS } from '@/data/lexicon'
import { SEPHIRAH_BY_ID } from '@/data/sephiroth'
import { fmtDate } from '@/composables/format'
import { useGraphStore } from '@/stores/graph'
import type { MemoryKind, MemoryRecord } from '@/types'

const MemorySpace = defineAsyncComponent(() => import('@/components/Memory/MemorySpace.vue'))

const graph = useGraphStore()
const { memories, memoryById, loadingMemories } = storeToRefs(graph)
const route = useRoute()
const router = useRouter()

const view = ref<'space' | 'list' | 'timeline'>('space')
const query = ref('')
const kinds = ref<Set<MemoryKind>>(new Set())
const webglOk = ref(true)
const selectedId = ref<string | null>((route.query.id as string) ?? null)

onMounted(() => graph.loadMemories())
watch(selectedId, (id) => router.replace({ query: id ? { id } : {} }))
watch(
  () => route.query.id,
  (id) => (selectedId.value = (id as string) ?? null),
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return memories.value.filter(
    (m) =>
      (!kinds.value.size || kinds.value.has(m.kind)) &&
      (!q || `${m.title} ${m.body} ${m.tags.join(' ')}`.toLowerCase().includes(q)),
  )
})
const chronological = computed(() => [...filtered.value].sort((a, b) => b.date.localeCompare(a.date)))
const byYear = computed(() => {
  const groups = new Map<string, MemoryRecord[]>()
  for (const m of chronological.value) groups.set(m.date.slice(0, 4), [...(groups.get(m.date.slice(0, 4)) ?? []), m])
  return [...groups.entries()]
})
const selected = computed(() => (selectedId.value ? memoryById.value.get(selectedId.value) ?? null : null))
const linked = computed(() => (selected.value?.links ?? []).map((id) => memoryById.value.get(id)).filter((m): m is MemoryRecord => !!m))
const kindCounts = computed(() => {
  const c: Partial<Record<MemoryKind, number>> = {}
  for (const m of memories.value) c[m.kind] = (c[m.kind] ?? 0) + 1
  return c
})

function toggleKind(k: MemoryKind) {
  const s = new Set(kinds.value)
  if (s.has(k)) s.delete(k)
  else s.add(k)
  kinds.value = s
}
function open(id: string) {
  selectedId.value = id
}
</script>

<template>
  <section class="chamber" aria-labelledby="mem-title">
    <PageHeader
      title="Memory Chamber"
      zh="记忆之室"
      world="Beria · 长期记忆"
      lede="Your archive held in space. Earliest memories rest at the base of the spiral; filaments join memories the graph has linked."
    >
      <LqSegmented
        v-model="view"
        :options="[
          { value: 'space', label: 'Space', icon: 'space' },
          { value: 'list', label: 'List', icon: 'list' },
          { value: 'timeline', label: 'Timeline', icon: 'timeline' },
        ]"
        label="View"
      />
    </PageHeader>

    <div class="toolbar">
      <label class="search">
        <LqIcon name="search" :size="16" />
        <span class="visually-hidden">Search memories</span>
        <input v-model="query" class="lq-input" type="search" placeholder="Search titles, text, tags…" />
      </label>
      <div class="row-wrap" role="group" aria-label="Filter by kind">
        <LqTag
          v-for="(k, key) in MEMORY_KINDS"
          :key="key"
          as="button"
          :tone="k.tone"
          :pressed="kinds.has(key)"
          @click="toggleKind(key)"
        >
          {{ k.label }} <span class="t-num t-faint">{{ kindCounts[key] ?? 0 }}</span>
        </LqTag>
      </div>
      <p class="t-caption count" role="status"><span class="t-num">{{ filtered.length }}</span> of <span class="t-num">{{ memories.length }}</span></p>
    </div>

    <div class="layout">
      <div class="stage" :class="view">
        <template v-if="view === 'space'">
          <div v-if="webglOk" class="space-wrap">
            <MemorySpace :memories="filtered" :selected="selectedId" @select="open" @unsupported="webglOk = false" />
            <p class="hint t-caption">Drag to orbit · scroll to approach · select a sphere to open it. The List view offers the same archive by keyboard.</p>
          </div>
          <Notice v-else>3D isn’t available in this browser. Showing the list instead.</Notice>
        </template>

        <ol v-if="view === 'list' || (view === 'space' && !webglOk)" class="list">
          <li v-for="m in chronological" :key="m.id">
            <button type="button" class="item" :aria-current="selectedId === m.id || undefined" @click="open(m.id)">
              <span class="orbit" :style="{ '--tone': MEMORY_KINDS[m.kind].tone }" aria-hidden="true" />
              <span class="item-body">
                <span class="item-head">
                  <span class="item-title">{{ m.title }}</span>
                  <span class="t-num t-muted t-sm">{{ fmtDate(m.date) }}</span>
                </span>
                <span class="item-excerpt t-sm t-muted">{{ m.excerpt }}</span>
              </span>
            </button>
          </li>
        </ol>

        <div v-if="view === 'timeline'" class="timeline">
          <section v-for="[year, items] in byYear" :key="year" class="year">
            <h2 class="year-label t-num">{{ year }}</h2>
            <ol>
              <li v-for="m in items" :key="m.id">
                <button type="button" class="t-item" :aria-current="selectedId === m.id || undefined" @click="open(m.id)">
                  <span class="bead" :style="{ '--tone': MEMORY_KINDS[m.kind].tone, '--s': `${8 + m.intensity * 8}px` }" aria-hidden="true" />
                  <span class="t-num t-muted t-sm when">{{ fmtDate(m.date) }}</span>
                  <span>{{ m.title }}</span>
                  <span class="t-faint t-sm">{{ MEMORY_KINDS[m.kind].label }}</span>
                </button>
              </li>
            </ol>
          </section>
        </div>

        <p v-if="!loadingMemories && !filtered.length" class="t-muted empty">Nothing matches. Clear the search or filters.</p>
      </div>

      <aside class="reader lq-surface" aria-live="polite" aria-label="Memory">
        <Transition name="rise" mode="out-in">
          <article v-if="selected" :key="selected.id" class="pad-lg doc">
            <p class="t-label kind">
              <span class="dot" :style="{ background: MEMORY_KINDS[selected.kind].tone }" />
              {{ MEMORY_KINDS[selected.kind].label }} · <span class="t-num">{{ fmtDate(selected.date) }}</span>
            </p>
            <h2>{{ selected.title }}</h2>
            <p class="body">{{ selected.body }}</p>
            <div class="row-wrap">
              <LqTag v-for="t in selected.tags" :key="t">{{ t }}</LqTag>
            </div>
            <div class="meters">
              <LqMeter label="Valence" :value="selected.valence" signed tone="var(--c-sage)" compact />
              <LqMeter label="Intensity" :value="selected.intensity" tone="var(--c-lavender)" compact />
            </div>
            <p v-if="selected.sephirah" class="t-sm">
              Held in
              <RouterLink to="/atlas">{{ SEPHIRAH_BY_ID[selected.sephirah].name }}</RouterLink>
              <span class="t-muted"> — {{ SEPHIRAH_BY_ID[selected.sephirah].psyche }}</span>
            </p>
            <div v-if="linked.length" class="links">
              <h3 class="t-label">Connected memories</h3>
              <ul>
                <li v-for="l in linked" :key="l.id">
                  <button type="button" class="link-row" @click="open(l.id)">
                    <span class="dot" :style="{ background: MEMORY_KINDS[l.kind].tone }" />
                    <span>{{ l.title }}</span>
                    <span class="spacer" />
                    <span class="t-num t-muted t-sm">{{ l.date.slice(0, 4) }}</span>
                  </button>
                </li>
              </ul>
            </div>
          </article>
          <div v-else key="empty" class="pad-lg placeholder">
            <p class="t-muted">Select a memory to read it and follow its connections.</p>
          </div>
        </Transition>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.chamber {
  display: grid;
  gap: var(--sp-5);
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3) var(--sp-4);
  align-items: center;
}
.search {
  position: relative;
  flex: 0 1 300px;
  color: var(--text-2);
}
.search svg {
  position: absolute;
  left: 12px;
  top: 12px;
}
.search input {
  padding-left: 36px;
}
.count {
  margin-left: auto;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: var(--sp-5);
  align-items: start;
}
.stage {
  min-width: 0;
}
.space-wrap {
  position: relative;
  height: min(68dvh, 680px);
  border-radius: var(--r-xl);
  overflow: hidden;
  box-shadow: inset 0 0 0 1px var(--hairline);
  background: radial-gradient(80% 70% at 50% 45%, color-mix(in srgb, var(--c-lavender) 6%, transparent), transparent);
}
.hint {
  position: absolute;
  left: var(--sp-4);
  bottom: var(--sp-4);
  max-width: calc(100% - 2 * var(--sp-4));
  padding: 6px 12px;
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  box-shadow: inset 0 0 0 1px var(--hairline);
  pointer-events: none;
}
.list {
  display: grid;
  gap: 2px;
}
.item {
  display: flex;
  gap: var(--sp-4);
  width: 100%;
  padding: var(--sp-4);
  border: 0;
  border-radius: var(--r-md);
  background: none;
  text-align: left;
  transition: background-color var(--dur-fast);
}
.item:hover,
.item[aria-current] {
  background: var(--accent-soft);
}
.orbit {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 4px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff 0 10%, var(--tone) 45%, color-mix(in srgb, var(--tone) 40%, transparent));
  box-shadow: 0 0 10px color-mix(in srgb, var(--tone) 60%, transparent);
}
.item-body {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.item-head {
  display: flex;
  gap: var(--sp-3);
  justify-content: space-between;
  align-items: baseline;
}
.item-title {
  font-weight: var(--fw-medium);
}
.item-excerpt {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.timeline {
  display: grid;
  gap: var(--sp-5);
  padding-left: var(--sp-2);
}
.year {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: var(--sp-4);
}
.year-label {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
  color: var(--text-2);
}
.year ol {
  display: grid;
  border-left: 1px solid var(--hairline-2);
}
.t-item {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--sp-3);
  width: 100%;
  padding: var(--sp-2) var(--sp-3) var(--sp-2) var(--sp-5);
  border: 0;
  background: none;
  text-align: left;
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
}
.t-item:hover,
.t-item[aria-current] {
  background: var(--accent-soft);
}
.when {
  min-width: 96px;
}
.bead {
  position: absolute;
  left: calc(var(--s) / -2);
  top: calc(50% - var(--s) / 2);
  width: var(--s);
  height: var(--s);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff 0 8%, var(--tone) 50%);
  box-shadow: 0 0 10px color-mix(in srgb, var(--tone) 60%, transparent);
}
.empty {
  padding: var(--sp-6) 0;
}
.reader {
  position: sticky;
  top: var(--sp-4);
  max-height: calc(100dvh - var(--topbar-h) - var(--sp-6));
  overflow-y: auto;
}
.doc {
  display: grid;
  gap: var(--sp-4);
}
.kind {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}
.doc h2 {
  font-size: var(--fs-xl);
}
.body {
  font-size: var(--fs-md);
  line-height: var(--lh-read);
}
.meters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4);
}
.links {
  display: grid;
  gap: var(--sp-2);
}
.link-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  min-height: 40px;
  padding: var(--sp-2);
  border: 0;
  border-radius: var(--r-sm);
  background: none;
  text-align: left;
  font-size: var(--fs-sm);
}
.link-row:hover {
  background: var(--accent-soft);
}
.placeholder {
  min-height: 200px;
  display: grid;
  place-items: center;
  text-align: center;
}
@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .reader {
    position: static;
    max-height: none;
  }
}
@media (max-width: 640px) {
  .space-wrap {
    height: 56dvh;
  }
  .year {
    grid-template-columns: 1fr;
    gap: var(--sp-2);
  }
  .search {
    flex: 1 1 100%;
  }
}
</style>
