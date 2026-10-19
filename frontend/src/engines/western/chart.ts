/**
 * Western natal chart: tropical, geocentric, apparent positions from the Swiss Ephemeris;
 * house cusps from the Swiss Ephemeris house routines; aspects by orb with applying/separating
 * from the bodies' daily motion.
 */
import type SwissEph from 'swisseph-wasm'
import { SE, calc, diff, houses, norm, type SeBody } from '../ephemeris/swe'
import { resolveInstant, type CivilTime } from '../ephemeris/time'
import {
  ASPECTS, BODIES, BODY_META, EXALTATION, SIGNS, type AspectDef, type BodyId, type HouseSystemCode, type Modality, type WElement,
} from './tables'

export interface WesternSettings {
  houseSystem: HouseSystemCode
  nodeType: 'true' | 'mean'
  /** Include the four main asteroids */
  asteroids: boolean
  /** Orb overrides by aspect id */
  orbs?: Partial<Record<string, number>>
  /** Extra orb for Sun/Moon aspects */
  luminaryBonus: number
  /** Modern (outer-planet) rulers for Scorpio/Aquarius/Pisces */
  modernRulers: boolean
}
export const DEFAULT_WESTERN_SETTINGS: WesternSettings = { houseSystem: 'P', nodeType: 'true', asteroids: false, luminaryBonus: 1, modernRulers: true }

export interface WesternInput extends CivilTime {
  timeZone: string | number
  longitude: number
  latitude: number
  place?: string
}

export type Dignity = 'domicile' | 'exaltation' | 'detriment' | 'fall' | null

export interface PlacedBody {
  id: BodyId
  en: string
  zh: string
  glyph: string
  lon: number
  lat: number
  speed: number
  retrograde: boolean
  sign: number
  /** Degree within sign 0–30 */
  signDeg: number
  house: number
  dignity: Dignity
  kind: (typeof BODIES)[number]['kind']
}

export interface HouseCusp {
  n: number
  lon: number
  sign: number
  signDeg: number
  ruler: BodyId
}

export interface Aspect {
  a: BodyId
  b: BodyId
  def: AspectDef
  /** Actual separation in degrees */
  separation: number
  /** |separation − exact| */
  orb: number
  applying: boolean
  /** 0–1, 1 = exact */
  strength: number
}

export interface WesternChart {
  input: WesternInput
  settings: WesternSettings
  jdUt: number
  zoneLabel: string
  utc: string
  isDayChart: boolean
  bodies: PlacedBody[]
  houses: HouseCusp[]
  angles: { asc: number; mc: number; dsc: number; ic: number; vertex: number; fortune: number }
  aspects: Aspect[]
  tally: {
    elements: Record<WElement, BodyId[]>
    modalities: Record<Modality, BodyId[]>
    polarity: { positive: BodyId[]; negative: BodyId[] }
    hemispheres: { east: number; west: number; north: number; south: number }
  }
  moonPhase: { angle: number; name: string; zh: string; illumination: number }
}

const CORE: BodyId[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'northNode', 'southNode', 'lilith']
const ASTEROIDS: BodyId[] = ['ceres', 'pallas', 'juno', 'vesta']

function houseOf(lon: number, cusps: number[]): number {
  for (let i = 1; i <= 12; i++) {
    const a = cusps[i]
    const b = cusps[i === 12 ? 1 : i + 1]
    const span = norm(b - a)
    if (norm(lon - a) < span) return i
  }
  return 12
}

function dignityOf(id: BodyId, sign: number, modern: boolean): Dignity {
  const s = SIGNS[sign]
  const ruler = modern ? s.modernRuler : s.ruler
  const opposite = SIGNS[(sign + 6) % 12]
  const oppRuler = modern ? opposite.modernRuler : opposite.ruler
  if (ruler === id) return 'domicile'
  if (oppRuler === id) return 'detriment'
  const ex = EXALTATION[id]
  if (ex === sign) return 'exaltation'
  if (ex !== undefined && (ex + 6) % 12 === sign) return 'fall'
  return null
}

