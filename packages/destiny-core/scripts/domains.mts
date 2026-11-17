import { getSwe } from '../src/ephemeris/swe'
import { computeBazi } from '../src/bazi/chart'
import { analyseBazi } from '../src/bazi/analysis'
import { forecastYear, forecastLuck, RATING_LABEL } from '../src/bazi/forecast'
const swe = await getSwe()
const c = computeBazi(swe, { year: 2003, month: 7, day: 27, hour: 8, minute: 0, calendar: 'solar', timeZone: 'Asia/Shanghai', longitude: 116.4074, latitude: 39.9042, gender: 'F' }, { trueSolarTime: true, lateZi: 'next-day' })
const a = analyseBazi(c)
for (const l of c.luck.pillars.slice(0, 4)) { const f = forecastLuck(c, l, a); console.log('运', f.stemChar + f.branchChar, RATING_LABEL[f.rating], f.domains.map((d) => `${d.name}${d.score}(${d.keyword})`).join(' '), '|', f.marks.map((m) => m.short + (m.good ? '+' : '-')).join('')) }
for (let y = 2024; y <= 2030; y++) { const f = forecastYear(c, y, a); console.log(y, f.stemChar + f.branchChar, RATING_LABEL[f.rating], f.domains.map((d) => `${d.name}${d.score}(${d.keyword})`).join(' '), '|', f.marks.map((m) => m.short + (m.good ? '+' : '-')).join(''), '\n   ', f.summary) }
