<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/i18n'
import { plainReading } from '@selfos/destiny-core/bazi/plain'
import type { BaziAnalysis } from '@selfos/destiny-core/bazi/analysis'
import type { Verdict } from '@selfos/destiny-core/bazi/verdicts'
import type { BaziChart } from '@/types'
const { t, isEn } = useI18n()

/** 通俗解读: the analysis retold for a reader with no 八字 background. */
const props = defineProps<{ chart: BaziChart; analysis: BaziAnalysis; verdicts: Verdict[] }>()
const reading = computed(() => plainReading(props.chart, props.analysis, props.verdicts))
const showGlossary = ref(false)
const ICON: Record<string, string> = { self: '◎', energy: '◐', character: '✦', career: '▲', love: '♡', health: '✚', helpers: '☼', now: '◷' }
</script>

<template>
  <div class="plain">
    <p v-if="isEn" class="t-caption">{{ t('通俗解读目前仅提供中文。') }}</p>
    <blockquote class="headline">
      <p>{{ reading.headline }}</p>
      <p class="t-caption">{{ t('下面把传统命理的判断翻译成白话。它描述的是倾向和适合的环境，不是定数。') }}</p>
    </blockquote>

    <section v-for="s in reading.sections" :key="s.key" class="sec" :class="s.key">
      <h3><span class="ic" aria-hidden="true">{{ ICON[s.key] }}</span>{{ s.title }}</h3>
      <p v-for="(p, i) in s.paras" :key="i">{{ p }}</p>
      <ul v-if="s.bullets?.length">
        <li v-for="(b, i) in s.bullets" :key="i">{{ b }}</li>
      </ul>
      <p v-if="s.after" class="after t-muted">{{ s.after }}</p>
    </section>

    <div class="gl">
      <button type="button" class="chip" :class="{ on: showGlossary }" @click="showGlossary = !showGlossary">{{ showGlossary ? t('收起名词解释') : t('这些词是什么意思？') }}</button>
      <dl v-if="showGlossary">
        <div v-for="g in reading.glossary" :key="g.term"><dt>{{ g.term }}</dt><dd>{{ g.gloss }}</dd></div>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.plain {
  display: grid;
  gap: var(--sp-5);
  max-width: 76ch;
}
.headline {
  margin: 0;
  padding: var(--sp-4) var(--sp-5);
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--r-md) var(--r-md) 0;
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}
.headline p:first-child {
  font-size: var(--fs-md);
  font-weight: 500;
  line-height: 1.7;
}
.headline p + p {
  margin-top: 6px;
}
.sec {
  display: grid;
  gap: var(--sp-2);
  padding-top: var(--sp-3);
  border-top: 1px solid var(--hairline);
}
.sec h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-md);
  font-weight: 500;
}
.ic {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: var(--fs-xs);
  color: var(--accent-ink);
  background: var(--accent-soft);
}
.sec p {
  line-height: 1.85;
}
.sec ul {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-left: 1.2em;
  list-style: disc;
  line-height: 1.8;
}
.sec li::marker {
  color: var(--accent);
}
.after {
  font-size: var(--fs-sm);
  line-height: 1.8;
}
.gl {
  display: grid;
  gap: var(--sp-3);
  justify-items: start;
}
.gl dl {
  display: grid;
  gap: 6px;
  width: 100%;
  margin: 0;
  padding: var(--sp-4);
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.gl div {
  display: grid;
  grid-template-columns: 7.5em 1fr;
  gap: var(--sp-3);
  font-size: var(--fs-sm);
  line-height: 1.7;
}
.gl dt {
  font-weight: 500;
}
.gl dd {
  margin: 0;
  color: var(--text-2);
}
.chip {
  padding: 5px 12px;
  border-radius: var(--r-pill);
  font-size: var(--fs-xs);
  color: var(--text-2);
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--hairline);
  cursor: pointer;
}
.chip.on {
  color: var(--accent-ink);
  background: var(--accent-soft);
  box-shadow: none;
}
@media (max-width: 640px) {
  .gl div {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
