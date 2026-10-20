/**
 * Table-driven 断语 — the bulk of the reading. Where `verdicts.ts` holds conditional
 * rules, this file holds positional tables (每柱十神、星运、日柱、纳音、命宫、时支…) so a
 * full chart yields roughly a hundred lines, each with its 推断依据.
 */
import type { FiveElement, PillarKey } from '../types'
import { BRANCHES, ELEMENT_ZH, STEMS, STEM_ELEMENT, controls, generates, stemYang, tenGod } from './tables'
import type { BaziChart } from './types'
import type { BaziAnalysis, ElementRole } from './analysis'
import type { Verdict, VerdictTag } from './verdicts'

const KEYS: PillarKey[] = ['year', 'month', 'day', 'hour']
const POS: Record<PillarKey, string> = { year: '年', month: '月', day: '日', hour: '时' }
const POS_PILLAR: Record<PillarKey, string> = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' }
const POS_PHASE: Record<PillarKey, string> = { year: '早年（祖上、根基）', month: '青年（父母、兄弟、事业根基）', day: '中年（自身与配偶）', hour: '晚年（子女、归宿）' }
const POS_WHO: Record<PillarKey, string> = { year: '祖上父母', month: '父母兄弟', day: '自身配偶', hour: '子女晚辈' }

const STEM_POS_GOD: Record<'year' | 'month' | 'hour', Record<string, string>> = {
  year: {
    比肩: '年干比肩：早年多靠自己，兄弟朋友缘重，祖业难以全继。',
    劫财: '年干劫财：少年时家中钱财易散，或与同辈争竞，性格好强。',
    食神: '年干食神：祖上温和有福，早年衣食无忧，性情随和。',
    伤官: '年干伤官：早年聪明叛逆，与长辈多有磨合，宜以学艺立身。',
    正财: '年干正财：出身殷实或父亲勤俭持家，少年时家境稳定。',
    偏财: '年干偏财：父亲多经商奔波，早年家境起伏，见过世面。',
    正官: '年干正官：家风端正，祖上有名望，少年守规矩、受管教。',
    七杀: '年干七杀：少年时压力大、环境严苛，磨练出担当。',
    正印: '年干正印：受祖荫与母亲照拂，早年读书顺利。',
    偏印: '年干偏印：祖上或长辈有偏业技艺，幼年心思敏感早熟。',
  },
  month: {
    比肩: '月干比肩：兄弟姐妹或同辈朋友多，青年期自立，合作须明账。',
    劫财: '月干劫财：青年期竞争激烈，钱财经手多，须防同辈牵累。',
    食神: '月干食神：青年期才艺显露，口才与审美佳，与母亲缘深。',
    伤官: '月干伤官：青年期才华外露、不服管束，宜专业技术或创作立身。',
    正财: '月干正财：青年期即有稳定收入观念，父亲或兄长勤勉务实。',
    偏财: '月干偏财：青年期财路活络，人脉广，父亲多经商或外出。',
    正官: '月干正官：青年期守纪有名，父母中有公职或管理者，宜考试升迁。',
    七杀: '月干七杀：青年期压力与机遇并存，兄弟中有强势之人，宜武职技术。',
    正印: '月干正印：青年期得父母庇护、学业顺利，性情温厚。',
    偏印: '月干偏印：青年期独学偏才，思路特别，与母亲关系微妙。',
  },
  hour: {
    比肩: '时干比肩：子女自立性强，晚年多与朋友往来，须防晚年劳心。',
    劫财: '时干劫财：晚年钱财经子女或他人之手，须守财，子女个性强。',
    食神: '时干食神：子女聪慧有福，晚年口福好、心境安逸。',
    伤官: '时干伤官：子女聪明但叛逆，晚年多操心，本人晚年宜修身养性。',
    正财: '时干正财：晚年有稳定收入与积蓄，子女孝顺务实。',
    偏财: '时干偏财：晚年财路活络，子女或有经商之才。',
    正官: '时干正官：子女端正有成，晚年有名望地位。',
    七杀: '时干七杀：子女有魄力，晚年有权亦有压力，身强则贵。',
    正印: '时干正印：晚年清贵安稳，子女孝顺，有文书名誉。',
    偏印: '时干偏印：晚年心思独处，子女缘略淡，宜有精神寄托。',
  },
}

