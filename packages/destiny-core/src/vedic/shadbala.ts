/**
 * Shadbala — the six-fold strength of the seven classical grahas, per Brihat Parashara Hora
 * Shastra as formalised in B. V. Raman's "Graha and Bhava Balas". All values in shashtiamsas
 * (60 = 1 rupa). Every component is returned so the breakdown can be inspected.
 */
import { diff, norm } from '../ephemeris/swe'
import { MOOLATRIKONA, NAISARGIKA_BALA, RELATION_BALA, REQUIRED_RUPAS, SIGN_LORD, type GrahaIdx } from './tables'
import { vargaSign } from './vargas'

export interface ShadbalaGraha {
  lon: number
  speed: number
  /** Declination, degrees north positive */
  declination: number
  sign: number
  /** Whole-sign house from lagna */
  house: number
  /** Compound relationship with each other graha (index 0–4, 2 = neutral) */
  relation: number[]
}

export interface ShadbalaContext {
  grahas: ShadbalaGraha[] // Su…Sa (7), plus Ra Ke at 7,8 used only for Mercury's malefic check
  lagna: number
  /** Local mean time hours since midnight */
  lmtHours: number
  /** Hours since the sunrise that began the birth day; day length and night length in hours */
  hoursSinceSunrise: number
  dayLengthHours: number
  nightLengthHours: number
  isDaytime: boolean
  /** Kali ahargana of the birth day (sunrise-based) */
  ahargana: number
  /** Weekday 0 = Sunday */
  weekday: number
  /** Mean tropical longitudes of Sun and Me/Ve/Ma/Ju/Sa */
  meanLon: { sun: number; planets: Record<number, number> }
  /** Whether the Moon is waxing */
  waxing: boolean
  sunMoonElongation: number
}

export interface ShadbalaEntry {
  graha: GrahaIdx
  sthana: { uchcha: number; saptavargaja: number; ojayugma: number; kendra: number; drekkana: number; total: number }
  dig: number
  kala: { nathonnatha: number; paksha: number; tribhaga: number; abda: number; masa: number; vara: number; hora: number; ayana: number; yuddha: number; total: number }
  chesta: number
  naisargika: number
  drik: number
  total: number
  rupas: number
  required: number
  ratio: number
  /** Benefic drishti received minus malefic, before dividing */
  aspectsReceived: { from: GrahaIdx; value: number }[]
}

const EXALT_POINT = [10, 33, 298, 165, 95, 357, 200] // Su Ar10, Mo Ta3, Ma Cp28, Me Vi15, Ju Cn5, Ve Pi27, Sa Li20
const SAPTA_VARGAS = [1, 2, 3, 7, 9, 12, 30] as const
const DIG_STRONG = [270, 90, 270, 0, 0, 90, 180] // Su 10th, Mo 4th, Ma 10th, Me 1st, Ju 1st, Ve 4th, Sa 7th
const HORA_SEQ = [0, 5, 3, 1, 6, 4, 2] // Sun Venus Mercury Moon Saturn Jupiter Mars

/** BPHS sputa drishti: aspect value of a graha on a point `d` degrees ahead of it. */
export function drishtiValue(from: GrahaIdx, d: number): number {
  d = norm(d)
  let v = 0
  if (d >= 30 && d < 60) v = (d - 30) / 2
  else if (d >= 60 && d < 90) v = d - 45
  else if (d >= 90 && d < 120) v = (120 - d) / 2 + 30
  else if (d >= 120 && d < 150) v = 150 - d
  else if (d >= 150 && d < 180) v = (d - 150) * 2
  else if (d >= 180 && d < 300) v = (300 - d) / 2
  // Special full aspects
  if (from === 2 && ((d >= 90 && d < 120) || (d >= 210 && d < 240))) v += 15
  if (from === 6 && ((d >= 60 && d < 90) || (d >= 270 && d < 300))) v += 45
  if (from === 4 && ((d >= 120 && d < 150) || (d >= 240 && d < 270))) v += 30
  return Math.min(60, v)
}

