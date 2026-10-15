<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import SephirothMap from '@/components/SephirothMap/SephirothMap.vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqMeter from '@/components/ui/LqMeter.vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import LqTag from '@/components/ui/LqTag.vue'
import Notice from '@/components/ui/Notice.vue'
import { PATHS, PATH_BY_ID, SEPHIRAH_BY_ID, SEPHIROTH, otherEnd, pathsOf } from '@/data/sephiroth'
import { MEMORY_KINDS } from '@/data/lexicon'
import { fmtDate, fmtPct, fmtSigned } from '@/composables/format'
import { useGraphStore } from '@/stores/graph'
import type { SephirahId } from '@/types'

const graph = useGraphStore()
const { sephiroth, loadingAtlas, error, memoryById } = storeToRefs(graph)
const router = useRouter()

const map = ref<InstanceType<typeof SephirothMap> | null>(null)
const selected = ref<SephirahId | null>(null)
const selectedPath = ref<number | null>(null)
const layer = ref<'flow' | 'structure'>('flow')
const showFlow = computed(() => layer.value === 'flow')
const tab = ref<'overview' | 'paths'>('overview')
const sheetOpen = ref(false)
const narrow = ref(window.matchMedia('(max-width: 760px)').matches)
window.matchMedia('(max-width: 760px)').addEventListener('change', (e) => (narrow.value = e.matches))
const inset = computed(() =>
  narrow.value ? { top: 120, right: 0, bottom: 150, left: 0 } : { top: 72, right: 400, bottom: 0, left: 0 },
)

onMounted(() => {
  graph.loadSephiroth()
  graph.loadMemories()
})

const nodeState = computed(() => sephiroth.value?.nodes.find((n) => n.id === selected.value) ?? null)
const meta = computed(() => (selected.value ? SEPHIRAH_BY_ID[selected.value] : null))
const pathMap = computed(() => new Map(sephiroth.value?.paths.map((p) => [p.id, p]) ?? []))
const pathInfo = computed(() => {
  if (!selectedPath.value) return null
  return { meta: PATH_BY_ID[selectedPath.value], state: pathMap.value.get(selectedPath.value) }
})
const connected = computed(() =>
  selected.value
    ? pathsOf(selected.value).map((p) => ({ ...p, other: otherEnd(p, selected.value!), state: pathMap.value.get(p.id) }))
    : [],
)
const ranked = computed(() =>
  [...(sephiroth.value?.nodes ?? [])].sort((a, b) => b.energy - a.energy).map((n) => ({ ...n, meta: SEPHIRAH_BY_ID[n.id] })),
)
const retention = computed(() => (sephiroth.value?.paths ?? []).filter((p) => p.stagnant))
const linkedMemories = computed(() =>
  (nodeState.value?.memoryIds ?? []).map((id) => memoryById.value.get(id)).filter((m) => !!m),
)

function pick(id: SephirahId) {
  selectedPath.value = null
  selected.value = id
  map.value?.centerOn(id)
  sheetOpen.value = true
}
function pickPath(id: number) {
  selectedPath.value = id
  sheetOpen.value = true
}
function clear() {
  selected.value = null
  selectedPath.value = null
}
const pathLabel = (id: number) => {
  const p = PATH_BY_ID[id]
  return `${SEPHIRAH_BY_ID[p.from].name} — ${SEPHIRAH_BY_ID[p.to].name}`
}
</script>

