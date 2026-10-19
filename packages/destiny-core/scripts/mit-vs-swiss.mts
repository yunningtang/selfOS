import { getSwe } from '../src/ephemeris/swe'
import { fromSwe, getMitSolar } from '../src/ephemeris/solar'
import { computeBazi } from '../src/bazi/chart'
const swe = await getSwe()
const S = fromSwe(swe), M = await getMitSolar()
function rnd(a: number, b: number) { return a + Math.floor(Math.random() * (b - a + 1)) }
let maxTerm = 0, maxEot = 0, maxLon = 0, mism = 0
for (let i = 0; i < 300; i++) {
  const jd = 2415020 + Math.random() * 60000 // 1900–2064
  maxLon = Math.max(maxLon, Math.abs(((S.sunLongitude(jd) - M.sunLongitude(jd) + 540) % 360) - 180))
  maxEot = Math.max(maxEot, Math.abs(S.equationOfTime(jd) - M.equationOfTime(jd)) * 1440)
  const deg = rnd(0, 23) * 15
  maxTerm = Math.max(maxTerm, Math.abs(S.sunCrossing(deg, jd) - M.sunCrossing(deg, jd)) * 1440)
}
console.log('max |Δ sun lon| arcsec', (maxLon * 3600).toFixed(2), '| max |Δ EoT| minutes', maxEot.toFixed(3), '| max |Δ 节气 time| minutes', maxTerm.toFixed(3))
for (let i = 0; i < 400; i++) {
  const y = rnd(1920, 2080), mo = rnd(1, 12), d = rnd(1, 28), h = rnd(0, 23), mi = rnd(0, 59)
  const inp = { year: y, month: mo, day: d, hour: h, minute: mi, calendar: 'solar' as const, timeZone: 'Asia/Shanghai', longitude: 116.4, latitude: 39.9, gender: 'M' as const }
  const a = computeBazi(S, inp, { trueSolarTime: true, lateZi: 'next-day' }), b = computeBazi(M, inp, { trueSolarTime: true, lateZi: 'next-day' })
  const pa = a.pillars.map((p) => p.stemChar + p.branchChar).join(''), pb = b.pillars.map((p) => p.stemChar + p.branchChar).join('')
  if (pa !== pb) { mism++; console.log('PILLAR MISMATCH', JSON.stringify(inp), pa, pb) } else if (a.luck.startDate !== b.luck.startDate) console.log('startDate ±1 day', a.luck.startDate, b.luck.startDate, (a.luck.daysToTerm - b.luck.daysToTerm).toFixed(5))
}
console.log('pillar+luck mismatches', mism, '/ 400')
