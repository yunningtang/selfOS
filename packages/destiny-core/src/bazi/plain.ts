import type { BaziChart } from './types'
import type { FiveElement } from '../types'
import { ELEMENT_ZH } from './tables'
import type { BaziAnalysis } from './analysis'
import type { Verdict } from './verdicts'
import { forecastLuck, forecastYear, RATING_LABEL } from './forecast'

/**
 * 通俗解读 — the same chart, explained for someone who has never heard of 十神 or 喜用神.
 *
 * Everything here is derived from the structured analysis (旺衰、十神强弱、喜忌、格局、断语、运势);
 * it adds no new judgement, only a translation layer: each technical term is introduced once
 * with a plain gloss, and the conclusions are grouped the way a reader would ask about them
 * (who am I, what am I good at, work and money, relationships, health, what helps me, this year).
 */

export interface PlainSection {
  key: 'self' | 'energy' | 'character' | 'career' | 'love' | 'health' | 'helpers' | 'now'
  title: string
  /** Short paragraphs; keep each under ~90 字 */
  paras: string[]
  /** Optional bullet list under the paragraphs */
  bullets?: string[]
  /** Closing line rendered after the bullets (the classical verdicts behind the section) */
  after?: string
}

export interface PlainReading {
  /** One-line portrait shown as the headline */
  headline: string
  sections: PlainSection[]
  /** Terms used above, each with a one-line gloss */
  glossary: { term: string; gloss: string }[]
}

// ---- 日主 imagery ----------------------------------------------------------------------------

const STEM_IMAGE: Record<string, { image: string; trait: string; en: string }> = {
  甲: { image: '参天大树', trait: '正直、有担当、认准方向就往上长，不太会拐弯', en: 'a tall tree' },
  乙: { image: '花草藤蔓', trait: '柔韧、能屈能伸、善于借力，外柔内韧', en: 'a vine' },
  丙: { image: '天上的太阳', trait: '热情外放、照亮别人、喜欢被看见，有时过于直接', en: 'the sun' },
  丁: { image: '一盏灯火', trait: '细腻温和、照顾身边的人、内心有坚持，情绪偏敏感', en: 'a lamp flame' },
  戊: { image: '厚重的高山', trait: '稳重可靠、守信、动作慢但不会轻易动摇', en: 'a mountain' },
  己: { image: '田园里的土', trait: '包容、务实、能滋养别人，习惯把事情放在心里', en: 'farmland' },
  庚: { image: '刀剑钢铁', trait: '果断、讲义气、吃软不吃硬，容易显得强硬', en: 'forged steel' },
  辛: { image: '珠玉首饰', trait: '精致、讲究、有审美和自尊心，在意别人怎么看自己', en: 'a jewel' },
  壬: { image: '江河大海', trait: '聪明机变、格局大、不愿受束缚，想法多且流动', en: 'a river' },
  癸: { image: '雨露溪水', trait: '细腻敏感、善解人意、低调渗透，心思藏得深', en: 'rain and dew' },
}

const GOD_TRAIT: Record<string, { strong: string; name: string }> = {
  比肩: { name: '比肩（和你同类的能量）', strong: '独立自主，重朋友，喜欢自己说了算，不愿求人' },
  劫财: { name: '劫财（争取与竞争的能量）', strong: '行动力和竞争心强，花钱爽快，容易为朋友或面子破财' },
  食神: { name: '食神（才华与享受的能量）', strong: '懂生活、有才艺或口福，心态松弛，表达自然' },
  伤官: { name: '伤官（聪明与叛逆的能量）', strong: '聪明、有创意、表达欲强，不喜欢被管，容易直言得罪人' },
  正财: { name: '正财（稳定收入的能量）', strong: '务实勤恳，理财稳健，重视安稳的生活和家庭' },
  偏财: { name: '偏财（机会与社交的能量）', strong: '善交际、看得到机会，财来财去，适合做生意或资源型工作' },
  正官: { name: '正官（规矩与责任的能量）', strong: '守规矩、有责任感、在意名声，适合体制或大平台' },
  七杀: { name: '七杀（压力与魄力的能量）', strong: '有冲劲和魄力，不怕压力，但容易把自己逼得太紧' },
  正印: { name: '正印（学习与庇护的能量）', strong: '爱学习、心地善良、有长辈缘，容易依赖别人照顾' },
  偏印: { name: '偏印（独特思维的能量）', strong: '思路独特、直觉敏锐、喜欢冷门领域，内心孤独感较强' },
}

