/**
 * Demo-mode divination. Loaded only when the backend is unreachable.
 *
 * BaZi is computed with lunar-javascript (the JS port of lunar_python used by the backend),
 * so pillars, hidden stems, ten gods and luck cycles are real for any input.
 * Vedic positions use astronomy-engine with a linear Lahiri ayanamsa (≈ arc-minute accuracy).
 * Shadbala here is illustrative only — the real six-fold strength comes from PyJHora.
 */
import { Lunar, Solar } from 'lunar-javascript'
import * as Astro from 'astronomy-engine'
import type {
  BaziChart,
  BaziPillar,
  BaziRequest,
  BranchRelation,
  DashaPeriod,
  FiveElement,
  GrahaId,
  PillarKey,
  ShadbalaEntry,
  ShadbalaResult,
  ShenSha,
  VedicChart,
  VedicPlanet,
  VedicRequest,
} from '@/types'

// ── BaZi ───────────────────────────────────────────────────────────

const STEM_EL: Record<string, FiveElement> = {
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth', 己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
}
const BRANCH_EL: Record<string, FiveElement> = {
  寅: 'wood', 卯: 'wood', 巳: 'fire', 午: 'fire', 辰: 'earth', 戌: 'earth', 丑: 'earth', 未: 'earth', 申: 'metal', 酉: 'metal', 亥: 'water', 子: 'water',
}
const HIDDEN_WEIGHTS = [[1], [0.7, 0.3], [0.6, 0.3, 0.1]]

const KEYS: PillarKey[] = ['year', 'month', 'day', 'hour']
const LJ_KEY: Record<PillarKey, string> = { year: 'Year', month: 'Month', day: 'Day', hour: 'Time' }

const CLASH = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥']
const COMBINE = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未']
const HARM = ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌']
const PUNISH = ['寅巳', '巳申', '申寅', '丑戌', '戌未', '未丑', '子卯']
const SELF_PUNISH = ['辰', '午', '酉', '亥']
const TRINES: [string, FiveElement][] = [['申子辰', 'water'], ['亥卯未', 'wood'], ['寅午戌', 'fire'], ['巳酉丑', 'metal']]
const MEETINGS: [string, FiveElement][] = [['寅卯辰', 'wood'], ['巳午未', 'fire'], ['申酉戌', 'metal'], ['亥子丑', 'water']]
const EL_ZH: Record<FiveElement, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' }

function pairHas(list: string[], a: string, b: string) {
  return list.includes(a + b) || list.includes(b + a)
}

function relations(branches: string[]): BranchRelation[] {
  const out: BranchRelation[] = []
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++) {
      const a = branches[i], b = branches[j]
      const pillars = [KEYS[i], KEYS[j]]
      if (pairHas(CLASH, a, b)) out.push({ type: '相冲', branches: [a, b], pillars })
      if (pairHas(COMBINE, a, b)) out.push({ type: '六合', branches: [a, b], pillars })
      if (pairHas(HARM, a, b)) out.push({ type: '相害', branches: [a, b], pillars })
      if (pairHas(PUNISH, a, b)) out.push({ type: '相刑', branches: [a, b], pillars })
      if (a === b && SELF_PUNISH.includes(a)) out.push({ type: '自刑', branches: [a, b], pillars })
    }
  for (const [set, el] of TRINES) {
    const idx = KEYS.filter((_, i) => set.includes(branches[i]))
    const present = new Set(idx.map((k) => branches[KEYS.indexOf(k)]))
    if (present.size === 3) out.push({ type: '三合', branches: [...set], pillars: idx, note: `${EL_ZH[el]}局` })
    else if (present.size === 2 && present.has(set[1]))
      out.push({ type: '半合', branches: [...present], pillars: idx, note: `${EL_ZH[el]}局` })
  }
  for (const [set, el] of MEETINGS) {
    const idx = KEYS.filter((_, i) => set.includes(branches[i]))
    if (new Set(idx.map((k) => branches[KEYS.indexOf(k)])).size === 3)
      out.push({ type: '三会', branches: [...set], pillars: idx, note: `${EL_ZH[el]}方` })
  }
  return out
}

