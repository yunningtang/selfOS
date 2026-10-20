import { getMitSolar } from '../src/ephemeris/solar'
import { computeBazi } from '../src/bazi/chart'
import { analyseBazi } from '../src/bazi/analysis'
import { forecastYear, forecastLuck } from '../src/bazi/forecast'
import { assessWealth, DEFAULT_CONTEXT } from '../src/bazi/wealth'
import { computeVerdicts } from '../src/bazi/verdicts'
const M = await getMitSolar()
function rnd(a: number, b: number) { return a + Math.floor(Math.random() * (b - a + 1)) }
const yearHist: Record<number, number> = {}, luckHist: Record<number, number> = {}, bandHist: Record<string, number> = {}, strengthHist: Record<string, number> = {}, specialHist: Record<string, number> = {}
let n = 0, verdictCount = 0, tiers = { core: 0, detail: 0, reference: 0 }
for (let i = 0; i < 150; i++) {
  const inp = { year: rnd(1960, 2005), month: rnd(1, 12), day: rnd(1, 28), hour: rnd(0, 23), minute: 0, calendar: 'solar' as const, timeZone: 8, longitude: 116.4, latitude: 39.9, gender: (i % 2 ? 'M' : 'F') as 'M' | 'F' }
  const c = computeBazi(M, inp, { trueSolarTime: true, lateZi: 'next-day' })
  const a = analyseBazi(c)
  strengthHist[c.strength.verdict] = (strengthHist[c.strength.verdict] ?? 0) + 1
  specialHist[a.special.type ?? '无'] = (specialHist[a.special.type ?? '无'] ?? 0) + 1
  for (let y = inp.year + 20; y < inp.year + 60; y += 1) { const r = forecastYear(c, y, a).rating; yearHist[r] = (yearHist[r] ?? 0) + 1 }
  for (const l of c.luck.pillars.slice(0, 6)) { const r = forecastLuck(c, l, a).rating; luckHist[r] = (luckHist[r] ?? 0) + 1 }
  const w = assessWealth(c, a, DEFAULT_CONTEXT); bandHist[w.band.name] = (bandHist[w.band.name] ?? 0) + 1
  const vs = computeVerdicts(c, a); verdictCount += vs.length; for (const v of vs) tiers[v.tier ?? 'detail']++
  n++
}
const pct = (h: Record<string, number>, total: number) => Object.entries(h).sort().map(([k, v]) => `${k}:${(100 * v / total).toFixed(0)}%`).join(' ')
console.log('charts', n)
console.log('strength', pct(strengthHist, n))
console.log('special', pct(specialHist, n))
console.log('year ratings (-3..3)', pct(yearHist, n * 40))
console.log('luck ratings', pct(luckHist, n * 6))
console.log('wealth band (unknown context)', pct(bandHist, n))
console.log('verdicts avg', (verdictCount / n).toFixed(1), 'tiers avg', Object.entries(tiers).map(([k, v]) => `${k}:${(v / n).toFixed(1)}`).join(' '))
