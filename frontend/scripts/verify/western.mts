import { getSwe } from '@/engines/ephemeris/swe'
import { computeWestern, DEFAULT_WESTERN_SETTINGS, fmtDm } from '@/engines/western/chart'
import { SIGNS } from '@/engines/western/tables'
const swe = await getSwe()
const c = computeWestern(swe, { year: 1990, month: 5, day: 15, hour: 12, minute: 0, timeZone: 'Asia/Shanghai', longitude: 116.4074, latitude: 39.9042 }, DEFAULT_WESTERN_SETTINGS)
console.log('utc', c.utc, 'jd', c.jdUt.toFixed(6), 'day chart', c.isDayChart)
for (const b of c.bodies) console.log(b.id.padEnd(10), b.lon.toFixed(6).padStart(11), SIGNS[b.sign].en.padEnd(12), fmtDm(b.signDeg), 'H' + b.house, b.retrograde ? 'R' : ' ', b.dignity ?? '')
console.log('houses', c.houses.map(h => h.lon.toFixed(4)).join(' '))
console.log('aspects', c.aspects.length, c.aspects.slice(0, 8).map(a => `${a.a}-${a.b} ${a.def.zh} orb ${a.orb.toFixed(2)} ${a.applying ? 'A' : 'S'}`).join(' | '))
console.log('tally', Object.fromEntries(Object.entries(c.tally.elements).map(([k, v]) => [k, v.length])), c.moonPhase)