const NOBLE: Record<string, string> = { 甲: '丑未', 戊: '丑未', 庚: '丑未', 乙: '子申', 己: '子申', 丙: '亥酉', 丁: '亥酉', 辛: '寅午', 壬: '卯巳', 癸: '卯巳' }
const SCHOLAR: Record<string, string> = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' }
const BLADE: Record<string, string> = { 甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子' }
const GROUP_STAR = (branch: string, map: [string, string][]) => map.find(([g]) => g.includes(branch))?.[1] ?? ''
const HORSE: [string, string][] = [['申子辰', '寅'], ['寅午戌', '申'], ['巳酉丑', '亥'], ['亥卯未', '巳']]
const PEACH: [string, string][] = [['申子辰', '酉'], ['寅午戌', '卯'], ['巳酉丑', '午'], ['亥卯未', '子']]
const CANOPY: [string, string][] = [['申子辰', '辰'], ['寅午戌', '戌'], ['巳酉丑', '丑'], ['亥卯未', '未']]

function shensha(dayStem: string, branches: string[]): ShenSha[] {
  const at = (targets: string) => KEYS.filter((_, i) => targets.includes(branches[i]))
  const fromYearDay = (map: [string, string][]) =>
    [...new Set([GROUP_STAR(branches[0], map), GROUP_STAR(branches[2], map)])].join('')
  const stars: [string, string][] = [
    ['天乙贵人', NOBLE[dayStem] ?? ''],
    ['文昌', SCHOLAR[dayStem] ?? ''],
    ['驿马', fromYearDay(HORSE)],
    ['桃花', fromYearDay(PEACH)],
    ['华盖', fromYearDay(CANOPY)],
  ]
  if (BLADE[dayStem]) stars.push(['羊刃', BLADE[dayStem]])
  return stars.map(([name, t]) => ({ name, branches: [...t], pillars: at(t) }))
}

export function demoBazi(input: BaziRequest): BaziChart {
  const solar =
    input.calendar === 'lunar'
      ? Lunar.fromYmdHms(input.year, input.month, input.day, input.hour, 0, 0).getSolar()
      : Solar.fromYmdHms(input.year, input.month, input.day, input.hour, 0, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  const scores: Record<FiveElement, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  const pillars: BaziPillar[] = KEYS.map((key) => {
    const k = LJ_KEY[key]
    const stem: string = ec[`get${k}Gan`]()
    const branch: string = ec[`get${k}Zhi`]()
    const hidden: string[] = ec[`get${k}HideGan`]()
    const hiddenGods: string[] = ec[`get${k}ShiShenZhi`]()
    scores[STEM_EL[stem]] += 1
    hidden.forEach((h, i) => (scores[STEM_EL[h]] += HIDDEN_WEIGHTS[hidden.length - 1][i]))
    return {
      key,
      stem,
      branch,
      stemElement: STEM_EL[stem],
      branchElement: BRANCH_EL[branch],
      stemTenGod: key === 'day' ? '日主' : ec[`get${k}ShiShenGan`](),
      hiddenStems: hidden.map((s, i) => ({ stem: s, element: STEM_EL[s], tenGod: hiddenGods[i] })),
      naYin: ec[`get${k}NaYin`](),
      lifeStage: ec[`get${k}DiShi`](),
    }
  })

  const yun = ec.getYun(input.gender === 'M' ? 1 : 0)
  const daYun = yun.getDaYun().slice(1, 9)
  const thisYear = new Date().getFullYear()
  const current = daYun.find((d: { getStartYear(): number; getEndYear(): number }) => d.getStartYear() <= thisYear && d.getEndYear() >= thisYear) ?? daYun[0]
  const branches = pillars.map((p) => p.branch)
  const dayStem = pillars[2].stem

  return {
    input,
    solarDate: solar.toYmdHms(),
    lunarDate: `农历${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    dayMaster: { stem: dayStem, element: STEM_EL[dayStem] },
    pillars,
    fiveElements: Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, Math.round(v * 10) / 10]),
    ) as Record<FiveElement, number>,
    luckStart: `${yun.getStartYear()}岁${yun.getStartMonth()}个月起运`,
    luckPillars: daYun.map((d: { getStartAge(): number; getStartYear(): number; getGanZhi(): string }) => ({
      startAge: d.getStartAge(),
      startYear: d.getStartYear(),
      stem: d.getGanZhi()[0],
      branch: d.getGanZhi()[1],
    })),
    annualPillars: current.getLiuNian().map((n: { getYear(): number; getAge(): number; getGanZhi(): string }) => ({
      year: n.getYear(),
      age: n.getAge(),
      stem: n.getGanZhi()[0],
      branch: n.getGanZhi()[1],
    })),
    relations: relations(branches),
    shensha: shensha(dayStem, branches),
  }
}

// ── Vedic ──────────────────────────────────────────────────────────

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
]
const DASHA_ORDER: GrahaId[] = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me']
const DASHA_YEARS: Record<GrahaId, number> = { Ke: 7, Ve: 20, Su: 6, Mo: 10, Ma: 7, Ra: 18, Ju: 16, Sa: 19, Me: 17 }
const NAK = 360 / 27
const YEAR_MS = 365.2425 * 86400000

const EXALT: Partial<Record<GrahaId, number>> = { Su: 0, Mo: 1, Ma: 9, Me: 5, Ju: 3, Ve: 11, Sa: 6 }
const OWN: Partial<Record<GrahaId, number[]>> = { Su: [4], Mo: [3], Ma: [0, 7], Me: [2, 5], Ju: [8, 11], Ve: [1, 6], Sa: [9, 10] }

const norm = (x: number) => ((x % 360) + 360) % 360

function lahiri(date: Date) {
  const years = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / YEAR_MS
  return 23.8531 + (years * 50.2388) / 3600
}

function nakshatraOf(lon: number) {
  const i = Math.floor(lon / NAK)
  return { name: NAKSHATRAS[i], pada: Math.floor((lon % NAK) / (NAK / 4)) + 1, index: i }
}

function dignity(id: GrahaId, sign: number): VedicPlanet['dignity'] {
  const ex = EXALT[id]
  if (ex === sign) return 'exalted'
  if (ex !== undefined && (ex + 6) % 12 === sign) return 'debilitated'
  if (OWN[id]?.includes(sign)) return 'own'
  return null
}

const d9 = (lon: number) => Math.floor(lon / (30 / 9)) % 12
function d10(lon: number) {
  const sign = Math.floor(lon / 30)
  const part = Math.floor((lon % 30) / 3)
  return sign % 2 === 0 ? (sign + part) % 12 : (sign + 8 + part) % 12
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

function vimshottari(moonLon: number, birth: Date): DashaPeriod[] {
  const nak = nakshatraOf(moonLon)
  const startLord = DASHA_ORDER[nak.index % 9]
  const elapsed = (moonLon % NAK) / NAK
  let t = birth.getTime() - elapsed * DASHA_YEARS[startLord] * YEAR_MS
  const out: DashaPeriod[] = []
  const start = DASHA_ORDER.indexOf(startLord)
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(start + i) % 9]
    const len = DASHA_YEARS[lord] * YEAR_MS
    const sub: DashaPeriod[] = []
    let s = t
    for (let j = 0; j < 9; j++) {
      const al = DASHA_ORDER[(start + i + j) % 9]
      const alen = (len * DASHA_YEARS[al]) / 120
      sub.push({ lord: al, start: iso(s), end: iso(s + alen) })
      s += alen
    }
    out.push({ lord, start: iso(t), end: iso(t + len), sub })
    t += len
  }
  return out
}

function ascendant(date: Date, lat: number, lon: number) {
  const time = Astro.MakeTime(date)
  const lst = norm(Astro.SiderealTime(time) * 15 + lon)
  const eps = (23.4393 - 0.013 * (time.tt / 36525)) * (Math.PI / 180)
  const r = lst * (Math.PI / 180)
  const phi = lat * (Math.PI / 180)
  const asc = Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)))
  return norm((asc * 180) / Math.PI)
}

export function demoVedic(input: VedicRequest): VedicChart {
  const date = new Date(
    Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute) - input.timezone * 3600000,
  )
  const ayan = lahiri(date)
  const time = Astro.MakeTime(date)
  const next = Astro.MakeTime(new Date(date.getTime() + 86400000))
  const bodies: [GrahaId, Astro.Body][] = [
    ['Su', Astro.Body.Sun], ['Mo', Astro.Body.Moon], ['Ma', Astro.Body.Mars], ['Me', Astro.Body.Mercury],
    ['Ju', Astro.Body.Jupiter], ['Ve', Astro.Body.Venus], ['Sa', Astro.Body.Saturn],
  ]
  const ascLon = norm(ascendant(date, input.latitude, input.longitude) - ayan)
  const ascSign = Math.floor(ascLon / 30)

  const raw: [GrahaId, number, boolean][] = bodies.map(([id, body]) => {
    const a = Astro.Ecliptic(Astro.GeoVector(body, time, true)).elon
    const b = Astro.Ecliptic(Astro.GeoVector(body, next, true)).elon
    let speed = b - a
    if (speed > 180) speed -= 360
    if (speed < -180) speed += 360
    return [id, norm(a - ayan), speed < 0]
  })
  const node = norm(125.04452 - 1934.136261 * (time.tt / 36525) - ayan)
  raw.push(['Ra', node, true], ['Ke', norm(node + 180), true])

  const planets: VedicPlanet[] = raw.map(([id, lon, retro]) => {
    const sign = Math.floor(lon / 30)
    const nak = nakshatraOf(lon)
    return {
      id,
      name: id,
      longitude: Math.round(lon * 1000) / 1000,
      sign,
      nakshatra: nak.name,
      pada: nak.pada,
      house: ((sign - ascSign + 12) % 12) + 1,
      retrograde: retro,
      dignity: dignity(id, sign),
    }
  })

  const per = (fn: (l: number) => number) => ({
    ascendant: fn(ascLon),
    planets: Object.fromEntries(planets.map((p) => [p.id, fn(p.longitude)])) as Record<GrahaId, number>,
  })

  const periods = vimshottari(raw[1][1], date)
  const now = new Date().toISOString().slice(0, 10)
  const maha = periods.find((p) => p.start <= now && now < p.end) ?? periods[0]
  const antar = maha.sub!.find((p) => p.start <= now && now < p.end) ?? maha.sub![0]
  const ascNak = nakshatraOf(ascLon)

  return {
    input,
    ayanamsa: { name: input.ayanamsa ?? 'LAHIRI', value: Math.round(ayan * 10000) / 10000 },
    ascendant: { longitude: Math.round(ascLon * 1000) / 1000, sign: ascSign, nakshatra: ascNak.name, pada: ascNak.pada },
    planets,
    divisional: { D1: per((l) => Math.floor(l / 30)), D9: per(d9), D10: per(d10) },
    dasha: {
      system: 'Vimshottari',
      periods,
      current: { maha: maha.lord, antar: antar.lord, since: antar.start, until: antar.end },
    },
  }
}

/** Illustrative only: deterministic values in a plausible range, not a Shadbala computation. */
export function demoShadbala(input: VedicRequest): ShadbalaResult {
  const required: Record<string, number> = { Su: 5, Mo: 6, Ma: 5, Me: 7, Ju: 6.5, Ve: 5.5, Sa: 5 }
  const seed = input.year * 372 + input.month * 31 + input.day
  const rnd = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280
    return x - Math.floor(x)
  }
  const planets: ShadbalaEntry[] = (['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as GrahaId[]).map((planet, i) => {
    const parts = [2.2, 0.6, 1.8, 0.9, 0.4, 0.3].map((base, j) => Math.round((base * (0.6 + rnd(i * 7 + j) * 0.9)) * 100) / 100)
    const [sthana, dig, kala, chesta, naisargika, drik] = parts
    const total = Math.round(parts.reduce((a, b) => a + b, 0) * 100) / 100
    return { planet, sthana, dig, kala, chesta, naisargika, drik, total, required: required[planet] }
  })
  return { input, planets }
}