const BRANCH_POS_GOD: Record<PillarKey, Record<string, string>> = {
  year: {
    比肩: '年支坐比肩：祖业靠自身维持，兄弟缘厚。', 劫财: '年支坐劫财：祖业易散，早年家中有耗。',
    食神: '年支坐食神：祖荫有福，早年口福好。', 伤官: '年支坐伤官：祖上有变故，早年环境多变。',
    正财: '年支坐正财：祖上有产业，根基稳固。', 偏财: '年支坐偏财：祖上经商，家境起伏。',
    正官: '年支坐正官：祖上清贵，家教严格。', 七杀: '年支坐七杀：祖上多磨难，早年环境严厉。',
    正印: '年支坐正印：祖荫深厚，少年得长辈照顾。', 偏印: '年支坐偏印：祖上有偏业，早年心思敏感。',
  },
  month: {
    比肩: '月令比肩：自身当令，独立有主见，宜创业与合作。', 劫财: '月令劫财：自身当令而争竞，钱财须防同辈分夺。',
    食神: '月令食神：才艺与口福为根基，宜以技艺服务生财。', 伤官: '月令伤官：才华为根基，适合技术、艺术、研发。',
    正财: '月令正财：务实勤俭为根基，宜稳定收入之业。', 偏财: '月令偏财：交际与经营为根基，宜商业贸易。',
    正官: '月令正官：规矩与名分为根基，宜公职、管理。', 七杀: '月令七杀：压力与魄力为根基，宜竞争性强之业。',
    正印: '月令正印：学识与庇护为根基，宜文教学术。', 偏印: '月令偏印：偏才与独思为根基，宜专业冷门之学。',
  },
  day: {
    比肩: '日支坐比肩：配偶个性与自己相近，相处如友，亦易争执。', 劫财: '日支坐劫财：配偶个性强，婚姻中钱财须防耗散。',
    食神: '日支坐食神：配偶温和有福，家庭口福好。', 伤官: '日支坐伤官：配偶聪明有才但个性强，婚姻须多包容。',
    正财: '日支坐正财：配偶务实持家，婚姻稳定。', 偏财: '日支坐偏财：配偶善经营、人缘好，男命妻贤能干。',
    正官: '日支坐正官：配偶端正可靠，女命得贤夫。', 七杀: '日支坐七杀：配偶有魄力、脾气急，婚姻中有压力。',
    正印: '日支坐正印：配偶贤淑有学识，多得长辈成全。', 偏印: '日支坐偏印：配偶心思细密独特，婚后宜多沟通。',
  },
  hour: {
    比肩: '时支坐比肩：子女独立，晚年多友。', 劫财: '时支坐劫财：晚年财须防耗，子女个性强。',
    食神: '时支坐食神：子女有福，晚年安逸。', 伤官: '时支坐伤官：子女聪明反骨，晚年操心。',
    正财: '时支坐正财：晚年有积蓄，子女务实。', 偏财: '时支坐偏财：晚年财路活，子女善经营。',
    正官: '时支坐正官：子女端正，晚年有名望。', 七杀: '时支坐七杀：子女有魄力，晚年有权有压。',
    正印: '时支坐正印：晚年清贵，子女孝顺。', 偏印: '时支坐偏印：晚年独思，子女缘淡。',
  },
}

const GOD_SHORT: Record<string, string> = {
  比肩: '主自立与同辈', 劫财: '主争竞与耗财', 食神: '主福气与才艺', 伤官: '主才华与反骨', 正财: '主正财与务实',
  偏财: '主偏财与人缘', 正官: '主名分与规矩', 七杀: '主压力与魄力', 正印: '主学识与庇护', 偏印: '主偏才与孤思',
}

const LIFE_STAGE_TEXT: Record<string, string> = {
  长生: '生机旺盛，有贵人提携、从头起步之象。', 沐浴: '多情多变，须防感情与反复。', 冠带: '渐趋成熟，有名誉与成长。',
  临官: '建禄之地，自立有成，财禄可期。', 帝旺: '气势最盛，有作为，亦须防过刚。', 衰: '气势转弱，宜守成、顺势而为。',
  病: '精力不足，须注意健康与节奏。', 死: '沉静内敛，宜学问与蓄力。', 墓: '入库收藏，有储蓄之象，亦易郁结。',
  绝: '绝处逢生，变化大，宜另辟新路。', 胎: '孕育新机，多计划与等待。', 养: '休养生息，平稳得人照应。',
}

