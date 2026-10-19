/**
 * 运势预判 — rough outlooks for 大运, 流年 and 流月, derived from how each period's 干支
 * meets the natal chart: 十神 of the period, 喜忌 of its elements, 太岁 relations with the
 * year branch, 冲合刑害 with the day / month / hour branches, 伏吟 / 反吟, 岁运并临, and the
 * period's 神煞 (桃花、驿马、贵人…). Every line carries its basis; the rating is a coarse
 * −3…+3 sum of those signals.
 */
import type { FiveElement, PillarKey } from '../types'
import {
  BRANCHES, BRANCH_BREAK, BRANCH_CLASH, BRANCH_ELEMENT, BRANCH_HARM, BRANCH_PUNISH_PAIRS, BRANCH_SELF_PUNISH, BRANCH_SIX_COMBINE, BRANCH_TRINE,
  ELEMENT_ZH, HIDDEN_STEMS, STEMS, STEM_CLASH, STEM_COMBINE, STEM_ELEMENT, controls, generates, lifeStage, tenGod,
} from './tables'
import { STEM_STARS, TRINE_STARS, trineGroup } from './shensha'
import type { BaziChart, LuckPillar, MonthlyPillar } from './types'
import type { BaziAnalysis } from './analysis'
import type { Verdict, VerdictTag } from './verdicts'

export type Rating = -3 | -2 | -1 | 0 | 1 | 2 | 3
export const RATING_LABEL: Record<Rating, string> = { 3: '大吉', 2: '吉', 1: '小吉', 0: '平', [-1]: '小忌', [-2]: '忌', [-3]: '凶' }

export interface PeriodForecast {
  kind: 'luck' | 'year' | 'month'
  label: string
  stemChar: string
  branchChar: string
  stemGod: string
  branchGod: string
  rating: Rating
  /** Short keywords, e.g. 冲太岁 / 贵人 / 桃花 */
  tags: string[]
  summary: string
  lines: Verdict[]
}

const YEAR_GOD: Record<string, [string, string]> = {
  比肩: ['比肩年：靠自己与朋友同辈，宜合作创业，须防朋友借贷与争财。', '争竞'],
  劫财: ['劫财年：竞争激烈、花销大，财易耗散，宜守不宜攻，防合伙失财。', '破耗'],
  食神: ['食神年：福气与口福旺，才艺生财，心情舒展，利于创作与享受。', '福气'],
  伤官: ['伤官年：才华外露、创意多，但易与上司规矩冲突，须防口舌官非。', '口舌'],
  正财: ['正财年：财运平稳，收入可靠，宜积蓄置产；男命有婚缘。', '正财'],
  偏财: ['偏财年：财路活络、人缘旺，宜经营投资；男命异性缘动。', '偏财'],
  正官: ['正官年：名分提升，利考试升迁与签约，宜守规矩；女命有婚缘。', '升迁'],
  七杀: ['七杀年：压力与机遇并至，宜拼搏竞争，防小人与意外；女命感情动。', '压力'],
  正印: ['正印年：学业文书顺利，得长辈贵人扶助，利考证进修与置业。', '贵人'],
  偏印: ['偏印年：偏才发挥、思路独特，宜专门之学，但易孤独多疑、计划被打断。', '偏思'],
}
const BRANCH_GOD_TEXT: Record<string, string> = {
  比肩: '地支比肩，根基在同辈与自己。', 劫财: '地支劫财，根基处须防耗损。', 食神: '地支食神，根基生福气。', 伤官: '地支伤官，根基处才气外露。',
  正财: '地支正财，根基有财可守。', 偏财: '地支偏财，根基处财路活。', 正官: '地支正官，根基有名分。', 七杀: '地支七杀，根基处有压力。',
  正印: '地支正印，根基得庇护。', 偏印: '地支偏印，根基处多独思。',
}
const POS_WHO: Record<PillarKey, string> = { year: '祖上长辈、根基', month: '父母兄弟、工作环境', day: '自身与配偶、婚姻宫', hour: '子女晚辈、居所与晚辈' }
const YEAR_STAR_TEXT: Record<string, string> = {
  驿马: '驿马年：多迁移出行、换环境，宜外出发展。', 桃花: '桃花年：人缘与异性缘旺，感情易动，已婚者须防外缘。', 华盖: '华盖年：宜独处进修、艺术宗教，不宜热闹。',
  将星: '将星年：有领导机会，宜担当。', 亡神: '亡神年：易有失落、机谋暗斗，守口慎行。', 劫煞: '劫煞年：防破耗争斗与意外之失。', 灾煞: '灾煞年：防疾厄横事，出行小心。',
  天乙贵人: '贵人年：逢凶化吉，多得人扶助。', 太极贵人: '太极贵人年：宜学问玄理，心境安稳。', 文昌贵人: '文昌年：利考试文书。', 国印贵人: '国印年：利权印文书之事。',
  学堂: '学堂年：利学业。', 禄神: '禄神年：衣禄丰足，自立有成。', 羊刃: '羊刃年：性急冲动，防刑伤手术。', 飞刃: '飞刃年：防意外刑伤。', 金舆: '金舆年：得配偶之助。',
  红艳煞: '红艳年：多情执著，感情用事。', 福星贵人: '福星年：少灾多福。', 流霞: '流霞年：防血光，女命防产厄。',
}

