/**
 * 资产与学业判断 — a reality-calibrated reading.
 *
 * 命理 alone cannot say what someone owns; it can only say how well a chart carries wealth
 * and when the luck helps. So the model combines three documented parts:
 *
 *   现实起点  birth city tier, family background, education, occupation (entered by the user)
 *   命局财力  how the natal chart holds wealth: 财星强弱与身财平衡, 食伤生财, 比劫夺财, 禄神, 调候, 格局
 *   运势加成  how many of the working years (25–55 岁) are rated favourable, and 财运 in that window
 *
 * Each part is a small integer score with itemised reasons; the sum maps to one of six
 * household-net-worth bands. The bands are national reference ranges for a Chinese household
 * (含房产的家庭净资产), stated as orders of magnitude, not predictions of an exact amount.
 */
import type { BaziChart } from './types'
import type { BaziAnalysis } from './analysis'
import { forecastLuck, forecastYear } from './forecast'
import { ELEMENT_ZH } from './tables'

export type CityTier = 'unknown' | 'tier1' | 'newTier1' | 'tier2' | 'tier3' | 'county' | 'abroadDeveloped' | 'abroadOther'
export type FamilyBackground = 'unknown' | 'wealthy' | 'upperMiddle' | 'middle' | 'working' | 'hardship'
export type Education = 'unknown' | 'phd' | 'master' | 'c985' | 'c211' | 'tier1Uni' | 'tier2Uni' | 'college' | 'highSchool' | 'below'
export type Occupation = 'unknown' | 'student' | 'publicSector' | 'corporate' | 'professional' | 'founder' | 'freelance' | 'manual' | 'none'

export interface RealityContext {
  cityTier: CityTier
  family: FamilyBackground
  education: Education
  occupation: Occupation
}
export const DEFAULT_CONTEXT: RealityContext = { cityTier: 'unknown', family: 'unknown', education: 'unknown', occupation: 'unknown' }

