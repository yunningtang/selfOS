<script setup lang="ts">
import { computed } from 'vue'
import { ELEMENTS } from '@/data/lexicon'
import { BRANCH_ELEMENT, HIDDEN_STEMS, STEMS, STEM_ELEMENT, TEN_GOD_SHORT, lifeStage, nayin, tenGod } from '@selfos/destiny-core/bazi/tables'
import type { FiveElement } from '@/types'

/**
 * One column of the 大运 / 流年 / 流月 timeline, in the 问真 table idiom: no card box, just a
 * column on a hairline grid — period label, 十神 of the stem, the two characters coloured by
 * 五行, every hidden stem with its 十神, then 星运 and 纳音. The selected column gets a soft
 * background and an accent underline; an optional badge sits at the bottom (运势 rating).
 */
const props = defineProps<{
  top: string
  sexa: number
  dayMaster: number
  sub?: string
  on?: boolean
  now?: boolean
  focus?: boolean
  badge?: string
  badgeClass?: string
  static?: boolean
}>()
const el = (e: FiveElement) => ELEMENTS[e].token
const stem = computed(() => props.sexa % 10)
const branch = computed(() => props.sexa % 12)
const hidden = computed(() => HIDDEN_STEMS[branch.value].map((h) => ({ ch: STEMS[h], god: TEN_GOD_SHORT[tenGod(props.dayMaster, h)], tone: el(STEM_ELEMENT[h]) })))
const stage = computed(() => lifeStage(props.dayMaster, branch.value))
const ny = computed(() => nayin(props.sexa))
</script>

<template>
  <component :is="static ? 'div' : 'button'" :type="static ? undefined : 'button'" class="tc" :class="{ on, now, focus, static }">
    <span class="t-top t-num">{{ top }}<span v-if="now" class="dot" aria-hidden="true" /></span>
    <span class="t-god">{{ TEN_GOD_SHORT[tenGod(dayMaster, stem)] }}</span>
    <span class="t-gz" :style="{ color: el(STEM_ELEMENT[stem]) }">{{ STEMS[stem] }}</span>
    <span class="t-gz" :style="{ color: el(BRANCH_ELEMENT[branch]) }">{{ ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][branch] }}</span>
    <span class="t-hidden">
      <span v-for="h in hidden" :key="h.ch"><b :style="{ color: h.tone }">{{ h.ch }}</b>{{ h.god }}</span>
    </span>
    <span class="t-meta">{{ stage }}<span v-if="sub"> · <span class="t-num">{{ sub }}</span></span></span>
    <span class="t-ny">{{ ny }}</span>
    <span v-if="badge" class="t-badge" :class="badgeClass">{{ badge }}</span>
  </component>
</template>

<style scoped>
.tc {
  --tone: var(--text-3);
  position: relative;
  display: grid;
  flex: 0 0 auto;
  align-content: start;
  justify-items: center;
  gap: 2px;
  min-width: 92px;
  padding: 10px 6px 12px;
  border: 0;
  border-right: 1px solid var(--hairline);
  border-radius: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  transition: background-color var(--dur-fast);
}
.tc:last-child {
  border-right: 0;
}
button.tc {
  cursor: pointer;
}
button.tc:hover {
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}
.tc.on {
  background: color-mix(in srgb, var(--accent) 9%, transparent);
}
.tc.on::after,
.tc.focus::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--accent);
}
.tc.focus::after {
  height: 3px;
}
.t-top {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--fs-2xs);
  color: var(--text-2);
  white-space: nowrap;
}
.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--c-sage);
}
.t-god {
  font-size: var(--fs-2xs);
  color: var(--text-3);
}
.t-gz {
  font-family: var(--font-cjk);
  font-size: 26px;
  line-height: 1.1;
  font-weight: 500;
  letter-spacing: 0;
}
.t-hidden {
  display: grid;
  gap: 1px;
  margin-top: 4px;
  font-size: var(--fs-2xs);
  color: var(--text-2);
  line-height: 1.35;
  text-align: center;
}
.t-hidden b {
  font-weight: 500;
  margin-right: 1px;
}
.t-meta {
  margin-top: 3px;
  font-size: var(--fs-2xs);
  color: var(--text-2);
  white-space: nowrap;
}
.t-ny {
  font-size: 10px;
  color: var(--text-3);
  white-space: nowrap;
}
.t-badge {
  margin-top: 4px;
  padding: 1px 8px;
  border-radius: var(--r-pill);
  font-size: var(--fs-2xs);
  color: var(--text-on-accent);
  background: var(--tone);
}
.r3 { --tone: var(--wx-wood); }
.r2 { --tone: color-mix(in srgb, var(--wx-wood) 70%, var(--text-2)); }
.r1 { --tone: var(--text-3); }
.r-1 { --tone: var(--wx-earth); }
.r-2 { --tone: color-mix(in srgb, var(--wx-fire) 70%, var(--wx-earth)); }
.r-3 { --tone: var(--wx-fire); }
</style>
