import { getSwe } from '../src/ephemeris/swe'
import { computeBazi } from '../src/bazi/chart'
import { analyseBazi } from '../src/bazi/analysis'
import { computeVerdicts } from '../src/bazi/verdicts'
const swe = await getSwe()
const c = computeBazi(swe, { year: 2003, month: 7, day: 27, hour: 8, minute: 0, calendar: 'solar', timeZone: 'Asia/Shanghai', longitude: 116.4074, latitude: 39.9042, gender: 'F' }, { trueSolarTime: true, lateZi: 'next-day' })
const a = analyseBazi(c)
console.log(a.overview); console.log(a.relationsLine)
console.log('patterns', a.patterns.map((p) => p.name).join(' | '))
for (const s of a.elementSummary) console.log(s.role, s.element, s.count, s.exposure, s.value, s.percent + '%', s.verdict)
for (const g of a.tenGods) console.log(g.name, g.count, g.exposure, g.base, g.basePercent + '%', g.month, g.hour, g.rootBonus, g.trait, g.total, g.percent + '%')
for (const s of a.scores) console.log(s.name, s.score + '/' + s.max, s.note)
console.log('total', a.totalScore)
for (const u of a.useGods) console.log(u.type, u.favourable.join(' '), '|', u.unfavourable.join(' '), '|', u.note)
console.log(a.tiaohou)
const v = computeVerdicts(c, a)
console.log(v.length, 'verdicts')
for (const x of v) console.log(`${x.tag ? '【' + x.tag + (x.star ? ' ★' : '') + '】' : ''}${x.text}  ${x.confidence}%  ${x.basis}`)
