import { getSwe } from '../src/ephemeris/swe'
import { computeBazi } from '../src/bazi/chart'
import { analyseBazi } from '../src/bazi/analysis'
import { computeVerdicts } from '../src/bazi/verdicts'
import { plainReading } from '../src/bazi/plain'
const swe = await getSwe()
const cases = [
  { year: 2003, month: 7, day: 27, hour: 8, gender: 'F' as const },
  { year: 1990, month: 3, day: 15, hour: 22, gender: 'M' as const },
  { year: 1985, month: 12, day: 1, hour: 3, gender: 'M' as const },
]
for (const cs of cases) {
  const c = computeBazi(swe, { ...cs, minute: 0, calendar: 'solar', timeZone: 'Asia/Shanghai', longitude: 116.4074, latitude: 39.9042 }, { trueSolarTime: true, lateZi: 'next-day' })
  const a = analyseBazi(c)
  const p = plainReading(c, a, computeVerdicts(c, a))
  console.log('\n====', cs.year, c.pillars.map((x) => x.stemChar + x.branchChar).join(' '))
  console.log('#', p.headline)
  for (const s of p.sections) { console.log('\n##', s.title); for (const q of s.paras) console.log(' ', q); for (const b of s.bullets ?? []) console.log('  -', b) }
}
