/**
 * 命局分析 — the transparent scoring layer behind the 分析 view.
 *
 * Everything here is a documented, reproducible model rather than a hidden oracle:
 *
 *   五行旺衰明细   每柱每行的分值拆成 本命包含 / 同柱影响 / 月令影响 / 天干邻柱 / 地支合化相生 /
 *                  离日主近 / 通根影响 / 时坐影响，相加为该柱该行总计。
 *   十神强弱       以同一基础分按十神归类，再加 月令、时柱、藏透通根、十神特性 修正。
 *   命局评分       阴阳 / 格局 / 五行 / 流通 / 调候 / 燥湿 / 寒暖 / 禄神 / 神煞 九项，满分 345。
 *   喜用神         调候（穷通宝鉴）、扶抑（旺衰）、格局（从格 / 专旺）三路并列。
 *
 * Base values: 天干 36；地支藏干 本气 60、中气 30、余气 10。
 */
import type { FiveElement, PillarKey } from '../types'
import {
  BRANCHES, BRANCH_CLASH, BRANCH_DIRECTIONAL, BRANCH_ELEMENT, BRANCH_SIX_COMBINE, BRANCH_TRINE, ELEMENT_ORDER, ELEMENT_ZH, HIDDEN_STEMS,
  STEMS, STEM_ELEMENT, controls, generates, lifeStage, stemYang, tenGod,
} from './tables'
import { seasonState, type SeasonState } from './strength'
import { JIN_BU_HUAN, TIAO_HOU } from './classics'
import type { BaziChart } from './types'

export const KEYS: PillarKey[] = ['year', 'month', 'day', 'hour']
export const PILLAR_ZH: Record<PillarKey, string> = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' }
const STEM_BASE = 36
const HIDDEN_BASE = [60, 30, 10]
const SEASON_PCT: Record<SeasonState, number> = { 旺: 0.4, 相: 0.2, 休: -0.15, 囚: -0.3, 死: -0.45 }
export const TEN_GODS = ['比肩', '劫财', '食神', '伤官', '正财', '偏财', '正官', '七杀', '正印', '偏印'] as const
/** 禄 branch of each stem (临官) */
const LU_BRANCH = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0]

export type ElementRole = '日主' | '食伤' | '财' | '官杀' | '印'
export type Exposure = '天透地藏' | '藏而不透' | '虚透无藏' | '无'

export interface ElementRow {
  pillar: PillarKey
  element: FiveElement
  base: number
  samePillar: number
  month: number
  adjStem: number
  branchCombo: number
  proximity: number
  root: number
  hourSeat: number
  total: number
}
export interface ElementSummary {
  element: FiveElement
  role: ElementRole
  count: number
  exposure: Exposure
  value: number
  percent: number
  verdict: string
}
export interface TenGodRow {
  name: string
  count: number
  exposure: Exposure
  base: number
  basePercent: number
  month: number
  hour: number
  rootBonus: number
  trait: number
  total: number
  percent: number
}
export interface ScoreRow {
  name: string
  max: number
  score: number
  note: string
}
export interface UseGodRow {
  type: string
  favourable: string[]
  unfavourable: string[]
  note: string
}
export interface PatternHit {
  name: string
  /** 正格 / 变格 / 特殊格 / 组合 */
  kind: string
  note: string
}

export interface BaziAnalysis {
  overview: string
  relationsLine: string
  patterns: PatternHit[]
  elementRows: ElementRow[]
  elementSummary: ElementSummary[]
  tenGods: TenGodRow[]
  scores: ScoreRow[]
  totalScore: number
  useGods: UseGodRow[]
  tiaohou: { stems: string[]; line: string; text: string }
  /** The 从/专旺 judgement used for 喜忌 */
  special: { type: '从弱' | '专旺' | '从强' | null; follow?: string }
  /** The 喜忌 every other reading uses: 从格 / 专旺 override 扶抑 when present */
  effective: { favourable: FiveElement[]; unfavourable: FiveElement[]; source: '从格' | '专旺' | '扶抑' }
}

const roleOf = (dmEl: FiveElement, el: FiveElement): ElementRole =>
  el === dmEl ? '日主' : generates(dmEl, el) ? '食伤' : controls(dmEl, el) ? '财' : controls(el, dmEl) ? '官杀' : '印'

