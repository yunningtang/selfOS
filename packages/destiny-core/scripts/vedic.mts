import { getSwe } from '../src/ephemeris/swe'
import { computeVedic, DEFAULT_VEDIC_SETTINGS } from '../src/vedic/chart'
import { RASHI, GRAHA_IDS } from '../src/vedic/tables'
const swe = await getSwe()
const c = computeVedic(swe, { year: 1990, month: 5, day: 15, hour: 12, minute: 0, timeZone: 'Asia/Shanghai', longitude: 116.4074, latitude: 39.9042 }, DEFAULT_VEDIC_SETTINGS)
console.log('ayanamsa', c.ayanamsa, 'lagna', c.lagna.lon.toFixed(6), RASHI[c.lagna.sign].en, c.lagna.nakshatraName, c.lagna.pada)
for (const g of c.grahas) console.log(g.id, g.lon.toFixed(6).padStart(11), RASHI[g.sign].abbr, g.signDeg.toFixed(3).padStart(7), 'H' + g.house, 'ch' + g.chalitHouse, g.nakshatraName.padEnd(16), 'p' + g.pada, g.retrograde ? 'R' : ' ', g.combust ? 'C' : ' ', g.dignity.padEnd(11), 'D9', RASHI[g.vargas[9]].abbr, 'D10', RASHI[g.vargas[10]].abbr, 'D60', RASHI[g.vargas[60]].abbr, 'dec', g.declination.toFixed(2))
console.log('panchanga', JSON.stringify(c.panchanga))
console.log('dasha current', c.dasha.current.map(p => `${GRAHA_IDS[p.lord]} ${p.start}→${p.end}`).join(' / '))
console.log('mahas', c.dasha.periods.map(p => `${GRAHA_IDS[p.lord]} ${p.start}`).join(' | '))
for (const s of c.shadbala) console.log(GRAHA_IDS[s.graha], 'sthana', s.sthana.total.toFixed(1), `(u${s.sthana.uchcha.toFixed(1)} s${s.sthana.saptavargaja.toFixed(1)} o${s.sthana.ojayugma} k${s.sthana.kendra} d${s.sthana.drekkana})`, 'dig', s.dig.toFixed(1), 'kala', s.kala.total.toFixed(1), `(n${s.kala.nathonnatha.toFixed(1)} p${s.kala.paksha.toFixed(1)} t${s.kala.tribhaga} a${s.kala.abda} m${s.kala.masa} v${s.kala.vara} h${s.kala.hora} ay${s.kala.ayana.toFixed(1)})`, 'chesta', s.chesta.toFixed(1), 'nais', s.naisargika, 'drik', s.drik.toFixed(1), '= rupas', s.rupas.toFixed(2), '/', s.required, 'ratio', s.ratio.toFixed(2))
console.log('SAV', c.ashtakavarga.sav.join(' '), 'total', c.ashtakavarga.sav.reduce((a, b) => a + b, 0))
console.log('BAV Sun', c.ashtakavarga.bav[0].join(' '), 'sum', c.ashtakavarga.bav[0].reduce((a, b) => a + b, 0))