const GOD_LACK: Record<string, string> = {
  财: '财的能量偏弱：对钱不够敏感或不太在意，收入靠踏实积累，不宜冒险投机',
  官杀: '官杀的能量偏弱：不太受外界约束，自由但也缺少推着你走的压力，需要自律',
  食伤: '食伤的能量偏弱：想法不少但不太会表达或变现，建议刻意练习输出',
  印: '印的能量偏弱：靠自己摸索多于靠贵人指点，学习要靠主动',
  日主: '',
}

const ELEMENT_HELP: Record<FiveElement, { colour: string; dir: string; season: string; fields: string }> = {
  wood: { colour: '绿色、青色', dir: '东方', season: '春天', fields: '教育、文创、医药健康、园艺木材、法律文书' },
  fire: { colour: '红色、橙色、紫色', dir: '南方', season: '夏天', fields: '互联网、能源、传媒影视、餐饮、电子' },
  earth: { colour: '黄色、棕色', dir: '本地、中部', season: '季节交替时', fields: '地产建筑、农业、仓储、保险、土地相关' },
  metal: { colour: '白色、金色、银色', dir: '西方', season: '秋天', fields: '金融、机械制造、汽车、公检法、珠宝五金' },
  water: { colour: '黑色、蓝色', dir: '北方', season: '冬天', fields: '物流贸易、咨询、水产运输、旅游、自由职业' },
}

const ORGAN: Record<FiveElement, string> = {
  wood: '肝胆、眼睛、筋骨和情绪',
  fire: '心脏、血液循环、睡眠',
  earth: '脾胃、消化、皮肉',
  metal: '肺与呼吸道、皮肤、牙齿',
  water: '肾、泌尿生殖系统、耳朵和腰',
}

const ROLE_OF_GOD: Record<string, string> = { 比肩: '日主', 劫财: '日主', 食神: '食伤', 伤官: '食伤', 正财: '财', 偏财: '财', 正官: '官杀', 七杀: '官杀', 正印: '印', 偏印: '印' }

const zh = (es: FiveElement[]) => es.map((e) => ELEMENT_ZH[e]).join('、')
const trimEnd = (s: string) => s.replace(/[。；;，,\s]+$/u, '')
const byConf = (vs: Verdict[], topic: string, n = 3) =>
  vs.filter((v) => v.topic === topic && v.tier !== 'reference').sort((a, b) => b.confidence - a.confidence).slice(0, n).map((v) => `${v.tag ? `【${v.tag}】` : ''}${trimEnd(v.text)}`)

