/**
 * 神煞 — classical auspicious / inauspicious stars, as listed by mainstream 排盘 software.
 * Each rule says which natal positions it is keyed from and which it marks.
 */
import type { PillarKey } from '../types'
import { BRANCHES, STEMS, STEM_COMBINE, nayinElement } from './tables'

export interface ShenShaHit {
  name: string
  /** Pillars carrying the star */
  pillars: PillarKey[]
  /** Short classical note */
  note: string
  kind: 'auspicious' | 'inauspicious' | 'neutral'
}

export interface NatalForShenSha {
  stems: Record<PillarKey, number>
  branches: Record<PillarKey, number>
  /** sexagenary index of each pillar */
  sexa: Record<PillarKey, number>
  gender: 'M' | 'F'
}

const KEYS: PillarKey[] = ['year', 'month', 'day', 'hour']
const trineGroup = (b: number) => [8, 0, 4].includes(b) ? 0 : [2, 6, 10].includes(b) ? 1 : [5, 9, 1].includes(b) ? 2 : 3 // 申子辰 寅午戌 巳酉丑 亥卯未

// Stars keyed from the 三合 group of the year branch and the day branch.
const TRINE_STARS: [string, number[], string, ShenShaHit['kind']][] = [
  ['驿马', [2, 8, 11, 5], '主奔波迁动、远行出外', 'neutral'],
  ['桃花', [9, 3, 6, 0], '咸池，主情欲人缘、艺术魅力', 'neutral'],
  ['华盖', [4, 10, 1, 7], '主孤高聪慧，近宗教艺术', 'neutral'],
  ['将星', [0, 6, 9, 3], '主权威统御、领导之才', 'auspicious'],
  ['亡神', [11, 5, 8, 2], '主机谋深沉，亦主失落', 'inauspicious'],
  ['劫煞', [5, 11, 2, 8], '主破耗争斗、意外之失', 'inauspicious'],
  ['灾煞', [6, 0, 3, 9], '主疾厄横事', 'inauspicious'],
]

// Stars keyed from the day stem (also checked from the year stem for 贵人).
const STEM_STARS: [string, number[][], string, ShenShaHit['kind']][] = [
  ['天乙贵人', [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [6, 2], [3, 5], [3, 5]], '最吉之神，逢凶化吉，得贵人扶助', 'auspicious'],
  ['太极贵人', [[0, 6], [0, 6], [3, 9], [3, 9], [4, 10, 1, 7], [4, 10, 1, 7], [2, 11], [2, 11], [5, 8], [5, 8]], '主聪明好学，精于玄理', 'auspicious'],
  ['文昌贵人', [[5], [6], [8], [9], [8], [9], [11], [0], [2], [3]], '主文才学业、聪慧', 'auspicious'],
  ['国印贵人', [[10], [11], [1], [2], [1], [2], [4], [5], [7], [8]], '主掌权印信、诚信', 'auspicious'],
  ['学堂', [[11], [6], [2], [9], [2], [9], [5], [0], [8], [3]], '日干长生之地，主学业有成', 'auspicious'],
  ['禄神', [[2], [3], [5], [6], [5], [6], [8], [9], [11], [0]], '日干临官，主衣禄丰足', 'auspicious'],
  ['羊刃', [[3], [4], [6], [7], [6], [7], [9], [10], [0], [1]], '刚烈之气，主果决亦主刑伤', 'inauspicious'],
  ['飞刃', [[9], [10], [0], [1], [0], [1], [3], [4], [6], [7]], '羊刃之冲，主意外刑伤', 'inauspicious'],
  ['金舆', [[4], [5], [7], [8], [7], [8], [10], [11], [1], [2]], '主富贵、得配偶之助', 'auspicious'],
  ['红艳煞', [[6], [6], [2], [7], [4], [4], [10], [9], [0], [8]], '主风流多情、异性缘', 'neutral'],
  ['福星贵人', [[2, 0], [1, 3], [2, 0], [11], [8], [7], [6], [5], [4], [1, 3]], '主福禄悠长', 'auspicious'],
  ['流霞', [[9], [10], [7], [8], [5], [6], [4], [3], [11], [2]], '主血光，女命忌产厄', 'inauspicious'],
]

// Stars keyed from the month branch (寅 = 2); value is a stem for 德, a branch for 天医.
const TIAN_DE: number[] = [5 /*子→巳*/, 6 /*丑→庚*/, 3 /*寅→丁*/, 8 /*卯→申*/, 8 /*辰→壬*/, 7 /*巳→辛*/, 11 /*午→亥*/, 0 /*未→甲*/, 9 /*申→癸*/, 2 /*酉→寅*/, 2 /*戌→丙*/, 1 /*亥→乙*/]
const TIAN_DE_IS_BRANCH = [true, false, false, true, false, false, true, false, false, true, false, false]
const YUE_DE = (m: number) => [2, 6, 10].includes(m) ? 2 : [8, 0, 4].includes(m) ? 8 : [11, 3, 7].includes(m) ? 0 : 6

