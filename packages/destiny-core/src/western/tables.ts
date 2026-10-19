/** Western (tropical) astrology reference tables, with Chinese labels as used by Chinese chart apps. */
import { SE } from '../ephemeris/swe'

export type BodyId =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'
  | 'chiron' | 'northNode' | 'southNode' | 'lilith' | 'ceres' | 'pallas' | 'juno' | 'vesta'
  | 'asc' | 'mc' | 'dsc' | 'ic' | 'fortune' | 'vertex'

export interface BodyMeta {
  id: BodyId
  en: string
  zh: string
  glyph: string
  /** Swiss Ephemeris body, undefined for computed points */
  se?: number
  kind: 'luminary' | 'planet' | 'outer' | 'asteroid' | 'node' | 'point' | 'angle'
}

export const BODIES: BodyMeta[] = [
  { id: 'sun', en: 'Sun', zh: '太阳', glyph: '☉\uFE0E', se: SE.SUN, kind: 'luminary' },
  { id: 'moon', en: 'Moon', zh: '月亮', glyph: '☽\uFE0E', se: SE.MOON, kind: 'luminary' },
  { id: 'mercury', en: 'Mercury', zh: '水星', glyph: '☿\uFE0E', se: SE.MERCURY, kind: 'planet' },
  { id: 'venus', en: 'Venus', zh: '金星', glyph: '♀\uFE0E', se: SE.VENUS, kind: 'planet' },
  { id: 'mars', en: 'Mars', zh: '火星', glyph: '♂\uFE0E', se: SE.MARS, kind: 'planet' },
  { id: 'jupiter', en: 'Jupiter', zh: '木星', glyph: '♃\uFE0E', se: SE.JUPITER, kind: 'planet' },
  { id: 'saturn', en: 'Saturn', zh: '土星', glyph: '♄\uFE0E', se: SE.SATURN, kind: 'planet' },
  { id: 'uranus', en: 'Uranus', zh: '天王星', glyph: '♅\uFE0E', se: SE.URANUS, kind: 'outer' },
  { id: 'neptune', en: 'Neptune', zh: '海王星', glyph: '♆\uFE0E', se: SE.NEPTUNE, kind: 'outer' },
  { id: 'pluto', en: 'Pluto', zh: '冥王星', glyph: '♇\uFE0E', se: SE.PLUTO, kind: 'outer' },
  { id: 'chiron', en: 'Chiron', zh: '凯龙星', glyph: '⚷\uFE0E', se: SE.CHIRON, kind: 'asteroid' },
  { id: 'northNode', en: 'North Node', zh: '北交点', glyph: '☊\uFE0E', kind: 'node' },
  { id: 'southNode', en: 'South Node', zh: '南交点', glyph: '☋\uFE0E', kind: 'node' },
  { id: 'lilith', en: 'Lilith', zh: '莉莉丝', glyph: '⚸\uFE0E', se: SE.MEAN_APOG, kind: 'point' },
  { id: 'ceres', en: 'Ceres', zh: '谷神星', glyph: '⚳\uFE0E', se: SE.CERES, kind: 'asteroid' },
  { id: 'pallas', en: 'Pallas', zh: '智神星', glyph: '⚴\uFE0E', se: SE.PALLAS, kind: 'asteroid' },
  { id: 'juno', en: 'Juno', zh: '婚神星', glyph: '⚵\uFE0E', se: SE.JUNO, kind: 'asteroid' },
  { id: 'vesta', en: 'Vesta', zh: '灶神星', glyph: '⚶\uFE0E', se: SE.VESTA, kind: 'asteroid' },
  { id: 'asc', en: 'Ascendant', zh: '上升', glyph: 'AC', kind: 'angle' },
  { id: 'mc', en: 'Midheaven', zh: '天顶', glyph: 'MC', kind: 'angle' },
  { id: 'dsc', en: 'Descendant', zh: '下降', glyph: 'DC', kind: 'angle' },
  { id: 'ic', en: 'Imum Coeli', zh: '天底', glyph: 'IC', kind: 'angle' },
  { id: 'fortune', en: 'Part of Fortune', zh: '福点', glyph: '⊗\uFE0E', kind: 'point' },
  { id: 'vertex', en: 'Vertex', zh: '宿命点', glyph: 'Vx', kind: 'point' },
]
export const BODY_META = Object.fromEntries(BODIES.map((b) => [b.id, b])) as Record<BodyId, BodyMeta>

