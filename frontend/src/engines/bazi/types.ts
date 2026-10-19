import type { FiveElement, PillarKey } from '@/types'
import type { CivilTime } from '../ephemeris/time'
import type { Relation } from './relations'
import type { ShenShaHit } from './shensha'
import type { StrengthResult } from './strength'

export interface BirthInput {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second?: number
  calendar: 'solar' | 'lunar'
  /** For lunar input: the month is a leap month (闰月) */
  lunarLeap?: boolean
  /** IANA zone name or fixed UTC offset in hours */
  timeZone: string | number
  longitude: number
  latitude: number
  gender: 'M' | 'F'
  place?: string
}

export interface BaziOptions {
  /** Use 真太阳时 (local apparent solar time) for the day and hour pillars */
  trueSolarTime: boolean
  /** 23:00–24:00: start the next day's pillar (traditional), or keep the day and only shift the hour stem (早晚子时) */
  lateZi: 'next-day' | 'same-day'
}

export const DEFAULT_BAZI_OPTIONS: BaziOptions = { trueSolarTime: true, lateZi: 'next-day' }

export interface HiddenStemInfo {
  stem: number
  stemChar: string
  element: FiveElement
  tenGod: string
  /** 本气 / 中气 / 余气 */
  rank: '本气' | '中气' | '余气'
}

export interface Pillar {
  key: PillarKey
  stem: number
  branch: number
  stemChar: string
  branchChar: string
  sexagenary: number
  stemElement: FiveElement
  branchElement: FiveElement
  /** 主星: 十神 of the stem (日主 for the day pillar) */
  stemTenGod: string
  hidden: HiddenStemInfo[]
  /** 星运: 日主 life stage on this branch */
  lifeStage: string
  /** 自坐: the pillar stem's own life stage on its branch */
  selfSeat: string
  naYin: string
  naYinElement: FiveElement
  /** The branch falls in the day pillar's 旬空 */
  kongWang: boolean
  /** The branch falls in the year pillar's 旬空 */
  kongWangYear: boolean
}

export interface LuckPillar {
  index: number
  sexagenary: number
  stemChar: string
  branchChar: string
  stemTenGod: string
  branchMainTenGod: string
  /** 周岁 at which this 大运 starts */
  startAge: number
  startYear: number
  endYear: number
  /** ISO date of 交运 */
  startDate: string
  lifeStage: string
  kongWang: boolean
}

export interface AnnualPillar {
  year: number
  /** 虚岁 */
  nominalAge: number
  /** 周岁 */
  age: number
  sexagenary: number
  stemChar: string
  branchChar: string
  stemTenGod: string
  branchMainTenGod: string
  lifeStage: string
}

export interface MonthlyPillar {
  /** 寅月 = 1 … 丑月 = 12 */
  index: number
  sexagenary: number
  stemChar: string
  branchChar: string
  stemTenGod: string
  branchMainTenGod: string
  /** Solar term that starts the month and its local time */
  term: string
  startsAt: string
}

export interface SolarTermMark {
  name: string
  /** Local civil time (ISO-like) */
  at: string
  jdUt: number
}

export interface BaziChart {
  input: BirthInput
  options: BaziOptions
  /** Resolved time used for the pillars */
  time: {
    /** Clock time in the birth zone */
    civil: CivilTime
    zoneLabel: string
    utc: string
    /** Standard (non-DST) local time */
    standard: string
    /** Local mean solar time */
    meanSolar: string
    /** Local apparent solar time */
    trueSolar: string
    /** Minutes between true solar and clock time */
    solarCorrectionMinutes: number
    dst: boolean
  }
  lunar: { text: string; year: number; month: number; day: number; leap: boolean; yearGanZhi: string; animal: string }
  sunSign: string
  dayMaster: { stem: number; stemChar: string; element: FiveElement; yang: boolean }
  pillars: Pillar[]
  /** 命宫 身宫 胎元 胎息 as 干支 strings */
  palaces: { mingGong: string; shenGong: string; taiYuan: string; taiXi: string; mingGongNaYin: string }
  kongWang: { day: string; year: string }
  terms: { previous: SolarTermMark; next: SolarTermMark; previousQi?: SolarTermMark; nextQi?: SolarTermMark }
  luck: {
    forward: boolean
    /** Days from birth to the relevant 节 */
    daysToTerm: number
    startAge: { years: number; months: number; days: number }
    startDate: string
    pillars: LuckPillar[]
  }
  strength: StrengthResult
  relations: Relation[]
  shensha: ShenShaHit[]
  /** Element tally of the eight characters, for the energy mapping */
  fiveElements: Record<FiveElement, number>
}
