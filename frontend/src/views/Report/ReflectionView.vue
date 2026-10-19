<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/ui/PageHeader.vue'
import LqButton from '@/components/ui/LqButton.vue'
import LqField from '@/components/ui/LqField.vue'
import Notice from '@/components/ui/Notice.vue'
import ChatThread from '@/components/Council/ChatThread.vue'
import { EVENT_TYPES, MEMORY_KINDS } from '@/data/lexicon'
import { fmt2, fmtDate } from '@/composables/format'
import { useReportStore } from '@/stores/report'
import { useGraphStore } from '@/stores/graph'
import { useSimulationStore } from '@/stores/simulation'

const reports = useReportStore()
const graph = useGraphStore()
const sim = useSimulationStore()
const { reports: list, activeId, generating, error, chats, chatting } = storeToRefs(reports)
const { memoryById } = storeToRefs(graph)

const focus = ref('')
const lookupId = ref('')
const openEvidence = ref<Set<string>>(new Set())

onMounted(() => {
  graph.loadMemories()
  if (!sim.status) sim.refresh()
})

const report = computed(() => list.value.find((r) => r.id === activeId.value) ?? null)
const eventById = computed(() => new Map((sim.status?.events ?? []).map((e) => [e.id, e])))

function toggle(id: string) {
  const s = new Set(openEvidence.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  openEvidence.value = s
}
function generate() {
  reports.generate(sim.status?.id ?? null, focus.value || undefined)
}
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
function delta(a: number, b: number) {
  const d = b - a
  return `${d > 0 ? '+' : d < 0 ? '−' : ''}${fmt2(Math.abs(d))}`
}
</script>

<template>
  <section class="reflection" aria-labelledby="ref-title">
    <PageHeader
      title="Reflection"
      zh="自性化报告"
      world="Assiya · 物质界"
      lede="Reports written from the council’s deliberation. Every claim can be traced to the memories, assumptions and events behind it."
    />

    <div class="layout">
      <aside class="side">
        <form class="lq-surface pad gen" @submit.prevent="generate">
          <LqField label="Focus (optional)" for="focus" hint="A question or theme to orient the report.">
            <input id="focus" v-model="focus" class="lq-input" placeholder="e.g. Why rest feels unsafe" />
          </LqField>
          <LqButton type="submit" variant="primary" icon="reflection" :loading="generating">Generate report</LqButton>
          <p v-if="!sim.status?.id" class="t-caption">No council run yet — the report will draw on the graph alone.</p>
        </form>

        <nav class="history" aria-label="Reports">
          <h2 class="t-label">This session</h2>
          <ul v-if="list.length">
            <li v-for="r in list" :key="r.id">
              <button type="button" class="hist" :aria-current="r.id === activeId || undefined" @click="activeId = r.id">
                <span class="hist-title">{{ r.title }}</span>
                <span class="t-num t-faint t-sm">{{ fmtDate(r.createdAt) }}</span>
              </button>
            </li>
          </ul>
          <p v-else class="t-sm t-muted">No reports yet.</p>
          <form class="lookup" @submit.prevent="lookupId && reports.open(lookupId)">
            <label class="visually-hidden" for="rid">Report ID</label>
            <input id="rid" v-model="lookupId" class="lq-input" placeholder="Open by report ID" />
            <LqButton type="submit" variant="ghost" size="sm" icon="chevron" icon-only :disabled="!lookupId">Open</LqButton>
          </form>
        </nav>
      </aside>

      <div class="main">
        <Notice v-if="error" tone="error">{{ error }}</Notice>

        <Transition name="fade" mode="out-in">
          <article v-if="report" :key="report.id" class="paper lq-surface" aria-labelledby="report-title">
            <header class="paper-head">
              <p class="t-label t-num">{{ fmtDate(report.createdAt) }} · {{ report.id }}</p>
              <h2 id="report-title">{{ report.title }}</h2>
              <p class="summary">{{ report.summary }}</p>
              <dl class="params">
                <div>
                  <dt class="t-label">Grip 抓取度</dt>
                  <dd class="t-num">
                    {{ fmt2(report.parameters.before.grip) }} → {{ fmt2(report.parameters.after.grip) }}
                    <span class="d">{{ delta(report.parameters.before.grip, report.parameters.after.grip) }}</span>
                  </dd>
                </div>
                <div>
                  <dt class="t-label">Resistance 抗拒度</dt>
                  <dd class="t-num">
                    {{ fmt2(report.parameters.before.resistance) }} → {{ fmt2(report.parameters.after.resistance) }}
                    <span class="d">{{ delta(report.parameters.before.resistance, report.parameters.after.resistance) }}</span>
                  </dd>
                </div>
              </dl>
            </header>

            <section v-for="s in report.sections" :key="s.id" class="section" :aria-labelledby="`h-${s.id}`">
              <h3 :id="`h-${s.id}`">{{ s.heading }}</h3>
              <p v-for="(para, i) in s.paragraphs" :key="i">{{ para }}</p>

              <div v-if="s.evidence.memoryIds.length || s.evidence.assumptions.length || s.evidence.simulationEventIds.length" class="evidence">
                <button
                  type="button"
                  class="ev-toggle"
                  :aria-expanded="openEvidence.has(s.id)"
                  :aria-controls="`ev-${s.id}`"
                  @click="toggle(s.id)"
                >
                  <span class="chev" aria-hidden="true">›</span>
                  Supporting evidence
                  <span class="t-faint t-num">
                    {{ plural(s.evidence.memoryIds.length, 'memory', 'memories') }} · {{ plural(s.evidence.assumptions.length, 'assumption') }} · {{ plural(s.evidence.simulationEventIds.length, 'event') }}
                  </span>
                </button>
                <Transition name="rise">
                  <div v-if="openEvidence.has(s.id)" :id="`ev-${s.id}`" class="ev-body">
                    <div v-if="s.evidence.memoryIds.length">
                      <h4 class="t-label">Memories</h4>
                      <ul>
                        <li v-for="id in s.evidence.memoryIds" :key="id">
                          <RouterLink :to="{ path: '/memory', query: { id } }" class="ev-mem">
                            <span v-if="memoryById.get(id)" class="dot" :style="{ background: MEMORY_KINDS[memoryById.get(id)!.kind].tone }" />
                            {{ memoryById.get(id)?.title ?? id }}
                            <span v-if="memoryById.get(id)" class="t-num t-faint">{{ memoryById.get(id)!.date.slice(0, 4) }}</span>
                          </RouterLink>
                        </li>
                      </ul>
                    </div>
                    <div v-if="s.evidence.assumptions.length">
                      <h4 class="t-label">Model assumptions</h4>
                      <ul class="assumptions">
                        <li v-for="a in s.evidence.assumptions" :key="a">{{ a }}</li>
                      </ul>
                    </div>
                    <div v-if="s.evidence.simulationEventIds.length">
                      <h4 class="t-label">Simulation outputs</h4>
                      <ul class="events">
                        <li v-for="id in s.evidence.simulationEventIds" :key="id">
                          <template v-if="eventById.get(id)">
                            <span class="t-num t-faint">R{{ eventById.get(id)!.round }}</span>
                            <span class="t-muted">{{ EVENT_TYPES[eventById.get(id)!.type].label }}</span>
                            — {{ eventById.get(id)!.text }}
                          </template>
                          <span v-else class="t-muted">Event <span class="t-num">{{ id }}</span> (not in the current run)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </Transition>
              </div>
            </section>
          </article>

          <div v-else key="empty" class="paper lq-surface empty">
            <div class="calm ambient-anim" aria-hidden="true" />
            <p class="t-muted">Generate a report, or open one by ID.</p>
          </div>
        </Transition>

        <section v-if="report" class="ask lq-surface pad" aria-labelledby="ask-title">
          <h2 id="ask-title" class="t-label">Ask the ReportAgent</h2>
          <ChatThread
            :turns="chats[report.id] ?? []"
            agent-name="ReportAgent"
            placeholder="Question the report…"
            :busy="chatting"
            :suggestions="['Why is the Limiter so strong?', 'Where did the shadow show up?', 'What should I watch for next?']"
            @send="(t) => reports.ask(report!.id, t)"
          />
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reflection {
  display: grid;
  gap: var(--sp-6);
}
.layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: var(--sp-7);
  align-items: start;
}
.side {
  display: grid;
  gap: var(--sp-5);
  position: sticky;
  top: var(--sp-4);
}
.gen {
  display: grid;
  gap: var(--sp-4);
}
.history {
  display: grid;
  gap: var(--sp-2);
}
.hist {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: var(--sp-2) var(--sp-3);
  border: 0;
  border-radius: var(--r-sm);
  background: none;
  text-align: left;
}
.hist:hover,
.hist[aria-current] {
  background: var(--accent-soft);
}
.hist-title {
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
}
.lookup {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}
.main {
  display: grid;
  gap: var(--sp-5);
  min-width: 0;
}
/* The page: opaque, quiet, measured for reading. */
.paper {
  padding: var(--sp-9) var(--sp-8);
  display: grid;
  gap: var(--sp-7);
}
.paper > * {
  width: 100%;
  max-width: var(--read-max);
  margin: 0 auto;
}
.paper-head {
  display: grid;
  gap: var(--sp-4);
  padding-bottom: var(--sp-6);
  border-bottom: 1px solid var(--hairline);
}
.paper-head h2 {
  font-size: var(--fs-2xl);
}
.summary {
  font-size: var(--fs-md);
  line-height: var(--lh-read);
  color: var(--text);
}
.params {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-7);
}
.params dd {
  margin-top: 2px;
  font-size: var(--fs-md);
}
.d {
  margin-left: var(--sp-2);
  font-size: var(--fs-sm);
  color: var(--sage-ink);
}
.section {
  display: grid;
  gap: var(--sp-4);
}
.section h3 {
  font-size: var(--fs-lg);
}
.section p {
  font-size: var(--fs-md);
  line-height: var(--lh-read);
}
.evidence {
  border-top: 1px solid var(--hairline);
  padding-top: var(--sp-2);
}
.ev-toggle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  padding: var(--sp-2) 0;
  border: 0;
  background: none;
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--text-2);
  text-align: left;
}
.ev-toggle:hover {
  color: var(--text);
}
.chev {
  display: inline-block;
  transition: transform var(--dur-base) var(--ease-spring);
}
.ev-toggle[aria-expanded='true'] .chev {
  transform: rotate(90deg);
}
.ev-body {
  display: grid;
  gap: var(--sp-4);
  padding: var(--sp-4);
  border-radius: var(--r-md);
  background: var(--surface-sunken);
  box-shadow: inset 0 0 0 1px var(--hairline);
  font-size: var(--fs-sm);
}
.ev-body h4 {
  margin-bottom: var(--sp-2);
}
.ev-body ul {
  display: grid;
  gap: 6px;
}
.ev-mem {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  color: var(--text);
  text-decoration: none;
}
.ev-mem:hover {
  color: var(--accent-ink);
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.assumptions li,
.events li {
  line-height: var(--lh-body);
}
.assumptions li::before {
  content: '— ';
  color: var(--text-3);
}
.empty {
  position: relative;
  min-height: 360px;
  place-items: center;
  overflow: hidden;
}
.calm {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, rgba(255, 255, 255, 0.25), color-mix(in srgb, var(--c-lavender) 30%, transparent) 50%, transparent 70%);
  animation:
    lq-morph 20s var(--ease-in-out) infinite,
    lq-breathe 9s var(--ease-in-out) infinite;
}
.empty p {
  position: relative;
}
@media (max-width: 1000px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .side {
    position: static;
  }
}
@media (max-width: 640px) {
  .paper {
    padding: var(--sp-6) var(--sp-4);
  }
  .paper-head h2 {
    font-size: var(--fs-xl);
  }
  .section p,
  .summary {
    font-size: var(--fs-base);
  }
}
</style>
