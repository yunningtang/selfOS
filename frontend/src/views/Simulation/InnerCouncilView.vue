<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/ui/PageHeader.vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqMeter from '@/components/ui/LqMeter.vue'
import LqSegmented from '@/components/ui/LqSegmented.vue'
import LqField from '@/components/ui/LqField.vue'
import Notice from '@/components/ui/Notice.vue'
import LiquidOrb from '@/components/ambient/LiquidOrb.vue'
import CouncilField from '@/components/Council/CouncilField.vue'
import EventStream from '@/components/Council/EventStream.vue'
import ChatThread from '@/components/Council/ChatThread.vue'
import { ARCHETYPES, INDIVIDUATION_STEPS } from '@/data/lexicon'
import { SEPHIRAH_BY_ID } from '@/data/sephiroth'
import { fmt2 } from '@/composables/format'
import { useSimulationStore } from '@/stores/simulation'
import { useGraphStore } from '@/stores/graph'
import type { SimulationInjectRequest } from '@/types'

const sim = useSimulationStore()
const graph = useGraphStore()
const { status, agents, relations, error, starting, running, agentById, interviews, interviewing } = storeToRefs(sim)

const selected = ref<string | null>(null)
const rounds = ref(10)
const injectOpen = ref(false)
const injection = ref<SimulationInjectRequest>({ kind: 'liunian', label: '2027 丁未 annual pillar', intensity: 0.6 })

onMounted(async () => {
  await sim.refresh()
  if (running.value) sim.startPolling()
})
onBeforeUnmount(() => sim.stopPolling())

const agent = computed(() => (selected.value ? agentById.value.get(selected.value) ?? null : null))
const speaking = computed(() => status.value?.events.at(-1)?.agents ?? [])
const progress = computed(() => (status.value?.totalRounds ? status.value.round / status.value.totalRounds : 0))
const stateLabel = computed(
  () => ({ idle: 'Idle', running: 'Deliberating', complete: 'Complete', error: 'Error' })[status.value?.state ?? 'idle'],
)

function start() {
  sim.start(rounds.value, graph.intent || undefined, graph.build?.graphId)
}
async function inject() {
  await sim.inject(injection.value)
  injectOpen.value = false
}
</script>