export function computeShadbala(ctx: ShadbalaContext): ShadbalaEntry[] {
  const g = ctx.grahas
  const moonBenefic = ctx.waxing
  const mercuryMalefic = [2, 6, 7, 8].some((m) => g[m] && g[m].sign === g[3].sign)
  const isBenefic = (i: number) => i === 4 || i === 5 || (i === 3 && !mercuryMalefic) || (i === 1 && moonBenefic)

  const out: ShadbalaEntry[] = []
  for (let p = 0 as GrahaIdx; p < 7; p = (p + 1) as GrahaIdx) {
    const me = g[p]
    // ── Sthana ──
    const debPoint = norm(EXALT_POINT[p] + 180)
    const uchcha = Math.abs(diff(debPoint, me.lon)) / 3
    let sapta = 0
    for (const d of SAPTA_VARGAS) {
      const s = vargaSign(me.lon, d)
      const lord = SIGN_LORD[s]
      if (lord === p) {
        const mt = MOOLATRIKONA[p]
        const deg = me.lon % 30
        sapta += d === 1 && mt && mt[0] === s && deg >= mt[1] && deg < mt[2] ? 45 : 30
      } else sapta += RELATION_BALA[me.relation[lord]]
    }
    const navSign = vargaSign(me.lon, 9)
    const wantsEven = p === 1 || p === 5
    const oja = (wantsEven ? me.sign % 2 === 1 : me.sign % 2 === 0 ? true : false) ? 15 : 0
    const ojaNav = (wantsEven ? navSign % 2 === 1 : navSign % 2 === 0) ? 15 : 0
    const ojayugma = oja + ojaNav
    const hmod = (me.house - 1) % 3
    const kendra = hmod === 0 ? 60 : hmod === 1 ? 30 : 15
    const drek = Math.floor((me.lon % 30) / 10)
    const drekkana = ([0, 2, 4].includes(p) && drek === 0) || ([1, 5].includes(p) && drek === 1) || ([3, 6].includes(p) && drek === 2) ? 15 : 0
    const sthanaTotal = uchcha + sapta + ojayugma + kendra + drekkana

    // ── Dig ──
    const weakPoint = norm(ctx.lagna + DIG_STRONG[p] + 180)
    const dig = Math.abs(diff(weakPoint, me.lon)) / 3

    // ── Kala ──
    const dMid = 12 - Math.abs(ctx.lmtHours - 12) // hours from midnight, 0–12
    const nathonnatha = p === 3 ? 60 : [0, 4, 5].includes(p) ? dMid * 5 : (12 - dMid) * 5
    const e = ctx.sunMoonElongation > 180 ? 360 - ctx.sunMoonElongation : ctx.sunMoonElongation
    let paksha = isBenefic(p) ? e / 3 : (180 - e) / 3
    if (p === 1) paksha *= 2
    let tribhaga = p === 4 ? 60 : 0
    if (p !== 4) {
      const part = ctx.isDaytime
        ? Math.min(2, Math.floor(ctx.hoursSinceSunrise / (ctx.dayLengthHours / 3)))
        : Math.min(2, Math.floor((ctx.hoursSinceSunrise - ctx.dayLengthHours) / (ctx.nightLengthHours / 3)))
      const lord = ctx.isDaytime ? [3, 0, 6][part] : [1, 5, 2][part]
      if (lord === p) tribhaga = 60
    }
    const abdaLord = (Math.floor(ctx.ahargana / 360) * 3 + 1) % 7
    const masaLord = (Math.floor(ctx.ahargana / 30) * 2 + 1) % 7
    const abda = abdaLord === p ? 15 : 0
    const masa = masaLord === p ? 30 : 0
    const vara = ctx.weekday === p ? 45 : 0
    const horaIdx = (HORA_SEQ.indexOf(ctx.weekday) + Math.floor(ctx.hoursSinceSunrise)) % 7
    const hora = HORA_SEQ[horaIdx] === p ? 60 : 0
    const dec = me.declination
    let ayana = p === 3 ? ((24 + Math.abs(dec)) / 48) * 60 : [0, 2, 4, 5].includes(p) ? ((24 + dec) / 48) * 60 : ((24 - dec) / 48) * 60
    ayana = Math.max(0, Math.min(60, ayana))
    if (p === 0) ayana *= 2
    const yuddha = 0
    const kalaTotal = nathonnatha + paksha + tribhaga + abda + masa + vara + hora + ayana + yuddha

    // ── Chesta ──
    let chesta: number
    if (p === 0) chesta = ayana
    else if (p === 1) chesta = paksha
    else {
      const meanP = ctx.meanLon.planets[p]
      const meanSun = ctx.meanLon.sun
      let kendraDeg: number
      if (p === 3 || p === 5) {
        const mid = norm(meanSun + diff(meanSun, me.lon) / 2)
        kendraDeg = norm(meanP - mid)
      } else {
        const mid = norm(meanP + diff(meanP, me.lon) / 2)
        kendraDeg = norm(meanSun - mid)
      }
      if (kendraDeg > 180) kendraDeg = 360 - kendraDeg
      chesta = kendraDeg / 3
    }

    const naisargika = NAISARGIKA_BALA[p]

    // ── Drik ──
    const received: { from: GrahaIdx; value: number }[] = []
    let drikSum = 0
    for (let q = 0 as GrahaIdx; q < 7; q = (q + 1) as GrahaIdx) {
      if (q === p) continue
      const v = drishtiValue(q, me.lon - g[q].lon)
      if (v <= 0) continue
      const signed = isBenefic(q) ? v : -v
      received.push({ from: q, value: signed })
      drikSum += signed
    }
    const drik = drikSum / 4

    const total = sthanaTotal + dig + kalaTotal + chesta + naisargika + drik
    out.push({
      graha: p,
      sthana: { uchcha, saptavargaja: sapta, ojayugma, kendra, drekkana, total: sthanaTotal },
      dig,
      kala: { nathonnatha, paksha, tribhaga, abda, masa, vara, hora, ayana, yuddha, total: kalaTotal },
      chesta, naisargika, drik, total,
      rupas: total / 60, required: REQUIRED_RUPAS[p], ratio: total / 60 / REQUIRED_RUPAS[p],
      aspectsReceived: received,
    })
  }
  return out
}
