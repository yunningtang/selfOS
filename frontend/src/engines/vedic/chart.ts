/**
 * Jyotish natal computation: sidereal positions and lagna from the Swiss Ephemeris, nakshatras,
 * sixteen Parashara vargas, panchanga at birth, Vimshottari dasha, Shadbala and Ashtakavarga.
 */
import type SwissEph from 'swisseph-wasm'
import { FLG, SE, SIDM, calc, deltaT, diff, houses, norm, setSidereal, type SidMode } from '../ephemeris/swe'
import { equationOfTime } from '../ephemeris/swe'
import { fmtCivil, resolveInstant, utcFromJd, type CivilTime } from '../ephemeris/time'
import { computeShadbala, type ShadbalaEntry } from './shadbala'
import {
  BAV_TABLE, DASHA_ORDER, DASHA_YEARS, EXALTATION, GRAHA_IDS, GRAHA_NAMES, KARANA_CYCLE, MOOLATRIKONA, NAKSHATRAS,
  NAK_LORD, NATURAL_RELATION, OWN_SIGNS, RELATION_NAMES, SIGN_LORD, TITHI_NAMES, VARA_NAMES, VARGA_LIST, YOGA_NAMES,
  type GrahaIdx, type VargaD,
} from './tables'
import { vargaSign } from './vargas'

export const AYANAMSAS: Record<string, { mode: SidMode; name: string }> = {
  LAHIRI: { mode: SIDM.LAHIRI, name: 'Lahiri (Chitrapaksha)' },
  TRUE_CITRA: { mode: SIDM.TRUE_CITRA, name: 'True Chitrapaksha' },
  RAMAN: { mode: SIDM.RAMAN, name: 'B. V. Raman' },
  KP: { mode: SIDM.KRISHNAMURTI, name: 'Krishnamurti (KP)' },
  YUKTESHWAR: { mode: SIDM.YUKTESHWAR, name: 'Sri Yukteshwar' },
  JN_BHASIN: { mode: SIDM.JN_BHASIN, name: 'J. N. Bhasin' },
  FAGAN_BRADLEY: { mode: SIDM.FAGAN_BRADLEY, name: 'Fagan–Bradley' },
}

export interface VedicSettings {
  ayanamsa: keyof typeof AYANAMSAS
  nodeType: 'true' | 'mean'
  /** Days per dasha year: 365.25 (most software), 360 (savana), 365.2564 (sidereal) */
  dashaYearDays: number
  /** Bhava chalit system: Sripati (Porphyry) or KP (Placidus) */
  chalit: 'sripati' | 'kp'
}
export const DEFAULT_VEDIC_SETTINGS: VedicSettings = { ayanamsa: 'LAHIRI', nodeType: 'true', dashaYearDays: 365.25, chalit: 'sripati' }

export interface VedicInput extends CivilTime {
  timeZone: string | number
  longitude: number
  latitude: number
  place?: string
  ignoreDst?: boolean
}

export type VedicDignity = 'exalted' | 'moolatrikona' | 'own' | 'adhimitra' | 'mitra' | 'sama' | 'satru' | 'adhisatru' | 'debilitated'

export interface Graha {
  idx: GrahaIdx
  id: string
  name: string
  lon: number
  lat: number
  speed: number
  retrograde: boolean
  combust: boolean
  sign: number
  signDeg: number
  nakshatra: number
  nakshatraName: string
  nakshatraLord: GrahaIdx
  pada: number
  /** Whole-sign house from lagna */
  house: number
  /** Bhava chalit house */
  chalitHouse: number
  dignity: VedicDignity
  /** Compound relationship with each graha Su…Sa, 0 Adhisatru … 4 Adhimitra */
  relation: number[]
  vargas: Record<number, number>
  declination: number
}

export interface DashaPeriod {
  lord: GrahaIdx
  level: 1 | 2 | 3
  startJd: number
  endJd: number
  start: string
  end: string
  sub?: DashaPeriod[]
}

export interface VedicChart {
  input: VedicInput
  settings: VedicSettings
  jdUt: number
  utc: string
  zoneLabel: string
  ayanamsa: { key: string; name: string; value: number }
  lagna: { lon: number; sign: number; signDeg: number; nakshatra: number; nakshatraName: string; pada: number; vargas: Record<number, number> }
  grahas: Graha[]
  chalit: { system: string; cusps: number[] }
  panchanga: {
    tithi: { index: number; number: number; name: string; paksha: 'Shukla' | 'Krishna'; elapsed: number }
    vara: { index: number; name: string; lord: GrahaIdx }
    nakshatra: { index: number; name: string; pada: number; lord: GrahaIdx; elapsed: number }
    yoga: { index: number; name: string }
    karana: { index: number; name: string }
    sunrise: string
    sunset: string
    isDaytime: boolean
  }
  dasha: { periods: DashaPeriod[]; current: DashaPeriod[] }
  shadbala: ShadbalaEntry[]
  ashtakavarga: { bav: Record<number, number[]>; sav: number[] }
}

