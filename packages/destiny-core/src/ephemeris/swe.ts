/**
 * Swiss Ephemeris (WebAssembly) — the single astronomical source for every chart in selfOS.
 *
 * `swisseph-wasm` bundles the Swiss Ephemeris 2.10 planetary, lunar and asteroid files for
 * 1800–2400 AD (sepl_18 / semo_18 / seas_18), so positions are the same as any desktop
 * programme built on Swiss Ephemeris: apparent geocentric, 0.001″ precision. The ~2.7 MB module
 * is loaded on first use, only on pages that cast charts.
 */
import type SwissEph from 'swisseph-wasm'

export const SE = {
  SUN: 0, MOON: 1, MERCURY: 2, VENUS: 3, MARS: 4, JUPITER: 5, SATURN: 6, URANUS: 7, NEPTUNE: 8, PLUTO: 9,
  MEAN_NODE: 10, TRUE_NODE: 11, MEAN_APOG: 12, OSCU_APOG: 13, EARTH: 14, CHIRON: 15, PHOLUS: 16,
  CERES: 17, PALLAS: 18, JUNO: 19, VESTA: 20,
} as const
export type SeBody = (typeof SE)[keyof typeof SE]

export const FLG = {
  SWIEPH: 2,
  MOSEPH: 4,
  SPEED: 256,
  EQUATORIAL: 2048,
  TOPOCTR: 32 * 1024,
  SIDEREAL: 64 * 1024,
} as const

/** Sidereal modes (swe_set_sid_mode) used by the Vedic engine. */
export const SIDM = {
  FAGAN_BRADLEY: 0,
  LAHIRI: 1,
  RAMAN: 3,
  KRISHNAMURTI: 5,
  YUKTESHWAR: 7,
  JN_BHASIN: 8,
  TRUE_CITRA: 27,
  TRUE_REVATI: 28,
  TRUE_PUSHYA: 29,
  LAHIRI_1940: 43,
  LAHIRI_VP285: 44,
} as const
export type SidMode = (typeof SIDM)[keyof typeof SIDM]

let loading: Promise<SwissEph> | null = null

/** Resolve the shared, initialised Swiss Ephemeris instance (loads the WASM once). */
export function getSwe(): Promise<SwissEph> {
  if (!loading) {
    loading = import('swisseph-wasm').then(async (mod) => {
      const swe = new mod.default()
      await swe.initSwissEph()
      return swe
    })
    loading.catch(() => (loading = null))
  }
  return loading
}

export interface BodyPosition {
  /** Ecliptic longitude 0–360 */
  lon: number
  /** Ecliptic latitude */
  lat: number
  /** Distance in AU */
  dist: number
  /** Longitude speed, °/day (negative = retrograde) */
  speed: number
}

/** Apparent geocentric ecliptic position for a UT Julian day. Pass FLG.SIDEREAL (after setSidereal) for sidereal. */
export function calc(swe: SwissEph, jdUt: number, body: SeBody, extraFlags = 0): BodyPosition {
  const x = swe.calc_ut(jdUt, body, FLG.SWIEPH | FLG.SPEED | extraFlags)
  return { lon: norm(x[0]), lat: x[1], dist: x[2], speed: x[3] }
}

export interface HousesResult {
  /** Cusps 1–12 (index 0 unused) */
  cusps: number[]
  asc: number
  mc: number
  armc: number
  vertex: number
  equatorialAsc: number
}

/** House cusps and angles. `hsys` is the Swiss Ephemeris letter: P Placidus, K Koch, E Equal, W Whole sign, O Porphyry, R Regiomontanus, C Campanus, B Alcabitius, M Morinus. */
export function houses(swe: SwissEph, jdUt: number, lat: number, lon: number, hsys: string, sidereal = false): HousesResult {
  const r = swe.houses_ex(jdUt, sidereal ? FLG.SIDEREAL : 0, lat, lon, hsys) as unknown as {
    cusps: Record<number, number>
    ascmc: Record<number, number>
  }
  const cusps = [0]
  for (let i = 1; i <= 12; i++) cusps.push(norm(r.cusps[i]))
  return {
    cusps,
    asc: norm(r.ascmc[0]),
    mc: norm(r.ascmc[1]),
    armc: r.ascmc[2],
    vertex: norm(r.ascmc[3]),
    equatorialAsc: norm(r.ascmc[4]),
  }
}

export function setSidereal(swe: SwissEph, mode: SidMode) {
  swe.set_sid_mode(mode, 0, 0)
}

export function ayanamsa(swe: SwissEph, jdUt: number, mode: SidMode): number {
  setSidereal(swe, mode)
  return swe.get_ayanamsa_ut(jdUt)
}

/** Mean obliquity of the ecliptic (degrees) — SE_ECL_NUT returns [true obliquity, mean obliquity, nutation lon, nutation obl]. */
export function obliquity(swe: SwissEph, jdUt: number): number {
  const x = swe.calc_ut(jdUt, -1, FLG.SWIEPH)
  return x[0]
}

/** Next UT at which the apparent Sun reaches ecliptic longitude `deg` after `jdStart`. */
export function sunCrossing(swe: SwissEph, deg: number, jdStart: number): number {
  return swe.solcross_ut(norm(deg), jdStart, FLG.SWIEPH)
}

/** Equation of time E = LAT − LMT in days (positive: sundial ahead of mean time). */
export function equationOfTime(swe: SwissEph, jdUt: number): number {
  return swe.time_equ(jdUt)
}

/** ΔT in days for the given UT. */
export function deltaT(swe: SwissEph, jdUt: number): number {
  return swe.deltat(jdUt)
}

export const norm = (deg: number) => ((deg % 360) + 360) % 360

/** Signed shortest arc from a to b, −180…180. */
export const diff = (a: number, b: number) => ((b - a + 540) % 360) - 180