export const SIGNS = [
  { en: 'Aries', zh: '白羊座', glyph: '♈\uFE0E', element: 'fire', modality: 'cardinal', ruler: 'mars', modernRuler: 'mars' },
  { en: 'Taurus', zh: '金牛座', glyph: '♉\uFE0E', element: 'earth', modality: 'fixed', ruler: 'venus', modernRuler: 'venus' },
  { en: 'Gemini', zh: '双子座', glyph: '♊\uFE0E', element: 'air', modality: 'mutable', ruler: 'mercury', modernRuler: 'mercury' },
  { en: 'Cancer', zh: '巨蟹座', glyph: '♋\uFE0E', element: 'water', modality: 'cardinal', ruler: 'moon', modernRuler: 'moon' },
  { en: 'Leo', zh: '狮子座', glyph: '♌\uFE0E', element: 'fire', modality: 'fixed', ruler: 'sun', modernRuler: 'sun' },
  { en: 'Virgo', zh: '处女座', glyph: '♍\uFE0E', element: 'earth', modality: 'mutable', ruler: 'mercury', modernRuler: 'mercury' },
  { en: 'Libra', zh: '天秤座', glyph: '♎\uFE0E', element: 'air', modality: 'cardinal', ruler: 'venus', modernRuler: 'venus' },
  { en: 'Scorpio', zh: '天蝎座', glyph: '♏\uFE0E', element: 'water', modality: 'fixed', ruler: 'mars', modernRuler: 'pluto' },
  { en: 'Sagittarius', zh: '射手座', glyph: '♐\uFE0E', element: 'fire', modality: 'mutable', ruler: 'jupiter', modernRuler: 'jupiter' },
  { en: 'Capricorn', zh: '摩羯座', glyph: '♑\uFE0E', element: 'earth', modality: 'cardinal', ruler: 'saturn', modernRuler: 'saturn' },
  { en: 'Aquarius', zh: '水瓶座', glyph: '♒\uFE0E', element: 'air', modality: 'fixed', ruler: 'saturn', modernRuler: 'uranus' },
  { en: 'Pisces', zh: '双鱼座', glyph: '♓\uFE0E', element: 'water', modality: 'mutable', ruler: 'jupiter', modernRuler: 'neptune' },
] as const
export type WElement = (typeof SIGNS)[number]['element']
export type Modality = (typeof SIGNS)[number]['modality']

export const ELEMENT_ZH: Record<WElement, string> = { fire: '火象', earth: '土象', air: '风象', water: '水象' }
export const MODALITY_ZH: Record<Modality, string> = { cardinal: '基本', fixed: '固定', mutable: '变动' }

/** Exaltation sign for the classical bodies */
export const EXALTATION: Partial<Record<BodyId, number>> = { sun: 0, moon: 1, mercury: 5, venus: 11, mars: 9, jupiter: 3, saturn: 6 }

export interface AspectDef {
  id: string
  en: string
  zh: string
  angle: number
  glyph: string
  /** Default orb in degrees */
  orb: number
  major: boolean
  tone: 'harmony' | 'tension' | 'neutral'
}

/** Default aspect set and orbs, in the convention common to Chinese chart apps (luminaries get +1°). */
export const ASPECTS: AspectDef[] = [
  { id: 'conjunction', en: 'Conjunction', zh: '合相', angle: 0, glyph: '☌\uFE0E', orb: 8, major: true, tone: 'neutral' },
  { id: 'opposition', en: 'Opposition', zh: '对分相', angle: 180, glyph: '☍\uFE0E', orb: 8, major: true, tone: 'tension' },
  { id: 'trine', en: 'Trine', zh: '三分相', angle: 120, glyph: '△\uFE0E', orb: 7, major: true, tone: 'harmony' },
  { id: 'square', en: 'Square', zh: '四分相', angle: 90, glyph: '□\uFE0E', orb: 7, major: true, tone: 'tension' },
  { id: 'sextile', en: 'Sextile', zh: '六分相', angle: 60, glyph: '⚹\uFE0E', orb: 5, major: true, tone: 'harmony' },
  { id: 'quincunx', en: 'Quincunx', zh: '梅花相', angle: 150, glyph: '⚻\uFE0E', orb: 3, major: false, tone: 'tension' },
  { id: 'semisextile', en: 'Semi-sextile', zh: '半六分相', angle: 30, glyph: '⚺\uFE0E', orb: 2, major: false, tone: 'neutral' },
  { id: 'semisquare', en: 'Semi-square', zh: '半刑相', angle: 45, glyph: '∠\uFE0E', orb: 2, major: false, tone: 'tension' },
  { id: 'sesquiquadrate', en: 'Sesquiquadrate', zh: '补八分相', angle: 135, glyph: '⚼\uFE0E', orb: 2, major: false, tone: 'tension' },
  { id: 'quintile', en: 'Quintile', zh: '五分相', angle: 72, glyph: 'Q', orb: 1.5, major: false, tone: 'harmony' },
  { id: 'biquintile', en: 'Bi-quintile', zh: '倍五分相', angle: 144, glyph: 'bQ', orb: 1.5, major: false, tone: 'harmony' },
]

export const HOUSE_SYSTEMS = [
  { code: 'P', en: 'Placidus', zh: '普拉西德' },
  { code: 'K', en: 'Koch', zh: '科赫' },
  { code: 'E', en: 'Equal', zh: '等宫制' },
  { code: 'W', en: 'Whole sign', zh: '整宫制' },
  { code: 'O', en: 'Porphyry', zh: '波菲利' },
  { code: 'R', en: 'Regiomontanus', zh: '雷格蒙塔努斯' },
  { code: 'C', en: 'Campanus', zh: '坎帕努斯' },
  { code: 'B', en: 'Alcabitius', zh: '阿卡比特斯' },
  { code: 'M', en: 'Morinus', zh: '莫林' },
] as const
export type HouseSystemCode = (typeof HOUSE_SYSTEMS)[number]['code']

export const HOUSE_ZH = ['命宫', '财帛宫', '兄弟宫', '田宅宫', '子女宫', '奴仆宫', '夫妻宫', '疾厄宫', '迁移宫', '官禄宫', '福德宫', '玄秘宫']
