<script setup lang="ts" generic="T extends string | number">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LqIcon from './LqIcon.vue'

/**
 * Popover select in the house style: an input-like trigger, a floating list on the surface
 * material, optional type-to-filter for long lists (time zones), keyboard navigation.
 */
const props = withDefaults(
  defineProps<{
    options: { value: T; label: string; hint?: string }[]
    label: string
    placeholder?: string
    searchable?: boolean
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)
const model = defineModel<T>({ required: true })
const open = ref(false)
const query = ref('')
const active = ref(0)
const root = ref<HTMLElement | null>(null)
const listEl = ref<HTMLElement | null>(null)
const searchEl = ref<HTMLInputElement | null>(null)

const current = computed(() => props.options.find((o) => o.value === model.value))
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.label.toLowerCase().includes(q) || (o.hint ?? '').toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q))
})

async function toggle(force?: boolean) {
  open.value = force ?? !open.value
  if (open.value) {
    query.value = ''
    active.value = Math.max(0, filtered.value.findIndex((o) => o.value === model.value))
    await nextTick()
    searchEl.value?.focus()
    scrollActive()
  }
}
function choose(o: { value: T }) {
  model.value = o.value
  open.value = false
}
function scrollActive() {
  const el = listEl.value?.children[active.value] as HTMLElement | undefined
  el?.scrollIntoView({ block: 'nearest' })
}
function onKey(e: KeyboardEvent) {
  if (!open.value) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      void toggle(true)
    }
    return
  }
  if (e.key === 'ArrowDown') { e.preventDefault(); active.value = (active.value + 1) % filtered.value.length; scrollActive() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active.value = (active.value - 1 + filtered.value.length) % filtered.value.length; scrollActive() }
  else if (e.key === 'Enter') { e.preventDefault(); const o = filtered.value[active.value]; if (o) choose(o) }
  else if (e.key === 'Escape') { e.preventDefault(); open.value = false }
}
function onDoc(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
watch(query, () => (active.value = 0))
onMounted(() => document.addEventListener('mousedown', onDoc))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDoc))
</script>

<template>
  <div ref="root" class="sel" :class="[`s-${size}`, { open }]" @keydown="onKey">
    <button type="button" class="trigger lq-input" :aria-label="label" aria-haspopup="listbox" :aria-expanded="open" @click="toggle()">
      <span class="val" :class="{ ph: !current }">{{ current?.label ?? placeholder ?? '—' }}</span>
      <span v-if="current?.hint" class="hint t-faint">{{ current.hint }}</span>
      <LqIcon class="chev" name="chevron" :size="16" />
    </button>
    <Transition name="pop">
      <div v-if="open" class="pop lq-surface" role="listbox" :aria-label="label">
        <input v-if="searchable" ref="searchEl" v-model="query" class="search" type="text" :placeholder="'输入筛选…'" aria-label="筛选" />
        <ul ref="listEl" class="list">
          <li v-for="(o, i) in filtered" :key="String(o.value)" role="option" :aria-selected="o.value === model" :class="{ act: i === active, cur: o.value === model }" @mouseenter="active = i" @click="choose(o)">
            <span class="o-label">{{ o.label }}</span>
            <span v-if="o.hint" class="o-hint t-faint">{{ o.hint }}</span>
            <LqIcon v-if="o.value === model" class="tick" name="check" :size="14" />
          </li>
          <li v-if="!filtered.length" class="empty t-caption">无匹配项</li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.sel {
  position: relative;
  min-width: 0;
}
.trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  cursor: pointer;
  text-align: left;
}
.s-sm .trigger {
  height: 34px;
  font-size: var(--fs-xs);
}
.val {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.val.ph {
  color: var(--text-3);
}
.hint {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  font-size: var(--fs-2xs);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.chev {
  flex: none;
  color: var(--text-3);
  transform: rotate(90deg);
  transition: transform var(--dur-fast);
}
.open .chev {
  transform: rotate(-90deg);
}
.open .trigger {
  box-shadow: inset 0 0 0 1.5px var(--accent);
}
.pop {
  position: absolute;
  z-index: var(--z-float);
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  max-width: min(420px, 90vw);
  padding: var(--sp-1);
  box-shadow: var(--shadow-float);
}
.search {
  width: 100%;
  height: 34px;
  margin-bottom: 4px;
  padding: 0 var(--sp-3);
  border: 0;
  border-radius: var(--r-sm);
  background: var(--surface-sunken);
  color: var(--text);
  font-size: var(--fs-sm);
}
.search:focus {
  outline: none;
  box-shadow: inset 0 0 0 1px var(--accent);
}
.list {
  max-height: 280px;
  overflow-y: auto;
}
.list li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
  cursor: pointer;
}
.list li.act {
  background: var(--accent-soft);
}
.list li.cur .o-label {
  color: var(--accent-ink);
  font-weight: 500;
}
.o-label {
  flex: 1;
  min-width: 0;
}
.o-hint {
  font-size: var(--fs-2xs);
  white-space: nowrap;
}
.tick {
  color: var(--accent-ink);
  align-self: center;
}
.empty {
  padding: 8px 10px;
  cursor: default;
}
.pop-enter-active,
.pop-leave-active {
  transition: opacity var(--dur-fast), transform var(--dur-fast) var(--ease-out);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