function v(text: string, confidence: number, basis: string, topic: string, tag?: VerdictTag): Verdict {
  return { text, confidence, basis, topic, tag }
}
const clamp = (n: number): Rating => Math.max(-3, Math.min(3, Math.round(n))) as Rating

interface Natal {
  chart: BaziChart
  dm: number
  dmEl: FiveElement
  fav: Set<FiveElement>
  unfav: Set<FiveElement>
  tiaohou: Set<string>
  stems: Record<PillarKey, number>
  branches: Record<PillarKey, number>
}

function natal(chart: BaziChart, analysis?: BaziAnalysis): Natal {
  return {
    chart, dm: chart.dayMaster.stem, dmEl: chart.dayMaster.element,
    fav: new Set(chart.strength.favourable), unfav: new Set(chart.strength.unfavourable),
    tiaohou: new Set(analysis?.tiaohou.stems ?? chart.classics.tiaoHou.levels.flat()),
    stems: Object.fromEntries(chart.pillars.map((p) => [p.key, p.stem])) as Record<PillarKey, number>,
    branches: Object.fromEntries(chart.pillars.map((p) => [p.key, p.branch])) as Record<PillarKey, number>,
  }
}

const pairIn = (a: number, b: number, t: [number, number][]) => t.some(([x, y]) => (x === a && y === b) || (x === b && y === a))