const DAY_PILLAR: Record<string, string> = {
  甲子: '甲子日：坐沐浴正印，聪明文雅，多情易变，宜以学问立身。', 乙丑: '乙丑日：身坐财库，勤俭能守财，外柔内刚。', 丙寅: '丙寅日：坐长生偏印，光明磊落，有寿有福，艺术缘深。',
  丁卯: '丁卯日：坐病偏印，心思细腻，文章秀气，须防多虑。', 戊辰: '戊辰日：坐冠带比肩，厚重有土气，自坐财库，中年发达。', 己巳: '己巳日：坐帝旺正印，聪明温厚，得长辈助，宜文职。',
  庚午: '庚午日：坐沐浴正官，刚中带柔，异性缘重，官星护身。', 辛未: '辛未日：坐衰偏印，身旺有根，心思细密，好学玄理。', 壬申: '壬申日：坐长生偏印，聪明秀丽，机智善变，宜远行。',
  癸酉: '癸酉日：坐病偏印，清秀多才，心思敏感，宜文艺。', 甲戌: '甲戌日：坐养偏财，心怀慈善，临财库，善理家财。', 乙亥: '乙亥日：坐死正印，文星秀气，名利可成，宜学术。',
  丙子: '丙子日：坐胎正官，文曲之象，少年成名，须防心疾。', 丁丑: '丁丑日：坐墓食神，内藏财库，深沉能忍，晚发。', 戊寅: '戊寅日：坐长生七杀，稳重有权，宜武职技术。',
  己卯: '己卯日：坐病七杀，心细多谋，须防身弱受压。', 庚辰: '庚辰日：魁罡坐养偏印，刚毅果决，有领导力。', 辛巳: '辛巳日：坐死正官，温文有礼，官印相生，宜公职。',
  壬午: '壬午日：坐胎正财，多情重义，妻财同宫，宜经商。', 癸未: '癸未日：坐墓七杀，深沉能忍，中晚年发达。', 甲申: '甲申日：坐绝七杀，才华横溢，变动多，宜以技艺立身。',
  乙酉: '乙酉日：坐绝七杀，清秀聪慧，情感波折，宜艺术。', 丙戌: '丙戌日：坐墓食神，内敛有福，财库藏身，善积蓄。', 丁亥: '丁亥日：坐胎正官，坐天乙贵人，温和得助，宜文职。',
  戊子: '戊子日：坐胎正财，稳重务实，妻财得力。', 己丑: '己丑日：坐墓比肩，厚重沉稳，中年后发。', 庚寅: '庚寅日：坐绝偏财，刚中有变，财路靠闯。',
  辛卯: '辛卯日：坐绝偏财，清秀多才，财缘靠人。', 壬辰: '壬辰日：魁罡坐墓七杀，聪明果断，有权有压。', 癸巳: '癸巳日：坐胎正财，坐天乙贵人，聪慧得助，宜财经。',
  甲午: '甲午日：坐死伤官，才华外露，多情重义，须防口舌。', 乙未: '乙未日：坐养偏财，温和有福，身坐财库。', 丙申: '丙申日：坐病偏财，聪明好动，财路靠奔波。',
  丁酉: '丁酉日：坐长生偏财，坐天乙贵人，清秀文雅，得贵人助。', 戊戌: '戊戌日：魁罡坐墓比肩，刚毅有土气，宜武职。', 己亥: '己亥日：坐胎正财，稳重温和，妻财得力。',
  庚子: '庚子日：坐死伤官，聪明清冷，才华出众，宜技术。', 辛丑: '辛丑日：坐养偏印，含蓄内敛，心思深沉，宜专门之学。', 壬寅: '壬寅日：坐病食神，聪明有福，才艺生财。',
  癸卯: '癸卯日：坐长生食神，坐天乙贵人，清秀有福，文艺缘深。', 甲辰: '甲辰日：坐衰偏财，身坐财库，慷慨多情，宜经营。', 乙巳: '乙巳日：坐沐浴伤官，聪明灵巧，多情多变。',
  丙午: '丙午日：坐帝旺劫财，阳刃坐命，刚烈有魄力，须防过刚。', 丁未: '丁未日：坐冠带食神，温和有福，善理财。', 戊申: '戊申日：坐病食神，聪明有才，奔波中得福。',
  己酉: '己酉日：坐长生食神，温文有礼，艺术口福佳。', 庚戌: '庚戌日：魁罡坐衰偏印，刚毅独断，宜武职技术。', 辛亥: '辛亥日：坐沐浴伤官，聪明清秀，多情多才。',
  壬子: '壬子日：坐帝旺劫财，阳刃坐命，聪明刚强，宜防争斗。', 癸丑: '癸丑日：坐冠带七杀，内敛能忍，中晚年发。', 甲寅: '甲寅日：坐临官比肩，自立自强，禄到人间，宜创业。',
  乙卯: '乙卯日：坐临官比肩，温和自立，人缘好。', 丙辰: '丙辰日：坐冠带食神，光明有福，善积财。', 丁巳: '丁巳日：坐帝旺劫财，热情刚烈，有魄力。',
  戊午: '戊午日：坐帝旺正印，阳刃坐命，厚重刚强，宜防固执。', 己未: '己未日：坐冠带比肩，厚重沉稳，善守成。', 庚申: '庚申日：坐临官比肩，刚毅自立，禄到人间。',
  辛酉: '辛酉日：坐临官比肩，清秀刚毅，自立有成。', 壬戌: '壬戌日：坐冠带七杀，深沉有权，宜武职。', 癸亥: '癸亥日：坐帝旺劫财，聪明灵活，变动多。',
}

const HOUR_BRANCH: string[] = [
  '子时生：夜深人静之时，心思深沉，宜文书智慧之业，晚年近水。',
  '丑时生：黎明前出生，耐劳能守，中年后渐发。',
  '寅时生：日出之前，生气勃发，有进取心，宜早离家发展。',
  '卯时生：日出之时，温和秀气，人缘好，宜文艺。',
  '辰时生：龙动之时，志向远大，变动多，宜技术管理。',
  '巳时生：日升之时，聪明外向，口才佳，宜交际之业。',
  '午时生：日中之时，热情光明，性急，宜防口舌与心火。',
  '未时生：日偏西时，温和有福，善蓄财，晚年安稳。',
  '申时生：日落前出生，机敏好动，宜远行与技术。',
  '酉时生：日落之时，清秀讲究，宜艺术与金融。',
  '戌时生：黄昏之时，忠厚守信，宜守成与宗教。',
  '亥时生：夜初之时，聪明柔和，多情，宜学问。',
]