<template>
  <section class="atlas-view" aria-labelledby="atlas-title">
    <div class="stage">
      <SephirothMap
        ref="map"
        v-model:selected="selected"
        v-model:selected-path="selectedPath"
        :state="sephiroth"
        :show-flow="showFlow"
        :inset="inset"
      />
      <p v-if="loadingAtlas && !sephiroth" class="loading t-muted" role="status">Gathering the tree…</p>
    </div>

    <header class="hud lq-glass">
      <div class="titles">
        <p class="t-label world">Beria · 创造界</p>
        <h1 id="atlas-title">Inner Atlas</h1>
      </div>
      <div class="controls">
        <LqSegmented
          v-model="layer"
          :options="[
            { value: 'flow', label: 'Flow', icon: 'flow' },
            { value: 'structure', label: 'Structure', icon: 'atlas' },
          ]"
          label="Map layer"
          size="sm"
        />
        <div class="zoom" role="group" aria-label="Zoom">
          <LqButton variant="quiet" size="sm" icon="minus" icon-only @click="map?.zoomOut()">Zoom out</LqButton>
          <LqButton variant="quiet" size="sm" icon="focus" icon-only @click="map?.reset()">Fit tree</LqButton>
          <LqButton variant="quiet" size="sm" icon="plus" icon-only @click="map?.zoomIn()">Zoom in</LqButton>
        </div>
      </div>
    </header>

    <aside class="inspector lq-glass" :class="{ open: sheetOpen }" aria-label="Atlas inspector">
      <button class="grab" type="button" :aria-expanded="sheetOpen" @click="sheetOpen = !sheetOpen">
        <span class="visually-hidden">{{ sheetOpen ? 'Collapse' : 'Expand' }} inspector</span>
      </button>

      <Notice v-if="error" tone="error">{{ error }}</Notice>

      <!-- Path detail -->
      <Transition name="rise" mode="out-in">
        <div v-if="pathInfo" :key="`p${pathInfo.meta.id}`" class="pane">
          <div class="pane-head">
            <div>
              <p class="t-label">Path <span class="t-num">{{ pathInfo.meta.id }}</span> · {{ pathInfo.meta.letterName }}</p>
              <h2>{{ pathLabel(pathInfo.meta.id) }}</h2>
            </div>
            <span class="glyph" lang="he">{{ pathInfo.meta.letter }}</span>
          </div>
          <div v-if="pathInfo.state" class="metrics">
            <LqMeter label="Flow" :value="pathInfo.state.flow" signed tone="var(--c-mist)" />
            <LqMeter label="Weight" :value="pathInfo.state.weight" tone="var(--c-lavender)" />
          </div>
          <p class="t-sm t-muted">
            Positive flow runs {{ SEPHIRAH_BY_ID[pathInfo.meta.from].name }} → {{ SEPHIRAH_BY_ID[pathInfo.meta.to].name }}.
          </p>
          <Notice v-if="pathInfo.state?.stagnant">
            Retention point — energy is held here rather than passing through. Cross-check against 忌神 and malefic placements in the Celestial Engine.
          </Notice>
          <div class="row-wrap">
            <LqButton size="sm" variant="ghost" @click="pick(pathInfo.meta.from)">{{ SEPHIRAH_BY_ID[pathInfo.meta.from].name }}</LqButton>
            <LqButton size="sm" variant="ghost" @click="pick(pathInfo.meta.to)">{{ SEPHIRAH_BY_ID[pathInfo.meta.to].name }}</LqButton>
            <span class="spacer" />
            <LqButton size="sm" variant="quiet" icon="close" @click="clear">Clear</LqButton>
          </div>
        </div>

        <!-- Node detail -->
        <div v-else-if="meta" :key="meta.id" class="pane">
          <div class="pane-head">
            <div>
              <p class="t-label"><span class="t-num">{{ meta.index }}</span> · {{ meta.meaning }} · <span class="t-cjk">{{ meta.zh }}</span></p>
              <h2>{{ meta.name }}</h2>
            </div>
            <span class="glyph" lang="he">{{ meta.hebrew }}</span>
          </div>
          <p class="psyche">{{ meta.psyche }}</p>
          <LqMeter v-if="nodeState" label="Energy" :value="nodeState.energy" :tone="meta.tone" />
          <p v-if="nodeState?.narrative" class="narrative">{{ nodeState.narrative }}</p>

          <div v-if="nodeState?.beliefs?.length" class="block">
            <h3 class="t-label">Core beliefs</h3>
            <ul class="beliefs">
              <li v-for="b in nodeState.beliefs" :key="b">“{{ b }}”</li>
            </ul>
          </div>

          <div class="block">
            <h3 class="t-label">Paths</h3>
            <ul class="list">
              <li v-for="p in connected" :key="p.id">
                <button type="button" class="list-btn" @click="pickPath(p.id)">
                  <span class="t-num t-faint">{{ p.id }}</span>
                  <span lang="he" class="mini-glyph">{{ p.letter }}</span>
                  <span>{{ SEPHIRAH_BY_ID[p.other].name }}</span>
                  <span class="spacer" />
                  <span v-if="p.state?.stagnant" class="dot-tension" title="Retention point" />
                  <span class="t-num t-muted">{{ fmtSigned(p.state?.flow ?? 0) }}</span>
                </button>
              </li>
            </ul>
          </div>

          <div v-if="linkedMemories.length" class="block">
            <h3 class="t-label">Memories held here</h3>
            <ul class="list">
              <li v-for="m in linkedMemories" :key="m!.id">
                <button type="button" class="list-btn" @click="router.push({ path: '/memory', query: { id: m!.id } })">
                  <span class="kind-dot" :style="{ background: MEMORY_KINDS[m!.kind].tone }" />
                  <span class="ellipsis">{{ m!.title }}</span>
                  <span class="spacer" />
                  <span class="t-num t-muted t-sm">{{ fmtDate(m!.date) }}</span>
                </button>
              </li>
            </ul>
          </div>
          <LqButton size="sm" variant="quiet" icon="close" @click="clear">Clear selection</LqButton>
        </div>

        <!-- Overview -->
        <div v-else key="overview" class="pane">
          <LqSegmented
            v-model="tab"
            :options="[
              { value: 'overview', label: 'Sephiroth' },
              { value: 'paths', label: 'All 22 paths' },
            ]"
            label="Inspector view"
            size="sm"
          />
          <template v-if="tab === 'overview'">
            <p class="t-sm t-muted">
              Select a sephirah to read its narrative, beliefs and the memories it holds. Drag to pan; scroll or pinch to zoom.
            </p>
            <ul class="list">
              <li v-for="n in ranked" :key="n.id">
                <button type="button" class="list-btn energy-row" @click="pick(n.id)">
                  <span class="swatch" :style="{ background: n.meta.tone }" />
                  <span>{{ n.meta.name }}</span>
                  <span class="t-faint t-sm">{{ n.meta.meaning }}</span>
                  <span class="spacer" />
                  <span class="bar"><span :style="{ width: fmtPct(n.energy), background: n.meta.tone }" /></span>
                  <span class="t-num pctv">{{ fmtPct(n.energy) }}</span>
                </button>
              </li>
            </ul>
            <div v-if="retention.length" class="block">
              <h3 class="t-label">Retention points</h3>
              <div class="row-wrap">
                <LqTag v-for="p in retention" :key="p.id" as="button" tone="var(--tension)" @click="pickPath(p.id)">
                  <span class="t-num">{{ p.id }}</span>&nbsp;{{ pathLabel(p.id) }}
                </LqTag>
              </div>
            </div>
          </template>
          <table v-else class="paths-table">
            <caption class="visually-hidden">All 22 paths with flow and weight</caption>
            <thead>
              <tr><th scope="col">#</th><th scope="col">Path</th><th scope="col" class="r">Flow</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in PATHS" :key="p.id" :class="{ stag: pathMap.get(p.id)?.stagnant }">
                <td class="t-num t-faint">{{ p.id }}</td>
                <td>
                  <button type="button" class="link-btn" @click="pickPath(p.id)">
                    <span lang="he" class="mini-glyph">{{ p.letter }}</span>
                    {{ SEPHIRAH_BY_ID[p.from].name }} — {{ SEPHIRAH_BY_ID[p.to].name }}
                  </button>
                </td>
                <td class="r t-num">{{ fmtSigned(pathMap.get(p.id)?.flow ?? 0) }}</td>
              </tr>
            </tbody>
          </table>
          <p class="t-caption"><span class="t-num">{{ SEPHIROTH.length }}</span> sephiroth · <span class="t-num">{{ PATHS.length }}</span> paths</p>
        </div>
      </Transition>
    </aside>
  </section>