/** Lines and score for how a period 干支 meets the natal chart. Shared by 大运 / 流年 / 流月. */
function meet(n: Natal, stem: number, branch: number, kind: PeriodForecast['kind'], luck?: LuckPillar): { lines: Verdict[]; score: number; tags: string[] } {
  const lines: Verdict[] = []
  const tags: string[] = []
  let score = 0
  const word = kind === 'luck' ? '大运' : kind === 'year' ? '流年' : '流月'
  const gz = STEMS[stem] + BRANCHES[branch]
  const sg = tenGod(n.dm, stem), bg = tenGod(n.dm, HIDDEN_STEMS[branch][0])
  const se = STEM_ELEMENT[stem], be = BRANCH_ELEMENT[branch]

  // 十神
  lines.push(v(`${word}${gz}天干${sg}。${YEAR_GOD[sg][0].replace('年', word === '流年' ? '年' : word === '大运' ? '运' : '月')}`, 86, `${word}干${STEMS[stem]}为${sg}`, '事业'))
  lines.push(v(`${word}${gz}${BRANCH_GOD_TEXT[bg]}`, 80, `${word}支${BRANCHES[branch]}本气${bg}`, '事业'))
  tags.push(YEAR_GOD[sg][1])

  // 喜忌
  const favCount = [se, be].filter((e) => n.fav.has(e)).length, unfavCount = [se, be].filter((e) => n.unfav.has(e)).length
  score += favCount - unfavCount
  if (favCount === 2) lines.push(v(`${word}干支${ELEMENT_ZH[se]}${ELEMENT_ZH[be]}皆为喜用：整体顺遂，宜进取。`, 84, `喜用${[...n.fav].map((e) => ELEMENT_ZH[e]).join('')}`, '格局', '吉'))
  else if (unfavCount === 2) lines.push(v(`${word}干支${ELEMENT_ZH[se]}${ELEMENT_ZH[be]}皆为忌神：阻滞较多，宜守成、少做大决定。`, 84, `忌${[...n.unfav].map((e) => ELEMENT_ZH[e]).join('')}`, '格局', '忌'))
  else if (favCount === 1 && unfavCount === 1) lines.push(v(`${word}一喜一忌（${ELEMENT_ZH[se]}${ELEMENT_ZH[be]}）：先难后易或喜忧参半，看上下半年。`, 78, '干支喜忌各半', '格局'))
  else if (favCount === 1) lines.push(v(`${word}${ELEMENT_ZH[se === (n.fav.has(se) ? se : be) ? se : be]}为喜用，小顺。`, 78, '干支一字为喜用', '格局', '吉'))
  else if (unfavCount === 1) lines.push(v(`${word}${ELEMENT_ZH[n.unfav.has(se) ? se : be]}为忌，小阻。`, 78, '干支一字为忌', '格局', '忌'))
  if (n.tiaohou.has(STEMS[stem])) { score += 1; lines.push(v(`${word}天干${STEMS[stem]}正是调候用神：寒暖燥湿得补，层次上升之期。`, 84, `调候用神${STEMS[stem]}透出`, '格局', '佳')) }

  // 天干与日主
  if (stem === n.dm) lines.push(v(`${word}干与日主同字（伏吟天干）：诸事重复、自我强势，与人争竞。`, 76, `${word}干${STEMS[stem]}=日干`, '性格'))
  const combo = STEM_COMBINE.find(([a, b]) => (a === stem && b === n.dm) || (a === n.dm && b === stem))
  if (combo) { lines.push(v(`${word}干${STEMS[stem]}合日干${STEMS[n.dm]}（化${ELEMENT_ZH[combo[2]]}）：有合作、牵绊或感情之事，身被合则主意易被人左右。`, 80, `${STEMS[stem]}${STEMS[n.dm]}相合`, '六亲')); tags.push('合身') }
  if (pairIn(stem, n.dm, STEM_CLASH)) { score -= 1; lines.push(v(`${word}干${STEMS[stem]}冲克日干：压力直逼自身，防健康与冲突。`, 78, `${STEMS[stem]}${STEMS[n.dm]}相冲`, '健康', '忌')) }

  // 太岁（与年支）
  const yb = n.branches.year
  if (branch === yb) { score -= 1; tags.push(kind === 'year' ? '本命年' : '值太岁'); lines.push(v(`${word}支与年支同为${BRANCHES[branch]}，${kind === 'year' ? '本命年' : '值太岁'}：旧事翻新、起伏较大，宜稳。`, 80, `${word}支=年支${BRANCHES[yb]}`, '六亲', '忌')) }
  if (pairIn(branch, yb, BRANCH_CLASH)) { score -= 1; tags.push('冲太岁'); lines.push(v(`${word}支${BRANCHES[branch]}冲年支${BRANCHES[yb]}（冲太岁）：变动、搬迁、长辈之忧，宜动中求静。`, 82, `${BRANCHES[branch]}${BRANCHES[yb]}相冲`, '六亲', '忌')) }
  if (pairIn(branch, yb, BRANCH_HARM)) { score -= 0.5; tags.push('害太岁'); lines.push(v(`${word}支害年支（害太岁）：小人暗损，防是非。`, 76, `${BRANCHES[branch]}${BRANCHES[yb]}相害`, '六亲', '忌')) }
  if (pairIn(branch, yb, BRANCH_BREAK)) { score -= 0.5; tags.push('破太岁'); lines.push(v(`${word}支破年支（破太岁）：破耗波折，防财物损失。`, 74, `${BRANCHES[branch]}${BRANCHES[yb]}相破`, '财运', '忌')) }
  if (BRANCH_PUNISH_PAIRS.some(([a, b]) => (a === branch && b === yb) || (a === yb && b === branch)) || (branch === yb && BRANCH_SELF_PUNISH.includes(branch))) { score -= 0.5; tags.push('刑太岁'); lines.push(v(`${word}支刑年支（刑太岁）：拉扯是非、暗疾，防官非。`, 76, `${BRANCHES[branch]}${BRANCHES[yb]}相刑`, '健康', '凶')) }
  if (BRANCH_SIX_COMBINE.some(([a, b]) => (a === branch && b === yb) || (a === yb && b === branch))) { score += 0.5; tags.push('合太岁'); lines.push(v(`${word}支合年支（合太岁）：得长辈贵人缘，诸事和顺。`, 78, `${BRANCHES[branch]}${BRANCHES[yb]}六合`, '六亲', '吉')) }
  const trine = BRANCH_TRINE.find(([g]) => g.includes(branch) && g.includes(yb) && branch !== yb)
  if (trine) { score += 0.5; lines.push(v(`${word}支与年支三合${ELEMENT_ZH[trine[1]]}局：人缘聚合，${n.fav.has(trine[1]) ? '合为喜用，吉' : n.unfav.has(trine[1]) ? '合成忌神，须防被卷入' : '平'}。`, 76, `${BRANCHES[branch]}${BRANCHES[yb]}半合`, '六亲', n.fav.has(trine[1]) ? '吉' : undefined)) }

  // 与日支、月支、时支
  for (const k of ['day', 'month', 'hour'] as const) {
    const nb = n.branches[k]
    if (pairIn(branch, nb, BRANCH_CLASH)) {
      score -= k === 'day' ? 1 : 0.5
      tags.push(k === 'day' ? '冲日支' : k === 'month' ? '冲月支' : '冲时支')
      lines.push(v(`${word}支${BRANCHES[branch]}冲${k === 'day' ? '日' : k === 'month' ? '月' : '时'}支${BRANCHES[nb]}：${POS_WHO[k]}有变动，${k === 'day' ? '婚姻感情或身体起波澜、易搬迁' : k === 'month' ? '工作环境或父母兄弟有变' : '子女居所之事生变'}。`, 82, `${BRANCHES[branch]}${BRANCHES[nb]}相冲`, '六亲', '忌'))
    } else if (BRANCH_SIX_COMBINE.some(([a, b]) => (a === branch && b === nb) || (a === nb && b === branch))) {
      score += k === 'day' ? 0.5 : 0.25
      lines.push(v(`${word}支合${k === 'day' ? '日' : k === 'month' ? '月' : '时'}支${BRANCHES[nb]}：${POS_WHO[k]}和合，${k === 'day' ? '感情婚姻有进展，未婚者有缘' : '相关人事顺遂'}。`, 78, `${BRANCHES[branch]}${BRANCHES[nb]}六合`, '六亲', '吉'))
      if (k === 'day') tags.push('合日支')
    } else if (pairIn(branch, nb, BRANCH_HARM)) {
      lines.push(v(`${word}支害${k === 'day' ? '日' : k === 'month' ? '月' : '时'}支：${POS_WHO[k]}暗生嫌隙。`, 72, `${BRANCHES[branch]}${BRANCHES[nb]}相害`, '六亲', '忌'))
    } else if (BRANCH_PUNISH_PAIRS.some(([a, b]) => (a === branch && b === nb) || (a === nb && b === branch))) {
      score -= 0.25
      lines.push(v(`${word}支刑${k === 'day' ? '日' : k === 'month' ? '月' : '时'}支：${POS_WHO[k]}有拉扯、暗疾或是非。`, 74, `${BRANCHES[branch]}${BRANCHES[nb]}相刑`, '健康', '忌'))
    }
  }

  // 伏吟 / 反吟 日柱
  if (stem === n.stems.day && branch === n.branches.day) { score -= 1; tags.push('伏吟'); lines.push(v(`${word}${gz}与日柱伏吟：旧事重演、心情郁闷，宜守静。`, 80, `${word}干支=日柱`, '健康', '忌')) }
  if (pairIn(stem, n.stems.day, STEM_CLASH) && pairIn(branch, n.branches.day, BRANCH_CLASH)) { score -= 1; tags.push('反吟'); lines.push(v(`${word}${gz}与日柱天克地冲（反吟）：大变动之期，婚姻、健康、居所皆须慎。`, 84, `${word}干支与日柱天克地冲`, '健康', '凶')) }

  // 神煞
  const dayGroup = trineGroup(n.branches.day), yearGroup = trineGroup(yb)
  for (const [name, byGroup, , kindOf] of TRINE_STARS) {
    if (byGroup[dayGroup] === branch || byGroup[yearGroup] === branch) {
      if (YEAR_STAR_TEXT[name]) { lines.push(v(YEAR_STAR_TEXT[name].replace('年', word === '流年' ? '年' : word === '大运' ? '运' : '月'), 76, `${word}支${BRANCHES[branch]}为${name}`, '神煞', kindOf === 'auspicious' ? '吉' : kindOf === 'inauspicious' ? '凶' : undefined)); tags.push(name) }
      if (kindOf === 'inauspicious') score -= 0.25
    }
  }
  for (const [name, byStem, , kindOf] of STEM_STARS) {
    if (byStem[n.dm].includes(branch) && YEAR_STAR_TEXT[name]) {
      lines.push(v(YEAR_STAR_TEXT[name].replace('年', word === '流年' ? '年' : word === '大运' ? '运' : '月'), 76, `日干${STEMS[n.dm]}见${BRANCHES[branch]}为${name}`, '神煞', kindOf === 'auspicious' ? '吉' : kindOf === 'inauspicious' ? '凶' : undefined))
      if (kindOf === 'auspicious') { score += 0.5; tags.push(name === '天乙贵人' ? '贵人' : name) } else if (kindOf === 'inauspicious') score -= 0.25
    }
  }

  // 与大运
  if (luck && kind !== 'luck') {
    const ls = luck.sexagenary % 10, lb = luck.sexagenary % 12
    if (ls === stem && lb === branch) { tags.push('岁运并临'); lines.push(v(`${word}与大运${luck.stemChar}${luck.branchChar}干支相同（岁运并临）：大事之期，吉凶皆放大。`, 84, '岁运并临', '事业', '内容')) }
    else if (pairIn(stem, ls, STEM_CLASH) && pairIn(branch, lb, BRANCH_CLASH)) { score -= 1; tags.push('岁运相冲'); lines.push(v(`${word}与大运天克地冲：运与年相争，变动剧烈，宜避开重大决策。`, 82, `${gz}冲${luck.stemChar}${luck.branchChar}`, '事业', '凶')) }
    else if (pairIn(branch, lb, BRANCH_CLASH)) { score -= 0.5; lines.push(v(`${word}支冲大运支：环境与节奏生变。`, 76, `${BRANCHES[branch]}${BRANCHES[lb]}相冲`, '事业', '忌')) }
    else if (BRANCH_SIX_COMBINE.some(([a, b]) => (a === branch && b === lb) || (a === lb && b === branch))) { score += 0.25; lines.push(v(`${word}支合大运支：运年相合，顺势而为。`, 74, `${BRANCHES[branch]}${BRANCHES[lb]}六合`, '事业', '吉')) }
  }

  // 日主在此支的星运
  const st = lifeStage(n.dm, branch)
  lines.push(v(`日主${STEMS[n.dm]}在${word}支${BRANCHES[branch]}为${st}：${st === '长生' || st === '冠带' || st === '临官' || st === '帝旺' ? '气势得助，精力充沛' : st === '沐浴' ? '多情多变' : st === '墓' ? '入库收藏，宜蓄力' : st === '绝' || st === '死' || st === '病' ? '精力偏弱，宜养' : '平稳'}。`, 72, `${word}支星运${st}`, '健康'))
  // 生克日主
  if (generates(be, n.dmEl)) lines.push(v(`${word}地支生日主：根基处得生扶。`, 70, `${ELEMENT_ZH[be]}生${ELEMENT_ZH[n.dmEl]}`, '健康'))
  else if (controls(be, n.dmEl)) lines.push(v(`${word}地支克日主：根基处受压。`, 70, `${ELEMENT_ZH[be]}克${ELEMENT_ZH[n.dmEl]}`, '健康'))

  return { lines, score, tags: Array.from(new Set(tags)) }
}

