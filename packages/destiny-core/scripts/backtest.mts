/**
 * Back-test the outlook against dated outcomes. Input: a JSON file of cases
 *   [{ "name": "…", "birth": { year, month, day, hour, minute, timeZone, longitude, latitude, gender },
 *      "events": [{ "year": 2019, "outcome": 1 }, { "year": 2021, "outcome": -1 }] }]
 * outcome: 1 good year, -1 bad year, 0 ordinary. Reports agreement and the confusion table.
 * Usage: npx tsx scripts/backtest.mts cases.json
 */
import { readFileSync } from 'node:fs'
import { getMitSolar } from '../src/ephemeris/solar'
import { computeBazi } from '../src/bazi/chart'
import { analyseBazi } from '../src/bazi/analysis'
import { forecastYear } from '../src/bazi/forecast'
const file = process.argv[2]
if (!file) { console.log('usage: npx tsx scripts/backtest.mts cases.json'); process.exit(1) }
const cases = JSON.parse(readFileSync(file, 'utf8')) as { name: string; birth: Record<string, unknown>; events: { year: number; outcome: -1 | 0 | 1 }[] }[]
const M = await getMitSolar()
let agree = 0, total = 0
const table: Record<string, number> = {}
for (const cs of cases) {
  const c = computeBazi(M, { calendar: 'solar', ...(cs.birth as object) } as never, { trueSolarTime: true, lateZi: 'next-day' })
  const a = analyseBazi(c)
  for (const e of cs.events) {
    const r = forecastYear(c, e.year, a).rating
    const pred = r >= 1 ? 1 : r <= -1 ? -1 : 0
    total++
    if (pred === e.outcome) agree++
    const k = `actual ${e.outcome} / predicted ${pred}`
    table[k] = (table[k] ?? 0) + 1
    console.log(`${cs.name} ${e.year}: predicted ${pred} (${r}) actual ${e.outcome}`)
  }
}
console.log(`agreement ${agree}/${total} = ${((100 * agree) / Math.max(1, total)).toFixed(0)}%`)
console.log(table)