/** `factor` scales the national band ranges to the city's price level (one-line city ≈ 2× national). */
export const CITY_TIERS: { value: CityTier; label: string; score: number; note: string; factor: number }[] = [
  { value: 'unknown', label: '未填写', score: 0, note: '按全国中位起点计', factor: 1 },
  { value: 'tier1', label: '一线（北上广深）', score: 3, note: '机会与房产基数高，生活成本亦高', factor: 2.2 },
  { value: 'newTier1', label: '新一线（杭蓉汉宁渝等）', score: 2, note: '机会多，成本相对可控', factor: 1.5 },
  { value: 'tier2', label: '二线省会 / 强地级市', score: 1, note: '', factor: 1.2 },
  { value: 'tier3', label: '三四线城市', score: 0, note: '', factor: 0.85 },
  { value: 'county', label: '县城 / 乡镇 / 农村', score: -1, note: '起点低但成本低', factor: 0.5 },
  { value: 'abroadDeveloped', label: '海外发达地区', score: 3, note: '', factor: 2.5 },
  { value: 'abroadOther', label: '海外其他地区', score: 1, note: '', factor: 1 },
]
/** Band boundaries in 万元 (national household net worth incl. property); scaled by the city factor for display. */
export const BAND_BOUNDS: [number, number | null][] = [[0, 20], [20, 80], [80, 300], [300, 1000], [1000, 5000], [5000, null]]
export function bandRange(level: Band['level'], cityFactor = 1): string {
  const [lo, hi] = BAND_BOUNDS[level - 1]
  const f = (v: number) => (v * cityFactor >= 10000 ? `${(v * cityFactor / 10000).toFixed(1).replace(/\.0$/, '')} 亿` : `${Math.round(v * cityFactor)} 万`)
  if (lo === 0) return `家庭净资产 < ${f(hi!)}`
  if (hi === null) return `> ${f(lo)}`
  return `${f(lo)} – ${f(hi)}`
}
export const FAMILIES: { value: FamilyBackground; label: string; score: number; note: string }[] = [
  { value: 'unknown', label: '未填写', score: 0, note: '' },
  { value: 'wealthy', label: '富裕（企业主 / 多套房产 / 高净值）', score: 3, note: '父母资产可直接转化为起点' },
  { value: 'upperMiddle', label: '中上（体制内中层 / 高级专业人士）', score: 2, note: '' },
  { value: 'middle', label: '中产（稳定职业、有房）', score: 1, note: '' },
  { value: 'working', label: '工薪 / 普通', score: 0, note: '' },
  { value: 'hardship', label: '困难（负债 / 低收入）', score: -2, note: '需自身与运势补足' },
]
export const EDUCATIONS: { value: Education; label: string; score: number; note: string }[] = [
  { value: 'unknown', label: '未填写', score: 0, note: '' },
  { value: 'phd', label: '博士 / 海外名校', score: 3, note: '' },
  { value: 'master', label: '硕士', score: 2, note: '' },
  { value: 'c985', label: '985 本科', score: 2, note: '' },
  { value: 'c211', label: '211 本科', score: 1, note: '' },
  { value: 'tier1Uni', label: '一本', score: 1, note: '' },
  { value: 'tier2Uni', label: '二本 / 三本', score: 0, note: '' },
  { value: 'college', label: '大专', score: -1, note: '' },
  { value: 'highSchool', label: '高中 / 中专', score: -1, note: '' },
  { value: 'below', label: '初中及以下', score: -2, note: '' },
]
export const OCCUPATIONS: { value: Occupation; label: string; score: number; note: string }[] = [
  { value: 'unknown', label: '未填写', score: 0, note: '' },
  { value: 'student', label: '在读', score: 0, note: '按学业与家庭起点计' },
  { value: 'publicSector', label: '体制内 / 国企', score: 1, note: '稳定、上限有限' },
  { value: 'corporate', label: '企业职员', score: 0, note: '' },
  { value: 'professional', label: '专业人士（医律金融技术）', score: 2, note: '' },
  { value: 'founder', label: '创业 / 企业主', score: 1, note: '波动大，吃运势' },
  { value: 'freelance', label: '自由职业', score: 0, note: '' },
  { value: 'manual', label: '体力 / 服务业', score: -1, note: '' },
  { value: 'none', label: '暂无工作', score: -1, note: '' },
]

export interface ScorePart {
  name: string
  score: number
  reason: string
}
export interface Band {
  level: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  range: string
  note: string
}
export const BANDS: Band[] = [
  { level: 1, name: '艰难', range: '家庭净资产 < 20 万', note: '收不抵支或负债为主' },
  { level: 2, name: '温饱', range: '20 – 80 万', note: '有积蓄，无房或在县城有房' },
  { level: 3, name: '小康', range: '80 – 300 万', note: '二三线有房，少量投资' },
  { level: 4, name: '中产', range: '300 – 1000 万', note: '一二线有房或多套，稳定投资' },
  { level: 5, name: '富裕', range: '1000 – 5000 万', note: '多套房产或企业股权' },
  { level: 6, name: '高净值', range: '> 5000 万', note: '企业、股权、海外资产' },
]

export interface WealthAssessment {
  baseline: { score: number; parts: ScorePart[] }
  chart: { score: number; parts: ScorePart[] }
  luck: { score: number; parts: ScorePart[]; favourableYears: number; unfavourableYears: number; window: [number, number] }
  total: number
  band: Band
  /** Band ranges scaled to the chosen city tier, index = level − 1 */
  rangesForCity: string[]
  cityFactor: number
  /** Band suggested by the chart alone (reality unknown) */
  chartBand: Band
  /** Band suggested by reality alone */
  baselineBand: Band
  checkpoints: { age: number; year: number; band: Band; note: string }[]
  education: { score: number; parts: ScorePart[]; verdict: string; comparison: string }
  /** Technical narrative with scores (for the 计分明细) */
  narrative: string[]
  /** Plain-language reading of the same result, for readers with no 八字 background */
  plain: string[]
}