function verdictFor(pct: number, present: boolean): string {
  if (!present) return '无'
  if (pct >= 45) return '太旺'
  if (pct >= 35) return '过旺'
  if (pct >= 28) return '偏旺'
  if (pct >= 22) return '中和偏旺'
  if (pct >= 16) return '中和'
  if (pct >= 12) return '中和偏弱'
  if (pct >= 8) return '偏弱'
  if (pct >= 5) return '太弱'
  return '从弱'
}

const ZERO = () => Object.fromEntries(ELEMENT_ORDER.map((e) => [e, 0])) as Record<FiveElement, number>

/** 从 / 专旺 thresholds (percent of total element strength); calibrated in scripts/calib-patterns.mts */
export const PATTERN_THRESHOLDS = {
  /** 日主 + 印 share at or above which the chart follows its own strength (从强 / 专旺) */
  dominant: 62,
  /** …and the 官杀 share must stay below this, otherwise it is just 身强 */
  dominantOfficerMax: 8,
  /** 日主 share alone for a true 专旺 (曲直、炎上…); otherwise 从强 */
  pureDominant: 45,
  followSelfMax: 12,
  followResourceMax: 14,
}

export function analyseBazi(chart: BaziChart): BaziAnalysis {
  const stems = Object.fromEntries(chart.pillars.map((p) => [p.key, p.stem])) as Record<PillarKey, number>
  const branches = Object.fromEntries(chart.pillars.map((p) => [p.key, p.branch])) as Record<PillarKey, number>
  const dm = chart.dayMaster.stem
  const dmEl = STEM_ELEMENT[dm]
  const monthEl = BRANCH_ELEMENT[branches.month]
  const season = Object.fromEntries(ELEMENT_ORDER.map((e) => [e, seasonState(e, monthEl)])) as Record<FiveElement, SeasonState>
  const hourHidden = HIDDEN_STEMS[branches.hour]

  // ---- 五行旺衰明细 -------------------------------------------------------------------
  const rows: ElementRow[] = []
  const allBranches = KEYS.map((k) => branches[k])
  const comboBonus = (k: PillarKey): Record<FiveElement, number> => {
    const b = branches[k]
    const out = ZERO()
    const others = KEYS.filter((x) => x !== k).map((x) => branches[x])
    // 六合
    for (const [x, y, el] of BRANCH_SIX_COMBINE) if ((b === x && others.includes(y)) || (b === y && others.includes(x))) out[el] += 15
    // 三合 (full or 半合 with the 中神)
    for (const [grp, el] of BRANCH_TRINE) {
      if (!grp.includes(b)) continue
      const hits = grp.filter((g) => allBranches.includes(g)).length
      if (hits === 3) out[el] += 20
      else if (hits === 2 && allBranches.includes(grp[1]) ) out[el] += 10
    }
    // 三会
    for (const [grp, el] of BRANCH_DIRECTIONAL) if (grp.includes(b) && grp.every((g) => allBranches.includes(g))) out[el] += 20
    // 六冲: both main elements lose
    for (const [x, y] of BRANCH_CLASH) if ((b === x && others.includes(y)) || (b === y && others.includes(x))) out[BRANCH_ELEMENT[b]] -= 10
    // adjacent branch 相生
    const idx = KEYS.indexOf(k)
    for (const n of [idx - 1, idx + 1]) {
      if (n < 0 || n > 3) continue
      const ne = BRANCH_ELEMENT[branches[KEYS[n]]]
      const me = BRANCH_ELEMENT[b]
      if (generates(ne, me)) out[me] += 8
      if (generates(me, ne)) out[me] -= 4
    }
    return out
  }

  for (const k of KEYS) {
    const base = ZERO()
    const s = stems[k], b = branches[k]
    base[STEM_ELEMENT[s]] += STEM_BASE
    HIDDEN_STEMS[b].forEach((h, i) => (base[STEM_ELEMENT[h]] += HIDDEN_BASE[i]))
    const se = STEM_ELEMENT[s], me = BRANCH_ELEMENT[b]
    const same = ZERO()
    if (se === me) same[se] += 15
    else if (generates(me, se)) same[se] += 12
    else if (generates(se, me)) { same[se] -= 8; same[me] += 8 }
    else if (controls(me, se)) same[se] -= 12
    else if (controls(se, me)) { same[me] -= 10; same[se] -= 4 }
    const adj = ZERO()
    const idx = KEYS.indexOf(k)
    for (const n of [idx - 1, idx + 1]) {
      if (n < 0 || n > 3) continue
      const ne = STEM_ELEMENT[stems[KEYS[n]]]
      if (ne === se) adj[se] += 5
      else if (generates(ne, se)) adj[se] += 8
      else if (controls(ne, se)) adj[se] -= 8
    }
    const combo = comboBonus(k)
    const prox = ZERO()
    if (k === 'month' || k === 'hour') prox[se] += 8
    if (k === 'day') prox[me] += 8
    const root = ZERO()
    let best = 0
    for (const bb of allBranches) HIDDEN_STEMS[bb].forEach((h, i) => { if (STEM_ELEMENT[h] === se) best = Math.max(best, [25, 15, 8][i]) })
    root[se] += best
    const hs = ZERO()
    hourHidden.forEach((h, i) => { const e = STEM_ELEMENT[h]; if (base[e] > 0) hs[e] += Math.round(base[e] * [0.15, 0.07, 0.04][i]) })
    for (const e of ELEMENT_ORDER) {
      const month = Math.round(base[e] * SEASON_PCT[season[e]])
      const total = Math.max(0, base[e] + same[e] + month + adj[e] + combo[e] + prox[e] + root[e] + hs[e])
      rows.push({ pillar: k, element: e, base: base[e], samePillar: same[e], month, adjStem: adj[e], branchCombo: combo[e], proximity: prox[e], root: root[e], hourSeat: hs[e], total: base[e] === 0 && total === 0 ? 0 : total })
    }
  }
  const sums = ZERO()
  for (const r of rows) sums[r.element] += r.total
  const grand = ELEMENT_ORDER.reduce((a, e) => a + sums[e], 0) || 1
  const stemEls = KEYS.map((k) => STEM_ELEMENT[stems[k]])
  const hiddenEls = allBranches.flatMap((b) => HIDDEN_STEMS[b].map((h) => STEM_ELEMENT[h]))
  const exposureOf = (hasStem: boolean, hasHidden: boolean): Exposure => (hasStem && hasHidden ? '天透地藏' : hasHidden ? '藏而不透' : hasStem ? '虚透无藏' : '无')
  const elementSummary: ElementSummary[] = ELEMENT_ORDER.map((e) => {
    const count = stemEls.filter((x) => x === e).length + allBranches.filter((b) => BRANCH_ELEMENT[b] === e).length
    const pct = Math.round((sums[e] / grand) * 1000) / 10
    return { element: e, role: roleOf(dmEl, e), count, exposure: exposureOf(stemEls.includes(e), hiddenEls.includes(e)), value: sums[e], percent: pct, verdict: verdictFor(pct, sums[e] > 0) }
  })
  // order by role: 日主 食伤 财 官杀 印
  const roleOrder: ElementRole[] = ['日主', '食伤', '财', '官杀', '印']
  elementSummary.sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))

  // ---- 十神强弱 ---------------------------------------------------------------------
  const godBase = Object.fromEntries(TEN_GODS.map((g) => [g, 0])) as Record<string, number>
  const godStem = Object.fromEntries(TEN_GODS.map((g) => [g, 0])) as Record<string, number>
  const godHidden = Object.fromEntries(TEN_GODS.map((g) => [g, 0])) as Record<string, number>
  const godCount = Object.fromEntries(TEN_GODS.map((g) => [g, 0])) as Record<string, number>
  const godHour = Object.fromEntries(TEN_GODS.map((g) => [g, 0])) as Record<string, number>
  for (const k of KEYS) {
    if (k !== 'day') { const g = tenGod(dm, stems[k]); godBase[g] += STEM_BASE; godStem[g] += 1; godCount[g] += 1; if (k === 'hour') godHour[g] += STEM_BASE }
    HIDDEN_STEMS[branches[k]].forEach((h, i) => { const g = tenGod(dm, h); godBase[g] += HIDDEN_BASE[i]; godHidden[g] += 1; godCount[g] += 1; if (k === 'hour') godHour[g] += HIDDEN_BASE[i] })
  }
  const godBaseTotal = TEN_GODS.reduce((a, g) => a + godBase[g], 0) || 1
  const TRAIT: Record<string, number> = { 七杀: 0.15, 伤官: 0.1, 偏印: 0.1, 劫财: 0.05, 偏财: 0.1 }
  const godRows: TenGodRow[] = TEN_GODS.map((g) => {
    const el = ELEMENT_ORDER.find((e) => roleOf(dmEl, e) === (g === '比肩' || g === '劫财' ? '日主' : g === '食神' || g === '伤官' ? '食伤' : g === '正财' || g === '偏财' ? '财' : g === '正官' || g === '七杀' ? '官杀' : '印'))!
    const base = godBase[g]
    const month = Math.round(base * SEASON_PCT[season[el]])
    const hour = Math.round(godHour[g] * 0.2)
    const exposure = exposureOf(godStem[g] > 0, godHidden[g] > 0)
    const rootBonus = exposure === '天透地藏' ? Math.round(base * 0.3) : exposure === '藏而不透' ? 0 : exposure === '虚透无藏' ? Math.round(base * 0.3) : 0
    const trait = Math.round(base * (TRAIT[g] ?? 0))
    const total = Math.max(0, base + month + hour + rootBonus + trait)
    return { name: g, count: godCount[g], exposure, base, basePercent: Math.round((base / godBaseTotal) * 1000) / 10, month, hour, rootBonus, trait, total, percent: 0 }
  })
  const godTotal = godRows.reduce((a, r) => a + r.total, 0) || 1
  for (const r of godRows) r.percent = Math.round((r.total / godTotal) * 1000) / 10

  // ---- 格局 ---------------------------------------------------------------------------
  const patterns: PatternHit[] = []
  const monthHidden = HIDDEN_STEMS[branches.month]
  const exposed = KEYS.filter((k) => k !== 'day').map((k) => stems[k])
  const GE_NAME: Record<string, string> = { 偏印: '枭格', 食神: '食神格', 伤官: '伤官格', 正财: '正财格', 偏财: '偏财格', 正官: '正官格', 七杀: '七杀格', 正印: '正印格' }
  const monthGods = monthHidden.map((h) => tenGod(dm, h))
  const mainGod = monthGods[0]
  if (mainGod === '比肩' || mainGod === '劫财') {
    const st = lifeStage(dm, branches.month)
    patterns.push(st === '临官' ? { name: '建禄格', kind: '正格', note: '月令为日主临官之地，自身旺，宜见财官。' } : st === '帝旺' ? { name: '阳刃格', kind: '正格', note: '月令为日主帝旺之地，气势刚烈，喜官杀制刃。' } : { name: '月劫格', kind: '正格', note: '月令比劫当令，宜财官食伤泄秀。' })
  }
  const exposedMonthGods = monthHidden.filter((h) => exposed.includes(h) || exposed.some((s) => STEM_ELEMENT[s] === STEM_ELEMENT[h] && stemYang(s) === stemYang(h))).map((h) => tenGod(dm, h))
  for (const g of exposedMonthGods) if (GE_NAME[g] && !patterns.some((p) => p.name === GE_NAME[g])) patterns.push({ name: GE_NAME[g], kind: '正格', note: `月令藏${g}透出天干，以${g}取格。` })
  if (!patterns.length && GE_NAME[mainGod]) patterns.push({ name: GE_NAME[mainGod], kind: '正格', note: `月令本气为${mainGod}，虽不透干，仍以本气取格。` })

  // 从 / 专旺
  const pct = (e: FiveElement) => Math.round((sums[e] / grand) * 1000) / 10
  const motherEl = ELEMENT_ORDER.find((e) => generates(e, dmEl))!
  const dmRooted = allBranches.some((b) => HIDDEN_STEMS[b].some((h) => STEM_ELEMENT[h] === dmEl))
  // 从格 needs 天干不见印比 (no exposed stem that feeds or sides with the 日主); a 比劫 is tolerated only for 从儿.
  const exposedSupport = KEYS.filter((k) => k !== 'day').map((k) => STEM_ELEMENT[stems[k]])
  const hasExposedResource = exposedSupport.includes(motherEl)
  const hasExposedPeer = exposedSupport.includes(dmEl)
  const T = PATTERN_THRESHOLDS
  const selfParty = pct(dmEl) + pct(motherEl)
  let special: BaziAnalysis['special'] = { type: null }
  if (selfParty >= T.dominant && pct(ELEMENT_ORDER.find((e) => controls(e, dmEl))!) < T.dominantOfficerMax) {
    const names: Record<FiveElement, string> = { wood: '曲直', fire: '炎上', earth: '稼穑', metal: '从革', water: '润下' }
    special = { type: pct(dmEl) >= T.pureDominant ? '专旺' : '从强' }
    patterns.push({ name: special.type === '专旺' ? `${names[dmEl]}格（专旺）` : '从强格', kind: '变格', note: '日主与印比得势，顺其旺势为用，忌官杀财星逆之。' })
  } else if (pct(dmEl) <= T.followSelfMax && pct(motherEl) <= T.followResourceMax && !dmRooted && !hasExposedResource && (!hasExposedPeer || elementSummary.filter((s) => s.role !== '日主' && s.role !== '印').sort((a, b) => b.value - a.value)[0]?.role === '食伤')) {
    const dominant = elementSummary.filter((s) => s.role !== '日主' && s.role !== '印').sort((a, b) => b.value - a.value)[0]
    const follow = dominant?.role === '食伤' ? '从儿格' : dominant?.role === '财' ? '从财格' : '从杀格'
    special = { type: '从弱', follow }
    patterns.push({ name: `从格（${follow}）`, kind: '变格', note: '日主无根且印星无力，弃命从势，以当旺之神为用，忌比劫印星。' })
  } else if (pct(dmEl) <= 15 && !dmRooted && pct(motherEl) >= 30) {
    patterns.push({ name: '印旺身弱', kind: '组合', note: '印星过旺而日主无根，母慈灭子之象，宜财星损印。' })
  }
  // 特殊格 & 组合
  const stemChars: string[] = KEYS.map((k) => STEMS[stems[k]])
  const hasAll = (chars: string[]) => chars.every((c) => stemChars.includes(c))
  if (hasAll(['甲', '戊', '庚'])) patterns.push({ name: '天上三奇格', kind: '特殊格', note: '甲戊庚齐透，需身强有贵人方贵。' })
  if (hasAll(['乙', '丙', '丁'])) patterns.push({ name: '地下三奇格', kind: '特殊格', note: '乙丙丁齐透，需身强有贵人方贵。' })
  if (hasAll(['壬', '癸', '辛'])) patterns.push({ name: '人中三奇格', kind: '特殊格', note: '壬癸辛齐透，需身强有贵人方贵。' })
  const dayGz = STEMS[dm] + BRANCHES[branches.day]
  if (['庚辰', '庚戌', '壬辰', '戊戌'].includes(dayGz)) patterns.push({ name: '魁罡格', kind: '特殊格', note: '日主坐魁罡，性刚果断，忌刑冲财官。' })
  if (['甲寅', '丙辰', '戊辰', '庚辰', '壬戌'].includes(dayGz)) patterns.push({ name: '日德格', kind: '特殊格', note: '日德之日，性情慈善，忌刑冲魁罡。' })
  if (['丁酉', '丁亥', '癸卯', '癸巳'].includes(dayGz)) patterns.push({ name: '日贵格', kind: '特殊格', note: '日坐天乙贵人，主端正得助。' })
  if ((dm === 0 || dm === 5) && ['乙丑', '己巳', '癸酉'].includes(STEMS[stems.hour] + BRANCHES[branches.hour])) patterns.push({ name: '金神格', kind: '特殊格', note: '甲己日逢金神时，喜火制方贵。' })
  if ((dm === 7 || dm === 1) && branches.hour === 0) patterns.push({ name: '六阴朝阳格', kind: '特殊格', note: '辛乙日生子时，忌午冲丑合。' })
  if (new Set(stemChars).size === 1) patterns.push({ name: '天元一气格', kind: '特殊格', note: '四柱天干相同，气专而清。' })
  if (new Set(allBranches).size === 1) patterns.push({ name: '地支一气格', kind: '特殊格', note: '四柱地支相同，气专而清。' })
  const exposedGods = exposed.map((s) => tenGod(dm, s))
  const has = (g: string) => exposedGods.includes(g)
  if (has('伤官') && (has('正印') || has('偏印'))) patterns.push({ name: '伤官配印', kind: '组合', note: '伤官与印星并透，文采与权位相济。' })
  if (has('食神') && has('七杀')) patterns.push({ name: '食神制杀', kind: '组合', note: '食神制伏七杀，化凶为权。' })
  if (has('七杀') && (has('正印') || has('偏印'))) patterns.push({ name: '杀印相生', kind: '组合', note: '七杀生印、印生身，宜武职权印。' })
  if ((has('正财') || has('偏财')) && has('正官')) patterns.push({ name: '财官双美', kind: '组合', note: '财生官旺，身强则富贵可期。' })
  if (has('伤官') && has('正官')) patterns.push({ name: '伤官见官', kind: '组合', note: '伤官与正官并透，易有是非口舌，需印制伤。' })

  // ---- 命局评分 ---------------------------------------------------------------------
  const scores: ScoreRow[] = []
  const yangCount = KEYS.filter((k) => stemYang(stems[k])).length + allBranches.filter((b) => b % 2 === 0).length
  const yinCount = 8 - yangCount
  scores.push({ name: '阴阳', max: 20, score: Math.abs(yangCount - yinCount) <= 2 ? 20 : Math.abs(yangCount - yinCount) <= 4 ? 15 : Math.abs(yangCount - yinCount) <= 6 ? 8 : 0, note: `四柱：${yangCount} 个阳字，${yinCount} 个阴字。` })
  let geScore = 0
  if (patterns.some((p) => p.kind === '变格')) geScore += 60
  else if (patterns.some((p) => p.kind === '正格' && !p.note.includes('不透'))) geScore += 40
  else geScore += 20
  geScore += patterns.filter((p) => p.kind === '特殊格' || p.kind === '组合').length * 10
  scores.push({ name: '格局', max: 60, score: Math.min(60, geScore), note: patterns.map((p) => p.name).join('。') + '。' })
  const missing = elementSummary.filter((s) => s.exposure === '无').map((s) => ELEMENT_ZH[s.element])
  const over = elementSummary.filter((s) => s.percent >= 40).map((s) => ELEMENT_ZH[s.element])
  const wx = (missing.length ? 0 : 30) + (over.length ? 0 : 20) + (elementSummary.every((s) => s.percent >= 5) ? 10 : 0)
  scores.push({ name: '五行', max: 60, score: wx, note: missing.length ? `缺${missing.join('')}。` : over.length ? `${over.join('')}太旺。` : '五行俱全且无太旺。' })
  // 流通: longest 相生 chain across the eight characters in reading order, each step to a neighbouring character
  const chars = KEYS.flatMap((k) => [{ c: STEMS[stems[k]], e: STEM_ELEMENT[stems[k]], i: KEYS.indexOf(k) * 2 }, { c: BRANCHES[branches[k]], e: BRANCH_ELEMENT[branches[k]], i: KEYS.indexOf(k) * 2 + 1 }])
  let bestChain: string[] = []
  const dfs = (idx: number, path: string[], used: Set<number>) => {
    if (path.length > bestChain.length) bestChain = [...path]
    for (const n of chars) {
      if (used.has(n.i) || Math.abs(n.i - idx) > 2) continue
      const cur = chars[idx]
      if (n.e === cur.e || generates(cur.e, n.e)) { used.add(n.i); dfs(n.i, [...path, n.c], used); used.delete(n.i) }
    }
  }
  for (const c of chars) dfs(c.i, [c.c], new Set([c.i]))
  scores.push({ name: '流通', max: 50, score: Math.min(50, (bestChain.length - 1) * 7), note: `流通长度 ${bestChain.length}：${bestChain.join('=>')}（最长 8，越长越好）。` })
  const th = TIAO_HOU[chart.classics.key] ?? []
  const thStems = th.flat()
  const primary = th[0] ?? []
  const stemSet = new Set(stemChars)
  const mainHidden = new Set<string>(allBranches.map((b) => STEMS[HIDDEN_STEMS[b][0]]))
  const anyHidden = new Set<string>(allBranches.flatMap((b) => HIDDEN_STEMS[b].map((h) => STEMS[h])))
  let thScore = 0
  if (primary.some((s) => stemSet.has(s) || mainHidden.has(s))) thScore = 30
  else if (primary.some((s) => anyHidden.has(s))) thScore = 20
  else if (thStems.some((s) => stemSet.has(s) || anyHidden.has(s))) thScore = 12
  scores.push({ name: '调候', max: 30, score: thScore, note: `日主${STEMS[dm]}生于${BRANCHES[branches.month]}月，调候用神为：${thStems.join(' ')}（调候用神透出或得地则命局层次高）。` })
  const DRY = new Set(['丙', '丁', '戊', '巳', '午', '未', '戌']), WET = new Set(['壬', '癸', '子', '丑', '辰', '亥'])
  const all8 = [...stemChars, ...allBranches.map((b) => BRANCHES[b])]
  const dry = all8.filter((c) => DRY.has(c)).length, wet = all8.filter((c) => WET.has(c)).length
  const dw = Math.abs(dry - wet)
  scores.push({ name: '燥湿', max: 10, score: dw <= 1 ? 10 : dw <= 2 ? 7 : dw <= 3 ? 4 : 0, note: dw <= 1 ? '燥湿平衡。' : dry > wet ? `偏燥（燥 ${dry} · 湿 ${wet}）。` : `偏湿（燥 ${dry} · 湿 ${wet}）。` })
  const mb = branches.month
  const needEl: FiveElement | null = [11, 0, 1].includes(mb) ? 'fire' : [5, 6, 7].includes(mb) ? 'water' : null
  let hw = 10, hwNote = '寒暖平衡。'
  if (needEl) {
    const inStem = stemEls.includes(needEl), inMain = allBranches.some((b) => BRANCH_ELEMENT[b] === needEl), inHidden = hiddenEls.includes(needEl)
    hw = inStem || inMain ? 10 : inHidden ? 6 : 0
    hwNote = `${needEl === 'fire' ? '冬生需火暖局' : '夏生需水润局'}，${inStem || inMain ? '已得' : inHidden ? '仅藏支' : '未见'}${ELEMENT_ZH[needEl]}。`
  }
  scores.push({ name: '寒暖', max: 10, score: hw, note: hwNote })
  const lu = LU_BRANCH[dm]
  const luIn = KEYS.filter((k) => branches[k] === lu)
  const wang = allBranches.includes((lu + (stemYang(dm) ? 1 : -1) + 12) % 12)
  const luScore = Math.min(60, (luIn.includes('day') ? 40 : luIn.length ? 30 : 0) + (luIn.length > 1 ? 10 : 0) + (wang ? 15 : 0))
  scores.push({ name: '禄神', max: 60, score: luScore, note: luIn.length ? `${luIn.map((k) => PILLAR_ZH[k]).join('、')}坐禄（${BRANCHES[lu]}）。` : wang ? '不见禄，见帝旺。' : '四柱不见禄神。' })
  const lucky = chart.shensha.filter((s) => s.kind === 'auspicious')
  scores.push({ name: '神煞', max: 45, score: Math.min(45, lucky.length * 5), note: lucky.length ? `有${lucky.map((s) => s.name).join('、')}；` : '无明显吉神。' })
  const totalScore = scores.reduce((a, s) => a + s.score, 0)

  // ---- 喜用神 ----------------------------------------------------------------------
  const luOfStem = (ch: string) => `${ch}(${BRANCHES[LU_BRANCH[STEMS.indexOf(ch as (typeof STEMS)[number])]]})`
  const jb = JIN_BU_HUAN[chart.classics.key]
  const useGods: UseGodRow[] = []
  const tiaohouLine = thStems.length ? `先用${primary.join('')}${th[1]?.length ? `，取${th[1].join('')}为佐` : ''}${th[2]?.length ? `，再看${th[2].join('')}` : ''}。` : ''
  useGods.push({ type: '调候', favourable: thStems.map(luOfStem), unfavourable: jb ? [jb.tiaohou.replace(/.*忌/, '忌')] : [], note: `${tiaohouLine}${jb ? jb.tiaohou + '。' : ''}从寒暖燥湿方面分析。` })
  const st = chart.strength
  useGods.push({ type: '扶抑', favourable: st.favourable.map((e) => ELEMENT_ZH[e]), unfavourable: st.unfavourable.map((e) => ELEMENT_ZH[e]), note: `日主${st.verdict}（同党 ${st.selfParty}%），${st.verdict === '身弱' ? '宜印比生扶' : st.verdict === '身强' ? '宜官杀财食克泄' : '扶抑两可，以调候为先'}。` })
  if (special.type) {
    const childEl = ELEMENT_ORDER.find((e) => generates(dmEl, e))!, wealthEl = ELEMENT_ORDER.find((e) => controls(dmEl, e))!, officerEl = ELEMENT_ORDER.find((e) => controls(e, dmEl))!
    useGods.push(special.type === '从弱'
      ? { type: '从格', favourable: [childEl, wealthEl, officerEl].map((e) => ELEMENT_ZH[e]), unfavourable: [motherEl, dmEl].map((e) => ELEMENT_ZH[e]), note: `${special.follow}，顺从当旺之势，忌印比帮身。` }
      : { type: '专旺', favourable: [dmEl, motherEl, childEl].map((e) => ELEMENT_ZH[e]), unfavourable: [officerEl, wealthEl].map((e) => ELEMENT_ZH[e]), note: '专旺格 / 从强格，顺其旺势，喜印比食伤，忌官杀财星逆之。' })
  }
  const special2 = useGods.find((u) => u.type === '从格' || u.type === '专旺')
  const zh2el = (z: string) => ELEMENT_ORDER.find((e) => ELEMENT_ZH[e] === z)!
  const effective: BaziAnalysis['effective'] = special2
    ? { favourable: special2.favourable.map(zh2el), unfavourable: special2.unfavourable.map(zh2el), source: special2.type as '从格' | '专旺' }
    : { favourable: st.favourable, unfavourable: st.unfavourable, source: '扶抑' }
  useGods.push({ type: '总结', favourable: effective.favourable.map((e) => ELEMENT_ZH[e]), unfavourable: effective.unfavourable.map((e) => ELEMENT_ZH[e]), note: `本盘采用${effective.source}取用：喜${effective.favourable.map((e) => ELEMENT_ZH[e]).join('')}、忌${effective.unfavourable.map((e) => ELEMENT_ZH[e]).join('')}，运势与资产判断均以此为准。重要性：化气 > 专旺/从格 > 调候 > 扶抑 > 流通；多路用神相同者为真用神。` })

  // ---- overview lines ---------------------------------------------------------------
  const overview = `你的日主为${STEMS[dm]}，年干${STEMS[stems.year]}，年支${BRANCHES[branches.year]}，月干${STEMS[stems.month]}，月支${BRANCHES[branches.month]}，日支${BRANCHES[branches.day]}，时干${STEMS[stems.hour]}，时支${BRANCHES[branches.hour]}；天干为${[stems.year, stems.month, stems.hour].map((s) => STEMS[s]).join('、')}；地支为${allBranches.map((b) => BRANCHES[b]).join('、')}。`
  const lab: Record<string, string> = { year: '年', month: '月', day: '日', hour: '时' }
  const relParts = chart.relations.map((r) => {
    const who = r.members.map((m) => `${lab[m]}${r.level === 'stem' ? '干' : '支'}`).join('与')
    return `${who}${r.note}`
  })
  const relationsLine = `你的日柱为${dayGz}，年柱${STEMS[stems.year]}${BRANCHES[branches.year]}，月柱${STEMS[stems.month]}${BRANCHES[branches.month]}，时柱${STEMS[stems.hour]}${BRANCHES[branches.hour]}${relParts.length ? '，' + relParts.join('，') : '，四柱之间无合冲刑害'}。`

  return {
    overview, relationsLine, patterns, elementRows: rows, elementSummary, tenGods: godRows, scores, totalScore, useGods,
    tiaohou: { stems: thStems, line: tiaohouLine, text: jb ? `${jb.tiaohou}${jb.luck ? '；大运' + jb.luck : ''}${jb.note ? '；' + jb.note : ''}` : '' },
    special, effective,
  }
}

