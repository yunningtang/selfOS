/** Types for /api/divination — BaZi (八字), Vedic (Jyotish) and ephemeris. */

export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

// ── BaZi ───────────────────────────────────────────────────────────
export interface BaziRequest {
  year: number
  month: number
  day: number
  hour: number
  calendar: 'solar' | 'lunar'
  gender: 'M' | 'F'
}

export type PillarKey = 'year' | 'month' | 'day' | 'hour'

export interface HiddenStem {
  stem: string
  element: FiveElement
  tenGod: string
}

export interface BaziPillar {
  key: PillarKey
  stem: string
  branch: string
  stemElement: FiveElement
  branchElement: FiveElement
  /** 十神 of the heavenly stem relative to the day master; '日主' for the day pillar. */
  stemTenGod: string
  hiddenStems: HiddenStem[]
  /** 纳音 */
  naYin: string
  /** 十二长生 stage of the day master on this branch */
  lifeStage: string
}

export interface LuckPillar {
  startAge: number
  startYear: number
  stem: string
  branch: string
}

export interface AnnualPillar {
  year: number
  age: number
  stem: string
  branch: string
}

export interface BranchRelation {
  /** 六合 三合 三会 相冲 相刑 相害 自刑 … */
  type: string
  branches: string[]
  pillars: PillarKey[]
  note?: string
}

export interface ShenSha {
  name: string
  /** Branches that carry this star for this chart */
  branches: string[]
  /** Natal pillars where it appears (empty when it is only activated by luck cycles) */
  pillars: PillarKey[]
  note?: string
}

export interface BaziChart {
  input: BaziRequest
  solarDate: string
  lunarDate: string
  dayMaster: { stem: string; element: FiveElement }
  pillars: BaziPillar[]
  /** Quantified element strength, including hidden-stem weighting */
  fiveElements: Record<FiveElement, number>
  luckStart: string
  luckPillars: LuckPillar[]
  annualPillars: AnnualPillar[]
  relations: BranchRelation[]
  shensha: ShenSha[]
}

// ── Vedic ──────────────────────────────────────────────────────────
export type GrahaId = 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'

export interface VedicRequest {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  latitude: number
  longitude: number
  timezone: number
  ayanamsa?: string
}

export interface VedicPlanet {
  id: GrahaId
  name: string
  /** Sidereal longitude 0–360 */
  longitude: number
  /** 0 = Aries … 11 = Pisces */
  sign: number
  nakshatra: string
  pada: number
  /** Whole-sign house from the ascendant, 1–12 */
  house: number
  retrograde: boolean
  dignity?: 'exalted' | 'own' | 'moolatrikona' | 'debilitated' | null
}

export type DivisionalKey = 'D1' | 'D9' | 'D10'

export interface DashaPeriod {
  lord: GrahaId
  start: string
  end: string
  sub?: DashaPeriod[]
}

export interface VedicChart {
  input: VedicRequest
  ayanamsa: { name: string; value: number }
  ascendant: { longitude: number; sign: number; nakshatra: string; pada: number }
  planets: VedicPlanet[]
  /** Sign index (0–11) of the ascendant and each graha in each divisional chart */
  divisional: Record<DivisionalKey, { ascendant: number; planets: Record<GrahaId, number> }>
  dasha: {
    system: 'Vimshottari'
    periods: DashaPeriod[]
    current: { maha: GrahaId; antar: GrahaId; since: string; until: string }
  }
}

export interface ShadbalaEntry {
  planet: GrahaId
  /** Six strengths in rupas */
  sthana: number
  dig: number
  kala: number
  chesta: number
  naisargika: number
  drik: number
  total: number
  required: number
}

export interface ShadbalaResult {
  input: VedicRequest
  planets: ShadbalaEntry[]
}

export interface PlanetPosition {
  jd: number
  planet: string
  longitude: number
  latitude: number
  distance: number
  speed: number
}
