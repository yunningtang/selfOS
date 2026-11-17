<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/i18n'
import { ELEMENTS } from '@/data/lexicon'
import { BRANCHES, BRANCH_ELEMENT, HIDDEN_STEMS, STEMS, STEM_ELEMENT, TEN_GOD_SHORT, lifeStage, nayin, tenGod } from '@selfos/destiny-core/bazi/tables'
import type { FiveElement } from '@/types'

/**
 * The 大运 / 流年 / 流月 rail in the same row-labelled table idiom as the natal 四柱: a label column,
 * one equal column per period, alternating row bands. Columns are buttons (the whole column
 * selects); the selected column is tinted, the current one carries a dot. Optional per-column
 * rating badge and domain markers (事业/财运/感情/健康/学业) for the 运势 view.
 */
export interface TimelineItem {
  key: string | number
  /** First row: age, year or 节气 */
  top: string
  /** Second row: start year, 虚岁 or date */
  sub?: string
  sexa: number
  on?: boolean
  now?: boolean
  focus?: boolean
  badge?: string
  badgeClass?: string
  marks?: { short: string; good: boolean; keyword: string }[]
}
const props = defineProps<{ items: TimelineItem[]; dayMaster: number; nested?: boolean; compact?: boolean; topLabel?: string; subLabel?: string }>()
const emit = defineEmits<{ select: [key: string | number] }>()
const { t } = useI18n()
const el = (e: FiveElement) => ELEMENTS[e].token
const cols = computed(() =>
  props.items.map((it) => {
    const stem = it.sexa % 10, branch = it.sexa % 12
    return {
      it, stem, branch,
      stemChar: STEMS[stem], branchChar: BRANCHES[branch],
      stemTone: el(STEM_ELEMENT[stem]), branchTone: el(BRANCH_ELEMENT[branch]),
      god: TEN_GOD_SHORT[tenGod(props.dayMaster, stem)],
      hidden: HIDDEN_STEMS[branch].map((h) => ({ ch: STEMS[h], god: TEN_GOD_SHORT[tenGod(props.dayMaster, h)], tone: el(STEM_ELEMENT[h]) })),
      stage: lifeStage(props.dayMaster, branch),
      ny: nayin(it.sexa),
    }
  }),
)
const hasSub = computed(() => props.items.some((i) => i.sub))
const hasBadge = computed(() => props.items.some((i) => i.badge))
const hasMarks = computed(() => props.items.some((i) => i.marks?.length))
const cellClass = (c: (typeof cols.value)[number]) => ({ on: c.it.on, focus: c.it.focus })
</script>

