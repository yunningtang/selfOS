/**
 * 干支关系: 天干五合/相冲, 地支六合/三合/半合/三会/六冲/相刑/自刑/六害/六破.
 * Works on any labelled set of pillars, so the same code also reports how a 大运 / 流年
 * interacts with the natal chart.
 */
import type { FiveElement } from '../types'
import {
  BRANCHES, BRANCH_BREAK, BRANCH_CLASH, BRANCH_DIRECTIONAL, BRANCH_HARM, BRANCH_PUNISH_PAIRS, BRANCH_SELF_PUNISH,
  BRANCH_SIX_COMBINE, BRANCH_TRINE, ELEMENT_ZH, STEMS, STEM_CLASH, STEM_COMBINE,
} from './tables'

export interface LabelledPillar {
  /** e.g. 'year' | 'month' | 'day' | 'hour' | 'luck' | 'annual' */
  key: string
  label: string
  stem: number
  branch: number
}

export interface Relation {
  /** 合 冲 刑 害 破 会 */
  type: string
  level: 'stem' | 'branch'
  members: string[]
  /** The characters involved */
  chars: string
  /** 化/会 element where applicable */
  element?: FiveElement
  note: string
  tone: 'harmony' | 'tension' | 'neutral'
}

const pair = (a: number, b: number, t: [number, number][]) => t.some(([x, y]) => (x === a && y === b) || (x === b && y === a))

export function computeRelations(pillars: LabelledPillar[], natalKeys: string[] = pillars.map((p) => p.key)): Relation[] {
  const out: Relation[] = []
  const push = (r: Relation) => {
    // Only report relations that involve at least one natal pillar, and no duplicates
    if (!r.members.some((m) => natalKeys.includes(m))) return
    if (out.some((x) => x.type === r.type && x.members.join() === r.members.join())) return
    out.push(r)
  }

  // Pairwise
  for (let i = 0; i < pillars.length; i++)
    for (let j = i + 1; j < pillars.length; j++) {
      const a = pillars[i], b = pillars[j]
      const members = [a.key, b.key]
      // stems
      const sc = STEM_COMBINE.find(([x, y]) => (x === a.stem && y === b.stem) || (x === b.stem && y === a.stem))
      if (sc) push({ type: '天干合', level: 'stem', members, chars: `${STEMS[a.stem]}${STEMS[b.stem]}`, element: sc[2], note: `${STEMS[a.stem]}${STEMS[b.stem]}合化${ELEMENT_ZH[sc[2]]}`, tone: 'harmony' })
      if (pair(a.stem, b.stem, STEM_CLASH)) push({ type: '天干冲', level: 'stem', members, chars: `${STEMS[a.stem]}${STEMS[b.stem]}`, note: `${STEMS[a.stem]}${STEMS[b.stem]}相冲`, tone: 'tension' })
      // branches
      const bc = BRANCH_SIX_COMBINE.find(([x, y]) => (x === a.branch && y === b.branch) || (x === b.branch && y === a.branch))
      const ch = `${BRANCHES[a.branch]}${BRANCHES[b.branch]}`
      if (bc) push({ type: '六合', level: 'branch', members, chars: ch, element: bc[2], note: `${ch}六合化${ELEMENT_ZH[bc[2]]}`, tone: 'harmony' })
      if (pair(a.branch, b.branch, BRANCH_CLASH)) push({ type: '六冲', level: 'branch', members, chars: ch, note: `${ch}相冲`, tone: 'tension' })
      if (pair(a.branch, b.branch, BRANCH_HARM)) push({ type: '六害', level: 'branch', members, chars: ch, note: `${ch}相害`, tone: 'tension' })
      if (pair(a.branch, b.branch, BRANCH_BREAK)) push({ type: '六破', level: 'branch', members, chars: ch, note: `${ch}相破`, tone: 'tension' })
      const pp = BRANCH_PUNISH_PAIRS.find(([x, y]) => (x === a.branch && y === b.branch) || (x === b.branch && y === a.branch))
      if (pp) push({ type: '相刑', level: 'branch', members, chars: ch, note: `${ch}${pp[2]}`, tone: 'tension' })
      if (a.branch === b.branch && BRANCH_SELF_PUNISH.includes(a.branch)) push({ type: '自刑', level: 'branch', members, chars: ch, note: `${ch}自刑`, tone: 'tension' })
      // 半合: the 旺支 (子午卯酉) plus one neighbour of its 三合
      for (const [tri, el] of BRANCH_TRINE) {
        const mid = tri[1]
        const has = (x: number) => a.branch === x || b.branch === x
        if (has(mid) && a.branch !== b.branch && (has(tri[0]) || has(tri[2])))
          push({ type: '半合', level: 'branch', members, chars: ch, element: el, note: `${ch}半合${ELEMENT_ZH[el]}局`, tone: 'harmony' })
      }
    }

  // Triples: 三合 / 三会 / 三刑
  const combos = (needed: number[]) => {
    const found: LabelledPillar[] = []
    for (const b of needed) {
      const p = pillars.find((x) => x.branch === b && !found.includes(x))
      if (!p) return null
      found.push(p)
    }
    return found
  }
  for (const [tri, el] of BRANCH_TRINE) {
    const c = combos(tri)
    if (c) push({ type: '三合', level: 'branch', members: c.map((p) => p.key), chars: tri.map((b) => BRANCHES[b]).join(''), element: el, note: `${tri.map((b) => BRANCHES[b]).join('')}三合${ELEMENT_ZH[el]}局`, tone: 'harmony' })
  }
  for (const [tri, el] of BRANCH_DIRECTIONAL) {
    const c = combos(tri)
    if (c) push({ type: '三会', level: 'branch', members: c.map((p) => p.key), chars: tri.map((b) => BRANCHES[b]).join(''), element: el, note: `${tri.map((b) => BRANCHES[b]).join('')}三会${ELEMENT_ZH[el]}方`, tone: 'harmony' })
  }
  for (const tri of [[2, 5, 8], [1, 10, 7]]) {
    const c = combos(tri)
    if (c) push({ type: '三刑', level: 'branch', members: c.map((p) => p.key), chars: tri.map((b) => BRANCHES[b]).join(''), note: `${tri.map((b) => BRANCHES[b]).join('')}三刑`, tone: 'tension' })
  }
  return out
}