const iso = (jd: number, offsetMin: number) => fmtCivil(utcFromJd(jd + offsetMin / 1440), false).slice(0, 16)
const dateOnly = (jd: number, offsetMin: number) => fmtCivil(utcFromJd(jd + offsetMin / 1440)).slice(0, 10)

function nakOf(lon: number) {
  const span = 360 / 27
  const i = Math.floor(lon / span)
  const within = lon - i * span
  return { index: i, name: NAKSHATRAS[i], pada: Math.floor(within / (span / 4)) + 1, elapsed: within / span, lord: NAK_LORD[i] }
}

function meanLongitudes(jdTt: number) {
  const T = (jdTt - 2451545) / 36525
  return {
    sun: norm(280.46646 + 36000.76983 * T + 0.0003032 * T * T),
    planets: {
      3: norm(252.250906 + 149474.0722491 * T),
      5: norm(181.979801 + 58519.213030 * T),
      2: norm(355.433 + 19141.6964471 * T),
      4: norm(34.351519 + 3036.3027748 * T),
      6: norm(50.077444 + 1223.5110686 * T),
    } as Record<number, number>,
  }
}

function sunrise(swe: SwissEph, jdStart: number, lon: number, lat: number, set = false): number {
  const r = swe.rise_trans(jdStart, SE.SUN, '', FLG.SWIEPH, set ? 2 : 1, [lon, lat, 0], 0, 0)
  return r ? r[0] : NaN
}

export function vimshottari(moonLon: number, birthJd: number, yearDays: number, offsetMin: number, levels = 2): DashaPeriod[] {
  const nak = nakOf(moonLon)
  const startIdx = DASHA_ORDER.indexOf(nak.lord)
  let t = birthJd - nak.elapsed * DASHA_YEARS[nak.lord] * yearDays
  const build = (lord: GrahaIdx, start: number, len: number, level: 1 | 2 | 3, orderStart: number): DashaPeriod => {
    const p: DashaPeriod = { lord, level, startJd: start, endJd: start + len, start: dateOnly(start, offsetMin), end: dateOnly(start + len, offsetMin) }
    if (level < levels) {
      p.sub = []
      let s = start
      for (let j = 0; j < 9; j++) {
        const sub = DASHA_ORDER[(orderStart + j) % 9]
        const sl = (len * DASHA_YEARS[sub]) / 120
        p.sub.push(build(sub, s, sl, (level + 1) as 2 | 3, (orderStart + j) % 9))
        s += sl
      }
    }
    return p
  }
  const out: DashaPeriod[] = []
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(startIdx + i) % 9]
    const len = DASHA_YEARS[lord] * yearDays
    out.push(build(lord, t, len, 1, (startIdx + i) % 9))
    t += len
  }
  return out
}

/** Sub-periods of any period (for lazily expanding pratyantar / sookshma). */
export function subPeriods(p: DashaPeriod, offsetMin: number): DashaPeriod[] {
  const len = p.endJd - p.startJd
  const orderStart = DASHA_ORDER.indexOf(p.lord)
  const out: DashaPeriod[] = []
  let s = p.startJd
  for (let j = 0; j < 9; j++) {
    const lord = DASHA_ORDER[(orderStart + j) % 9]
    const sl = (len * DASHA_YEARS[lord]) / 120
    out.push({ lord, level: Math.min(3, p.level + 1) as 2 | 3, startJd: s, endJd: s + sl, start: dateOnly(s, offsetMin), end: dateOnly(s + sl, offsetMin) })
    s += sl
  }
  return out
}