const MING_GONG: string[] = [
  '命宫在子（天贵宫）：聪明清秀，宜学术文职，一生近贵。', '命宫在丑（天厄宫）：早年多劳，中年后转顺，须防疾厄。',
  '命宫在寅（天权宫）：有权威气度，宜管理领导。', '命宫在卯（天赦宫）：逢凶化吉，心性仁慈，得人缘。',
  '命宫在辰（天如宫）：志向高远，多奔波后成。', '命宫在巳（天文宫）：文采秀气，宜文化艺术。',
  '命宫在午（天福宫）：福气自来，光明磊落。', '命宫在未（天驿宫）：多迁移奔波，宜外出发展。',
  '命宫在申（天孤宫）：独立孤高，宜专门技艺。', '命宫在酉（天秘宫）：心思缜密，宜研究与玄学。',
  '命宫在戌（天艺宫）：有艺术之才，晚年安稳。', '命宫在亥（天寿宫）：心宽寿长，温和有福。',
]

const ANIMAL: string[] = [
  '属鼠：机敏灵活，善于积蓄，适应力强。', '属牛：勤恳踏实，耐力过人，不善变通。', '属虎：胆大有魄力，独立好胜。',
  '属兔：温和细腻，人缘好，重感情。', '属龙：志向高远，气度不凡，宜防自负。', '属蛇：聪明深沉，善谋略，外冷内热。',
  '属马：热情奔放，好动好自由。', '属羊：温顺善良，多才艺，略欠主见。', '属猴：机智多变，口才佳，宜专注。',
  '属鸡：讲究精细，勤快直率。', '属狗：忠诚守信，重义气。', '属猪：宽厚随和，福气自来。',
]

const DAY_STEM: string[] = [
  '甲木日主：参天之木，正直进取，有领袖气，宜防固执。', '乙木日主：花草之木，柔韧灵活，善应变，重情感。',
  '丙火日主：太阳之火，热情光明，慷慨直率，性急。', '丁火日主：灯烛之火，温柔内敛，思虑细密，有文采。',
  '戊土日主：高山之土，厚重稳固，守信包容，略显保守。', '己土日主：田园之土，温和包容，善孕育，心思多。',
  '庚金日主：刀剑之金，刚毅果决，重义气，不服输。', '辛金日主：珠玉之金，清秀讲究，自尊心强，外柔内刚。',
  '壬水日主：江河之水，聪明豪迈，志向远大，流动不定。', '癸水日主：雨露之水，细腻温柔，善适应，心思深。',
]

const GOD_COUNT: Record<string, [string, string, string]> = {
  比肩: ['四柱无比肩：独立性靠自己培养，兄弟朋友缘淡。', '比肩一位：有同辈相助，自立而不孤。', '比肩多见：好胜独立，朋友多而争财，宜合作须立规矩。'],
  劫财: ['四柱无劫财：少争竞，钱财不易被夺。', '劫财一位：有魄力与竞争心，须防耗财。', '劫财多见：争竞心重，钱财易散，婚姻多争。'],
  食神: ['四柱无食神：口福与闲适稍欠，才艺需后天培养。', '食神一位：温和有福，口才与审美佳。', '食神多见：享受心重，才艺多而不专，宜节制。'],
  伤官: ['四柱无伤官：少叛逆，表达较内敛。', '伤官一位：才华有表达力，宜技术创作。', '伤官多见：才华横溢但不服管，口舌是非多。'],
  正财: ['四柱无正财：正财缘靠食伤生财或大运补足。', '正财一位：理财稳健，勤俭积富。', '正财多见：务实而心累，财多身弱则为财所困。'],
  偏财: ['四柱无偏财：偏财机遇少，宜稳扎稳打。', '偏财一位：有经营与交际之才。', '偏财多见：慷慨人缘旺，财来财去，感情多头。'],
  正官: ['四柱无正官：少拘束，不喜被管，名分需自取。', '正官一位：规矩清，名分正，宜公职。', '正官多见：拘谨多虑，官多为杀，压力重。'],
  七杀: ['四柱无七杀：少横逆压力，魄力需后天磨练。', '七杀一位：有魄力与担当，宜竞争之业。', '七杀多见：压力大，小人多，须印化杀。'],
  正印: ['四柱无正印：少长辈庇护，学业靠自努力。', '正印一位：有学识与庇护，心性温厚。', '正印多见：依赖心重，想多做少。'],
  偏印: ['四柱无偏印：少偏才，思路较正。', '偏印一位：有独特思路与专门之学。', '偏印多见：孤僻多疑，偏才突出，枭神须防夺食。'],
}

const ROLE_VERDICT: Record<ElementRole, [string, string, string, string]> = {
  日主: ['日主太旺：主观自信，能扛事，宜泄秀用财官。', '日主中和：刚柔相济，顺逆皆能自处。', '日主偏弱：需人扶持，宜印比帮身。', '日主极弱无根：随势而行，从格论之。'],
  食伤: ['食伤太旺：才华与欲望皆旺，泄气过度，须节制。', '食伤中和：有才艺有表达，福气自然。', '食伤偏弱：表达内敛，才艺需培养。', '四柱无食伤：少泄秀之路，宜大运补足。'],
  财: ['财星太旺：财多身劳，须比劫印星扶身方能任财。', '财星中和：财运平稳，理财有道。', '财星偏弱：求财需靠食伤或大运，不宜投机。', '四柱无财星：财缘靠后天与大运。'],
  官杀: ['官杀太旺：压力与病痛相随，宜印化杀。', '官杀中和：有名分有约束，事业可成。', '官杀偏弱：少压力亦少名位，宜自我规划。', '四柱无官杀：自由不羁，名分需自取。'],
  印: ['印星太旺：庇护过重，依赖心强，宜财星损印。', '印星中和：学识与庇护兼得。', '印星偏弱：学业靠自努力，长辈助力少。', '四柱无印星：少庇护，靠自身成长。'],
}

