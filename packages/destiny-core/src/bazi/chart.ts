/**
 * 四柱八字 from an exact instant.
 *
 * Year and month pillars follow the apparent Sun: the year changes at 立春 (315°) and each
 * month at its 节, with the moments taken from the Swiss Ephemeris. Day and hour pillars use
 * either the zone's standard clock or 真太阳时, as chosen. The lunar calendar date comes from
 * lunar-javascript, whose calendar tables are the de-facto reference for 农历.
 */
import { Lunar, Solar } from 'lunar-javascript'
import type SwissEph from 'swisseph-wasm'
import type { FiveElement, PillarKey } from '../types'
import { SE, calc, equationOfTime, sunCrossing, norm } from '../ephemeris/swe'
import { fmtCivil, jdFromUtc, resolveInstant, solarTimes, utcFromJd, zoneOffsetAt, type CivilTime } from '../ephemeris/time'
import {
  BRANCHES, BRANCH_ELEMENT, ELEMENT_ORDER, HIDDEN_STEMS, JIE_LONGITUDE_FOR_BRANCH, SIGNS_ZH, STEMS, STEM_COMBINE,
  STEM_ELEMENT, ZODIAC_ANIMALS, BRANCH_SIX_COMBINE, ganzhi, hourStemFor, lifeStage, monthStemFor, nayin,
  nayinElement, sexagenary, solarTermName, stemYang, tenGod, xunKong,
} from './tables'
import { computeRelations } from './relations'
import { computeShenSha } from './shensha'
import { computeStrength } from './strength'
import { GE_JU, GE_JU_NAMES, JIN_BU_HUAN, SI_LING, TIAO_HOU, TIAO_HOU_NOTE } from './classics'
import type { AnnualPillar, BaziChart, BaziOptions, BirthInput, LuckPillar, MonthlyPillar, Pillar } from './types'

const KEYS: PillarKey[] = ['year', 'month', 'day', 'hour']

/** Lunar → solar civil date via lunar-javascript (negative month = leap month). */
export function lunarToSolar(y: number, m: number, d: number, leap: boolean) {
  const s = Lunar.fromYmd(y, leap ? -m : m, d).getSolar()
  return { year: s.getYear() as number, month: s.getMonth() as number, day: s.getDay() as number }
}

function standardOffsetMinutes(zone: string | number, year: number) {
  if (typeof zone === 'number') return Math.round(zone * 60)
  return Math.min(zoneOffsetAt(zone, Date.UTC(year, 0, 1)), zoneOffsetAt(zone, Date.UTC(year, 6, 1)))
}

function isoLocal(jdLocal: number) {
  return fmtCivil(utcFromJd(jdLocal), true)
}

