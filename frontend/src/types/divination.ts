/**
 * Divination types. Charts are computed in the browser by the engines in `@/engines`
 * (Swiss Ephemeris); these shared primitives are used across the app and the graph API.
 */

export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water'
export type PillarKey = 'year' | 'month' | 'day' | 'hour'

/** Birth data entered by the user — the single source for all three chart systems. */
export interface BirthProfile {
  name?: string
  /** Civil date as entered (solar or lunar, per `calendar`) */
  year: number
  month: number
  day: number
  hour: number
  minute: number
  calendar: 'solar' | 'lunar'
  lunarLeap: boolean
  gender: 'M' | 'F'
  place: string
  latitude: number
  longitude: number
  /** IANA zone name, or fixed UTC offset in hours */
  timeZone: string | number
  /** 'auto': apply historical daylight-saving time from the zone database; 'ignore': read the clock as standard time */
  dst: 'auto' | 'ignore'
}

export type { BaziChart, BaziOptions, LuckPillar, AnnualPillar, MonthlyPillar, Pillar } from '@/engines/bazi/types'
export type { WesternChart, WesternSettings, PlacedBody, Aspect, HouseCusp } from '@/engines/western/chart'
export type { VedicChart, VedicSettings, Graha, DashaPeriod } from '@/engines/vedic/chart'
export type { ShadbalaEntry } from '@/engines/vedic/shadbala'

/** Compact innate-memory payload sent to POST /api/graph/inject-memory */
export interface InnateSummary {
  birth: BirthProfile
  bazi?: {
    pillars: string[]
    dayMaster: string
    fiveElements: Record<FiveElement, number>
    strength: string
    pattern: string
    favourable: FiveElement[]
  }
  western?: { sun: string; moon: string; ascendant: string; elements: Record<string, number> }
  vedic?: { lagna: string; moonNakshatra: string; currentDasha: string[]; shadbala: Record<string, number> }
}