<template>
  <div class="tt" :class="{ nested, compact, scroll: items.length > 10 }" :style="{ '--n': items.length }" role="table">
    <div class="tr head" role="row">
      <span class="rl">{{ topLabel ?? '' }}</span>
      <button v-for="c in cols" :key="c.it.key" type="button" class="td top" :class="cellClass(c)" @click="emit('select', c.it.key)">
        <span class="t-num">{{ c.it.top }}</span><span v-if="c.it.now" class="dot" aria-hidden="true" />
      </button>
    </div>
    <div v-if="hasSub" class="tr" role="row">
      <span class="rl">{{ subLabel ?? '' }}</span>
      <button v-for="c in cols" :key="c.it.key" type="button" class="td sub t-num" :class="cellClass(c)" @click="emit('select', c.it.key)">{{ c.it.sub }}</button>
    </div>
    <div class="tr" role="row">
      <span class="rl">{{ t('主星') }}</span>
      <button v-for="c in cols" :key="c.it.key" type="button" class="td god" :class="cellClass(c)" :style="{ color: c.stemTone }" @click="emit('select', c.it.key)">{{ c.god }}</button>
    </div>
    <div class="tr" role="row">
      <span class="rl">{{ t('天干') }}</span>
      <button v-for="c in cols" :key="c.it.key" type="button" class="td gz" :class="cellClass(c)" :style="{ '--tone': c.stemTone }" @click="emit('select', c.it.key)">{{ c.stemChar }}</button>
    </div>
    <div class="tr" role="row">
      <span class="rl">{{ t('地支') }}</span>
      <button v-for="c in cols" :key="c.it.key" type="button" class="td gz" :class="cellClass(c)" :style="{ '--tone': c.branchTone }" @click="emit('select', c.it.key)">{{ c.branchChar }}</button>
    </div>
    <div class="tr" role="row">
      <span class="rl">{{ t('藏干') }}</span>
      <button v-for="c in cols" :key="c.it.key" type="button" class="td hidden" :class="cellClass(c)" @click="emit('select', c.it.key)">
        <span v-for="h in c.hidden" :key="h.ch"><b :style="{ color: h.tone }">{{ h.ch }}</b>{{ h.god }}</span>
      </button>
    </div>
    <div class="tr" role="row">
      <span class="rl">{{ t('星运') }}</span>
      <button v-for="c in cols" :key="c.it.key" type="button" class="td txt" :class="cellClass(c)" @click="emit('select', c.it.key)">{{ c.stage }}</button>
    </div>
    <div class="tr ny" role="row">
      <span class="rl">{{ t('纳音') }}</span>
      <button v-for="c in cols" :key="c.it.key" type="button" class="td txt small" :class="cellClass(c)" @click="emit('select', c.it.key)">{{ c.ny }}</button>
    </div>
    <div v-if="hasBadge" class="tr" role="row">
      <span class="rl">{{ t('评级') }}</span>
      <button v-for="c in cols" :key="c.it.key" type="button" class="td badge-cell" :class="cellClass(c)" @click="emit('select', c.it.key)">
        <span v-if="c.it.badge" class="badge" :class="c.it.badgeClass">{{ c.it.badge }}</span>
      </button>
    </div>
    <div v-if="hasMarks" class="tr" role="row">
      <span class="rl">{{ t('重点') }}</span>
      <button v-for="c in cols" :key="c.it.key" type="button" class="td marks" :class="cellClass(c)" @click="emit('select', c.it.key)">
        <span v-for="m in c.it.marks ?? []" :key="m.short" class="mk" :class="m.good ? 'good' : 'bad'" :title="m.keyword">{{ m.short }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tt {
  --label: 3.2em;
  display: grid;
  font-family: var(--font-cjk);
  letter-spacing: 0;
  border-radius: var(--r-lg);
  overflow: hidden;
}
.tt.scroll {
  overflow-x: auto;
}
.tt.nested {
  margin-left: var(--sp-3);
  border-left: 2px solid var(--hairline-2);
  border-radius: 0 var(--r-lg) var(--r-lg) 0;
}
.tr {
  display: grid;
  grid-template-columns: var(--label) repeat(var(--n), minmax(0, 1fr));
  align-items: stretch;
}
.tt.scroll .tr {
  grid-template-columns: var(--label) repeat(var(--n), minmax(44px, 1fr));
  min-width: max-content;
  width: 100%;
}
.tr:nth-child(even) {
  background: color-mix(in srgb, var(--text-3) 5%, transparent);
}
.rl {
  align-self: center;
  padding-left: 8px;
  font-size: var(--fs-xs);
  color: var(--text-3);
  white-space: nowrap;
}
.td {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 2px;
  min-width: 0;
  padding: 5px 2px;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  line-height: 1.45;
  text-align: center;
  cursor: pointer;
  transition: background-color var(--dur-fast);
}
.td:hover {
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}
.td.on {
  background: color-mix(in srgb, var(--accent) 9%, transparent);
}
.tr.head .td.on {
  box-shadow: inset 0 2px 0 var(--accent);
}
.tr.head .td.focus {
  box-shadow: inset 0 3px 0 var(--accent);
}
.td.top {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: var(--fs-xs);
  color: var(--text-2);
  white-space: nowrap;
}
.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--c-sage);
}
.td.sub {
  font-size: var(--fs-2xs);
  color: var(--text-3);
  white-space: nowrap;
}
.td.god {
  font-size: var(--fs-xs);
}
.td.gz {
  padding: 2px 0;
  font-size: clamp(22px, 2.4vw, 30px);
  line-height: 1.15;
  font-weight: 500;
  color: var(--tone);
}
.td.hidden {
  gap: 1px;
  font-size: var(--fs-2xs);
  line-height: 1.45;
  color: var(--text-2);
  white-space: nowrap;
}
.td.hidden b {
  font-weight: 500;
}
.td.txt {
  font-size: var(--fs-xs);
  color: var(--text-2);
}
.td.small {
  font-size: var(--fs-2xs);
  color: var(--text-3);
  white-space: nowrap;
}
.badge {
  --tone: var(--text-3);
  padding: 1px 8px;
  border-radius: var(--r-pill);
  font-size: var(--fs-2xs);
  color: var(--text-on-accent);
  background: var(--tone);
  white-space: nowrap;
}
.r3 { --tone: var(--wx-wood); }
.r2 { --tone: color-mix(in srgb, var(--wx-wood) 70%, var(--text-2)); }
.r1 { --tone: var(--text-3); }
.r-1 { --tone: var(--wx-earth); }
.r-2 { --tone: color-mix(in srgb, var(--wx-fire) 70%, var(--wx-earth)); }
.r-3 { --tone: var(--wx-fire); }
.td.marks {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 3px;
  min-height: 24px;
}
.mk {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 10px;
  line-height: 1;
  color: var(--text-on-accent);
}
.mk.good {
  background: var(--wx-wood);
}
.mk.bad {
  background: var(--wx-fire);
}
@media (max-width: 640px) {
  .tt {
    --label: 2.8em;
  }
  .tt.nested {
    margin-left: var(--sp-2);
  }
  .rl {
    padding-left: 6px;
    font-size: var(--fs-2xs);
  }
  .td {
    padding: 4px 1px;
  }
  .td.gz {
    font-size: clamp(18px, 5.6vw, 24px);
  }
  .td.top,
  .td.god,
  .td.txt {
    font-size: 11px;
  }
  .td.hidden,
  .td.sub {
    font-size: 10px;
  }
  .td.marks {
    gap: 2px;
    min-height: 20px;
  }
  .mk {
    width: 15px;
    height: 15px;
    font-size: 9px;
  }
  .tr.ny {
    display: none;
  }
  .tt.scroll .tr {
    grid-template-columns: var(--label) repeat(var(--n), minmax(38px, 1fr));
  }
}
</style>
