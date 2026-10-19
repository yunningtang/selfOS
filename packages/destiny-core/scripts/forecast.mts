import { getSwe } from '../src/ephemeris/swe'
import { computeBazi, monthlyPillars } from '../src/bazi/chart'
import { analyseBazi } from '../src/bazi/analysis'
import { forecastLuck, forecastMonth, forecastYears, RATING_LABEL } from '../src/bazi/forecast'
const swe = await getSwe()
const c = computeBazi(swe, { year: 2003, month: 7, day: 27, hour: 8, minute: 0, calendar: 'solar', timeZone: 'Asia/Shanghai', longitude: 116.4074, latitude: 39.9042, gender: 'F' }, { trueSolarTime: true, lateZi: 'next-day' })
const a = analyseBazi(c)
for (const l of c.luck.pillars.slice(0, 4)) { const f = forecastLuck(c, l, a); console.log('大运', f.stemChar + f.branchChar, f.label, RATING_LABEL[f.rating], f.tags.join('/'), '|', f.summary) }
for (const f of forecastYears(c, 2024, 2030, a)) console.log('流年', f.stemChar + f.branchChar, f.label, RATING_LABEL[f.rating], f.tags.join('/'), '|', f.summary, '|', f.lines.length, 'lines')
const y = forecastYears(c, 2026, 2026, a)[0]
for (const l of y.lines) console.log('  ', l.tag ? `【${l.tag}】` : '', l.text, '←', l.basis)
for (const m of monthlyPillars(swe, c, 2026).slice(0, 3)) { const f = forecastMonth(c, m, a); console.log('流月', f.label, f.stemChar + f.branchChar, RATING_LABEL[f.rating], f.summary) }