const MAGUI = [6, 8, 4, 10] // 魁罡: 庚辰 壬辰 戊戌 庚戌 as sexagenary
const RI_DE = [sexaOf(0, 2), sexaOf(2, 4), sexaOf(4, 4), sexaOf(6, 4), sexaOf(8, 10)]
const RI_GUI = [sexaOf(3, 9), sexaOf(3, 11), sexaOf(9, 3), sexaOf(9, 5)]
const YIN_CHA = [sexaOf(2, 0), sexaOf(3, 1), sexaOf(4, 2), sexaOf(7, 3), sexaOf(8, 4), sexaOf(9, 5), sexaOf(2, 6), sexaOf(3, 7), sexaOf(4, 8), sexaOf(7, 9), sexaOf(8, 10), sexaOf(9, 11)]
const SHI_E = [sexaOf(0, 4), sexaOf(1, 5), sexaOf(8, 8), sexaOf(2, 8), sexaOf(3, 11), sexaOf(6, 4), sexaOf(4, 10), sexaOf(9, 11), sexaOf(7, 5), sexaOf(5, 1)]
const GU_LUAN = [sexaOf(1, 5), sexaOf(3, 5), sexaOf(7, 11), sexaOf(4, 8), sexaOf(0, 2), sexaOf(8, 2), sexaOf(2, 6), sexaOf(8, 0)]
const LIU_XIU = [sexaOf(2, 6), sexaOf(3, 7), sexaOf(4, 0), sexaOf(4, 6), sexaOf(5, 1), sexaOf(5, 7)]
const SHI_LING = [sexaOf(0, 4), sexaOf(1, 11), sexaOf(2, 4), sexaOf(3, 9), sexaOf(4, 6), sexaOf(6, 10), sexaOf(6, 2), sexaOf(7, 11), sexaOf(8, 2), sexaOf(9, 7)]
const JIN_SHEN = [sexaOf(1, 1), sexaOf(5, 5), sexaOf(9, 9)]
const KUI_GANG = [sexaOf(6, 4), sexaOf(8, 4), sexaOf(4, 10), sexaOf(6, 10)]
void MAGUI

function sexaOf(stem: number, branch: number) {
  for (let i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === branch) return i
  return -1
}

