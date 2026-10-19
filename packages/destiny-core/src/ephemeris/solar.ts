/**
 * Solar ephemeris abstraction for 八字: the only astronomy a BaZi chart needs is the Sun's
 * apparent longitude (for 节气), the moment it crosses a given longitude, and the equation of
 * time (for 真太阳时). Two backends:
 *
 *   swiss  — Swiss Ephemeris (AGPL / commercial), arcsecond precision, also serves astrology
 *   mit    — astronomy-engine (MIT), ~arcminute precision; 节气 moments agree to within a minute,
 *            which is far inside the tolerance of a month-pillar boundary
 *
 * Any function that takes a `SolarSource` accepts either a backend or a raw SwissEph instance.
 */
import type SwissEph from 'swisseph-wasm'
import { SE, calc, equationOfTime, sunCrossing, norm } from './swe'

export interface SolarEphemeris {
  readonly backend: 'swiss' | 'mit'
  /** Apparent geocentric ecliptic longitude of the Sun, degrees 0–360 */
  sunLongitude(jdUt: number): number
  /** First moment after jdStart when the Sun reaches `deg` (JD UT) */
  sunCrossing(deg: number, jdStart: number): number
  /** Equation of time, days (apparent − mean) */
  equationOfTime(jdUt: number): number
}

export type SolarSource = SolarEphemeris | SwissEph

const isSwe = (x: SolarSource): x is SwissEph => typeof (x as SwissEph).calc_ut === 'function'

export function fromSwe(swe: SwissEph): SolarEphemeris {
  return {
    backend: 'swiss',
    sunLongitude: (jd) => calc(swe, jd, SE.SUN).lon,
    sunCrossing: (deg, jd) => sunCrossing(swe, deg, jd),
    equationOfTime: (jd) => equationOfTime(swe, jd),
  }
}

export function resolveSolar(x: SolarSource): SolarEphemeris {
  return isSwe(x) ? fromSwe(x) : x
}

const JD_UNIX = 2440587.5
const jdToDate = (jd: number) => new Date((jd - JD_UNIX) * 86400000)
const dateToJd = (d: Date) => d.getTime() / 86400000 + JD_UNIX

let mitPromise: Promise<SolarEphemeris> | null = null

/** MIT backend, loaded on first use so apps that only ever use Swiss never ship it. */
export function getMitSolar(): Promise<SolarEphemeris> {
  if (!mitPromise) {
    mitPromise = import('astronomy-engine').then((A) => {
      const observer = new A.Observer(0, 0, 0)
      return {
        backend: 'mit' as const,
        sunLongitude: (jd) => norm(A.SunPosition(jdToDate(jd)).elon),
        sunCrossing: (deg, jd) => {
          // astronomy-engine brackets a monotonic longitude change, so search in short overlapping windows.
          for (let start = jd; start < jd + 400; start += 20) {
            const t = A.SearchSunLongitude(norm(deg), jdToDate(start), 22)
            if (t) {
              const found = dateToJd(t.date)
              if (found >= jd) return found
            }
          }
          throw new Error('SearchSunLongitude failed')
        },
        equationOfTime: (jd) => {
          const date = jdToDate(jd)
          const ra = A.Equator(A.Body.Sun, date, observer, true, true).ra // hours, true equinox of date
          const gast = A.SiderealTime(date) // hours
          const ut = ((jd + 0.5) % 1) * 24 // hours since 0h UT
          let eot = gast - ra - (ut - 12)
          eot = ((((eot + 12) % 24) + 24) % 24) - 12
          return eot / 24
        },
      }
    })
  }
  return mitPromise
}