<template>
  <section class="council" aria-labelledby="council-title">
    <PageHeader
      title="Inner Council"
      zh="内在议会"
      world="Yetzirah · 形成界"
      lede="Archetypal agents deliberate over your material. Watch where they ally, where they oppose, and what the Self proposes."
    >
      <form class="run" @submit.prevent="start">
        <label class="visually-hidden" for="rounds">Rounds</label>
        <div class="rounds">
          <input id="rounds" v-model.number="rounds" class="lq-input t-num" type="number" min="1" max="50" />
          <span class="t-caption">rounds</span>
        </div>
        <LqButton type="submit" variant="primary" icon="play" :loading="starting" :disabled="running">
          {{ status?.state === 'complete' ? 'Run again' : 'Start council' }}
        </LqButton>
        <LqButton variant="ghost" icon="inject" :aria-expanded="injectOpen" :disabled="!status || status.state === 'idle'" @click="injectOpen = !injectOpen">
          Inject variable
        </LqButton>
      </form>
    </PageHeader>

    <Notice v-if="error" tone="error">{{ error }}</Notice>

    <Transition name="rise">
      <form v-if="injectOpen" class="inject lq-glass pad" @submit.prevent="inject">
        <h2 class="t-label">Inject an external variable</h2>
        <div class="inject-grid">
          <LqField label="Source">
            <LqSegmented
              v-model="injection.kind"
              :options="[
                { value: 'liunian', label: '流年 Annual' },
                { value: 'dasha', label: 'Dasha' },
                { value: 'event', label: 'Life event' },
              ]"
              label="Variable source"
              size="sm"
            />
          </LqField>
          <LqField label="Label" for="inj-label">
            <input id="inj-label" v-model="injection.label" class="lq-input" required />
          </LqField>
          <LqField :label="`Intensity · ${fmt2(injection.intensity)}`" for="inj-int">
            <input id="inj-int" v-model.number="injection.intensity" class="lq-input" type="range" min="0" max="1" step="0.05" />
          </LqField>
        </div>
        <div class="row">
          <span class="spacer" />
          <LqButton variant="quiet" @click="injectOpen = false">Cancel</LqButton>
          <LqButton type="submit" variant="primary">Inject</LqButton>
        </div>
      </form>
    </Transition>

    <div class="layout">
      <div class="main-col">
        <!-- Run status -->
        <div class="status lq-surface pad">
          <div class="status-head">
            <p class="state" :class="status?.state">
              <span class="pip" aria-hidden="true" />
              {{ stateLabel }}
            </p>
            <p class="t-num t-muted t-sm">
              Round {{ status?.round ?? 0 }} / {{ status?.totalRounds ?? rounds }}
            </p>
          </div>
          <div class="progress" role="progressbar" :aria-valuenow="Math.round(progress * 100)" aria-valuemin="0" aria-valuemax="100" aria-label="Simulation progress">
            <span :style="{ width: `${progress * 100}%` }" />
          </div>
          <ol class="steps" aria-label="Individuation engine steps">
            <li
              v-for="s in INDIVIDUATION_STEPS"
              :key="s.n"
              :class="{ done: (status?.step ?? 0) > s.n, here: status?.step === s.n }"
              :aria-current="status?.step === s.n ? 'step' : undefined"
            >
              <span class="n t-num">{{ s.n }}</span>
              <span class="lbl">{{ s.label }} <span class="t-cjk t-faint">{{ s.zh }}</span></span>
            </li>
          </ol>
          <div v-if="status" class="params">
            <LqMeter label="Grip 抓取度" :value="status.parameters.grip" tone="var(--c-clay)" compact />
            <LqMeter label="Resistance 抗拒度" :value="status.parameters.resistance" tone="var(--c-slate)" compact />
          </div>
        </div>

        <!-- The field -->
        <div class="field-wrap">
          <CouncilField v-if="agents.length" v-model:selected="selected" :agents="agents" :relations="relations" :speaking="running ? speaking : []" />
          <div class="legend t-caption" aria-hidden="true">
            <span><i class="sw ally" /> alliance</span>
            <span><i class="sw oppose" /> opposition</span>
            <span>size = activation</span>
          </div>
        </div>

        <EventStream :events="status?.events ?? []" :agents="agentById" :focus-agent="selected" />
      </div>

      <aside class="inspector lq-glass pad" aria-label="Agent inspector">
        <Transition name="rise" mode="out-in">
          <div v-if="agent" :key="agent.id" class="stack">
            <div class="agent-head">
              <LiquidOrb :material="ARCHETYPES[agent.archetype].material" :size="56" :intensity="agent.activation" />
              <div>
                <h2>{{ agent.name }}</h2>
                <p class="t-sm t-muted">
                  {{ ARCHETYPES[agent.archetype].role }}
                  <template v-if="agent.sephirah"> · {{ SEPHIRAH_BY_ID[agent.sephirah].name }}</template>
                </p>
              </div>
            </div>
            <p v-if="agent.description" class="t-sm">{{ agent.description }}</p>
            <div class="meters">
              <LqMeter label="Activation" :value="agent.activation" :tone="ARCHETYPES[agent.archetype].material.base" />
              <LqMeter label="Grip" :value="agent.grip" tone="var(--c-clay)" />
              <LqMeter label="Resistance" :value="agent.resistance" tone="var(--c-slate)" />
              <LqMeter label="Valence" :value="agent.valence" signed tone="var(--c-sage)" />
            </div>
            <div class="divider" />
            <h3 class="t-label">Interview</h3>
            <ChatThread
              :turns="interviews[agent.id] ?? []"
              :agent-name="agent.name"
              :placeholder="`Ask ${agent.name} something…`"
              :busy="interviewing"
              :suggestions="['What are you protecting?', 'What do you need right now?']"
              @send="(t) => sim.interview(agent!.id, t)"
            />
          </div>
          <div v-else key="none" class="stack empty">
            <h2 class="t-label">Council members</h2>
            <ul class="members">
              <li v-for="a in agents" :key="a.id">
                <button type="button" class="member" @click="selected = a.id">
                  <LiquidOrb :material="ARCHETYPES[a.archetype].material" :size="28" :intensity="a.activation" />
                  <span>
                    <span class="m-name">{{ a.name }}</span>
                    <span class="t-caption">{{ ARCHETYPES[a.archetype].role }}</span>
                  </span>
                </button>
              </li>
            </ul>
            <p class="t-caption">Select an agent to inspect its parameters and talk with it directly.</p>
          </div>
        </Transition>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.council {
  display: grid;
  gap: var(--sp-6);
}
.run {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  align-items: center;
}
.rounds {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.rounds input {
  width: 72px;
  text-align: center;
}
.inject {
  display: grid;
  gap: var(--sp-4);
}
.inject-grid {
  display: grid;
  grid-template-columns: auto 1fr 220px;
  gap: var(--sp-4);
  align-items: end;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: var(--sp-6);
  align-items: start;
}
.main-col {
  display: grid;
  gap: var(--sp-5);
  min-width: 0;
}
.status {
  display: grid;
  gap: var(--sp-4);
}
.status-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.state {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-weight: var(--fw-medium);
}
.pip {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-3);
}
.state.running .pip {
  background: var(--c-mist);
  box-shadow: 0 0 10px var(--c-mist);
  animation: lq-breathe 1.6s var(--ease-in-out) infinite;
  --breathe-to: 1.4;
}
.state.complete .pip {
  background: var(--c-sage);
}
.progress {
  height: 4px;
  border-radius: var(--r-pill);
  background: var(--surface-sunken);
  overflow: hidden;
}
.progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--c-mist), var(--c-lavender), var(--c-pearl));
  transition: width var(--dur-slow) var(--ease-out);
}
.steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--sp-2);
}
.steps li {
  display: flex;
  gap: var(--sp-2);
  align-items: flex-start;
  font-size: var(--fs-xs);
  color: var(--text-3);
  transition: color var(--dur-base);
}
.n {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--hairline-2);
  font-size: var(--fs-2xs);
}
.lbl {
  line-height: var(--lh-snug);
}
.steps li.done {
  color: var(--text-2);
}
.steps li.done .n {
  background: color-mix(in srgb, var(--c-sage) 25%, transparent);
  box-shadow: none;
}
.steps li.here {
  color: var(--text);
}
.steps li.here .n {
  background: radial-gradient(circle at 35% 30%, #fff, var(--c-lavender));
  color: var(--text-on-accent);
  box-shadow: 0 0 10px var(--c-lavender);
}
.params {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-5);
}
.field-wrap {
  position: relative;
}
.legend {
  display: flex;
  gap: var(--sp-4);
  justify-content: center;
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sw {
  width: 18px;
  height: 0;
  border-top: 1.5px solid var(--harmony);
}
.sw.oppose {
  border-top: 1.5px dashed var(--tension);
}
.inspector {
  position: sticky;
  top: var(--sp-4);
  border-radius: var(--r-xl);
  max-height: calc(100dvh - var(--topbar-h) - var(--sp-6));
  overflow-y: auto;
}
.agent-head {
  display: flex;
  gap: var(--sp-4);
  align-items: center;
}
.agent-head h2 {
  font-size: var(--fs-xl);
}
.meters {
  display: grid;
  gap: var(--sp-3);
}
.members {
  display: grid;
  gap: 2px;
}
.member {
  display: flex;
  gap: var(--sp-3);
  align-items: center;
  width: 100%;
  padding: var(--sp-2);
  border: 0;
  border-radius: var(--r-md);
  background: none;
  text-align: left;
  transition: background-color var(--dur-fast);
}
.member:hover {
  background: var(--accent-soft);
}
.member > span:last-child {
  display: grid;
}
.m-name {
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
}

@media (max-width: 1180px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .inspector {
    position: static;
    max-height: none;
  }
  .inject-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .steps {
    grid-template-columns: 1fr;
  }
  .params {
    grid-template-columns: 1fr;
  }
}
</style>