export function computeVedic(swe: SwissEph, input: VedicInput, settings: VedicSettings): VedicChart {
  const inst = resolveInstant(input, input.timeZone, { ignoreDst: input.ignoreDst })
  const jd = inst.jdUt
  const ay = AYANAMSAS[settings.ayanamsa]
  setSidereal(swe, ay.mode)
  const ayanamsaValue = swe.get_ayanamsa_ut(jd)

  // Lagna and chalit cusps (sidereal)
  const whole = houses(swe, jd, input.latitude, input.longitude, 'W', true)
  const chalitH = houses(swe, jd, input.latitude, input.longitude, settings.chalit === 'kp' ? 'P' : 'O', true)
  const lagnaLon = whole.asc
  const lagnaSign = Math.floor(lagnaLon / 30)
  const chalitHouseOf = (lon: number) => {
    // Bhava spans from the midpoint between consecutive cusps (bhava sandhi) — Sripati convention.
    for (let i = 1; i <= 12; i++) {
      const c = chalitH.cusps[i]
      const prev = chalitH.cusps[i === 1 ? 12 : i - 1]
      const next = chalitH.cusps[i === 12 ? 1 : i + 1]
      const start = norm(c + diff(c, prev) / 2)
      const end = norm(c + diff(c, next) / 2)
      if (norm(lon - start) < norm(end - start)) return i
    }
    return 12
  }

  // Positions
  const raw: { lon: number; lat: number; speed: number; dec: number }[] = []
  const seBodies = [SE.SUN, SE.MOON, SE.MARS, SE.MERCURY, SE.JUPITER, SE.VENUS, SE.SATURN]
  for (const b of seBodies) {
    const p = calc(swe, jd, b, FLG.SIDEREAL)
    const eq = calc(swe, jd, b, FLG.EQUATORIAL)
    raw.push({ lon: p.lon, lat: p.lat, speed: p.speed, dec: eq.lat })
  }
  const node = calc(swe, jd, settings.nodeType === 'true' ? SE.TRUE_NODE : SE.MEAN_NODE, FLG.SIDEREAL)
  raw.push({ lon: node.lon, lat: 0, speed: node.speed, dec: 0 })
  raw.push({ lon: norm(node.lon + 180), lat: 0, speed: node.speed, dec: 0 })

  const signs = raw.map((r) => Math.floor(r.lon / 30))
  const houseOf = (sign: number) => ((sign - lagnaSign + 12) % 12) + 1

  // Compound relationships (Su…Sa)
  const relation: number[][] = []
  for (let a = 0; a < 7; a++) {
    relation.push([])
    for (let b = 0; b < 7; b++) {
      if (a === b) {
        relation[a].push(2)
        continue
      }
      const nat = NATURAL_RELATION[a][b]
      const h = ((signs[b] - signs[a] + 12) % 12) + 1
      const temp = [2, 3, 4, 10, 11, 12].includes(h) ? 1 : -1
      relation[a].push(2 + nat + temp)
    }
  }

  const sunLon = raw[0].lon
  const COMBUST = [NaN, 12, 17, 14, 11, 10, 15]
  const COMBUST_RETRO = [NaN, 12, 17, 12, 11, 8, 15]
  const grahas: Graha[] = raw.map((r, i) => {
    const idx = i as GrahaIdx
    const sign = signs[i]
    const deg = r.lon - sign * 30
    const nak = nakOf(r.lon)
    let dignity: VedicDignity
    const ex = EXALTATION[idx]
    const mt = MOOLATRIKONA[idx]
    if (ex && ex[0] === sign) dignity = 'exalted'
    else if (ex && (ex[0] + 6) % 12 === sign) dignity = 'debilitated'
    else if (mt && mt[0] === sign && deg >= mt[1] && deg < mt[2]) dignity = 'moolatrikona'
    else if (OWN_SIGNS[idx]?.includes(sign)) dignity = 'own'
    else if (idx < 7) dignity = (['adhisatru', 'satru', 'sama', 'mitra', 'adhimitra'] as VedicDignity[])[relation[idx][SIGN_LORD[sign]]]
    else dignity = 'sama'
    const vargas: Record<number, number> = {}
    for (const v of VARGA_LIST) vargas[v.d] = vargaSign(r.lon, v.d)
    const retro = r.speed < 0
    const combust = idx >= 1 && idx <= 6 && Math.abs(diff(sunLon, r.lon)) < (retro ? COMBUST_RETRO[idx] : COMBUST[idx])
    return {
      idx, id: GRAHA_IDS[idx], name: GRAHA_NAMES[idx], lon: r.lon, lat: r.lat, speed: r.speed, retrograde: retro, combust,
      sign, signDeg: deg, nakshatra: nak.index, nakshatraName: nak.name, nakshatraLord: nak.lord, pada: nak.pada,
      house: houseOf(sign), chalitHouse: chalitHouseOf(r.lon), dignity, relation: idx < 7 ? relation[idx] : [],
      vargas, declination: r.dec,
    }
  })

  // ── Panchanga ─────────────────────────────────────────────────
  const offset = inst.offsetMinutes
  let rise = sunrise(swe, jd - 1.2, input.longitude, input.latitude)
  if (rise > jd) rise = sunrise(swe, jd - 2.2, input.longitude, input.latitude)
  const nextRise = sunrise(swe, rise + 0.1, input.longitude, input.latitude)
  const set = sunrise(swe, rise, input.longitude, input.latitude, true)
  const isDaytime = jd < set
  const moonLon = raw[1].lon
  const elong = norm(moonLon - sunLon)
  const tithiIdx = Math.floor(elong / 12)
  const yogaIdx = Math.floor(norm(sunLon + moonLon) / (360 / 27))
  const kar = Math.floor(elong / 6)
  const karanaName = kar === 0 ? 'Kimstughna' : kar >= 57 ? ['Shakuni', 'Chatushpada', 'Naga'][kar - 57] : KARANA_CYCLE[(kar - 1) % 7]
  const riseLocal = rise + offset / 1440
  const ahargana = Math.floor(riseLocal + 0.5) - 588466
  const weekday = ((ahargana + 5) % 7 + 7) % 7
  const moonNak = nakOf(moonLon)

  // ── Dasha ─────────────────────────────────────────────────────
  const periods = vimshottari(moonLon, jd, settings.dashaYearDays, offset, 2)
  const now = (Date.now() / 86400000) + 2440587.5
  const current: DashaPeriod[] = []
  const maha = periods.find((p) => p.startJd <= now && now < p.endJd)
  if (maha) {
    current.push(maha)
    const antar = maha.sub?.find((p) => p.startJd <= now && now < p.endJd)
    if (antar) {
      current.push(antar)
      const prat = subPeriods(antar, offset).find((p) => p.startJd <= now && now < p.endJd)
      if (prat) current.push(prat)
    }
  }

  // ── Shadbala ──────────────────────────────────────────────────
  const lmtJd = jd + input.longitude / 15 / 24
  const lmt = utcFromJd(lmtJd)
  const jdTt = jd + deltaT(swe, jd)
  const shadbala = computeShadbala({
    grahas: grahas.map((g) => ({ lon: g.lon, speed: g.speed, declination: g.declination, sign: g.sign, house: g.house, relation: g.relation })),
    lagna: lagnaLon,
    lmtHours: lmt.hour + lmt.minute / 60 + lmt.second / 3600,
    hoursSinceSunrise: (jd - rise) * 24,
    dayLengthHours: (set - rise) * 24,
    nightLengthHours: (nextRise - set) * 24,
    isDaytime, ahargana, weekday,
    meanLon: meanLongitudes(jdTt),
    waxing: elong < 180,
    sunMoonElongation: elong,
  })

  // ── Ashtakavarga ──────────────────────────────────────────────
  const refs = [...signs.slice(0, 7), lagnaSign]
  const bav: Record<number, number[]> = {}
  const sav = Array(12).fill(0)
  for (let p = 0; p < 7; p++) {
    bav[p] = Array(12).fill(0)
    for (let s = 0; s < 12; s++) {
      let n = 0
      for (let c = 0; c < 8; c++) {
        const h = ((s - refs[c] + 12) % 12) + 1
        if (BAV_TABLE[p][c].includes(h)) n++
      }
      bav[p][s] = n
      sav[s] += n
    }
  }

  const lagnaNak = nakOf(lagnaLon)
  const lagnaVargas: Record<number, number> = {}
  for (const v of VARGA_LIST) lagnaVargas[v.d] = vargaSign(lagnaLon, v.d)

  void equationOfTime
  return {
    input, settings, jdUt: jd, utc: fmtCivil(inst.utc), zoneLabel: inst.zoneLabel,
    ayanamsa: { key: settings.ayanamsa, name: ay.name, value: ayanamsaValue },
    lagna: { lon: lagnaLon, sign: lagnaSign, signDeg: lagnaLon - lagnaSign * 30, nakshatra: lagnaNak.index, nakshatraName: lagnaNak.name, pada: lagnaNak.pada, vargas: lagnaVargas },
    grahas,
    chalit: { system: settings.chalit === 'kp' ? 'KP (Placidus)' : 'Sripati', cusps: chalitH.cusps },
    panchanga: {
      tithi: { index: tithiIdx, number: (tithiIdx % 15) + 1, name: tithiIdx % 15 === 14 ? (tithiIdx < 15 ? 'Purnima' : 'Amavasya') : TITHI_NAMES[tithiIdx % 15], paksha: tithiIdx < 15 ? 'Shukla' : 'Krishna', elapsed: (elong % 12) / 12 },
      vara: { index: weekday, name: VARA_NAMES[weekday], lord: weekday as GrahaIdx },
      nakshatra: { index: moonNak.index, name: moonNak.name, pada: moonNak.pada, lord: moonNak.lord, elapsed: moonNak.elapsed },
      yoga: { index: yogaIdx, name: YOGA_NAMES[yogaIdx] },
      karana: { index: kar, name: karanaName },
      sunrise: iso(rise, offset), sunset: iso(set, offset), isDaytime,
    },
    dasha: { periods, current },
    shadbala,
    ashtakavarga: { bav, sav },
  }
}

export const relationName = (i: number) => RELATION_NAMES[i]
export const vargaOf = (lon: number, d: VargaD) => vargaSign(lon, d)
