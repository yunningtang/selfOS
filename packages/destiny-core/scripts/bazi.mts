import { getSwe } from '../src/ephemeris/swe'
import { computeBazi, annualPillars, monthlyPillars } from '../src/bazi/chart'
import { Solar } from 'lunar-javascript'
const swe = await getSwe()
const c = computeBazi(swe, { year: 1990, month: 5, day: 15, hour: 12, minute: 0, calendar: 'solar', timeZone: 'Asia/Shanghai', longitude: 116.4074, latitude: 39.9042, gender: 'F' }, { trueSolarTime: false, lateZi: 'next-day' })
console.log(c.time)
console.log(c.pillars.map(p => `${p.stemChar}${p.branchChar} ${p.stemTenGod} [${p.hidden.map(h => h.stemChar + h.tenGod).join(' ')}] ${p.lifeStage}/${p.selfSeat} ${p.naYin} 空${p.kongWang ? '亡' : '-'}`).join('\n'))
console.log('palaces', c.palaces, 'kong', c.kongWang, 'lunar', c.lunar.text, c.sunSign)
console.log('terms', c.terms.previous, c.terms.next)
console.log('luck', c.luck.forward, c.luck.daysToTerm.toFixed(3), c.luck.startAge, c.luck.startDate)
console.log(c.luck.pillars.map(l => `${l.stemChar}${l.branchChar}@${l.startAge}/${l.startYear}`).join(' '))
console.log('strength', c.strength.verdict, c.strength.selfParty, c.strength.percent, c.strength.pattern, c.strength.favourable)
console.log('relations', c.relations.map(r => r.note).join(' | '))
console.log('shensha', c.shensha.map(s => `${s.name}(${s.pillars.join(',')})`).join(' '))
console.log('annual', annualPillars(c, c.luck.pillars[2]).slice(0, 3).map(a => `${a.year}${a.stemChar}${a.branchChar}`).join(' '))
console.log('monthly', monthlyPillars(swe, c, 2027).slice(0, 3).map(m => `${m.term} ${m.startsAt} ${m.stemChar}${m.branchChar}`).join(' | '))

// Cross-check pillars against lunar-javascript over random instants (standard clock, next-day 子时 rule)
let mism = 0, n = 0, near = 0
function rnd(a: number, b: number) { return a + Math.floor(Math.random() * (b - a + 1)) }
for (let i = 0; i < 400; i++) {
  const y = rnd(1920, 2080), mo = rnd(1, 12), d = rnd(1, 28), h = rnd(0, 22), mi = rnd(0, 59)
  const r = computeBazi(swe, { year: y, month: mo, day: d, hour: h, minute: mi, calendar: 'solar', timeZone: 8, longitude: 116.4, latitude: 39.9, gender: 'M' }, { trueSolarTime: false, lateZi: 'next-day' })
  const ec = Solar.fromYmdHms(y, mo, d, h, mi, 0).getLunar().getEightChar()
  const mine = r.pillars.map(p => p.stemChar + p.branchChar).join(' ')
  const ref = [ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()].join(' ')
  n++
  if (mine !== ref) {
    const minsToTerm = Math.min(Math.abs(r.terms.previous.jdUt - (r as any).jd), 99) 
    // Is the instant within 5 minutes of a 节? then it's a boundary rounding difference
    const dPrev = Math.abs(r.luck.daysToTerm) 
    mism++; if (mism < 8) console.log('MISMATCH', y, mo, d, h, mi, '| mine', mine, '| lunar-js', ref, '| prev', r.terms.previous.at, 'next', r.terms.next.at)
  }
  const yun = ec.getYun(1); const refStart = `${yun.getStartYear()}y${yun.getStartMonth()}m${yun.getStartDay()}d`
  const mineStart = `${r.luck.startAge.years}y${r.luck.startAge.months}m${r.luck.startAge.days}d`
  if (refStart !== mineStart) { near++; if (near < 6) console.log('LUCK diff', y, mo, d, h, mi, 'mine', mineStart, 'ref', refStart) }
  const refMing = ec.getMingGong(), refShen = ec.getShenGong(), refTai = ec.getTaiYuan()
  if (mine === ref && (refMing !== r.palaces.mingGong || refShen !== r.palaces.shenGong || refTai !== r.palaces.taiYuan)) console.log('PALACE diff', mine, r.palaces, refMing, refShen, refTai)
}
console.log('pillar mismatches', mism, '/', n, '; luck start diffs', near)