</template>

<style scoped>
.atlas-view {
  position: relative;
  flex: 1;
  min-height: calc(100dvh - var(--topbar-h));
}
.stage {
  position: absolute;
  inset: 0;
}
.loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
.hud {
  position: absolute;
  top: var(--sp-3);
  left: var(--sp-5);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-3) var(--sp-5);
  padding: var(--sp-3) var(--sp-3) var(--sp-3) var(--sp-5);
  border-radius: var(--r-lg);
  max-width: calc(100% - 420px);
}
.world {
  color: var(--accent-ink);
  font-size: var(--fs-2xs);
}
.hud h1 {
  font-size: var(--fs-lg);
}
.controls {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.zoom {
  display: flex;
  padding-left: var(--sp-2);
  border-left: 1px solid var(--hairline);
}

.inspector {
  position: absolute;
  top: var(--sp-3);
  right: var(--sp-5);
  bottom: var(--sp-5);
  width: 360px;
  padding: var(--sp-5);
  overflow-y: auto;
  border-radius: var(--r-xl);
}
.grab {
  display: none;
}
.pane {
  display: grid;
  gap: var(--sp-4);
}
.pane-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sp-3);
}
.pane-head h2 {
  font-size: var(--fs-xl);
  margin-top: 2px;
}
.glyph {
  font-size: 28px;
  line-height: 1;
  color: var(--accent-ink);
  opacity: 0.85;
}
.mini-glyph {
  color: var(--accent-ink);
  min-width: 1.2em;
  text-align: center;
}
.psyche {
  color: var(--text-2);
}
.narrative {
  font-size: var(--fs-sm);
  line-height: var(--lh-body);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--r-md);
  background: var(--surface-sunken);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.metrics {
  display: grid;
  gap: var(--sp-3);
}
.block {
  display: grid;
  gap: var(--sp-2);
}
.beliefs li {
  padding: var(--sp-2) 0;
  font-size: var(--fs-sm);
  border-bottom: 1px solid var(--hairline);
}
.list {
  display: grid;
}
.list-btn {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  min-height: 40px;
  padding: var(--sp-2) var(--sp-2);
  border: 0;
  border-radius: var(--r-sm);
  background: none;
  text-align: left;
  font-size: var(--fs-sm);
  transition: background-color var(--dur-fast);
}
.list-btn:hover {
  background: var(--accent-soft);
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.swatch,
.kind-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}
.bar {
  width: 64px;
  height: 4px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  overflow: hidden;
}
.bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
}
.pctv {
  width: 3.2em;
  text-align: right;
  color: var(--text-2);
}
.dot-tension {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tension);
}
.paths-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}
.paths-table th {
  text-align: left;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--text-2);
  padding: var(--sp-2) var(--sp-1);
  border-bottom: 1px solid var(--hairline-2);
}
.paths-table td {
  padding: 6px var(--sp-1);
  border-bottom: 1px solid var(--hairline);
}
.paths-table .r {
  text-align: right;
}
.paths-table tr.stag td:last-child {
  color: var(--clay-ink);
}
.link-btn {
  display: inline-flex;
  gap: 6px;
  border: 0;
  padding: 0;
  background: none;
  text-align: left;
  color: var(--text);
}
.link-btn:hover {
  color: var(--accent-ink);
}

