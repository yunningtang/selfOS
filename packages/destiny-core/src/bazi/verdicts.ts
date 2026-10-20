/**
 * 断语 — rule-based readings in the style of the classic 口诀 tables: each line carries
 * a confidence (how reliable the rule is held to be in the tradition, not a prediction
 * probability) and the 推断依据 it was triggered by, so the reader can check it against
 * the chart. Rules are written from the common 十神 / 神煞 / 宫位 lore; wording is ours.
 */
import type { FiveElement, PillarKey } from '../types'
import { BRANCHES, ELEMENT_ZH, HIDDEN_STEMS, STEMS, STEM_ELEMENT, tenGod } from './tables'
import type { BaziChart } from './types'
import type { BaziAnalysis, ElementRole } from './analysis'
import { tableVerdicts } from './verdicts.tables'

export type VerdictTag = '吉' | '忌' | '凶' | '贵' | '富' | '佳' | '格' | '内容'

export interface Verdict {
  text: string
  /** 0–100 */
  confidence: number
  basis: string
  tag?: VerdictTag
  /** 推断依据 touched a 格 or ★ marker */
  star?: boolean
  /** 性格 财运 事业 婚姻 六亲 健康 神煞 格局 */
  topic: string
  /** core: 格局与旺衰层面的定性结论 · detail: 十神宫位层面的具体断语 · reference: 纳音、藏干余气、神煞落柱等参考 */
  tier?: 'core' | 'detail' | 'reference'
  /** 'key=value'; two verdicts with the same key but different values contradict, the lower-confidence one is dropped */
  claim?: string
}

interface Ctx {
  dm: string
  dmEl: FiveElement
  gender: 'M' | 'F'
  female: boolean
  stemGod: Record<'year' | 'month' | 'hour', string>
  mainGod: Record<PillarKey, string>
  hiddenGods: Record<PillarKey, string[]>
  exposed: (g: string) => number
  hidden: (g: string) => number
  total: (g: string) => number
  has: (g: string) => boolean
  role: (r: ElementRole) => number
  rolePct: Record<ElementRole, number>
  verdict: string
  strong: boolean
  weak: boolean
  fav: Set<FiveElement>
  roleEl: (r: ElementRole) => FiveElement
  godEl: (g: string) => FiveElement
  favGod: (g: string) => boolean
  shensha: (name: string, pillar?: PillarKey) => boolean
  pattern: (name: string) => boolean
  rel: (type: string, a?: PillarKey, b?: PillarKey) => boolean
  rooted: boolean
  month: number
  day: number
  hour: number
  dayGz: string
  tiaohouIn: boolean
  special: BaziAnalysis['special']
  elZh: string
}

