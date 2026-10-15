<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import LqButton from '@/components/ui/LqButton.vue'

/** Minimal conversation surface shared by agent interviews and the ReportAgent. */
const props = defineProps<{
  turns: { role: 'user' | 'agent'; text: string }[]
  agentName: string
  placeholder: string
  busy?: boolean
  suggestions?: string[]
}>()
const emit = defineEmits<{ send: [text: string] }>()
const draft = ref('')
const log = ref<HTMLElement | null>(null)

function send(text = draft.value) {
  const t = text.trim()
  if (!t || props.busy) return
  emit('send', t)
  draft.value = ''
}
watch(
  () => props.turns.length,
  async () => {
    await nextTick()
    log.value?.scrollTo({ top: log.value.scrollHeight, behavior: 'smooth' })
  },
)
</script>

<template>
  <div class="chat">
    <ol ref="log" class="log" aria-live="polite">
      <li v-for="(t, i) in turns" :key="i" class="turn" :class="t.role">
        <span class="who t-label">{{ t.role === 'user' ? 'You' : agentName }}</span>
        <p>{{ t.text }}</p>
      </li>
      <li v-if="busy" class="turn agent pending" aria-label="Waiting for a reply">
        <span class="who t-label">{{ agentName }}</span>
        <p class="dots" aria-hidden="true"><span /><span /><span /></p>
      </li>
    </ol>
    <div v-if="suggestions?.length && !turns.length" class="row-wrap sugg">
      <button v-for="s in suggestions" :key="s" type="button" class="sugg-btn" @click="send(s)">{{ s }}</button>
    </div>
    <form class="compose" @submit.prevent="send()">
      <label class="visually-hidden" :for="`chat-${agentName}`">Message {{ agentName }}</label>
      <input :id="`chat-${agentName}`" v-model="draft" class="lq-input" :placeholder="placeholder" autocomplete="off" />
      <LqButton type="submit" variant="primary" icon="send" icon-only :disabled="!draft.trim()" :loading="busy">Send</LqButton>
    </form>
  </div>
</template>

<style scoped>
.chat {
  display: grid;
  gap: var(--sp-3);
}
.log {
  display: grid;
  gap: var(--sp-3);
  max-height: 320px;
  overflow-y: auto;
}
.log:empty {
  display: none;
}
.turn {
  display: grid;
  gap: 2px;
  max-width: 92%;
}
.turn p {
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  font-size: var(--fs-sm);
  line-height: var(--lh-body);
}
.turn.agent p {
  background: var(--surface-sunken);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.turn.user {
  justify-self: end;
  text-align: right;
}
.turn.user p {
  background: var(--accent-soft);
}
.dots {
  display: flex;
  gap: 4px;
  width: fit-content;
}
.dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-2);
  animation: lq-breathe 1.2s var(--ease-in-out) infinite;
  --breathe-to: 1.5;
}
.dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.dots span:nth-child(3) {
  animation-delay: 0.4s;
}
.compose {
  display: flex;
  gap: var(--sp-2);
}
.sugg-btn {
  border: 0;
  padding: 6px 12px;
  border-radius: var(--r-pill);
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--hairline-2);
  font-size: var(--fs-xs);
  color: var(--text-2);
  text-align: left;
  transition: color var(--dur-fast), background-color var(--dur-fast);
}
.sugg-btn:hover {
  color: var(--text);
  background: var(--accent-soft);
}
</style>