const bandFor = (total: number): Band => BANDS[total <= -2 ? 0 : total <= 1 ? 1 : total <= 4 ? 2 : total <= 7 ? 3 : total <= 10 ? 4 : 5]

export function assessWealth(chart: BaziChart, analysis: BaziAnalysis, ctx: RealityContext = DEFAULT_CONTEXT): WealthAssessment {
  // ---- 现实起点
  const bp: ScorePart[] = []
  const pick = <T extends { value: string; score: number; label: string; note: string }>(list: T[], v: string) => list.find((x) => x.value === v) ?? list[0]
  const city = pick(CITY_TIERS, ctx.cityTier), fam = pick(FAMILIES, ctx.family), edu = pick(EDUCATIONS, ctx.education), occ = pick(OCCUPATIONS, ctx.occupation)
  bp.push({ name: '出生 / 成长城市', score: city.score, reason: `${city.label}${city.note ? '：' + city.note : ''}` })
  bp.push({ name: '家庭背景', score: fam.score, reason: `${fam.label}${fam.note ? '：' + fam.note : ''}` })
  bp.push({ name: '学历', score: edu.score, reason: `${edu.label}${edu.note ? '：' + edu.note : ''}` })
  bp.push({ name: '职业', score: occ.score, reason: `${occ.label}${occ.note ? '：' + occ.note : ''}` })
  const baselineScore = bp.reduce((a, p) => a + p.score, 0)

  // ---- 命局财力
  const cp: ScorePart[] = []
  const role = (r: string) => analysis.elementSummary.find((s) => s.role === r)!
  const wealth = role('财'), self = role('日主'), output = role('食伤'), resource = role('印')
  const st = chart.strength.verdict
  const canCarry = st === '身强' || st === '中和'
  if (analysis.special.type === '从弱' && analysis.special.follow === '从财格') cp.push({ name: '从财格', score: 3, reason: '弃命从财，顺势则富，财为全局之用' })
  else if (wealth.percent >= 22 && canCarry) cp.push({ name: '财旺身能任', score: 2, reason: `财星占 ${wealth.percent}%，日主${st}，财可入囊` })
  else if (wealth.percent >= 22) cp.push({ name: '财多身弱', score: -1, reason: `财星占 ${wealth.percent}% 而日主身弱，富屋贫人，见财难守，需印比运方发` })
  else if (wealth.percent >= 10) cp.push({ name: '财星中和', score: 1, reason: `财星占 ${wealth.percent}%，有财可求，不至为财所困` })
  else cp.push({ name: '财星微弱', score: -1, reason: `财星仅占 ${wealth.percent}%，求财靠食伤生财或大运补足` })
  const exposed = chart.pillars.filter((p) => p.key !== 'day').map((p) => p.stemTenGod)
  const hasOutput = exposed.some((g) => g === '食神' || g === '伤官') || output.percent >= 15
  if (hasOutput && wealth.percent >= 8) cp.push({ name: '食伤生财', score: 1, reason: '有食伤泄秀生财，靠技术、口才、创意生财之路通' })
  if (self.percent >= 35 && wealth.percent < 15) cp.push({ name: '比劫夺财', score: -1, reason: `日主（比劫）占 ${self.percent}% 而财弱，钱财易被同辈分夺` })
  const lu = analysis.scores.find((s) => s.name === '禄神')
  if (lu && lu.score > 0) cp.push({ name: '禄神', score: 1, reason: lu.note })
  const th = analysis.scores.find((s) => s.name === '调候')
  if (th && th.score >= 20) cp.push({ name: '调候得用', score: 1, reason: '调候用神在局，命局层次高，易出千万以上之格' })
  if (analysis.patterns.some((p) => p.name === '财官双美')) cp.push({ name: '财官双美', score: 1, reason: '财生官旺，富贵可期' })
  if (analysis.patterns.some((p) => p.name.includes('专旺') || p.name.includes('从强'))) cp.push({ name: '专旺 / 从强', score: 1, reason: '一行得气，专一则成' })
  if (resource.percent >= 45) cp.push({ name: '印星太旺', score: -1, reason: `印星占 ${resource.percent}%，庇护过重、依赖心强，财星被印所困` })
  if (analysis.patterns.some((p) => p.name === '伤官见官')) cp.push({ name: '伤官见官', score: -1, reason: '易与体制规矩冲突，升迁与合同多波折' })
  const chartScore = Math.max(-3, Math.min(4, cp.reduce((a, p) => a + p.score, 0)))

  // ---- 运势加成（25–55 岁）
  const birthYear = chart.time.civil.year
  const window: [number, number] = [birthYear + 25, birthYear + 55]
  let fav = 0, unfav = 0
  for (let y = window[0]; y <= window[1]; y++) {
    const r = forecastYear(chart, y, analysis).rating
    if (r >= 1) fav++
    else if (r <= -1) unfav++
  }
  const span = window[1] - window[0] + 1
  const ratio = (fav - unfav) / span
  const lp: ScorePart[] = []
  const luckScore0 = ratio > 0.3 ? 2 : ratio > 0.1 ? 1 : ratio < -0.3 ? -2 : ratio < -0.1 ? -1 : 0
  lp.push({ name: '25–55 岁流年', score: luckScore0, reason: `${span} 年中评级偏吉 ${fav} 年、偏忌 ${unfav} 年` })
  const wealthLucks = chart.luck.pillars.filter((l) => l.startYear <= window[1] && l.endYear >= window[0] && (l.stemTenGod === '正财' || l.stemTenGod === '偏财' || l.branchMainTenGod === '正财' || l.branchMainTenGod === '偏财'))
  if (wealthLucks.length) lp.push({ name: '财运大运', score: 1, reason: `${wealthLucks.map((l) => l.stemChar + l.branchChar + '（' + l.startAge + '岁）').join('、')}走财星，为求财之期` })
  const goodLucks = chart.luck.pillars.filter((l) => l.startYear <= window[1] && l.endYear >= window[0]).map((l) => forecastLuck(chart, l, analysis)).filter((f) => f.rating >= 2)
  if (goodLucks.length >= 2) lp.push({ name: '大运评级', score: 1, reason: `工作年龄段内有 ${goodLucks.length} 步大运评为吉以上` })
  const luckScore = Math.max(-2, Math.min(3, lp.reduce((a, p) => a + p.score, 0)))

  const total = baselineScore + chartScore + luckScore
  const band = bandFor(total)
  const chartBand = bandFor(chartScore + luckScore + 1)
  const baselineBand = bandFor(baselineScore + 1)

  // ---- 阶段检查点
  const checkpoints = [30, 40, 50].map((age) => {
    const year = birthYear + age
    let f = 0, u = 0
    for (let y = year - 5; y < year + 5; y++) { const r = forecastYear(chart, y, analysis).rating; if (r >= 1) f++; else if (r <= -1) u++ }
    const local = total + (f - u >= 4 ? 1 : f - u <= -4 ? -1 : 0) - (age === 30 ? 2 : age === 40 ? 1 : 0)
    const luck = chart.luck.pillars.find((l) => l.startYear <= year && year <= l.endYear)
    return { age, year, band: bandFor(local), note: `${year} 年前后十年评级偏吉 ${f} 年、偏忌 ${u} 年${luck ? '，行' + luck.stemChar + luck.branchChar + '运（' + luck.stemTenGod + '）' : ''}` }
  })

  // ---- 学业
  const ep: ScorePart[] = []
  if (resource.percent >= 22 && resource.percent < 45) ep.push({ name: '印星得力', score: 2, reason: `印星占 ${resource.percent}%，学业有庇护与吸收力` })
  else if (resource.percent >= 45) ep.push({ name: '印星过旺', score: 1, reason: '读书多而转化少，学历可高但需防纸上谈兵' })
  else if (resource.percent < 8) ep.push({ name: '印星薄弱', score: -1, reason: '学业靠自我努力，缺少庇护' })
  for (const n of ['文昌贵人', '学堂', '国印贵人', '太极贵人']) if (chart.shensha.some((s) => s.name === n)) ep.push({ name: n, score: 1, reason: `${n}入命，利考试与学问` })
  if (analysis.patterns.some((p) => p.name === '杀印相生' || p.name === '伤官配印')) ep.push({ name: '官印 / 伤印相配', score: 1, reason: '才华与学识相济，考试竞争有利' })
  if (analysis.patterns.some((p) => p.name === '伤官见官')) ep.push({ name: '伤官见官', score: -1, reason: '不服管束，应试与体制教育多磨' })
  const eduTeen = [15, 16, 17, 18, 19, 20, 21, 22].map((a) => forecastYear(chart, birthYear + a, analysis).rating)
  const eduGood = eduTeen.filter((r) => r >= 1).length, eduBad = eduTeen.filter((r) => r <= -1).length
  ep.push({ name: '15–22 岁流年', score: eduGood - eduBad >= 3 ? 1 : eduBad - eduGood >= 3 ? -1 : 0, reason: `求学期八年评级偏吉 ${eduGood} 年、偏忌 ${eduBad} 年` })
  const eduScore = ep.reduce((a, p) => a + p.score, 0)
  const eduVerdict = eduScore >= 4 ? '命局学业潜力高（研究生 / 名校层级）' : eduScore >= 2 ? '命局学业潜力中上（重点本科层级）' : eduScore >= 0 ? '命局学业潜力中等（普通本科层级）' : '命局学业潜力偏弱（需后天环境补足）'
  const eduActual = edu.score
  const eduExpected = eduScore >= 4 ? 2.5 : eduScore >= 2 ? 1.5 : eduScore >= 0 ? 0.5 : -0.5
  const comparison = ctx.education === 'unknown'
    ? '未填写实际学历，无法对照。'
    : eduActual - eduExpected >= 1.5 ? '实际学历高于命局潜力：后天环境与努力明显补足，印星之用已被充分兑现。'
      : eduExpected - eduActual >= 1.5 ? '命局学业潜力高于实际学历：潜力尚未完全释放，仍可通过进修、考证或专业深耕兑现。'
        : '实际学历与命局潜力相符。'

  // ---- 叙述
  const narrative: string[] = []
  narrative.push(`现实起点：${baselineBand.name}（${baselineScore >= 0 ? '+' : ''}${baselineScore}）。${ctx.cityTier === 'unknown' && ctx.family === 'unknown' ? '未填写现实背景，按全国中位起点计；填写后结论会更贴近实际。' : `${city.label}、${fam.label}、${edu.label}、${occ.label}。`}`)
  narrative.push(`命局财力：${cp.map((p) => `${p.name}（${p.score >= 0 ? '+' : ''}${p.score}）`).join('、')}，合计 ${chartScore >= 0 ? '+' : ''}${chartScore}。日主${ELEMENT_ZH[chart.dayMaster.element]}${st}，财星${wealth.verdict}。`)
  narrative.push(`运势加成：25–55 岁 ${span} 年中偏吉 ${fav} 年、偏忌 ${unfav} 年${wealthLucks.length ? '，' + wealthLucks.map((l) => l.stemChar + l.branchChar).join('、') + '为财运' : ''}，合计 ${luckScore >= 0 ? '+' : ''}${luckScore}。`)
  narrative.push(`综合：${total >= 0 ? '+' : ''}${total} → ${band.name}（${bandRange(band.level, city.factor)}${city.factor !== 1 ? '，按' + city.label.split('（')[0] + '价格水平' : ''}）。${band.level > baselineBand.level ? '命局与运势在起点之上有抬升，关键在把握财运年份。' : band.level < baselineBand.level ? '命局与运势拖累起点，守成重于进取，避免在忌年做大决定。' : '命局与起点相称，稳步积累即可。'}`)

  // ---- 通俗解读
  const PLAIN_PART: Record<string, string> = {
    从财格: '命局整体顺着财走，是天生适合经商、靠钱生钱的类型',
    财旺身能任: '命里财的能量充足，你自己也扛得住，赚到的钱留得住',
    财多身弱: '财的能量不少，但你自身偏弱，机会多却容易留不住，要靠学习和贵人撑着',
    财星中和: '财的能量适中，有钱可赚，也不会被钱困住',
    财星微弱: '命里财的能量偏弱，赚钱不是本能，要靠手艺、口才或好运势来补',
    食伤生财: '有一条靠才华和表达换钱的路',
    比劫夺财: '同辈、朋友和合伙容易分走你的钱',
    禄神: '有自己的衣食之源，基本生活不愁',
    调候得用: '命局配得恰当，上限比一般人高',
    财官双美: '钱和地位能互相成就',
    '专旺 / 从强': '专注一行容易做出成绩',
    印星太旺: '庇护太多、依赖心强，反而把财挡在外面',
    伤官见官: '和体制、规矩容易起冲突，升迁与合同多波折',
  }
  const plain: string[] = []
  plain.push(`综合来看，你的家庭资产大概率落在「${band.name}」这一档（${bandRange(band.level, city.factor)}）：${band.note}。这是量级判断，不是具体数字。`)
  plain.push(
    ctx.cityTier === 'unknown' && ctx.family === 'unknown' && ctx.education === 'unknown'
      ? '现实起点还没填，先按全国中位的出身和条件来算；在上面填上城市、家庭、学历和职业，结论会贴近得多。'
      : `只看现实条件（${[city, fam, edu, occ].filter((x) => x.value !== 'unknown').map((x) => x.label.split('（')[0]).join('、')}），起点本身对应「${baselineBand.name}」。`,
  )
  plain.push(`只看命局本身、不考虑出身：${cp.map((p) => PLAIN_PART[p.name] ?? p.reason).join('；')}。合起来命局自带的财力属于「${chartBand.name}」一档。`)
  plain.push(`25–55 岁这三十年里，顺的年份 ${fav} 年、不顺的 ${unfav} 年${wealthLucks.length ? `，其中 ${wealthLucks.map((l) => `${l.startAge}–${l.startAge + 9} 岁`).join('、')}是赚钱的窗口期` : ''}；这段运势${luckScore > 0 ? '整体在帮你' : luckScore < 0 ? '整体在拖你' : '基本持平'}。`)
  plain.push(
    baselineBand.level > chartBand.level
      ? '你的起点高于命局自带的财力：家底和环境给的比命里自带的多，这种情况守住、稳步增值比冒险扩张更重要。'
      : baselineBand.level < chartBand.level
        ? '命局自带的财力高于你的起点：你有机会靠自己往上走，关键是抓住顺的年份。'
        : '起点和命局相称，稳步积累就好。',
  )
  plain.push(`按年龄看：30 岁前后大约在「${checkpoints[0].band.name}」，40 岁「${checkpoints[1].band.name}」，50 岁「${checkpoints[2].band.name}」。30 岁前还在积累期，所以按惯例压低两档，40 岁压低一档。`)

  return {
    baseline: { score: baselineScore, parts: bp }, chart: { score: chartScore, parts: cp },
    luck: { score: luckScore, parts: lp, favourableYears: fav, unfavourableYears: unfav, window },
    total, band, chartBand, baselineBand, checkpoints, rangesForCity: BANDS.map((b) => bandRange(b.level, city.factor)), cityFactor: city.factor,
    education: { score: eduScore, parts: ep, verdict: eduVerdict, comparison },
    narrative,
    plain,
  }
}
