/**
 * 五行旺衰 and 日主强弱 — a transparent weighting model of the kind used by popular 排盘
 * apps. Every rule is listed here so the numbers on screen can be explained:
 *
 *   contribution = position weight × (藏干 rank weight) × 月令 旺相休囚死 factor
 *
 * Position weights   年干 1.0 · 月干 1.2 · 日干 1.0 · 时干 1.0 · 年支 1.0 · 月支 1.6 · 日支 1.2 · 时支 1.0
 * 藏干 rank weights  本气 1.0 · 中气 0.5 · 余气 0.3
 * 月令 factors       旺 1.3 · 相 1.15 · 休 0.9 · 囚 0.75 · 死 0.6
 */
import type { FiveElement, PillarKey } from '../types'
import { BRANCH_ELEMENT, HIDDEN_STEMS, STEM_ELEMENT, ELEMENT_ORDER, controls, generates, lifeStage } from './tables'

const POS_STEM: Record<PillarKey, number> = { year: 1.0, month: 1.2, day: 1.0, hour: 1.0 }
const POS_BRANCH: Record<PillarKey, number> = { year: 1.0, month: 1.6, day: 1.2, hour: 1.0 }
const RANK = [1.0, 0.5, 0.3]
const SEASON_FACTOR = { 旺: 1.3, 相: 1.15, 休: 0.9, 囚: 0.75, 死: 0.6 } as const
export type SeasonState = keyof typeof SEASON_FACTOR

/** 旺相休囚死 of an element in a month whose ruling element is `monthEl`. */
export function seasonState(el: FiveElement, monthEl: FiveElement): SeasonState {
  if (el === monthEl) return '旺'
  if (generates(monthEl, el)) return '相'
  if (generates(el, monthEl)) return '休'
  if (controls(el, monthEl)) return '囚'
  return '死'
}

export interface StrengthResult {
  /** Raw weighted scores per element */
  scores: Record<FiveElement, number>
  /** Percent share per element (sums to 100) */
  percent: Record<FiveElement, number>
  /** Plain character counts per element over the eight characters */
  counts: Record<FiveElement, number>
  season: Record<FiveElement, SeasonState>
  /** 同党 (印 + 比) share, 0–100 */
  selfParty: number
  verdict: '身强' | '身弱' | '中和'
  /** 得令 / 得地 / 得势 */
  support: { ling: boolean; di: boolean; shi: boolean }
  /** 喜用 / 忌 elements from the 扶抑 principle */
  favourable: FiveElement[]
  unfavourable: FiveElement[]
  /** 格局 from the month branch's 本气 */
  pattern: string
}

export interface StrengthInput {
  stems: Record<PillarKey, number>
  branches: Record<PillarKey, number>
  dayMaster: number
}

export function computeStrength(input: StrengthInput, tenGodOf: (s: number) => string): StrengthResult {
  const monthEl = BRANCH_ELEMENT[input.branches.month]
  const season = Object.fromEntries(ELEMENT_ORDER.map((e) => [e, seasonState(e, monthEl)])) as Record<FiveElement, SeasonState>
  const scores = Object.fromEntries(ELEMENT_ORDER.map((e) => [e, 0])) as Record<FiveElement, number>
  const counts = Object.fromEntries(ELEMENT_ORDER.map((e) => [e, 0])) as Record<FiveElement, number>
  const keys: PillarKey[] = ['year', 'month', 'day', 'hour']
  for (const k of keys) {
    const se = STEM_ELEMENT[input.stems[k]]
    scores[se] += POS_STEM[k] * SEASON_FACTOR[season[se]]
    counts[se] += 1
    const hidden = HIDDEN_STEMS[input.branches[k]]
    hidden.forEach((h, i) => {
      const he = STEM_ELEMENT[h]
      scores[he] += POS_BRANCH[k] * RANK[i] * SEASON_FACTOR[season[he]]
    })
    counts[BRANCH_ELEMENT[input.branches[k]]] += 1
  }
  const total = ELEMENT_ORDER.reduce((a, e) => a + scores[e], 0)
  const percent = Object.fromEntries(ELEMENT_ORDER.map((e) => [e, Math.round((scores[e] / total) * 1000) / 10])) as Record<FiveElement, number>

  const dmEl = STEM_ELEMENT[input.dayMaster]
  const motherEl = ELEMENT_ORDER.find((e) => generates(e, dmEl))!
  const selfParty = Math.round(((scores[dmEl] + scores[motherEl]) / total) * 1000) / 10
  const verdict = selfParty >= 55 ? '身强' : selfParty <= 45 ? '身弱' : '中和'

  const ling = [dmEl, motherEl].includes(STEM_ELEMENT[HIDDEN_STEMS[input.branches.month][0]])
  const dayStage = lifeStage(input.dayMaster, input.branches.day)
  const di = ['长生', '冠带', '临官', '帝旺'].includes(dayStage) || [dmEl, motherEl].includes(STEM_ELEMENT[HIDDEN_STEMS[input.branches.day][0]])
  const shi = keys.filter((k) => k !== 'day' && [dmEl, motherEl].includes(STEM_ELEMENT[input.stems[k]])).length >= 2

  const childEl = ELEMENT_ORDER.find((e) => generates(dmEl, e))!
  const wealthEl = ELEMENT_ORDER.find((e) => controls(dmEl, e))!
  const officerEl = ELEMENT_ORDER.find((e) => controls(e, dmEl))!
  const strong = verdict === '身强' || (verdict === '中和' && selfParty >= 50)
  const favourable = strong ? [officerEl, childEl, wealthEl] : [motherEl, dmEl]
  const unfavourable = strong ? [motherEl, dmEl] : [officerEl, childEl, wealthEl]

  const monthMain = HIDDEN_STEMS[input.branches.month][0]
  const god = tenGodOf(monthMain)
  let pattern = `${god}格`
  if (god === '比肩' || god === '劫财') {
    const st = lifeStage(input.dayMaster, input.branches.month)
    pattern = st === '临官' ? '建禄格' : st === '帝旺' ? '阳刃格' : `${god}格（月劫）`
  }

  return { scores, percent, counts, season, selfParty, verdict, support: { ling, di, shi }, favourable, unfavourable, pattern }
}