const SEASON: Record<FiveElement, [string, string, string, string, string]> = {
  wood: ['木生于春，当令而旺，宜金修剪、火泄秀。', '木生于夏，火旺泄气，宜水滋润。', '木生于秋，金旺克木，宜火制金、水生木。', '木生于冬，水旺木寒，宜火暖局。', '木生于四季土月，土重木折，宜水木扶助。'],
  fire: ['火生于春，木生火相，宜金水调候。', '火生于夏，当令炎上，宜水润、金财。', '火生于秋，气衰，宜木生扶。', '火生于冬，水旺火弱，宜木生火、土制水。', '火生于四季土月，土多晦火，宜木疏土。'],
  earth: ['土生于春，木旺克土，宜火生土。', '土生于夏，火旺土燥，宜水润。', '土生于秋，金旺泄气，宜火生土。', '土生于冬，水旺土寒，宜火暖。', '土生于四季土月，当令厚重，宜木疏、水润。'],
  metal: ['金生于春，木旺金绝，宜土生金。', '金生于夏，火旺克金，宜水制火、土生金。', '金生于秋，当令刚锐，宜火锻、水洗。', '金生于冬，水旺金寒，宜火暖、土生。', '金生于四季土月，土厚埋金，宜木疏土、水淘。'],
  water: ['水生于春，木旺泄气，宜金生水。', '水生于夏，火旺水涸，宜金水相生。', '水生于秋，金旺水相，宜木泄秀。', '水生于冬，当令汪洋，宜火暖、土制。', '水生于四季土月，土旺克水，宜金生水、木疏土。'],
}

const NAYIN_TEXT: Record<string, string> = {
  海中金: '海中金：金藏海底，含蓄内敛，大器晚成。', 炉中火: '炉中火：炉火炼金，热情有力，宜技艺。', 大林木: '大林木：森林之木，气象宏大，宜群体事业。',
  路旁土: '路旁土：路边之土，平实耐劳，宜服务之业。', 剑锋金: '剑锋金：锋利之金，果决刚毅，宜武职技术。', 山头火: '山头火：山顶之火，光照远方，有名望。',
  涧下水: '涧下水：山涧清流，清秀灵动，宜文艺。', 城头土: '城头土：城墙之土，稳固守护，宜管理。', 白蜡金: '白蜡金：柔软之金，精细讲究，宜工艺。',
  杨柳木: '杨柳木：随风之木，柔韧善变，多情。', 泉中水: '泉中水：泉源之水，源源不断，有智慧。', 屋上土: '屋上土：屋顶之土，安居守成，重家庭。',
  霹雳火: '霹雳火：雷电之火，爆发力强，性急。', 松柏木: '松柏木：耐寒之木，坚韧不拔，有气节。', 长流水: '长流水：长河之水，绵长不息，宜远行。',
  沙中金: '沙中金：沙里之金，需淘洗而得，晚成。', 山下火: '山下火：山脚之火，温暖亲和，宜服务。', 平地木: '平地木：平原之木，平和踏实，宜合作。',
  壁上土: '壁上土：墙壁之土，依附成形，宜辅佐。', 金箔金: '金箔金：薄金装饰，精美外露，宜艺术。', 覆灯火: '覆灯火：灯笼之火，照亮一隅，宜专门之学。',
  天河水: '天河水：天上之水，志向高远，有慈悲心。', 大驿土: '大驿土：驿道之土，奔波迁动，宜交通贸易。', 钗钏金: '钗钏金：首饰之金，精致讲究，宜美业。',
  桑柘木: '桑柘木：桑树之木，勤劳养人，宜实业。', 大溪水: '大溪水：溪流之水，活泼奔放，宜开拓。', 沙中土: '沙中土：沙土混合，适应力强，宜变通。',
  天上火: '天上火：太阳之火，光明磊落，有领袖气。', 石榴木: '石榴木：结果之木，多子多福，宜守成。', 大海水: '大海水：海洋之水，胸怀广阔，起伏大。',
}

const MONTH_BRANCH: string[] = [
  '生于子月（大雪后）：寒冬之水，心思深沉，宜火暖局。', '生于丑月（小寒后）：严冬冻土，耐劳坚忍，宜火暖。', '生于寅月（立春后）：初春生发，有进取心。',
  '生于卯月（惊蛰后）：仲春木旺，温和秀气。', '生于辰月（清明后）：春末水库，变化多，有潜力。', '生于巳月（立夏后）：初夏火起，热情外向。',
  '生于午月（芒种后）：仲夏火旺，性急光明，宜水润。', '生于未月（小暑后）：夏末燥土，稳重有耐力，宜水润。', '生于申月（立秋后）：初秋金起，机敏果断。',
  '生于酉月（白露后）：仲秋金旺，清秀讲究。', '生于戌月（寒露后）：秋末火库，忠厚守信。', '生于亥月（立冬后）：初冬水起，聪明柔和。',
]