function buildCtx(chart: BaziChart, a: BaziAnalysis): Ctx {
  const dm = chart.dayMaster.stem
  const dmEl = STEM_ELEMENT[dm]
  const stems = Object.fromEntries(chart.pillars.map((p) => [p.key, p.stem])) as Record<PillarKey, number>
  const branches = Object.fromEntries(chart.pillars.map((p) => [p.key, p.branch])) as Record<PillarKey, number>
  const keys: PillarKey[] = ['year', 'month', 'day', 'hour']
  const stemGod = { year: tenGod(dm, stems.year), month: tenGod(dm, stems.month), hour: tenGod(dm, stems.hour) }
  const hiddenGods = Object.fromEntries(keys.map((k) => [k, HIDDEN_STEMS[branches[k]].map((h) => tenGod(dm, h))])) as Record<PillarKey, string[]>
  const mainGod = Object.fromEntries(keys.map((k) => [k, hiddenGods[k][0]])) as Record<PillarKey, string>
  const exposed = (g: string) => Object.values(stemGod).filter((x) => x === g).length
  const hidden = (g: string) => keys.reduce((n, k) => n + hiddenGods[k].filter((x) => x === g).length, 0)
  const total = (g: string) => exposed(g) + keys.filter((k) => mainGod[k] === g).length
  const rolePct = Object.fromEntries(a.elementSummary.map((s) => [s.role, s.percent])) as Record<ElementRole, number>
  const roleEl = (r: ElementRole) => a.elementSummary.find((s) => s.role === r)!.element
  const godRole = (g: string): ElementRole => (g === '比肩' || g === '劫财' ? '日主' : g === '食神' || g === '伤官' ? '食伤' : g === '正财' || g === '偏财' ? '财' : g === '正官' || g === '七杀' ? '官杀' : '印')
  const fav = new Set(a.effective.favourable)
  const relations = chart.relations
  const rooted = keys.some((k) => HIDDEN_STEMS[branches[k]].some((h) => STEM_ELEMENT[h] === dmEl))
  const th = a.tiaohou.stems
  const allChars: string[] = [...keys.map((k) => STEMS[stems[k]]), ...keys.flatMap((k) => HIDDEN_STEMS[branches[k]].slice(0, 1).map((h) => STEMS[h]))]
  return {
    dm: STEMS[dm], dmEl, gender: chart.input.gender, female: chart.input.gender === 'F',
    stemGod, mainGod, hiddenGods, exposed, hidden, total, has: (g) => exposed(g) + hidden(g) > 0,
    role: (r) => rolePct[r], rolePct, verdict: chart.strength.verdict,
    strong: chart.strength.verdict === '身强', weak: chart.strength.verdict === '身弱',
    fav, roleEl, godEl: (g) => roleEl(godRole(g)), favGod: (g) => fav.has(roleEl(godRole(g))),
    shensha: (name, pillar) => chart.shensha.some((s) => s.name === name && (!pillar || s.pillars.includes(pillar))),
    pattern: (name) => a.patterns.some((p) => p.name.includes(name)),
    rel: (type, x, y) => relations.some((r) => r.type.includes(type) && (!x || r.members.includes(x)) && (!y || r.members.includes(y))),
    rooted, month: branches.month, day: branches.day, hour: branches.hour, dayGz: STEMS[dm] + BRANCHES[branches.day],
    tiaohouIn: th.some((s) => allChars.includes(s)), special: a.special, elZh: ELEMENT_ZH[dmEl],
  }
}

type Rule = { when: (c: Ctx) => boolean; text: string | ((c: Ctx) => string); conf: number; basis: string | ((c: Ctx) => string); tag?: VerdictTag; star?: boolean; topic: string; claim?: string }
const r = (topic: string, conf: number, when: Rule['when'], text: Rule['text'], basis: Rule['basis'], tag?: VerdictTag, star?: boolean): Rule => ({ topic, conf, when, text, basis, tag, star })