function summarise(kind: PeriodForecast['kind'], rating: Rating, sg: string, tags: string[]): string {
  const lead = YEAR_GOD[sg][1]
  const tone = rating >= 2 ? '整体顺遂，可进取' : rating === 1 ? '小顺，稳中有进' : rating === 0 ? '平稳，按部就班' : rating === -1 ? '小有阻滞，宜稳' : rating === -2 ? '阻滞较多，宜守成' : '多变多忧，静守为上'
  const extra = tags.filter((t) => t !== lead).slice(0, 3).join('、')
  return `${lead}之${kind === 'luck' ? '运' : kind === 'year' ? '年' : '月'}，${tone}${extra ? '；关键词：' + extra : ''}。`
}

/** Outlook for one 大运. */
export function forecastLuck(chart: BaziChart, luck: LuckPillar, analysis?: BaziAnalysis): PeriodForecast {
  const n = natal(chart, analysis)
  const stem = luck.sexagenary % 10, branch = luck.sexagenary % 12
  const { lines, score, tags } = meet(n, stem, branch, 'luck')
  const rating = clamp(score)
  return { kind: 'luck', label: `${luck.startAge}–${luck.startAge + 9}岁 · ${luck.startYear}–${luck.endYear}`, stemChar: luck.stemChar, branchChar: luck.branchChar, stemGod: luck.stemTenGod, branchGod: luck.branchMainTenGod, rating, tags, summary: summarise('luck', rating, luck.stemTenGod, tags), lines }
}