const LUCK_GOD: Record<string, string> = {
  比肩: '比肩运：靠自己与同辈，宜合作创业，须防争财。', 劫财: '劫财运：竞争激烈，钱财易耗，宜守不宜攻。', 食神: '食神运：福气口福皆旺，才艺生财，心情舒展。',
  伤官: '伤官运：才华外露，创意多，须防口舌与官非。', 正财: '正财运：财运平稳，宜积蓄置产。', 偏财: '偏财运：财路活络，人缘旺，宜经营投资。',
  正官: '正官运：名分提升，宜考试升迁，守规矩。', 七杀: '七杀运：压力与机遇并至，宜拼搏，防小人。', 正印: '正印运：学业文书顺利，得长辈贵人助。', 偏印: '偏印运：偏才发挥，宜专门之学，防孤独。',
}

const RELATION_VERB: Record<string, string> = { 合: '相合，主和顺牵绊、互有助益', 会: '三会成方，一气独旺', 冲: '相冲，主变动分离、不安', 刑: '相刑，主拉扯是非、暗疾', 害: '相害，主暗损不和', 破: '相破，主耗损波折' }

function v(text: string, confidence: number, basis: string, topic: string, tag?: VerdictTag): Verdict {
  return { text, confidence, basis, topic, tag }
}

const bucket = (verdict: string): 0 | 1 | 2 | 3 => (/太旺|过旺|从强/.test(verdict) ? 0 : /偏弱|太弱/.test(verdict) ? 2 : /从弱|^无$/.test(verdict) ? 3 : 1)