const RULES: Rule[] = [
  // ---- 旺衰 / 格局 -----------------------------------------------------------------
  r('格局', 96, (c) => c.pattern('从格'), '弃命从势，一生随大势而行，顺从则富贵，逆之则颠沛；忌行印比之运。', '日主无根，印星无力，从格', '格', true),
  r('格局', 94, (c) => c.pattern('专旺') || c.pattern('从强'), '一行得气，志向专一，宜在一门之内深耕成名；忌官杀财星逆势。', '日主与印比得势，专旺/从强', '格', true),
  r('格局', 92, (c) => c.pattern('食神制杀'), '以智制权，临危有谋，可掌实权；食神制杀多主刚柔并济之才。', '食神透干，七杀透干，食神制杀', '贵', true),
  r('格局', 92, (c) => c.pattern('杀印相生'), '杀印相生，权印双全，宜武职、技术、公检法等带权之业。', '七杀透干，印星透干，杀印相生', '贵', true),
  r('格局', 90, (c) => c.pattern('伤官配印'), '伤官配印，才华有节制，文艺学术可成名；印制伤官，言行有度。', '伤官透干，印星透干，伤官配印', '贵', true),
  r('格局', 90, (c) => c.pattern('财官双美'), '财官双美，身强者富贵双全，身弱则财官为累。', '财透官透，财官双美', '富', true),
  r('格局', 88, (c) => c.pattern('伤官见官'), '伤官见官，易与上司、体制或规矩冲突，口舌是非多，需印星通关。', '伤官透干，正官透干，伤官见官', '忌', true),
  r('格局', 90, (c) => c.pattern('建禄'), '建禄格：自立自强，少靠祖业，兄弟多而争财，宜独当一面创业。', '月令建禄', '格'),
  r('格局', 90, (c) => c.pattern('阳刃'), '阳刃格：性刚果决，敢于担当，但易有刑伤与极端；喜官杀制刃为贵。', '月令阳刃', '格'),
  r('格局', 86, (c) => c.pattern('魁罡'), '魁罡坐命，聪明果断，有领袖气质；忌刑冲财官，宜清白自守。', '日柱魁罡', '格'),
  r('格局', 84, (c) => c.pattern('三奇'), '三奇格：才华出众，有奇遇贵人；需身强、有贵人方显。', '天干三奇', '贵'),
  r('格局', 88, (c) => c.pattern('印旺身弱'), '印旺身弱，母慈灭子：受长辈庇护过重而少自主，宜财星损印、早离家自立。', '印星太旺，日主无根', '忌'),

  // ---- 身强身弱 ---------------------------------------------------------------------
  { ...r('性格', 90, (c) => c.strong, '身强：主观自信，耐压能扛事，不喜受人管束；宜以财官食伤泄秀，忌再帮身。', (c) => `日主${c.elZh}，身强，同党 ${c.rolePct['日主'] + c.rolePct['印']}%`), claim: 'dm=strong' },
  { ...r('性格', 90, (c) => c.weak, '身弱：心思细腻，易受环境影响，依赖感强；宜印比扶身，得贵人则成。', (c) => `日主${c.elZh}，身弱，同党 ${c.rolePct['日主'] + c.rolePct['印']}%`), claim: 'dm=weak' },
  { ...r('性格', 86, (c) => c.verdict === '中和', '中和：性情平和，不走极端，顺逆皆能自处；喜用以调候为先。', '日主中和'), claim: 'dm=mid' },
  r('健康', 88, (c) => !c.rooted && !c.pattern('从格'), '日主无根，体质偏弱，早年易病，需防过劳；宜借印星之运扶身。', '日主无根，非从格', '忌'),
  r('性格', 84, (c) => c.tiaohouIn, '调候用神在局，寒暖燥湿得宜，一生少极端困顿，层次较高。', '调候用神透出或得地', '佳', true),
  r('性格', 84, (c) => !c.tiaohouIn, '调候用神不在局，需待大运补足寒暖燥湿；成就多在调候运中。', '调候用神未透未藏', '忌'),

  // ---- 印 -----------------------------------------------------------------------------
  r('财运', 96, (c) => c.role('印') >= 35 && c.dmEl === 'metal', '房产田宅多，或与不动产、文书之业有缘。', (c) => `日主${c.elZh}，印多，印库或印很多`, '富'),
  r('性格', 96, (c) => c.exposed('偏印') >= 1 && c.exposed('正印') >= 1, '爱叨叨，对自己要求严格、严谨，思虑多。', '正印偏印并透，印格或食伤格'),
  r('性格', 95, (c) => c.total('正印') >= 1 && c.favGod('正印'), '宅心仁厚，心性善良，富人情味，知性敏锐，重视人格内涵与高尚气质，对宗教道德有敬畏之心。', '正印为喜用，正印旺，无正印忌', '吉'),
  r('性格', 91, (c) => c.total('正印') >= 2 && !c.favGod('正印'), '正印过多为忌：依赖心重，想得多做得少，易受长辈束缚。', '正印旺且为忌神', '忌'),
  r('性格', 93, (c) => c.total('偏印') >= 2, '偏印（枭）多：心思独特，喜冷门之学，孤僻多疑，有艺术或玄学天分。', '偏印多，枭神重'),
  r('六亲', 92, (c) => c.total('偏印') >= 2 && c.total('食神') >= 1, '枭神夺食：易有口福受损、子女缘薄或计划被打断之事；女命尤需防产厄。', '偏印多且有食神，枭神夺食', '凶'),
  r('性格', 96, (c) => c.stemGod.hour === '正印' && c.total('正印') === 1, '一正印在时，晚年清贵，子女孝顺，有文书名誉。', '时柱正印，一正印', '佳', true),
  r('六亲', 95, (c) => c.mainGod.day === '偏印' || c.mainGod.day === '正印', '配偶贤惠持家，或年长、有学识，婚姻多得长辈成全。', '日坐印星'),
  r('性格', 98, (c) => ['year', 'month', 'day', 'hour'].every((k) => c.hiddenGods[k as PillarKey].some((g) => g === '正印' || g === '偏印')), '一生皆有宗教、艺文倾向，喜静思与学问。', '日坐藏印，月坐藏印，年坐藏印，时坐藏印'),

  // ---- 食伤 ---------------------------------------------------------------------------
  r('性格', 98, (c) => c.strong && (c.stemGod.month === '食神' || c.stemGod.month === '伤官' || c.stemGod.hour === '食神' || c.stemGod.hour === '伤官') && c.dmEl === 'metal', '长得漂亮，气质清秀。', '身旺，食伤紧靠日主，日主金'),
  r('性格', 94, (c) => c.exposed('食神') >= 1 && c.favGod('食神'), '食神为用：温和宽厚，口福好，有才艺与审美，福气自来。', '透食神，食神为喜用', '吉'),
  r('性格', 92, (c) => c.exposed('伤官') >= 1 && !c.favGod('伤官'), '伤官透为忌神：聪明外露，直言犯上，不讲理时好骂人，需修口德。', (c) => `伤官透为忌神，无伤官用${c.female ? '，女' : ''}`, '忌'),
  r('性格', 93, (c) => c.exposed('伤官') >= 1 && c.favGod('伤官'), '伤官为用：才思敏捷，创意与表达力强，宜文艺、技术、自由职业。', '伤官透出为喜用', '吉'),
  r('性格', 96, (c) => c.exposed('食神') >= 1 && c.exposed('伤官') >= 1 && c.shensha('华盖'), '通常不出家则习五术（信仰、玄学、宗教）。', '透食神，透伤官，华盖'),
  r('六亲', 90, (c) => c.female && c.exposed('伤官') >= 1 && c.total('正官') >= 1, '女命伤官见官，夫星受克，婚姻多波折，宜晚婚或找年龄差距大的对象。', '女命伤官透，正官现', '凶'),
  r('六亲', 88, (c) => c.female && c.total('食神') + c.total('伤官') >= 3, '女命食伤过重，子女缘厚但夫缘薄，个性强不服管。', '女命食伤多', '忌'),
  r('健康', 86, (c) => c.total('食神') + c.total('伤官') >= 3 && c.weak, '身弱食伤多，泄气太过，易神经衰弱、消化系统不佳，忌过度操劳。', '身弱，食伤多', '凶'),
  r('财运', 90, (c) => c.exposed('食神') + c.exposed('伤官') >= 1 && c.exposed('正财') + c.exposed('偏财') >= 1 && c.strong, '食伤生财，身强可任：靠技术、口才、创意生财，财源不断。', '食伤透，财星透，身强，食伤生财', '富'),

  // ---- 财 -----------------------------------------------------------------------------
  r('财运', 98, (c) => c.dmEl === 'metal' && c.month === 7 && c.shensha('华盖', 'month'), '若梦中捡钱或得意外财物，一两个月内多有实际进财。', '日主金，月坐未，月坐藏华盖'),
  r('性格', 91, (c) => c.total('偏财') >= 2 && !c.favGod('偏财'), '有爱受人奉承、拍马屁的倾向，防言过其实；是实用型的人，受环境影响，喜听表扬夸奖。', '偏财旺，偏财为忌，无偏财用', '忌'),
  r('财运', 92, (c) => c.total('偏财') >= 2 && c.favGod('偏财'), '偏财旺为用：慷慨善交际，财来财去，适合经商、投资、流动性生意。', '偏财旺，偏财为喜用', '富'),
  r('财运', 92, (c) => c.total('正财') >= 1 && c.favGod('正财') && c.hidden('正财') >= 1, '正财有根为用：理财稳健，勤俭积富，适合薪俸稳定之业。', '正财藏支有根，为喜用', '富'),
  r('财运', 90, (c) => c.role('财') >= 30 && c.weak, '财多身弱：富屋贫人，见财难守，易为钱财劳累；得比劫印运方发。', '财旺身弱', '忌'),
  r('财运', 88, (c) => c.role('财') < 8, '财星微弱，求财需靠食伤生财或大运补足；不宜投机。', '财星太弱或藏而不透', '忌'),
  r('六亲', 90, (c) => !c.female && (c.mainGod.day === '正财' || c.mainGod.day === '偏财'), '男命日坐财星，得妻之助，配偶能干理财。', '男命日坐财', '吉'),
  r('六亲', 88, (c) => !c.female && c.total('正财') + c.total('偏财') >= 3, '男命财多：异性缘旺，感情易多头，需专一。', '男命财多'),
  r('六亲', 92, (c) => c.stemGod.year === '偏财' || c.stemGod.year === '正财', '年上见财，祖上或父亲有产业，早年家境尚可。', '年干财星', '富'),

  // ---- 官杀 ---------------------------------------------------------------------------
  r('事业', 92, (c) => c.exposed('正官') === 1 && c.exposed('七杀') === 0 && c.favGod('正官'), '一位正官清透为用：正直守规，有贵气，宜公职、管理、名誉之业。', '正官一位透干，官杀不混，为喜用', '贵'),
  r('事业', 90, (c) => c.exposed('七杀') >= 1 && c.strong, '身强七杀透：有魄力、敢拼敢闯，宜竞争性强、带权之职业。', '身强，七杀透干', '贵'),
  r('性格', 90, (c) => c.total('七杀') >= 2 && c.weak, '七杀重而身弱：压力大，易受小人或权势之累，性急多忧；需印化杀。', '七杀重，身弱', '凶'),
  r('事业', 88, (c) => c.exposed('正官') >= 1 && c.exposed('七杀') >= 1, '官杀混杂：心志摇摆，做事多头，易遇是非；宜去留一位。', '正官七杀并透，官杀混杂', '忌'),
  r('六亲', 92, (c) => c.female && c.exposed('正官') === 1 && c.exposed('七杀') === 0, '女命正官一位，夫星清，婚姻端正，丈夫可靠。', '女命正官一位', '吉'),
  r('六亲', 88, (c) => c.female && c.total('正官') + c.total('七杀') >= 3, '女命官杀多：感情经历复杂，宜晚婚，择偶须慎。', '女命官杀多', '忌'),
  r('六亲', 88, (c) => c.female && c.total('正官') + c.total('七杀') === 0, '女命不见官杀，夫缘淡薄或晚成，需看大运补夫星。', '女命无官杀', '忌'),
  r('健康', 86, (c) => c.role('官杀') < 5 && !c.pattern('从格'), '官杀太弱，少有约束与压力，但易缺乏名位与规划。', '官杀藏而不透或太弱'),
  r('六亲', 90, (c) => c.female && (c.mainGod.day === '正官' || c.mainGod.day === '七杀'), '女命日坐官杀，夫星入宅，婚姻缘分早到，配偶有能力。', '女命日坐官杀', '吉'),

  // ---- 比劫 ---------------------------------------------------------------------------
  r('性格', 90, (c) => c.total('比肩') + c.total('劫财') >= 3, '比劫重：独立好胜，重朋友义气，但易因朋友破财、与人争利。', '比劫多', '忌'),
  r('财运', 90, (c) => c.total('劫财') >= 2 && c.role('财') < 15, '劫财旺财星弱：钱财难聚，防借贷合伙之失。', '劫财重，财弱', '凶'),
  r('六亲', 86, (c) => c.total('比肩') + c.total('劫财') >= 2 && !c.female, '男命比劫重，婚姻多争，需防第三者或因友失妻。', '男命比劫多', '忌'),
  r('六亲', 88, (c) => c.stemGod.year === '比肩' || c.stemGod.year === '劫财', '年上比劫，兄弟姐妹多或朋友多，祖业难靠，白手起家。', '年干比劫'),

  // ---- 宫位 ----------------------------------------------------------------------------
  r('六亲', 91, (c) => c.stemGod.year === '食神' && !c.favGod('食神'), '祖上清贫或早年家境平常。', '年柱食神，食神为忌，无食神用'),
  r('六亲', 90, (c) => c.stemGod.year === '正印' || c.stemGod.year === '偏印', '年上印星，祖上有文教或受长辈荫庇，早年得父母照顾。', '年干印星', '吉'),
  r('六亲', 90, (c) => c.stemGod.year === '正官', '年上正官，出身尚正，祖上有名望或公职。', '年干正官', '贵'),
  r('六亲', 88, (c) => c.stemGod.year === '七杀', '年上七杀，祖业难守，少年多劳；若杀为用则早有担当。', '年干七杀'),
  r('六亲', 88, (c) => c.stemGod.year === '伤官', '年上伤官：祖上有损或自幼与长辈不合，早年多波折。', '年干伤官', '忌'),
  r('六亲', 90, (c) => c.stemGod.month === '正官' || c.stemGod.month === '正印', '月上官印，父母或兄弟中有贵人，青年时期得助。', '月干官印', '吉'),
  r('六亲', 90, (c) => c.stemGod.month === '劫财' || c.stemGod.month === '伤官', '月上劫伤：青年时期多折腾，与兄弟同辈缘薄或争执。', '月干劫财/伤官', '忌'),
  r('六亲', 90, (c) => c.stemGod.hour === '食神' && c.favGod('食神'), '时上食神为用，子女聪明有福，晚年安逸有口福。', '时干食神为喜用', '吉'),
  r('六亲', 90, (c) => c.stemGod.hour === '七杀' && c.strong, '时上七杀身强，晚年有权，子女有成就。', '时干七杀，身强', '贵'),
  r('六亲', 88, (c) => c.stemGod.hour === '伤官' && c.female, '女命时上伤官，子女缘厚但操心，晚年宜修身。', '女命时干伤官'),
  r('六亲', 88, (c) => c.stemGod.hour === '劫财', '时上劫财，晚年防财务被子女或他人耗散。', '时干劫财', '忌'),
  r('六亲', 90, (c) => c.rel('冲', 'day', 'hour'), '日时相冲，子女缘分较晚或与子女聚少离多；中年后易搬迁变动。', '日支时支相冲', '忌'),
  r('六亲', 90, (c) => c.rel('冲', 'month', 'day'), '月日相冲，与父母兄弟聚少，青年离家；配偶与原生家庭意见不合。', '月支日支相冲', '忌'),
  r('六亲', 90, (c) => c.rel('冲', 'year', 'month'), '年月相冲，早年离祖或家道变迁，与长辈缘分较浅。', '年支月支相冲', '忌'),
  r('六亲', 88, (c) => c.rel('合', 'day', 'hour'), '日时相合，与子女亲近，晚年得子女之力。', '日支时支相合', '吉'),
  r('六亲', 88, (c) => c.rel('合', 'month', 'day'), '月日相合，与父母兄弟和睦，婚姻得家人支持。', '月支日支相合', '吉'),
  r('六亲', 86, (c) => c.rel('刑', 'day'), '日支带刑，婚姻宫受扰，夫妻易有拉扯或配偶多病。', '日支带刑', '凶'),
  r('六亲', 86, (c) => c.rel('害', 'day'), '日支带害，配偶之间易暗生嫌隙，需多沟通。', '日支带害', '忌'),
  r('六亲', 84, (c) => c.rel('破', 'day'), '日支带破，婚姻宫有损，防中途变故。', '日支带破', '忌'),

  // ---- 神煞 ----------------------------------------------------------------------------
  r('神煞', 95, (c) => c.shensha('天乙贵人'), '平生少意外之灾，逢凶化吉，多得贵人扶助。', (c) => `${c.dm}日见天乙贵人`, '佳', true),
  r('神煞', 92, (c) => c.shensha('天德贵人') || c.shensha('月德贵人'), '天月二德在命，先天有福，心性仁慈，灾厄多能化解。', '天德/月德贵人', '吉'),
  r('神煞', 90, (c) => c.shensha('文昌贵人'), '文昌入命，聪明好学，文书考试有缘，气质斯文。', '文昌贵人', '贵'),
  r('神煞', 88, (c) => c.shensha('太极贵人'), '太极贵人：喜玄学哲理，有悟性，晚年安享。', '太极贵人', '吉'),
  r('神煞', 90, (c) => c.shensha('福星贵人'), '福星贵人：一生衣禄无忧，少有大灾。', '福星贵人', '吉'),
  r('神煞', 88, (c) => c.shensha('将星'), '将星入命，有领导气度，做事从容有章法。', '将星', '贵'),
  r('神煞', 88, (c) => c.shensha('华盖'), '华盖入命，孤高聪慧，宜艺术宗教，不喜热闹。', '华盖'),
  r('神煞', 88, (c) => c.shensha('驿马'), '驿马入命，多迁移奔波、出外发展，宜交通、贸易、外务。', '驿马'),
  r('神煞', 86, (c) => c.shensha('桃花'), '桃花入命，人缘好，异性缘旺，艺术魅力强；需防感情是非。', '桃花（咸池）'),
  r('神煞', 86, (c) => c.shensha('桃花', 'day'), '日坐桃花，配偶容貌佳，夫妻情浓但要防外缘。', '日支咸池'),
  r('神煞', 88, (c) => c.shensha('羊刃'), '羊刃在命，性格刚强，有魄力也易冲动，需防刑伤手术。', '羊刃', '忌'),
  r('神煞', 84, (c) => c.shensha('红艳煞'), '红艳煞：多情执著，不顾地位差异，感情用事。', '红艳'),
  r('神煞', 86, (c) => c.shensha('金舆'), '金舆入命，得配偶之助，衣食丰足。', '金舆', '吉'),
  r('神煞', 86, (c) => c.shensha('学堂'), '学堂入命，学业顺利，有学术之才。', '学堂', '吉'),
  r('神煞', 86, (c) => c.shensha('国印贵人'), '国印贵人：诚信可靠，宜掌印信文书之职。', '国印贵人', '贵'),
  r('神煞', 84, (c) => c.shensha('孤辰') || c.shensha('寡宿'), '孤辰寡宿：性情孤独，不易合群，婚姻宜晚。', '孤辰/寡宿', '忌'),
  r('神煞', 84, (c) => c.shensha('劫煞') || c.shensha('亡神'), '劫煞亡神：机谋深沉，易有破耗失落之事，与贵人同柱可解。', '劫煞/亡神', '忌'),
  r('神煞', 84, (c) => c.shensha('灾煞'), '灾煞在命，需防疾厄横事，交通出行多加小心。', '灾煞', '凶'),
  r('神煞', 84, (c) => c.shensha('天医'), '天医入命，与医药、养生、治愈之业有缘。', '天医', '吉'),
  r('神煞', 82, (c) => c.shensha('阴差阳错'), '阴差阳错日：婚姻感情易生误会错配，需多沟通。', '阴差阳错', '忌'),
  r('神煞', 82, (c) => c.shensha('十恶大败'), '十恶大败日：财禄难聚，宜守不宜攻。', '十恶大败', '凶'),
  r('神煞', 86, (c) => c.shensha('魁罡', 'day'), '魁罡日生，个性刚毅，聪明果断，女命个性较强。', '日柱魁罡'),
  r('神煞', 82, (c) => c.shensha('童子煞'), '童子煞：心性纯真，不食人间烟火，婚姻宜迟。', '童子煞'),

  // ---- 五行 / 健康 ----------------------------------------------------------------------
  r('健康', 86, (c) => c.role('印') >= 45, (c) => `${ELEMENT_ZH[c.roleEl('印')]}太旺，需防${ELEMENT_ZH[c.roleEl('印')] === '土' ? '脾胃消化' : ELEMENT_ZH[c.roleEl('印')] === '水' ? '肾膀胱' : ELEMENT_ZH[c.roleEl('印')] === '木' ? '肝胆' : ELEMENT_ZH[c.roleEl('印')] === '火' ? '心血' : '肺呼吸'}之疾。`, '印星太旺', '忌'),
  r('健康', 86, (c) => c.role('官杀') >= 40, '官杀太旺，压力与病痛相随，需印化杀、多休养。', '官杀太旺', '凶'),
  r('健康', 84, (c) => c.role('食伤') >= 40, '食伤太旺，泄气过度，多思多虑，易失眠。', '食伤太旺', '忌'),
  r('性格', 84, (c) => c.dmEl === 'wood', '木命之人仁慈正直，好生恶杀，有进取心。', '日主木'),
  r('性格', 84, (c) => c.dmEl === 'fire', '火命之人热情礼貌，性急易燥，明快磊落。', '日主火'),
  r('性格', 84, (c) => c.dmEl === 'earth', '土命之人厚重诚信，包容守成，略嫌保守。', '日主土'),
  r('性格', 84, (c) => c.dmEl === 'metal', '金命之人刚毅果决，重义守信，外刚内柔。', '日主金'),
  r('性格', 84, (c) => c.dmEl === 'water', '水命之人聪明灵活，善变通，但易流动不定。', '日主水'),
]