export function computeShenSha(n: NatalForShenSha): ShenShaHit[] {
  const hits: ShenShaHit[] = []
  const add = (name: string, pillars: PillarKey[], note: string, kind: ShenShaHit['kind']) => {
    const uniq = [...new Set(pillars)]
    if (!uniq.length) return
    const existing = hits.find((h) => h.name === name)
    if (existing) existing.pillars = [...new Set([...existing.pillars, ...uniq])]
    else hits.push({ name, pillars: uniq, note, kind })
  }
  const branchesAt = (targets: number[]) => KEYS.filter((k) => targets.includes(n.branches[k]))
  const stemsAt = (targets: number[]) => KEYS.filter((k) => targets.includes(n.stems[k]))
  const yb = n.branches.year, db = n.branches.day, mb = n.branches.month
  const ys = n.stems.year, ds = n.stems.day

  // 三合-group stars from year and day branch
  for (const [name, table, note, kind] of TRINE_STARS) {
    const targets = [table[trineGroup(yb)], table[trineGroup(db)]]
    add(name, branchesAt(targets), note, kind)
  }

  // Day-stem (and year-stem for the two 贵人) stars
  for (const [name, table, note, kind] of STEM_STARS) {
    const targets = [...table[ds]]
    if (name === '天乙贵人' || name === '太极贵人') targets.push(...table[ys])
    add(name, branchesAt(targets), note, kind)
  }

  // Month-branch stars
  const td = TIAN_DE[mb]
  add('天德贵人', TIAN_DE_IS_BRANCH[mb] ? branchesAt([td]) : stemsAt([td]), '月中天德，逢凶化吉，仁慈宽厚', 'auspicious')
  if (!TIAN_DE_IS_BRANCH[mb]) {
    const pair = STEM_COMBINE.find((p) => p[0] === td || p[1] === td)!
    add('天德合', stemsAt([pair[0] === td ? pair[1] : pair[0]]), '天德之合，同主福佑', 'auspicious')
  }
  const yd = YUE_DE(mb)
  add('月德贵人', stemsAt([yd]), '月中德神，主慈善福泽', 'auspicious')
  const ydPair = STEM_COMBINE.find((p) => p[0] === yd || p[1] === yd)!
  add('月德合', stemsAt([ydPair[0] === yd ? ydPair[1] : ydPair[0]]), '月德之合，主人缘福气', 'auspicious')
  add('天医', branchesAt([(mb + 11) % 12]), '主医药、疗愈之才', 'auspicious')

  // Year-branch stars
  const season = Math.floor(((yb + 1) % 12) / 3) // 亥子丑=0 寅卯辰=1 巳午未=2 申酉戌=3
  add('孤辰', branchesAt([[2, 5, 8, 11][season]]), '主孤独，六亲缘薄', 'inauspicious')
  add('寡宿', branchesAt([[10, 1, 4, 7][season]]), '主孤寡，配偶缘薄', 'inauspicious')
  const hongluan = (3 - yb + 12) % 12
  add('红鸾', branchesAt([hongluan]), '主婚姻喜庆', 'auspicious')
  add('天喜', branchesAt([(hongluan + 6) % 12]), '主喜事、添丁', 'auspicious')
  add('丧门', branchesAt([(yb + 2) % 12]), '主孝服哀事', 'inauspicious')
  add('吊客', branchesAt([(yb + 10) % 12]), '主忧患吊丧', 'inauspicious')
  add('披麻', branchesAt([(yb + 9) % 12]), '主孝服', 'inauspicious')
  const yangYear = ys % 2 === 0
  const forward = (yangYear && n.gender === 'M') || (!yangYear && n.gender === 'F')
  add('元辰', branchesAt([(yb + (forward ? 7 : 5)) % 12]), '大耗，主耗损是非', 'inauspicious')

  // Day-pillar specific
  const dsx = n.sexa.day
  if (KUI_GANG.includes(dsx)) add('魁罡', ['day'], '性刚果断，聪明有威，忌刑冲', 'neutral')
  if (RI_DE.includes(dsx)) add('日德', ['day'], '性善仁厚，福泽绵长', 'auspicious')
  if (RI_GUI.includes(dsx)) add('日贵', ['day'], '日坐贵人，主贵气', 'auspicious')
  if (YIN_CHA.includes(dsx)) add('阴差阳错', ['day'], '主婚姻多波折、外家不和', 'inauspicious')
  if (SHI_E.includes(dsx)) add('十恶大败', ['day'], '禄绝之日，主财难聚', 'inauspicious')
  if (GU_LUAN.includes(dsx)) add('孤鸾煞', ['day'], '主婚姻迟滞不顺', 'inauspicious')
  if (LIU_XIU.includes(dsx)) add('六秀日', ['day'], '主秀气聪慧、才艺', 'auspicious')
  if (SHI_LING.includes(dsx)) add('十灵日', ['day'], '主灵性聪敏', 'auspicious')
  for (const k of ['day', 'hour'] as PillarKey[]) if (JIN_SHEN.includes(n.sexa[k])) add('金神', [k], '刚锐之气，喜火制', 'neutral')
  const seasonSets = [[sexaOf(8, 0), sexaOf(9, 11)], [sexaOf(6, 8), sexaOf(7, 9)], [sexaOf(2, 6), sexaOf(3, 5)], [sexaOf(0, 2), sexaOf(1, 3)]] // 冬春夏秋 of month
  const mSeason = Math.floor(((mb + 1) % 12) / 3)
  if (seasonSets[mSeason].includes(dsx)) add('四废', ['day'], '当令休囚之日，主志难伸', 'inauspicious')

  // 童子煞: 春秋寅子贵，冬夏卯未辰；金木马卯合，水火酉戌多，土命逢辰巳
  const tz1 = mSeason === 1 || mSeason === 3 ? [2, 0] : [3, 7, 4]
  const yNayin = nayinElement(n.sexa.year)
  const tz2 = yNayin === 'metal' || yNayin === 'wood' ? [6, 3] : yNayin === 'water' || yNayin === 'fire' ? [9, 10] : [4, 5]
  const tzPillars = (['day', 'hour'] as PillarKey[]).filter((k) => tz1.includes(n.branches[k]) || tz2.includes(n.branches[k]))
  add('童子煞', tzPillars, '主体弱多病、婚姻不顺（民俗）', 'inauspicious')

  // 天罗地网 by 年纳音: 火命逢戌亥为天罗，水土命逢辰巳为地网
  if (yNayin === 'fire' && KEYS.some((k) => n.branches[k] === 10) && KEYS.some((k) => n.branches[k] === 11))
    add('天罗', branchesAt([10, 11]), '主牢狱困顿', 'inauspicious')
  if ((yNayin === 'water' || yNayin === 'earth') && KEYS.some((k) => n.branches[k] === 4) && KEYS.some((k) => n.branches[k] === 5))
    add('地网', branchesAt([4, 5]), '主困顿缠绕', 'inauspicious')

  // 三奇: 甲戊庚 / 乙丙丁 / 壬癸辛 in sequence over 年月日 or 月日时
  const seqs: PillarKey[][] = [['year', 'month', 'day'], ['month', 'day', 'hour']]
  for (const seq of seqs) {
    const s = seq.map((k) => STEMS[n.stems[k]]).join('')
    const name = s === '甲戊庚' ? '天上三奇' : s === '乙丙丁' ? '地下三奇' : s === '壬癸辛' ? '人中三奇' : null
    if (name) add(name, seq, '三奇贵格，主卓越超群', 'auspicious')
  }

  return hits
}

export const pillarZh: Record<PillarKey, string> = { year: '年', month: '月', day: '日', hour: '时' }
export const branchName = (b: number) => BRANCHES[b]