export function computeBazi(swe: SwissEph, raw: BirthInput, options: BaziOptions): BaziChart {
  const civilDate =
    raw.calendar === 'lunar' ? lunarToSolar(raw.year, raw.month, raw.day, !!raw.lunarLeap) : { year: raw.year, month: raw.month, day: raw.day }
  const civil: CivilTime = { ...civilDate, hour: raw.hour, minute: raw.minute, second: raw.second ?? 0 }
  const inst = resolveInstant(civil, raw.timeZone, { ignoreDst: raw.ignoreDst })
  const jdUt = inst.jdUt

  // ── Time standards ──────────────────────────────────────────────
  const stdOffset = standardOffsetMinutes(raw.timeZone, civilDate.year)
  const stdJd = jdUt + stdOffset / 1440
  const st = solarTimes(jdUt, raw.longitude, equationOfTime(swe, jdUt))
  const pillarJd = options.trueSolarTime ? st.latJd : stdJd
  const pillarTime = utcFromJd(pillarJd)

  // ── Year & month from the apparent Sun ──────────────────────────
  const sunLon = calc(swe, jdUt, SE.SUN).lon
  // Month branch: 寅 begins at 315°; each 30° thereafter.
  const monthBranch = (2 + Math.floor(norm(sunLon - 315) / 30)) % 12
  // Year: the Gregorian year of the instant, minus one if before 立春 of that year.
  const utcY = inst.utc.year
  const lichunThisYear = sunCrossing(swe, 315, jdFromUtc({ year: utcY, month: 1, day: 20, hour: 0, minute: 0 }))
  const solarYear = jdUt >= lichunThisYear ? utcY : utcY - 1
  const yearStem = ((solarYear - 4) % 10 + 10) % 10
  const yearBranch = ((solarYear - 4) % 12 + 12) % 12
  const monthStem = monthStemFor(yearStem, monthBranch)

  // ── Day & hour ──────────────────────────────────────────────────
  let dayJdn = Math.floor(pillarJd + 0.5)
  const hourBranch = Math.floor((pillarTime.hour + 1) / 2) % 12
  const lateZi = pillarTime.hour >= 23
  if (lateZi && options.lateZi === 'next-day') dayJdn += 1
  const daySexa = ((dayJdn + 49) % 60 + 60) % 60
  const dayStem = daySexa % 10
  const dayBranch = daySexa % 12
  const hourStemBase = lateZi && options.lateZi === 'same-day' ? (dayStem + 1) % 10 : dayStem
  const hourStem = hourStemFor(hourStemBase, hourBranch)

  const stems: Record<PillarKey, number> = { year: yearStem, month: monthStem, day: dayStem, hour: hourStem }
  const branches: Record<PillarKey, number> = { year: yearBranch, month: monthBranch, day: dayBranch, hour: hourBranch }
  const sexa = Object.fromEntries(KEYS.map((k) => [k, sexagenary(stems[k], branches[k])])) as Record<PillarKey, number>
  const dayKong = xunKong(sexa.day)
  const yearKong = xunKong(sexa.year)
  const tg = (s: number) => tenGod(dayStem, s)

  const pillars: Pillar[] = KEYS.map((key) => {
    const s = stems[key], b = branches[key]
    return {
      key, stem: s, branch: b, stemChar: STEMS[s], branchChar: BRANCHES[b], sexagenary: sexa[key],
      stemElement: STEM_ELEMENT[s], branchElement: BRANCH_ELEMENT[b],
      stemTenGod: key === 'day' ? '日主' : tg(s),
      hidden: HIDDEN_STEMS[b].map((h, i) => ({ stem: h, stemChar: STEMS[h], element: STEM_ELEMENT[h], tenGod: tg(h), rank: (['本气', '中气', '余气'] as const)[i] })),
      lifeStage: lifeStage(dayStem, b),
      selfSeat: lifeStage(s, b),
      naYin: nayin(sexa[key]), naYinElement: nayinElement(sexa[key]),
      kongWang: dayKong.includes(b), kongWangYear: yearKong.includes(b),
    }
  })

  // ── Palaces ────────────────────────────────────────────────────
  // 命宫: (月支 + 时支 counted from 寅=1) subtracted from 14 or 26; 身宫: sum counted 寅=1 / 子=1.
  const mIdx = ((monthBranch - 2 + 12) % 12) + 1
  const tIdxYin = ((hourBranch - 2 + 12) % 12) + 1
  const tIdxZi = hourBranch + 1
  let mg = mIdx + tIdxYin
  mg = (mg >= 14 ? 26 : 14) - mg
  const mingBranch = (mg - 1 + 2) % 12
  let sg = mIdx + tIdxZi
  if (sg > 12) sg -= 12
  const shenBranch = (sg - 1 + 2) % 12
  const palaceGanzhi = (b: number) => ganzhi(sexagenary(monthStemFor(yearStem, b), b))
  const taiYuan = ganzhi(sexagenary((monthStem + 1) % 10, (monthBranch + 3) % 12))
  const comb = STEM_COMBINE.find(([a, b]) => a === dayStem || b === dayStem)!
  const taiXiStem = comb[0] === dayStem ? comb[1] : comb[0]
  const six = BRANCH_SIX_COMBINE.find(([a, b]) => a === dayBranch || b === dayBranch)!
  const taiXiBranch = six[0] === dayBranch ? six[1] : six[0]
  const mingGong = palaceGanzhi(mingBranch)

  // ── Solar terms around birth ───────────────────────────────────
  const prevJieLon = JIE_LONGITUDE_FOR_BRANCH(monthBranch)
  const prevJie = sunCrossing(swe, prevJieLon, jdUt - 40)
  const nextJie = sunCrossing(swe, prevJieLon + 30, jdUt)
  const prevQi = sunCrossing(swe, prevJieLon + 15, jdUt - 40)
  const nextQiJd = prevQi > jdUt ? prevQi : sunCrossing(swe, prevJieLon + 45, jdUt)
  const prevQiJd = prevQi > jdUt ? sunCrossing(swe, prevJieLon - 15, jdUt - 40) : prevQi
  const toLocal = (jd: number) => jd + inst.offsetMinutes / 1440
  const mark = (jd: number, lon: number) => ({ name: solarTermName(lon), at: isoLocal(toLocal(jd)), jdUt: jd })

  // ── 大运 ───────────────────────────────────────────────────────
  const forward = (stemYang(yearStem) && raw.gender === 'M') || (!stemYang(yearStem) && raw.gender === 'F')
  const daysToTerm = forward ? nextJie - jdUt : jdUt - prevJie
  // 三天折一年，一天折四个月，一时辰折十日
  const years = Math.floor(daysToTerm / 3)
  const remDays = daysToTerm - years * 3
  const months = Math.floor(remDays * 4)
  const days = Math.round((remDays * 4 - months) * 30)
  const startLocal = new Date(Date.UTC(civilDate.year, civilDate.month - 1, civilDate.day))
  startLocal.setUTCFullYear(startLocal.getUTCFullYear() + years)
  startLocal.setUTCMonth(startLocal.getUTCMonth() + months)
  startLocal.setUTCDate(startLocal.getUTCDate() + days)
  const startDate = startLocal.toISOString().slice(0, 10)
  const startYear = startLocal.getUTCFullYear()
  const luckPillars: LuckPillar[] = []
  for (let i = 1; i <= 10; i++) {
    const sx = ((sexa.month + (forward ? i : -i)) % 60 + 60) % 60
    const sy = startYear + (i - 1) * 10
    luckPillars.push({
      index: i, sexagenary: sx, stemChar: STEMS[sx % 10], branchChar: BRANCHES[sx % 12],
      stemTenGod: tg(sx % 10), branchMainTenGod: tg(HIDDEN_STEMS[sx % 12][0]),
      startAge: years + (i - 1) * 10, startYear: sy, endYear: sy + 9,
      startDate: `${sy}-${startDate.slice(5)}`,
      lifeStage: lifeStage(dayStem, sx % 12), kongWang: dayKong.includes(sx % 12),
    })
  }

  // ── Lunar calendar & misc ──────────────────────────────────────
  const solar = Solar.fromYmdHms(civilDate.year, civilDate.month, civilDate.day, civil.hour, civil.minute, Math.floor(civil.second ?? 0))
  const lunar = solar.getLunar()
  const lunarMonth: number = lunar.getMonth()
  const lunarInfo = {
    text: `${lunar.getYearInGanZhi()}年${lunarMonth < 0 ? '闰' : ''}${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    year: lunar.getYear() as number, month: Math.abs(lunarMonth), day: lunar.getDay() as number, leap: lunarMonth < 0,
    yearGanZhi: ganzhi(sexa.year), animal: ZODIAC_ANIMALS[yearBranch],
  }

  const strength = computeStrength({ stems, branches, dayMaster: dayStem }, tg)
  const relations = computeRelations(pillars.map((p) => ({ key: p.key, label: p.key, stem: p.stem, branch: p.branch })))
  const shensha = computeShenSha({ stems, branches, sexa, gender: raw.gender })
  const fiveElements = Object.fromEntries(ELEMENT_ORDER.map((e) => [e, strength.scores[e]])) as Record<FiveElement, number>
  const classicsKey = `${STEMS[dayStem]}${BRANCHES[monthBranch]}`
  const classics = {
    key: classicsKey,
    tiaoHou: { levels: TIAO_HOU[classicsKey] ?? [], note: TIAO_HOU_NOTE[classicsKey] },
    jinBuHuan: JIN_BU_HUAN[classicsKey] ?? null,
    geJu: GE_JU_NAMES.map((name, i) => ({ name, verdict: GE_JU[STEM_ELEMENT[dayStem]][BRANCHES[monthBranch]]?.[i] ?? '' })).filter((g) => g.verdict),
    siLing: SI_LING[BRANCHES[monthBranch]] ?? '',
  }

  return {
    input: raw, options,
    time: {
      civil, zoneLabel: inst.zoneLabel, utc: fmtCivil(inst.utc, true),
      standard: isoLocal(stdJd), meanSolar: fmtCivil(st.lmt, true), trueSolar: fmtCivil(st.lat, true),
      solarCorrectionMinutes: Math.round((st.latJd - stdJd) * 1440 * 10) / 10, dst: inst.dst,
    },
    lunar: lunarInfo,
    sunSign: SIGNS_ZH[Math.floor(sunLon / 30)],
    dayMaster: { stem: dayStem, stemChar: STEMS[dayStem], element: STEM_ELEMENT[dayStem], yang: stemYang(dayStem) },
    pillars,
    palaces: {
      mingGong, shenGong: palaceGanzhi(shenBranch), taiYuan,
      taiXi: ganzhi(sexagenary(taiXiStem, taiXiBranch)), mingGongNaYin: nayin(sexagenary(monthStemFor(yearStem, mingBranch), mingBranch)),
    },
    kongWang: { day: dayKong.map((b) => BRANCHES[b]).join(''), year: yearKong.map((b) => BRANCHES[b]).join('') },
    terms: {
      previous: mark(prevJie, prevJieLon), next: mark(nextJie, prevJieLon + 30),
      previousQi: mark(prevQiJd, prevQi > jdUt ? prevJieLon - 15 : prevJieLon + 15),
      nextQi: mark(nextQiJd, prevQi > jdUt ? prevJieLon + 15 : prevJieLon + 45),
    },
    luck: { forward, daysToTerm, startAge: { years, months, days }, startDate, pillars: luckPillars },
    strength, relations, shensha, fiveElements, classics,
  }
}

/** 流年 for a 大运 (ten calendar years from its start). */
export function annualPillars(chart: BaziChart, luck: LuckPillar): AnnualPillar[] {
  const dm = chart.dayMaster.stem
  const out: AnnualPillar[] = []
  for (let y = luck.startYear; y <= luck.endYear; y++) {
    const sx = sexagenary(((y - 4) % 10 + 10) % 10, ((y - 4) % 12 + 12) % 12)
    out.push({
      year: y, nominalAge: y - chart.input.year + 1, age: y - chart.input.year,
      sexagenary: sx, stemChar: STEMS[sx % 10], branchChar: BRANCHES[sx % 12],
      stemTenGod: tenGod(dm, sx % 10), branchMainTenGod: tenGod(dm, HIDDEN_STEMS[sx % 12][0]),
      lifeStage: lifeStage(dm, sx % 12),
    })
  }
  return out
}

/** 流月 for a calendar (solar) year: twelve months from 立春, with the 节 that begins each. */
export function monthlyPillars(swe: SwissEph, chart: BaziChart, year: number): MonthlyPillar[] {
  const dm = chart.dayMaster.stem
  const ys = ((year - 4) % 10 + 10) % 10
  const offsetDays = (typeof chart.input.timeZone === 'number' ? chart.input.timeZone * 60 : zoneOffsetAt(chart.input.timeZone, Date.UTC(year, 6, 1))) / 1440
  const out: MonthlyPillar[] = []
  let jd = jdFromUtc({ year, month: 1, day: 20, hour: 0, minute: 0 })
  for (let i = 0; i < 12; i++) {
    const b = (2 + i) % 12
    const lon = JIE_LONGITUDE_FOR_BRANCH(b)
    jd = sunCrossing(swe, lon, jd)
    const sx = sexagenary(monthStemFor(ys, b), b)
    out.push({
      index: i + 1, sexagenary: sx, stemChar: STEMS[sx % 10], branchChar: BRANCHES[sx % 12],
      stemTenGod: tenGod(dm, sx % 10), branchMainTenGod: tenGod(dm, HIDDEN_STEMS[b][0]),
      term: solarTermName(lon), startsAt: fmtCivil(utcFromJd(jd + offsetDays)),
    })
    jd += 20
  }
  return out
}