export function tableVerdicts(chart: BaziChart, a: BaziAnalysis): Verdict[] {
  const out: Verdict[] = []
  const dm = chart.dayMaster.stem
  const dmEl = STEM_ELEMENT[dm]
  const pillars = Object.fromEntries(chart.pillars.map((p) => [p.key, p])) as Record<PillarKey, (typeof chart.pillars)[number]>
  const female = chart.input.gender === 'F'

  // 日主
  out.push(v(DAY_STEM[dm], 88, `日主${STEMS[dm]}`, '性格'))
  out.push(v(stemYang(dm) ? '阳干日主：外向主动，直来直往，喜做主。' : '阴干日主：内敛细腻，柔中有韧，善观察。', 84, `日主${STEMS[dm]}为${stemYang(dm) ? '阳' : '阴'}干`, '性格'))
  const dayGz = pillars.day.stemChar + pillars.day.branchChar
  if (DAY_PILLAR[dayGz]) out.push(v(DAY_PILLAR[dayGz], 90, `日柱${dayGz}`, '性格', '内容'))

  // 天干十神（年月时）
  for (const k of ['year', 'month', 'hour'] as const) {
    const g = pillars[k].stemTenGod
    if (STEM_POS_GOD[k][g]) out.push(v(STEM_POS_GOD[k][g], 90, `${POS[k]}干${g}`, k === 'hour' ? '六亲' : k === 'year' ? '六亲' : '事业'))
  }
  // 地支本气十神 + 藏干
  for (const k of KEYS) {
    const p = pillars[k]
    const main = p.hidden[0]?.tenGod
    if (main && BRANCH_POS_GOD[k][main]) out.push(v(BRANCH_POS_GOD[k][main], 88, `${POS[k]}支本气${main}`, k === 'day' ? '六亲' : k === 'month' ? '事业' : '六亲'))
    for (const h of p.hidden.slice(1)) out.push(v(`${POS_PILLAR[k]}藏${h.tenGod}（${h.rank}）：${POS_WHO[k]}方面暗${GOD_SHORT[h.tenGod].slice(1)}，力量较轻。`, 80, `${POS[k]}支${h.rank}${h.stemChar}${h.tenGod}`, '六亲'))
  }
  // 星运
  for (const k of KEYS) {
    const st = p12(pillars[k].lifeStage)
    out.push(v(`日主在${POS[k]}支逢${st}，${POS_PHASE[k]}：${LIFE_STAGE_TEXT[st] ?? ''}`, 84, `${POS[k]}支星运${st}`, '性格'))
  }
  // 纳音
  for (const k of KEYS) {
    const n = pillars[k].naYin
    if (NAYIN_TEXT[n]) out.push(v(`${POS_PILLAR[k]}纳音${NAYIN_TEXT[n]}（应于${POS_WHO[k]}）`, 80, `${POS[k]}柱纳音${n}`, '性格'))
  }
  // 时支、命宫、生肖、月支
  out.push(v(HOUR_BRANCH[pillars.hour.branch], 86, `时支${BRANCHES[pillars.hour.branch]}`, '性格'))
  const mingBranch = BRANCHES.indexOf(chart.palaces.mingGong[1] as (typeof BRANCHES)[number])
  if (mingBranch >= 0) out.push(v(MING_GONG[mingBranch], 84, `命宫${chart.palaces.mingGong}`, '性格'))
  out.push(v(ANIMAL[pillars.year.branch], 82, `年支${BRANCHES[pillars.year.branch]}，属${chart.lunar.animal}`, '性格'))
  out.push(v(MONTH_BRANCH[pillars.month.branch], 86, `月支${BRANCHES[pillars.month.branch]}`, '性格'))
  const mb = pillars.month.branch
  const seasonIdx = [2, 3].includes(mb) ? 0 : [5, 6].includes(mb) ? 1 : [8, 9].includes(mb) ? 2 : [11, 0].includes(mb) ? 3 : 4
  out.push(v(SEASON[dmEl][seasonIdx], 90, `日主${ELEMENT_ZH[dmEl]}生于${BRANCHES[mb]}月`, '格局'))
  // 胎元 身宫
  const taiStem = STEMS.indexOf(chart.palaces.taiYuan[0] as (typeof STEMS)[number])
  if (taiStem >= 0) { const g = tenGod(dm, taiStem); out.push(v(`胎元${chart.palaces.taiYuan}为${g}：胎元主先天禀赋，${GOD_SHORT[g]}。`, 78, `胎元${chart.palaces.taiYuan}`, '性格')) }
  const shenStem = STEMS.indexOf(chart.palaces.shenGong[0] as (typeof STEMS)[number])
  if (shenStem >= 0) { const g = tenGod(dm, shenStem); out.push(v(`身宫${chart.palaces.shenGong}为${g}：身宫主后天作为，${GOD_SHORT[g]}。`, 78, `身宫${chart.palaces.shenGong}`, '事业')) }

  // 十神数量
  const count: Record<string, number> = {}
  for (const k of KEYS) {
    if (k !== 'day') count[pillars[k].stemTenGod] = (count[pillars[k].stemTenGod] ?? 0) + 1
    for (const h of pillars[k].hidden) count[h.tenGod] = (count[h.tenGod] ?? 0) + 1
  }
  for (const g of Object.keys(GOD_COUNT)) {
    const n = count[g] ?? 0
    const [none, one, many] = GOD_COUNT[g]
    out.push(v(n === 0 ? none : n <= 2 ? one : many, 86, n === 0 ? `四柱无${g}` : `${g}共 ${n} 位（含藏干）`, '性格'))
  }
  // 五行各角色旺衰
  for (const s of a.elementSummary) {
    const b = s.role === '日主'
      ? (a.special.type === '从弱' ? 3 : chart.strength.verdict === '身强' ? 0 : chart.strength.verdict === '身弱' ? 2 : 1)
      : bucket(s.verdict)
    if (s.role === '日主' && (a.special.type === '专旺' || a.special.type === '从强')) {
      out.push(v('日主得印比之势而成专旺 / 从强：顺其旺势，以印比食伤为用，忌官杀财星逆之。', 88, `日主与印合计 ${chart.strength.selfParty}%，${a.special.type}`, '格局', '格'))
      continue
    }
    out.push(v(s.role === '日主' ? ROLE_VERDICT[s.role][b] : ROLE_VERDICT[s.role][b], 88, `${ELEMENT_ZH[s.element]}（${s.role}）${s.verdict}，占 ${s.percent}%`, '格局', b === 0 ? '忌' : b === 1 ? '吉' : undefined))
    if (s.count === 0 && s.exposure === '无') out.push(v(`四柱缺${ELEMENT_ZH[s.element]}（${s.role}）：${s.role === '财' ? '财缘靠后天' : s.role === '官杀' ? '少约束少名位' : s.role === '印' ? '少庇护' : s.role === '食伤' ? '表达内敛' : '根基薄'}，可以颜色、方位与大运补之。`, 82, `四柱不见${ELEMENT_ZH[s.element]}`, '格局', '忌'))
  }
  // 空亡
  for (const k of ['year', 'month', 'hour'] as const) {
    if (pillars[k].kongWang) out.push(v(k === 'year' ? '年支空亡：祖业根基虚，早年多漂泊。' : k === 'month' ? '月支空亡：父母兄弟缘薄，青年多变动。' : '时支空亡：子女缘迟或晚年孤清。', 82, `${POS[k]}支落日柱空亡`, '六亲', '忌'))
  }
  // 关系
  const lab: Record<string, string> = { year: '年', month: '月', day: '日', hour: '时' }
  for (const r of chart.relations) {
    const key = Object.keys(RELATION_VERB).find((kk) => r.type.includes(kk))
    if (!key || r.members.length < 2) continue
    const [m1, m2] = r.members as PillarKey[]
    out.push(v(`${lab[m1]}${r.level === 'stem' ? '干' : '支'}与${lab[m2]}${r.level === 'stem' ? '干' : '支'}${r.chars}${RELATION_VERB[key]}：涉及${POS_WHO[m1]}与${POS_WHO[m2]}。`, 86, `${r.note}`, '六亲', r.tone === 'tension' ? '忌' : r.tone === 'harmony' ? '吉' : undefined))
  }
  // 评分项
  const score = (name: string) => a.scores.find((s) => s.name === name)
  const zs = score('燥湿'); if (zs) out.push(v(zs.score >= 10 ? '燥湿平衡：身体与情绪较稳定。' : zs.note.includes('燥') ? '命局偏燥：性急易上火，宜水润，多近水。' : '命局偏湿：易湿寒沉滞，宜火暖，多晒太阳。', 80, zs.note, '健康', zs.score >= 10 ? '吉' : '忌'))
  const hw = score('寒暖'); if (hw) out.push(v(hw.score >= 10 ? '寒暖得宜：气候调候已足。' : '寒暖失调：需大运补足暖或润之神。', 80, hw.note, '健康', hw.score >= 10 ? '吉' : '忌'))
  const lu = score('禄神'); if (lu) out.push(v(lu.score > 0 ? '四柱见禄：衣禄丰足，自立有根。' : '四柱不见禄神：衣禄需靠后天经营。', 82, lu.note, '财运', lu.score > 0 ? '吉' : undefined))
  const yy = score('阴阳'); if (yy) out.push(v(yy.score >= 15 ? '阴阳较平衡：性情不走极端。' : '阴阳偏颇：性情易偏于一端，宜以配偶朋友互补。', 78, yy.note, '性格'))
  const fl = score('流通'); if (fl) out.push(v(fl.score >= 35 ? '五行流通较长：气脉通畅，做事有连贯性。' : '五行流通短：易卡在某一环节，宜借用神疏通。', 80, fl.note, '格局', fl.score >= 35 ? '吉' : undefined))

  // 大运
  const now = new Date().getFullYear()
  const cur = chart.luck.pillars.find((l) => l.startYear <= now && now <= l.endYear)
  if (cur) out.push(v(`当前大运${cur.stemChar}${cur.branchChar}（${cur.startYear}–${cur.endYear}）${LUCK_GOD[cur.stemTenGod]}`, 84, `大运干${cur.stemTenGod}，支本气${cur.branchMainTenGod}`, '事业'))
  out.push(v(chart.luck.forward ? '大运顺行：人生节奏顺势推进，成就渐积。' : '大运逆行：人生节奏先难后易，宜厚积薄发。', 76, `${female ? '女' : '男'}命，年干${stemYang(pillars.year.stem) ? '阳' : '阴'}`, '事业'))
  out.push(v(chart.luck.startAge.years < 3 ? '起运早：少年即入运，人生展开较早。' : chart.luck.startAge.years > 7 ? '起运晚：少年期由命局主导，大运影响较迟。' : '起运适中：童年后即入运，节奏平稳。', 74, `${chart.luck.startAge.years}岁${chart.luck.startAge.months}月起运`, '事业'))
  const annualSexa = ((now - 1984) % 60 + 60) % 60
  const ag = tenGod(dm, annualSexa % 10)
  out.push(v(`今年流年${STEMS[annualSexa % 10]}${BRANCHES[annualSexa % 12]}为${ag}：${LUCK_GOD[ag].split('：')[1]}`, 78, `${now} 年干${ag}`, '事业'))

  // 日干与月干、时干的生克
  const relStem = (k: 'month' | 'hour') => {
    const se = STEM_ELEMENT[pillars[k].stem]
    const who = k === 'month' ? '父母兄弟与事业根基' : '子女与晚年'
    if (se === dmEl) return `${POS[k]}干与日干同气：${who}与自己同声相应，易互相支持，也易相争。`
    if (generates(se, dmEl)) return `${POS[k]}干生日干：${who}对自己有助力，得其滋养。`
    if (generates(dmEl, se)) return `日干生${POS[k]}干：自己为${who}付出较多，须防耗神。`
    if (controls(se, dmEl)) return `${POS[k]}干克日干：${who}给自己压力与约束，宜以印通关。`
    return `日干克${POS[k]}干：自己能主导${who}，但须防强势。`
  }
  out.push(v(relStem('month'), 80, `日干${STEMS[dm]}与月干${pillars.month.stemChar}`, '六亲'))
  out.push(v(relStem('hour'), 80, `日干${STEMS[dm]}与时干${pillars.hour.stemChar}`, '六亲'))

  // 性别 × 旺衰
  const st = chart.strength.verdict
  out.push(v(female
    ? (st === '身强' ? '女命身强：独立能干，不甘依附，婚姻宜找能包容之人。' : st === '身弱' ? '女命身弱：温柔依人，得夫家与长辈照拂。' : '女命中和：刚柔并济，家庭事业可兼顾。')
    : (st === '身强' ? '男命身强：有担当有主见，宜开创，须防刚愎。' : st === '身弱' ? '男命身弱：心思细腻，宜借助团队与贵人。' : '男命中和：进退有度，稳中求进。'), 82, `${female ? '女' : '男'}命，${st}`, '性格'))

  // 神煞落柱
  for (const s of chart.shensha) {
    const where = s.pillars.map((k) => POS[k]).join('、')
    const who = s.pillars.map((k) => POS_WHO[k]).join('，')
    out.push(v(`${s.name}落${where}柱：应于${who}，${s.note}。`, 78, `${where}柱${s.name}`, '神煞', s.kind === 'auspicious' ? '吉' : s.kind === 'inauspicious' ? '凶' : undefined))
  }
  return out
}

const p12 = (stage: string) => stage