/** Outlook for one 流年 (Gregorian year, 立春-based 干支). */
export function forecastYear(chart: BaziChart, year: number, analysis?: BaziAnalysis): PeriodForecast {
  const n = natal(chart, analysis)
  const sexa = (((year - 1984) % 60) + 60) % 60
  const stem = sexa % 10, branch = sexa % 12
  const luck = chart.luck.pillars.find((l) => l.startYear <= year && year <= l.endYear)
  const { lines, score, tags } = meet(n, stem, branch, 'year', luck)
  const rating = clamp(score)
  const age = year - chart.time.civil.year + 1
  const sg = tenGod(n.dm, stem)
  return { kind: 'year', label: `${year} · ${age}虚岁${luck ? ' · 大运' + luck.stemChar + luck.branchChar : ''}`, stemChar: STEMS[stem], branchChar: BRANCHES[branch], stemGod: sg, branchGod: tenGod(n.dm, HIDDEN_STEMS[branch][0]), rating, tags, summary: summarise('year', rating, sg, tags), lines }
}

/** Outlook for one 流月 (from the monthly pillars of a selected year). */
export function forecastMonth(chart: BaziChart, m: MonthlyPillar, analysis?: BaziAnalysis): PeriodForecast {
  const n = natal(chart, analysis)
  const stem = m.sexagenary % 10, branch = m.sexagenary % 12
  const { lines, score, tags } = meet(n, stem, branch, 'month')
  const rating = clamp(score)
  return { kind: 'month', label: `${m.term} ${m.startsAt.slice(5, 10)}`, stemChar: m.stemChar, branchChar: m.branchChar, stemGod: m.stemTenGod, branchGod: m.branchMainTenGod, rating, tags, summary: summarise('month', rating, m.stemTenGod, tags), lines }
}

/** Ratings for a run of years, for a timeline strip. */
export function forecastYears(chart: BaziChart, from: number, to: number, analysis?: BaziAnalysis): PeriodForecast[] {
  const out: PeriodForecast[] = []
  for (let y = from; y <= to; y++) out.push(forecastYear(chart, y, analysis))
  return out
}