export function computeVerdicts(chart: BaziChart, analysis: BaziAnalysis): Verdict[] {
  const c = buildCtx(chart, analysis)
  const out: Verdict[] = []
  for (const rule of RULES) {
    let ok = false
    try { ok = rule.when(c) } catch { ok = false }
    if (!ok) continue
    out.push({
      text: typeof rule.text === 'function' ? rule.text(c) : rule.text,
      confidence: rule.conf,
      basis: typeof rule.basis === 'function' ? rule.basis(c) : rule.basis,
      tag: rule.tag, star: rule.star, topic: rule.topic, claim: rule.claim, tier: rule.topic === '格局' || rule.conf >= 92 || rule.tag === '格' ? 'core' : 'detail',
    })
  }
  const seen = new Set<string>()
  const all = [...out, ...tableVerdicts(chart, analysis)].filter((x) => (seen.has(x.text) ? false : (seen.add(x.text), true))).sort((a, b) => b.confidence - a.confidence)
  // Contradictions: same claim key, different value → keep the higher-confidence line (list is sorted).
  const claimed = new Map<string, string>()
  return all.filter((x) => {
    if (!x.claim) return true
    const [k, val] = x.claim.split('=')
    const prev = claimed.get(k)
    if (prev !== undefined && prev !== val) return false
    claimed.set(k, val)
    return true
  })
}

export const TOPICS = ['格局', '性格', '财运', '事业', '六亲', '健康', '神煞'] as const