export function plainReading(chart: BaziChart, analysis: BaziAnalysis, verdicts: Verdict[], today = new Date()): PlainReading {
  const dm = chart.dayMaster
  const img = STEM_IMAGE[dm.stemChar]
  const st = chart.strength
  const eff = analysis.effective
  const female = chart.input.gender === 'F'

  // ---- 1. 你是谁 ----
  const self: PlainSection = {
    key: 'self',
    title: '你是什么样的人',
    paras: [
      `八字里代表你本人的那个字叫「日主」。你的日主是「${dm.stemChar}${ELEMENT_ZH[dm.element]}」，古人把它比作${img.image}：${img.trait}。`,
      `这不是性格测试的结论，而是出发点——下面所有判断，都是看其余七个字和它怎么相处。`,
    ],
  }

  // ---- 2. 能量状态 ----
  const energyWord = st.verdict === '身强' ? '偏强' : st.verdict === '身弱' ? '偏弱' : '比较平衡'
  const energyParas: string[] = []
  if (analysis.special.type === '专旺') {
    energyParas.push(`你的命局属于少见的「专旺」：几乎全盘都是和你同类的能量，像一条只往一个方向流的大河。这种人通常专注、执拗、在自己的领域能走得很深，但不太能听进反对意见。`)
  } else if (analysis.special.type === '从强') {
    energyParas.push(`你的命局属于「从强」：自身和支持你的能量占了绝大多数。顺着自己的天性和强项走，往往比刻意补短板更顺。`)
  } else if (analysis.special.type === '从弱') {
    energyParas.push(`你的命局属于「从弱」：自身能量很少，整盘被${analysis.special.follow ?? '外部'}的能量主导。这种人反而适合顺势而为，借平台、借人、借环境，比硬扛更容易成事。`)
  } else {
    energyParas.push(
      st.verdict === '身强'
        ? `整体来说，你自身的能量${energyWord}（占比约 ${Math.round(st.selfParty)}%）。好处是有主见、扛得住事、能自己拿主意；要注意的是容易固执、把别人的建议当耳旁风，需要有事情来消耗和牵引这股劲。`
        : st.verdict === '身弱'
          ? `整体来说，你自身的能量${energyWord}（占比约 ${Math.round(st.selfParty)}%）。这不代表「弱」，而是说你比较容易受环境、关系和外部压力影响，需要靠支持、学习和积累来撑起自己；适合有人带、有团队、有体系的环境。`
          : `整体来说，你自身的能量${energyWord}（占比约 ${Math.round(st.selfParty)}%）。既不会太固执，也不至于被环境牵着走，不同阶段的运势会更明显地左右你的状态。`,
    )
  }
  const supports = [st.support.ling ? '出生的季节对你有利' : '出生的季节不太帮你', st.support.di ? '脚下有根基' : '根基较浅', st.support.shi ? '身边有同类支持' : '身边同类不多']
  energyParas.push(`具体看：${supports.join('，')}。`)
  const energy: PlainSection = { key: 'energy', title: '你的能量状态', paras: energyParas }

  // ---- 3. 性格底色 ----
  const godsSorted = [...analysis.tenGods].sort((a, b) => b.percent - a.percent)
  const topGods = godsSorted.filter((g) => g.percent >= 12 && g.count > 0).slice(0, 3)
  const roleShare: Record<string, number> = {}
  for (const g of analysis.tenGods) roleShare[ROLE_OF_GOD[g.name]] = (roleShare[ROLE_OF_GOD[g.name]] ?? 0) + g.percent
  const weakRoles = Object.entries(roleShare).filter(([r, p]) => r !== '日主' && p < 8).map(([r]) => r)
  const character: PlainSection = {
    key: 'character',
    title: '你的性格底色',
    paras: [
      `八字把其余七个字和日主的关系分成十种，叫「十神」，可以理解成十种不同的能量。你身上最明显的是：`,
    ],
    bullets: [
      ...topGods.map((g) => `${GOD_TRAIT[g.name].name}，占比约 ${Math.round(g.percent)}%：${GOD_TRAIT[g.name].strong}。`),
      ...weakRoles.map((r) => GOD_LACK[r]).filter(Boolean).map((s) => `${s}。`),
    ],
  }
  const charV = byConf(verdicts, '性格', 3)
  if (charV.length) character.after = `传统口诀对你性格的判断：${charV.join('；')}。`

  // ---- 4. 事业财富 ----
  const careerParas: string[] = []
  const wealthShare = roleShare['财'] ?? 0, officerShare = roleShare['官杀'] ?? 0, outputShare = roleShare['食伤'] ?? 0
  const favRoles = new Set(eff.favourable.map((e) => analysis.elementSummary.find((s) => s.element === e)?.role))
  const resourceShare = roleShare['印'] ?? 0, selfShare = roleShare['日主'] ?? 0
  if (resourceShare >= 35) careerParas.push(`「印」的能量很重（约 ${Math.round(resourceShare)}%），你偏学者和专业人士型：靠知识、证书、专业口碑和长辈贵人立足，不太适合纯销售或冒险创业；要防想得多、做得慢。`)
  if (selfShare >= 35) careerParas.push(`「比劫」（和你同类）的能量很重（约 ${Math.round(selfShare)}%），靠自己打拼和同辈合作成事，但合伙与借贷要把账算清楚，容易因朋友破财。`)
  if (outputShare >= 20) careerParas.push(`你「食伤」的能量不弱（约 ${Math.round(outputShare)}%），说明靠才华、创意、技术和表达赚钱比靠熬资历更顺，适合专业型、内容型或自由度高的工作。`)
  if (officerShare >= 20) careerParas.push(`「官杀」的能量明显（约 ${Math.round(officerShare)}%），意味着你的人生里压力、规则和责任比较多——${favRoles.has('官杀') ? '好在这股压力对你是正向的，体制内、大公司、需要担责的岗位反而能让你出头' : '它对你来说偏消耗，要避免长期处在高压或被管得很死的环境'}。`)
  if (wealthShare >= 20) careerParas.push(`「财」的能量充足（约 ${Math.round(wealthShare)}%），对钱和机会敏感，${favRoles.has('财') ? '财对你是喜用，赚钱这件事相对顺手，适合经营、销售、资源整合' : '但财对你偏忌，钱来得快去得也快，赚到之后更要守得住'}。`)
  if (!careerParas.length) careerParas.push(`你的事业和财富能量分布比较平均，没有特别突出的一路，这意味着路径更多取决于运势和你自己的选择，而不是命局强推你往哪走。`)
  const favFields = eff.favourable.map((e) => `${ELEMENT_ZH[e]}（${ELEMENT_HELP[e].fields}）`).join('、')
  careerParas.push(`从「喜用」来看，对你有帮助的行业方向偏向：${favFields}。这是倾向，不是限制。`)
  const careerV = [...byConf(verdicts, '事业', 2), ...byConf(verdicts, '财运', 2)]
  const career: PlainSection = { key: 'career', title: '事业与财富', paras: careerParas, after: careerV.length ? `传统口诀：${careerV.join('；')}。` : undefined }

  // ---- 5. 感情家庭 ----
  const spouseRole = female ? '官杀' : '财'
  const spouseShare = roleShare[spouseRole] ?? 0
  const loveParas = [
    `传统上${female ? '女命看「官杀」' : '男命看「财」'}代表伴侣。你这路能量${spouseShare >= 20 ? '充足' : spouseShare >= 10 ? '适中' : '偏弱'}（约 ${Math.round(spouseShare)}%）：${
      spouseShare >= 25 ? '异性缘和感情经历都不少，重点在于选择和专注' : spouseShare >= 10 ? '感情机会正常，关键看运势什么时候把它带出来' : '感情不是人生主线，缘分往往来得慢或需要主动一些'
    }。`,
  ]
  const loveV = [...byConf(verdicts, '婚姻', 3), ...byConf(verdicts, '六亲', 2)]
  const love: PlainSection = { key: 'love', title: '感情与家庭', paras: loveParas, after: loveV.length ? `传统口诀：${loveV.join('；')}。` : undefined }

  // ---- 6. 健康 ----
  const sums = analysis.elementSummary
  const hot = sums.filter((s) => s.percent >= 40).map((s) => s.element)
  const cold = sums.filter((s) => s.percent < 6).map((s) => s.element)
  const healthParas: string[] = []
  if (hot.length) healthParas.push(`${zh(hot)}的能量过于集中，中医上对应${hot.map((e) => ORGAN[e]).join('；')}，这些部位容易「过劳」或上火，要注意节制。`)
  if (cold.length) healthParas.push(`${zh(cold)}的能量很少，对应${cold.map((e) => ORGAN[e]).join('；')}，平时偏弱，是需要养护的地方。`)
  if (!healthParas.length) healthParas.push(`五行分布没有明显的过强或缺失，体质底子相对均衡，健康更多看生活习惯和当下运势。`)
  const healthV = byConf(verdicts, '健康', 2)
  const health: PlainSection = { key: 'health', title: '身体提示', paras: healthParas, after: healthV.length ? `传统口诀：${healthV.join('；')}。` : undefined }

  // ---- 7. 对你有帮助的 ----
  const helpers: PlainSection = {
    key: 'helpers',
    title: '对你有帮助的东西',
    paras: [
      `「喜用神」就是对你最有帮助的那几种能量；「忌神」是会给你添堵的。本盘按「${analysis.special.type ?? '平衡（扶抑）'}」的思路取用：喜${zh(eff.favourable)}，忌${zh(eff.unfavourable)}。把它们落到生活里大致是：`,
    ],
    bullets: [
      ...eff.favourable.map((e) => `多亲近${ELEMENT_ZH[e]}：${ELEMENT_HELP[e].colour}，${ELEMENT_HELP[e].dir}，${ELEMENT_HELP[e].season}精神最好；行业偏${ELEMENT_HELP[e].fields}。`),
      ...eff.unfavourable.map((e) => `少被${ELEMENT_ZH[e]}牵着走：${ELEMENT_HELP[e].colour}不作主色，${ELEMENT_HELP[e].dir}不作长期定居首选。`),
      ...(analysis.tiaohou.line ? [`再按出生季节的冷暖调节（古书叫「调候」）：${analysis.tiaohou.line}`] : []),
    ],
  }

  // ---- 8. 当下 ----
  const thisYear = today.getFullYear()
  const luck = chart.luck.pillars.find((l) => l.startYear <= thisYear && thisYear <= l.endYear)
  const nowParas: string[] = [
    `「大运」是人生每十年一换的大环境，「流年」是每一年的小气候。两者和你本命的字相互作用，决定某个阶段顺不顺。`,
  ]
  if (luck) {
    const fl = forecastLuck(chart, luck, analysis)
    nowParas.push(`你现在走的是 ${luck.stemChar}${luck.branchChar} 大运（${luck.startAge}–${luck.startAge + 9} 岁，${luck.startYear}–${luck.endYear}），整体评级「${RATING_LABEL[fl.rating]}」：${fl.summary}`)
  }
  const fy = forecastYear(chart, thisYear, analysis)
  nowParas.push(`今年 ${thisYear} 年是 ${fy.stemChar}${fy.branchChar} 年，评级「${RATING_LABEL[fy.rating]}」：${fy.summary}`)
  nowParas.push(`想看逐年、逐月的详细推断，切到「运势」页。`)
  const now: PlainSection = { key: 'now', title: '你现在处在什么阶段', paras: nowParas }

  const headline = `你是「${dm.stemChar}${ELEMENT_ZH[dm.element]}」命，像${img.image}；自身能量${energyWord}${topGods[0] ? `，最突出的是${GOD_TRAIT[topGods[0].name].name.replace(/（.*）/, '')}的能量` : ''}；喜${zh(eff.favourable)}、忌${zh(eff.unfavourable)}。`

  return {
    headline,
    sections: [self, energy, character, career, love, health, helpers, now],
    glossary: [
      { term: '日主', gloss: '出生那天的天干，代表你本人；其余七个字都围绕它来解读。' },
      { term: '十神', gloss: '其余字和日主的十种关系，各代表一种能量：比肩、劫财、食神、伤官、正财、偏财、正官、七杀、正印、偏印。' },
      { term: '身强 / 身弱', gloss: '日主本身的能量在全盘中占多少。强不等于好，弱不等于差，只是决定了你需要什么。' },
      { term: '喜用神 / 忌神', gloss: '对你有帮助 / 添堵的五行。运势好坏，基本就是看每年来的字是喜还是忌。' },
      { term: '格局', gloss: '整盘能量的组织方式，像一个人的「人设」，决定了哪条路对你最顺。' },
      { term: '大运 / 流年', gloss: '十年一换的大环境和一年一换的小气候。' },
    ],
  }
}
