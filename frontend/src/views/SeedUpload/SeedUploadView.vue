<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/ui/PageHeader.vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqField from '@/components/ui/LqField.vue'
import LqIcon from '@/components/ui/LqIcon.vue'
import LqMeter from '@/components/ui/LqMeter.vue'
import Notice from '@/components/ui/Notice.vue'
import LiquidOrb from '@/components/ambient/LiquidOrb.vue'
import { useGraphStore } from '@/stores/graph'
import type { SeedKind } from '@/types'

const graph = useGraphStore()
const { intent, seeds, pastedText, build, building, buildError } = storeToRefs(graph)

const KINDS: { value: SeedKind; label: string }[] = [
  { value: 'diary', label: 'Diary 日记' },
  { value: 'dream', label: 'Dream log 梦境' },
  { value: 'social', label: 'Social posts 微博/微信' },
  { value: 'chat', label: 'AI chat export' },
  { value: 'note', label: 'Notes for agents' },
]

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)

function guessKind(name: string): SeedKind {
  const n = name.toLowerCase()
  if (n.includes('dream') || n.includes('梦')) return 'dream'
  if (n.endsWith('.json') || n.includes('chat') || n.includes('gpt')) return 'chat'
  if (n.includes('weibo') || n.includes('wechat') || n.includes('微')) return 'social'
  return 'diary'
}
function add(files: FileList | null) {
  if (!files) return
  for (const f of Array.from(files)) seeds.value.push({ file: f, kind: guessKind(f.name) })
}
function onDrop(e: DragEvent) {
  dragging.value = false
  add(e.dataTransfer?.files ?? null)
}
const size = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`)
</script>

<template>
  <section class="seed" aria-labelledby="seed-title">
    <PageHeader
      title="Seed"
      zh="生命素材"
      world="Atzilut · 神性界 · Will"
      lede="Name what you are seeking, then offer the raw material of your life. Nothing here is judged; it is only listened to."
    />

    <div class="layout">
      <form class="stack form" @submit.prevent="graph.buildGraph()">
        <div class="lq-surface pad-lg stack">
          <LqField label="Core intent of individuation 自性化核心意图" for="intent" hint="One or two sentences. This orients every agent in the council.">
            <textarea id="intent" v-model="intent" class="lq-input" rows="3" placeholder="e.g. I want to stop living as a project and start living as a person." />
          </LqField>
        </div>

        <div class="lq-surface pad-lg stack">
          <h2 class="t-label">Life material</h2>
          <div
            class="drop"
            :class="{ dragging }"
            @dragover.prevent="dragging = true"
            @dragleave="dragging = false"
            @drop.prevent="onDrop"
          >
            <LiquidOrb :material="{ base: '#A8C8E0', depth: '#6A5FA8', variant: 'clear' }" :size="56" :intensity="dragging ? 0.9 : 0.4" />
            <p>Drop diaries, dream logs, social exports or chat histories</p>
            <p class="t-caption">.txt .md .json .csv .html — processed by the Perception Engine</p>
            <LqButton variant="ghost" icon="upload" @click="input?.click()">Choose files</LqButton>
            <input ref="input" class="visually-hidden" type="file" multiple accept=".txt,.md,.json,.csv,.html,.htm" tabindex="-1" @change="add(($event.target as HTMLInputElement).files)" />
          </div>

          <TransitionGroup v-if="seeds.length" tag="ul" name="list" class="files" aria-label="Selected files">
            <li v-for="(s, i) in seeds" :key="s.file.name + i" class="file">
              <LqIcon name="file" :size="18" />
              <span class="fname">{{ s.file.name }}</span>
              <span class="t-num t-faint t-sm">{{ size(s.file.size) }}</span>
              <label class="visually-hidden" :for="`kind-${i}`">Material type for {{ s.file.name }}</label>
              <select :id="`kind-${i}`" v-model="s.kind" class="lq-input kind">
                <option v-for="k in KINDS" :key="k.value" :value="k.value">{{ k.label }}</option>
              </select>
              <LqButton variant="quiet" size="sm" icon="close" icon-only @click="seeds.splice(i, 1)">Remove {{ s.file.name }}</LqButton>
            </li>
          </TransitionGroup>

          <LqField label="Or paste text directly" for="paste">
            <textarea id="paste" v-model="pastedText" class="lq-input" rows="5" placeholder="A dream from last night, a conversation, anything…" />
          </LqField>
        </div>

        <Notice v-if="buildError" tone="error">{{ buildError }}</Notice>
        <div class="row">
          <span class="t-caption">Builds the GraphRAG narrative graph — entities, belief clusters and emotional anchors.</span>
          <span class="spacer" />
          <LqButton type="submit" variant="primary" icon="atlas" :loading="building" :disabled="!seeds.length && !pastedText.trim()">
            Build narrative graph
          </LqButton>
        </div>
      </form>

      <aside class="side">
        <Transition name="rise" mode="out-in">
          <div v-if="build" key="result" class="lq-glass pad-lg stack result" role="status">
            <h2 class="t-label">Graph built</h2>
            <dl class="counts">
              <div><dt class="t-caption">Entities</dt><dd class="t-num">{{ build.entities }}</dd></div>
              <div><dt class="t-caption">Relations</dt><dd class="t-num">{{ build.relations }}</dd></div>
            </dl>
            <h3 class="t-label">Core belief clusters</h3>
            <div class="stack" style="--gap: var(--sp-3)">
              <LqMeter v-for="b in build.beliefClusters" :key="b.id" :label="`“${b.label}”`" :value="b.weight" compact />
            </div>
            <h3 class="t-label">Emotional anchors</h3>
            <ul class="anchors">
              <li v-for="a in build.emotionalAnchors" :key="a.id">
                <span>{{ a.label }}</span>
                <span class="t-num t-muted">{{ a.valence > 0 ? '+' : '' }}{{ a.valence.toFixed(2) }}</span>
              </li>
            </ul>
            <div class="row-wrap">
              <RouterLink to="/atlas" class="next">Open the Inner Atlas →</RouterLink>
              <RouterLink to="/celestial" class="next">Add innate memory →</RouterLink>
            </div>
          </div>
          <div v-else key="guide" class="guide stack">
            <h2 class="t-label">What happens next</h2>
            <ol class="steps">
              <li><span class="n t-num">1</span><span>Text is parsed into entities, events and feelings.</span></li>
              <li><span class="n t-num">2</span><span>Recurring beliefs cluster; strong moments become emotional anchors.</span></li>
              <li><span class="n t-num">3</span><span>The narrative is mapped onto the ten sephiroth and 22 paths.</span></li>
              <li><span class="n t-num">4</span><span>Birth charts can be added as innate memory in the Celestial Engine.</span></li>
            </ol>
          </div>
        </Transition>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.seed {
  display: grid;
  gap: var(--sp-6);
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: var(--sp-7);
  align-items: start;
}
.form {
  --gap: var(--sp-5);
}
.drop {
  display: grid;
  justify-items: center;
  gap: var(--sp-2);
  padding: var(--sp-7) var(--sp-5);
  border-radius: var(--r-lg);
  background: var(--surface-sunken);
  box-shadow: inset 0 0 0 1px var(--hairline-2);
  text-align: center;
  transition:
    box-shadow var(--dur-base) var(--ease-out),
    background-color var(--dur-base);
}
.drop.dragging {
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1.5px var(--accent);
}
.drop p:first-of-type {
  margin-top: var(--sp-2);
  font-weight: var(--fw-medium);
}
.drop .lq-btn {
  margin-top: var(--sp-2);
}
.files {
  display: grid;
}
.file {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2) 0;
  border-bottom: 1px solid var(--hairline);
  color: var(--text-2);
}
.fname {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
  font-size: var(--fs-sm);
}
.kind {
  width: 190px;
  height: 34px;
}
.side {
  position: sticky;
  top: var(--sp-4);
}
.counts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4);
}
.counts dd {
  font-size: var(--fs-2xl);
  font-weight: var(--fw-medium);
}
.anchors li {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--hairline);
  font-size: var(--fs-sm);
}
.next {
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  text-decoration: none;
}
.guide {
  padding: var(--sp-5);
}
.steps {
  display: grid;
  gap: var(--sp-4);
}
.steps li {
  display: flex;
  gap: var(--sp-3);
  font-size: var(--fs-sm);
  color: var(--text-2);
}
.n {
  display: grid;
  place-items: center;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--hairline-3);
  font-size: var(--fs-2xs);
  color: var(--text);
}
@media (max-width: 1000px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .side {
    position: static;
  }
}
@media (max-width: 560px) {
  .file {
    flex-wrap: wrap;
  }
  .kind {
    width: 100%;
    order: 5;
  }
}
</style>
