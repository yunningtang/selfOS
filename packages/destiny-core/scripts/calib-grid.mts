import { evaluate } from './calib-patterns.mts'
import { STRENGTH_WEIGHTS, setStrengthWeights } from '../src/bazi/strength'
const base = JSON.parse(JSON.stringify(STRENGTH_WEIGHTS))
let best = { score: evaluate(false), w: JSON.stringify(base) }
console.log('baseline', best.score)
const grid = {
  season: [[1.3, 1.15, 0.9, 0.75, 0.6], [1.3, 1.15, 0.95, 0.85, 0.7], [1.25, 1.1, 0.95, 0.85, 0.75], [1.4, 1.2, 0.9, 0.8, 0.7]],
  month: [1.6, 1.8, 2.0], day: [1.2, 1.5, 1.8], hour: [1.0, 1.2], seatRoot: [0.4, 0.8, 1.2], trine: [1.2, 2.0, 2.8], halfTrine: [0.5, 1.0, 1.5], strong: [55, 52, 50], weak: [45, 42, 40],
}
let n = 0
for (const se of grid.season) for (const month of grid.month) for (const day of grid.day) for (const hour of grid.hour) for (const seatRoot of grid.seatRoot) for (const trine of grid.trine) for (const halfTrine of grid.halfTrine) for (const strong of grid.strong) for (const weak of grid.weak) {
  if (weak >= strong - 6) continue
  setStrengthWeights({ season: { 旺: se[0], 相: se[1], 休: se[2], 囚: se[3], 死: se[4] }, posBranch: { year: 1.0, month, day, hour }, seatRoot, trine, halfTrine, strong, weak })
  const score = evaluate(false); n++
  if (score > best.score) { best = { score, w: JSON.stringify(STRENGTH_WEIGHTS) }; console.log('better', score, best.w) }
}
console.log('tried', n, 'best', best.score)
console.log(best.w)
