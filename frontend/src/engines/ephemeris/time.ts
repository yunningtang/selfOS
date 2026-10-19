/**
 * Civil time ↔ Julian Day, with IANA time zones (historical offsets and daylight-saving rules
 * come from the browser's tz database, so e.g. China's 1986–1991 夏令时 is applied correctly)
 * and true solar time (真太阳时) for BaZi.
 */

export interface CivilTime {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second?: number
}

/** Gregorian civil UTC → Julian Day (Meeus). */
export function jdFromUtc(t: CivilTime): number {
  let y = t.year
  let m = t.month
  if (m <= 2) {
    y -= 1
    m += 12
  }
  const a = Math.floor(y / 100)
  const b = 2 - a + Math.floor(a / 4)
  const dayFrac = (t.hour + t.minute / 60 + (t.second ?? 0) / 3600) / 24
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + t.day + dayFrac + b - 1524.5
}

/** Julian Day → Gregorian civil UTC. */
export function utcFromJd(jd: number): Required<CivilTime> {
  const z = Math.floor(jd + 0.5)
  let f = jd + 0.5 - z
  const alpha = Math.floor((z - 1867216.25) / 36524.25)
  const a = z + 1 + alpha - Math.floor(alpha / 4)
  const b = a + 1524
  const c = Math.floor((b - 122.1) / 365.25)
  const d = Math.floor(365.25 * c)
  const e = Math.floor((b - d) / 30.6001)
  const day = b - d - Math.floor(30.6001 * e)
  const month = e < 14 ? e - 1 : e - 13
  const year = month > 2 ? c - 4716 : c - 4715
  // Round to the nearest millisecond to avoid 59.9999 s artefacts.
  f = Math.round(f * 86400000) / 86400000
  const secs = f * 86400
  const hour = Math.floor(secs / 3600)
  const minute = Math.floor((secs - hour * 3600) / 60)
  const second = secs - hour * 3600 - minute * 60
  return { year, month, day, hour, minute, second }
}

const dtfCache = new Map<string, Intl.DateTimeFormat>()
function dtf(timeZone: string) {
  let f = dtfCache.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
    })
    dtfCache.set(timeZone, f)
  }
  return f
}

/** UTC offset (minutes east of Greenwich) of an IANA zone at a given instant. */
export function zoneOffsetAt(timeZone: string, utcMs: number): number {
  const p = Object.fromEntries(dtf(timeZone).formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]))
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second)
  return Math.round((asUtc - utcMs) / 60000)
}

export function isValidTimeZone(tz: string) {
  try {
    dtf(tz)
    return true
  } catch {
    return false
  }
}

export interface ResolvedInstant {
  jdUt: number
  utc: Required<CivilTime>
  /** Minutes east of UTC that applied to the civil time */
  offsetMinutes: number
  /** Whether the zone was observing daylight-saving time */
  dst: boolean
  zoneLabel: string
}

/**
 * Local civil time in a zone → instant. `zone` is an IANA name ("Asia/Shanghai") or a fixed
 * offset in hours. Ambiguous or non-existent local times (DST transitions) resolve to the
 * earlier offset, which is what most ephemeris programmes do.
 */
export function resolveInstant(local: CivilTime, zone: string | number): ResolvedInstant {
  const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, Math.floor(local.second ?? 0))
  let offset: number
  let dst = false
  let zoneLabel: string
  if (typeof zone === 'number') {
    offset = Math.round(zone * 60)
    zoneLabel = `UTC${fmtOffset(offset)}`
  } else {
    // Two passes: guess with the offset at the local-as-UTC instant, then refine.
    let guess = zoneOffsetAt(zone, localAsUtc)
    guess = zoneOffsetAt(zone, localAsUtc - guess * 60000)
    offset = guess
    const jan = zoneOffsetAt(zone, Date.UTC(local.year, 0, 1))
    const jul = zoneOffsetAt(zone, Date.UTC(local.year, 6, 1))
    dst = offset > Math.min(jan, jul)
    zoneLabel = `${zone} (UTC${fmtOffset(offset)}${dst ? ', DST' : ''})`
  }
  const utcMs = localAsUtc - offset * 60000
  const d = new Date(utcMs)
  const utc = {
    year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
    hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds() + (local.second ?? 0) % 1,
  }
  return { jdUt: jdFromUtc(utc), utc, offsetMinutes: offset, dst, zoneLabel }
}

export function fmtOffset(minutes: number) {
  const sign = minutes < 0 ? '−' : '+'
  const m = Math.abs(minutes)
  return `${sign}${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/**
 * Local mean / true solar time at a longitude.
 * LMT = UT + λ/15 h; LAT = LMT + E, where E is the equation of time in days (from the ephemeris).
 */
export function solarTimes(jdUt: number, longitude: number, equationOfTimeDays: number) {
  const lmt = jdUt + longitude / 15 / 24
  const lat = lmt + equationOfTimeDays
  return { lmtJd: lmt, latJd: lat, meanMinus: equationOfTimeDays * 1440, lmt: utcFromJd(lmt), lat: utcFromJd(lat) }
}

export const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0')

export function fmtCivil(t: CivilTime, seconds = false) {
  const base = `${t.year}-${pad2(t.month)}-${pad2(t.day)} ${pad2(t.hour)}:${pad2(t.minute)}`
  return seconds ? `${base}:${pad2(t.second ?? 0)}` : base
}

/** Days → "Y年M月D日" style parts (uses 365.2425-day years and 30.4369-day months). */
export function daysToYmd(days: number) {
  const years = Math.floor(days / 365.2425)
  const rem = days - years * 365.2425
  const months = Math.floor(rem / 30.436875)
  const d = Math.round(rem - months * 30.436875)
  return { years, months, days: d }
}
