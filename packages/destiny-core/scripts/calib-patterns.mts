/**
 * Pattern / strength calibration on canonical 命造 constructed to the definitions in
 * 《三命通会》《子平真诠》《滴天髓》 (专旺五格, 从格, 财多身弱, 建禄, 杀印相生 …).
 * Each case gives the expected strength class, special pattern and favourable elements.
 */
import { getMitSolar } from '../src/ephemeris/solar'
import { computeBazi } from '../src/bazi/chart'
import { analyseBazi } from '../src/bazi/analysis'
import { STEMS, BRANCHES, ELEMENT_ZH } from '../src/bazi/tables'

const M = await getMitSolar()
const idx = (s: string) => STEMS.indexOf(s as never)
const bidx = (s: string) => BRANCHES.indexOf(s as never)
/** Find a date (1900–2060) whose 四柱 equal the given 干支; hour from the hour branch. */
function findDate(gz: string[], gender: 'M' | 'F') {
  const [y, m, d, h] = gz
  const hour = (bidx(h[1]) * 2 + 23) % 24 + 0.5 > 24 ? 0 : [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21][bidx(h[1])]
  for (let year = 1900; year <= 2060; year++) {
    if (STEMS[(((year - 1984) % 60) + 60) % 60 % 10] !== y[0] || BRANCHES[(((year - 1984) % 60) + 60) % 60 % 12] !== y[1]) continue
    // month branch → rough civil month (寅≈Feb…); scan the ±40 days around and test the real chart
    const mb = bidx(m[1])
    const approxMonth = ((mb - 2 + 12) % 12) + 2 // 寅→2 … 丑→13
    const base = new Date(Date.UTC(approxMonth > 12 ? year + 1 : year, (approxMonth - 1) % 12, 15))
    for (let off = -25; off <= 25; off++) {
      const dt = new Date(base.getTime() + off * 86400000)
      const inp = { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate(), hour: hour === 23 ? 23 : hour, minute: 30, calendar: 'solar' as const, timeZone: 8, longitude: 120, latitude: 30, gender }
      try {
        const c = computeBazi(M, inp, { trueSolarTime: false, lateZi: 'next-day' })
        const got = c.pillars.map((p) => p.stemChar + p.branchChar)
        if (got[0] === y && got[1] === m && got[2] === d && got[3] === h) return { inp, c }
      } catch { /* skip */ }
    }
  }
  return null
}

interface Case { name: string; gz: string[]; gender: 'M' | 'F'; strength: '身强' | '身弱' | '中和' | 'any' | '不弱' | '不强'; special: '专旺' | '从强' | '从弱' | null; fav: string[] }
const CASES: Case[] = [
  { name: '曲直格（木专旺）', gz: ['癸卯', '乙卯', '甲寅', '甲子'], gender: 'M', strength: '身强', special: '专旺', fav: ['木', '水', '火'] },
  { name: '炎上格（火专旺）', gz: ['丙午', '甲午', '丙午', '甲午'], gender: 'M', strength: '身强', special: '专旺', fav: ['火', '木', '土'] },
  { name: '稼穑格（土专旺）', gz: ['戊戌', '己未', '戊辰', '戊午'], gender: 'M', strength: '身强', special: '专旺', fav: ['土', '火', '金'] },
  { name: '从革格（金专旺）', gz: ['庚申', '乙酉', '辛酉', '戊戌'], gender: 'M', strength: '身强', special: '专旺', fav: ['金', '土', '水'] },
  { name: '润下格（水专旺）', gz: ['壬子', '壬子', '癸亥', '辛酉'], gender: 'F', strength: '身强', special: '专旺', fav: ['水', '金', '木'] },
  { name: '从财格（丙无根从金）', gz: ['己酉', '癸酉', '丙申', '戊子'], gender: 'M', strength: '身弱', special: '从弱', fav: ['金', '土', '水'] },
  { name: '从儿格（甲从火）', gz: ['丙午', '甲午', '甲戌', '己巳'], gender: 'F', strength: '身弱', special: '从弱', fav: ['火', '土'] },
  { name: '从杀格（乙无根从金）', gz: ['辛酉', '丁酉', '乙丑', '辛巳'], gender: 'M', strength: '身弱', special: '从弱', fav: ['金', '土'] },
  { name: '财多身弱（庚 寅月，印透）', gz: ['甲寅', '丙寅', '庚寅', '己卯'], gender: 'M', strength: '身弱', special: null, fav: ['土', '金'] },
  { name: '建禄得令得地（不弱）', gz: ['庚午', '戊寅', '甲子', '庚午'], gender: 'M', strength: '不弱', special: null, fav: [] },
  { name: '杀印相生身弱', gz: ['庚申', '庚辰', '甲申', '癸酉'], gender: 'M', strength: '身弱', special: null, fav: ['水', '木'] },
  { name: '伤官配印中和', gz: ['癸卯', '甲子', '壬午', '乙巳'], gender: 'F', strength: 'any', special: null, fav: [] },
  { name: '禄刃双根，食伤生财（不弱）', gz: ['戊午', '丙辰', '甲寅', '丁卯'], gender: 'M', strength: '不弱', special: null, fav: [] },
  { name: '印重（从强或身强皆可，喜用须含水或木）', gz: ['戊戌', '己未', '辛丑', '壬辰'], gender: 'F', strength: '身强', special: null, fav: [] },
  { name: '官杀三透会火（不强）', gz: ['丙午', '丁酉', '庚午', '丙戌'], gender: 'M', strength: '不强', special: null, fav: ['土', '金'] },
]

const FOUND = CASES.map((cs) => ({ cs, found: findDate(cs.gz, cs.gender) }))
export function evaluate(verbose = true) {
let pass = 0
for (const { cs, found } of FOUND) {
  if (!found) { if (verbose) console.log('NO DATE', cs.name, cs.gz.join(' ')); continue }
  const c = computeBazi(M, found.inp, { trueSolarTime: false, lateZi: 'next-day' })
  const a = analyseBazi(c)
  const st = c.strength
  const fav = a.effective.favourable.map((e) => ELEMENT_ZH[e])
  const okS = cs.strength === 'any' || (cs.strength === '不弱' ? st.verdict !== '身弱' : cs.strength === '不强' ? st.verdict !== '身强' : st.verdict === cs.strength)
  const okP = cs.name.startsWith('印重') ? (a.special.type === null || a.special.type === '从强') : cs.special === null ? a.special.type === null : (cs.special === '专旺' ? (a.special.type === '专旺' || a.special.type === '从强') : a.special.type === cs.special)
  const okF = cs.fav.length === 0 || cs.fav.every((f) => fav.includes(f))
  const ok = okS && okP && okF
  if (ok) pass++
  const pct = a.elementSummary.map((s) => `${s.role}${s.percent}`).join(' ')
  if (verbose) console.log(`${ok ? 'PASS' : 'FAIL'} ${cs.name} ${cs.gz.join('')} | 同党${st.selfParty}% ${st.verdict}${okS ? '' : '✗'} | special=${a.special.type ?? '无'}${a.special.follow ? '(' + a.special.follow + ')' : ''}${okP ? '' : '✗'} | 喜${fav.join('')}${okF ? '' : '✗ want ' + cs.fav.join('')} | ${pct} | ${a.patterns.map((p) => p.name).join(',')}`)
}
if (verbose) console.log(`${pass}/${CASES.length} pass`)
return pass
}
if (process.argv[1]?.endsWith('calib-patterns.mts')) evaluate(true)
