/**
 * 八字 reference tables: stems, branches, hidden stems, 纳音, 十神, 十二长生 and the
 * classical relation tables. Indices are 0-based throughout (甲 = 0, 子 = 0).
 */
import type { FiveElement } from '@/types'

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
export type Stem = (typeof STEMS)[number]
export type Branch = (typeof BRANCHES)[number]

export const STEM_ELEMENT: FiveElement[] = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water']
export const BRANCH_ELEMENT: FiveElement[] = ['water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water']
/** 阳 = true (甲丙戊庚壬 / 子寅辰午申戌) */
export const stemYang = (s: number) => s % 2 === 0
export const branchYang = (b: number) => b % 2 === 0

export const ELEMENT_ZH: Record<FiveElement, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }
export const ELEMENT_ORDER: FiveElement[] = ['wood', 'fire', 'earth', 'metal', 'water']
const EL_IDX: Record<FiveElement, number> = { wood: 0, fire: 1, earth: 2, metal: 3, water: 4 }
/** a 生 b */
export const generates = (a: FiveElement, b: FiveElement) => (EL_IDX[a] + 1) % 5 === EL_IDX[b]
/** a 克 b */
export const controls = (a: FiveElement, b: FiveElement) => (EL_IDX[a] + 2) % 5 === EL_IDX[b]

/** 藏干 by branch: [本气, 中气, 余气] as stem indices. */
export const HIDDEN_STEMS: number[][] = [
  [9], // 子: 癸
  [5, 9, 7], // 丑: 己 癸 辛
  [0, 2, 4], // 寅: 甲 丙 戊
  [1], // 卯: 乙
  [4, 1, 9], // 辰: 戊 乙 癸
  [2, 6, 4], // 巳: 丙 庚 戊
  [3, 5], // 午: 丁 己
  [5, 3, 1], // 未: 己 丁 乙
  [6, 8, 4], // 申: 庚 壬 戊
  [7], // 酉: 辛
  [4, 7, 3], // 戌: 戊 辛 丁
  [8, 0], // 亥: 壬 甲
]

/** 十神 of stem `s` relative to day master `dm`. */
export function tenGod(dm: number, s: number): string {
  const a = STEM_ELEMENT[dm]
  const b = STEM_ELEMENT[s]
  const same = stemYang(dm) === stemYang(s)
  if (a === b) return same ? '比肩' : '劫财'
  if (generates(a, b)) return same ? '食神' : '伤官'
  if (controls(a, b)) return same ? '偏财' : '正财'
  if (controls(b, a)) return same ? '七杀' : '正官'
  return same ? '偏印' : '正印'
}
export const TEN_GOD_SHORT: Record<string, string> = {
  比肩: '比', 劫财: '劫', 食神: '食', 伤官: '伤', 偏财: '才', 正财: '财', 七杀: '杀', 正官: '官', 偏印: '枭', 正印: '印',
}

export const NAYIN = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
  '泉中水', '屋上土', '霹雳火', '松柏木', '长流水', '沙中金', '山下火', '平地木', '壁上土', '金箔金',
  '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水',
]
/** 纳音 of a sexagenary index 0–59 */
export const nayin = (sexa: number) => NAYIN[Math.floor(sexa / 2)]
export const nayinElement = (sexa: number): FiveElement => {
  const ch = nayin(sexa).slice(-1)
  return ch === '金' ? 'metal' : ch === '木' ? 'wood' : ch === '水' ? 'water' : ch === '火' ? 'fire' : 'earth'
}

/** Sexagenary index from stem and branch indices (null if impossible parity). */
export function sexagenary(stem: number, branch: number): number {
  for (let i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === branch) return i
  throw new Error(`invalid 干支 ${stem}/${branch}`)
}
export const ganzhi = (sexa: number) => `${STEMS[sexa % 10]}${BRANCHES[sexa % 12]}`

/** 旬空: the two empty branches of the decade a sexagenary index belongs to. */
export function xunKong(sexa: number): [number, number] {
  const first = (10 - 2 * Math.floor(sexa / 10) + 12) % 12
  return [first, (first + 1) % 12]
}

export const LIFE_STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'] as const
/** Branch where each stem's 长生 begins */
const LIFE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3]
/** 十二长生 stage of stem `s` on branch `b` (阳顺阴逆). */
export function lifeStage(s: number, b: number): string {
  const start = LIFE_START[s]
  const step = stemYang(s) ? (b - start + 12) % 12 : (start - b + 12) % 12
  return LIFE_STAGES[step]
}

// ── Relations ──────────────────────────────────────────────────────
export const STEM_COMBINE: [number, number, FiveElement][] = [
  [0, 5, 'earth'], [1, 6, 'metal'], [2, 7, 'water'], [3, 8, 'wood'], [4, 9, 'fire'],
]
export const STEM_CLASH: [number, number][] = [[0, 6], [1, 7], [2, 8], [3, 9]]

export const BRANCH_SIX_COMBINE: [number, number, FiveElement][] = [
  [0, 1, 'earth'], [2, 11, 'wood'], [3, 10, 'fire'], [4, 9, 'metal'], [5, 8, 'water'], [6, 7, 'earth'],
]
export const BRANCH_TRINE: [number[], FiveElement][] = [
  [[8, 0, 4], 'water'], [[11, 3, 7], 'wood'], [[2, 6, 10], 'fire'], [[5, 9, 1], 'metal'],
]
export const BRANCH_DIRECTIONAL: [number[], FiveElement][] = [
  [[2, 3, 4], 'wood'], [[5, 6, 7], 'fire'], [[8, 9, 10], 'metal'], [[11, 0, 1], 'water'],
]
export const BRANCH_CLASH: [number, number][] = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]]
export const BRANCH_HARM: [number, number][] = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]]
export const BRANCH_BREAK: [number, number][] = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]]
/** 三刑 groups and the pairwise 刑 relations they imply, plus 子卯 and 自刑 */
export const BRANCH_PUNISH_GROUPS: [number[], string][] = [
  [[2, 5, 8], '无恩之刑'], [[1, 10, 7], '恃势之刑'],
]
export const BRANCH_PUNISH_PAIRS: [number, number, string][] = [
  [2, 5, '无恩之刑'], [5, 8, '无恩之刑'], [8, 2, '无恩之刑'],
  [1, 10, '恃势之刑'], [10, 7, '恃势之刑'], [7, 1, '恃势之刑'],
  [0, 3, '无礼之刑'],
]
export const BRANCH_SELF_PUNISH = [4, 6, 9, 11]

/** 五虎遁: month stem for a year stem and month branch (寅 = 2). */
export const monthStemFor = (yearStem: number, monthBranch: number) => ((yearStem % 5) * 2 + 2 + ((monthBranch - 2 + 12) % 12)) % 10
/** 五鼠遁: hour stem for a day stem and hour branch. */
export const hourStemFor = (dayStem: number, hourBranch: number) => ((dayStem % 5) * 2 + hourBranch) % 10

/** 节 longitudes (apparent Sun) that begin each month branch, 寅 = 315°. */
export const JIE_LONGITUDE_FOR_BRANCH = (branch: number) => (315 + ((branch - 2 + 12) % 12) * 30) % 360
export const SOLAR_TERMS = [
  '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰',
]
/** Name of the solar term at apparent longitude k·15° */
export const solarTermName = (lon: number) => SOLAR_TERMS[Math.round(((lon % 360) + 360) % 360 / 15) % 24]

export const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
export const SIGNS_ZH = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']