@media (max-width: 1100px) {
  .inspector {
    width: 320px;
    right: var(--sp-3);
  }
  .hud {
    left: var(--sp-3);
    max-width: calc(100% - 360px);
  }
}
@media (max-width: 760px) {
  .atlas-view {
    min-height: calc(100dvh - var(--topbar-h) - var(--tabbar-h));
  }
  .hud {
    left: var(--sp-2);
    right: var(--sp-2);
    max-width: none;
    padding: var(--sp-2) var(--sp-2) var(--sp-2) var(--sp-4);
  }
  .hud .titles {
    flex: 1;
  }
  .hud .world {
    display: none;
  }
  .hud h1 {
    font-size: var(--fs-md);
  }
  .inspector {
    top: auto;
    left: var(--sp-2);
    right: var(--sp-2);
    bottom: var(--sp-3);
    width: auto;
    max-height: 132px;
    padding: var(--sp-2) var(--sp-4) var(--sp-4);
    transition: max-height var(--dur-slow) var(--ease-spring);
  }
  .inspector.open {
    max-height: 62dvh;
  }
  .grab {
    display: block;
    width: 100%;
    height: 22px;
    border: 0;
    background: none;
    position: relative;
  }
  .grab::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 8px;
    width: 40px;
    height: 4px;
    margin-left: -20px;
    border-radius: var(--r-pill);
    background: var(--hairline-3);
  }
}
</style>