export function computeWestern(swe: SwissEph, input: WesternInput, settings: WesternSettings): WesternChart {
  const inst = resolveInstant(input, input.timeZone)
  const jd = inst.jdUt
  const h = houses(swe, jd, input.latitude, input.longitude, settings.houseSystem)
  const cusps = h.cusps

  const raw = new Map<BodyId, { lon: number; lat: number; speed: number }>()
  const ids = settings.asteroids ? [...CORE, ...ASTEROIDS] : CORE
  for (const id of ids) {
    const meta = BODY_META[id]
    if (id === 'northNode') {
      const p = calc(swe, jd, settings.nodeType === 'true' ? SE.TRUE_NODE : SE.MEAN_NODE)
      raw.set('northNode', p)
      raw.set('southNode', { lon: norm(p.lon + 180), lat: -p.lat, speed: p.speed })
    } else if (id === 'southNode') continue
    else if (meta.se !== undefined) raw.set(id, calc(swe, jd, meta.se as SeBody))
  }

  const sun = raw.get('sun')!
  const moon = raw.get('moon')!
  const sunHouse = houseOf(sun.lon, cusps)
  const isDayChart = sunHouse >= 7
  const fortune = isDayChart ? norm(h.asc + moon.lon - sun.lon) : norm(h.asc + sun.lon - moon.lon)
  const angles = { asc: h.asc, mc: h.mc, dsc: norm(h.asc + 180), ic: norm(h.mc + 180), vertex: h.vertex, fortune }
  raw.set('asc', { lon: h.asc, lat: 0, speed: 360 })
  raw.set('mc', { lon: h.mc, lat: 0, speed: 360 })
  raw.set('fortune', { lon: fortune, lat: 0, speed: 0 })
  raw.set('vertex', { lon: h.vertex, lat: 0, speed: 0 })

  const order: BodyId[] = [...ids, 'asc', 'mc', 'fortune', 'vertex']
  const bodies: PlacedBody[] = order
    .filter((id) => raw.has(id))
    .map((id) => {
      const p = raw.get(id)!
      const meta = BODY_META[id]
      const sign = Math.floor(p.lon / 30)
      return {
        id, en: meta.en, zh: meta.zh, glyph: meta.glyph, kind: meta.kind,
        lon: p.lon, lat: p.lat, speed: p.speed,
        retrograde: id === 'lilith' ? false : p.speed < 0,
        sign, signDeg: p.lon - sign * 30,
        house: meta.kind === 'angle' ? (id === 'asc' ? 1 : 10) : houseOf(p.lon, cusps),
        dignity: ['luminary', 'planet', 'outer'].includes(meta.kind) ? dignityOf(id, sign, settings.modernRulers) : null,
      }
    })

  const houseList: HouseCusp[] = []
  for (let n = 1; n <= 12; n++) {
    const lon = cusps[n]
    const sign = Math.floor(lon / 30)
    houseList.push({ n, lon, sign, signDeg: lon - sign * 30, ruler: settings.modernRulers ? SIGNS[sign].modernRuler : SIGNS[sign].ruler })
  }

  // ── Aspects ────────────────────────────────────────────────────
  const aspectable = bodies.filter((b) => b.kind !== 'angle' || b.id === 'asc' || b.id === 'mc')
  const aspects: Aspect[] = []
  for (let i = 0; i < aspectable.length; i++)
    for (let j = i + 1; j < aspectable.length; j++) {
      const A = aspectable[i], B = aspectable[j]
      if (A.id === 'northNode' && B.id === 'southNode') continue
      if ((A.id === 'asc' && B.id === 'mc') || (A.id === 'mc' && B.id === 'asc')) continue
      const sep = Math.abs(diff(A.lon, B.lon))
      const isPoint = (b: PlacedBody) => b.kind === 'angle' || b.kind === 'point' || b.kind === 'node'
      for (const def of ASPECTS) {
        if ((isPoint(A) || isPoint(B)) && !def.major) continue
        let orb = settings.orbs?.[def.id] ?? def.orb
        if (A.kind === 'luminary' || B.kind === 'luminary') orb += settings.luminaryBonus
        if (isPoint(A) || isPoint(B)) orb = Math.min(orb, 5)
        const o = Math.abs(sep - def.angle)
        if (o <= orb) {
          // Applying when the separation is moving towards exactness.
          const signedSep = diff(A.lon, B.lon)
          const dSep = (signedSep >= 0 ? 1 : -1) * (B.speed - A.speed)
          const applying = (sep - def.angle) * dSep < 0
          aspects.push({ a: A.id, b: B.id, def, separation: sep, orb: o, applying, strength: 1 - o / orb })
          break
        }
      }
    }
  aspects.sort((x, y) => x.orb - y.orb)

  // ── Tallies ────────────────────────────────────────────────────
  const tallyIds: BodyId[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'asc']
  const elements: Record<WElement, BodyId[]> = { fire: [], earth: [], air: [], water: [] }
  const modalities: Record<Modality, BodyId[]> = { cardinal: [], fixed: [], mutable: [] }
  const polarity = { positive: [] as BodyId[], negative: [] as BodyId[] }
  const hemi = { east: 0, west: 0, north: 0, south: 0 }
  for (const id of tallyIds) {
    const b = bodies.find((x) => x.id === id)!
    elements[SIGNS[b.sign].element].push(id)
    modalities[SIGNS[b.sign].modality].push(id)
    ;(b.sign % 2 === 0 ? polarity.positive : polarity.negative).push(id)
    if (id !== 'asc') {
      if (b.house >= 10 || b.house <= 3) hemi.east++
      else hemi.west++
      if (b.house >= 7) hemi.south++
      else hemi.north++
    }
  }

  const phase = norm(moon.lon - sun.lon)
  const phaseNames = [
    ['New Moon', '新月'], ['Waxing Crescent', '娥眉月'], ['First Quarter', '上弦月'], ['Waxing Gibbous', '盈凸月'],
    ['Full Moon', '满月'], ['Waning Gibbous', '亏凸月'], ['Last Quarter', '下弦月'], ['Waning Crescent', '残月'],
  ]
  const pn = phaseNames[Math.floor(((phase + 22.5) % 360) / 45)]

  return {
    input, settings, jdUt: jd, zoneLabel: inst.zoneLabel,
    utc: `${inst.utc.year}-${String(inst.utc.month).padStart(2, '0')}-${String(inst.utc.day).padStart(2, '0')} ${String(inst.utc.hour).padStart(2, '0')}:${String(inst.utc.minute).padStart(2, '0')}`,
    isDayChart, bodies, houses: houseList, angles, aspects,
    tally: { elements, modalities, polarity, hemispheres: hemi },
    moonPhase: { angle: phase, name: pn[0], zh: pn[1], illumination: Math.round(((1 - Math.cos((phase * Math.PI) / 180)) / 2) * 1000) / 10 },
  }
}

/** "23°45′" */
export function fmtDm(deg: number) {
  const d = Math.floor(deg)
  const m = Math.floor((deg - d) * 60)
  return `${d}°${String(m).padStart(2, '0')}′`
}
/** "23°45′12″" */
export function fmtDms(deg: number) {
  const d = Math.floor(deg)
  const m = Math.floor((deg - d) * 60)
  const s = Math.round(((deg - d) * 60 - m) * 60)
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`
}
