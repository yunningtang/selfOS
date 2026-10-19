/**
 * 紫微斗数 via iztro (MIT). The library is loaded on first use so the main bundle stays lean.
 *
 * Time index follows the usual 十二时辰 split with 早/晚子时: 23:00–24:00 is 晚子时 (index 12),
 * 00:00–01:00 is 早子时 (index 0). The clock time of the birth zone is used, as most 紫微 apps do.
 */
import type { IFunctionalAstrolabe } from 'iztro/lib/astro/FunctionalAstrolabe'
import type { DecadalHoroscope, HoroscopeItem, MonthlyHoroscope, YearlyHoroscope } from 'iztro/lib/data/types'

export type ZiweiScope = 'origin' | 'decadal' | 'yearly' | 'monthly' | 'daily' | 'hourly'
export type ZiweiStarType = 'major' | 'soft' | 'tough' | 'adjective' | 'flower' | 'helper' | 'lucun' | 'tianma'

export interface ZiweiStar {
  name: string
  type: ZiweiStarType
  scope: ZiweiScope
  brightness?: string
  mutagen?: string
}

export interface ZiweiPalace {
  /** 0 = 寅宫, counted anticlockwise */
  index: number
  name: string
  stem: string
  branch: string
  isSoul: boolean
  isBody: boolean
  /** 来因宫 */
  isOrigin: boolean
  majorStars: ZiweiStar[]
  minorStars: ZiweiStar[]
  adjectiveStars: ZiweiStar[]
  changsheng12: string
  boshi12: string
  jiangqian12: string
  suiqian12: string
  /** 大限 virtual-age range and 干支 */
  decadal: { range: [number, number]; stem: string; branch: string }
  /** 小限 ages */
  ages: number[]
}

export interface ZiweiChart {
  gender: string
  solarDate: string
  lunarDate: string
  chineseDate: string
  time: string
  timeRange: string
  sign: string
  zodiac: string
  soulBranch: string
  bodyBranch: string
  soul: string
  body: string
  fiveElementsClass: string
  palaces: ZiweiPalace[]
  /** 本命四化: 禄 权 科 忌 → star names */
  mutagen: Record<'禄' | '权' | '科' | '忌', string | undefined>
  decadals: DecadalHoroscope[]
  /** The live iztro object, for 运限 queries */
  astrolabe: IFunctionalAstrolabe
}

export type { DecadalHoroscope, HoroscopeItem, MonthlyHoroscope, YearlyHoroscope }

export interface ZiweiInput {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  gender: 'M' | 'F'
}

export const BRANCH_ZH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
export const MUTAGENS = ['禄', '权', '科', '忌'] as const

/** Hour → iztro time index (0 早子 … 11 亥, 12 晚子). */
export const timeIndexOf = (hour: number) => (hour === 23 ? 12 : Math.floor((hour + 1) / 2))

export async function computeZiwei(input: ZiweiInput): Promise<ZiweiChart> {
  const { astro } = await import('iztro')
  const dateStr = `${input.year}-${input.month}-${input.day}`
  const a = astro.withOptions({ type: 'solar', dateStr, timeIndex: timeIndexOf(input.hour), gender: input.gender === 'M' ? '男' : '女', fixLeap: true, language: 'zh-CN' })
  const palaces: ZiweiPalace[] = a.palaces.map((p) => {
    const j = p.toJSON ? p.toJSON() : p
    const stars = (list: unknown) => ((list ?? []) as { toJSON?: () => ZiweiStar }[]).map((s) => ({ ...(s.toJSON ? s.toJSON() : (s as unknown as ZiweiStar)) }))
    return {
      index: j.index, name: j.name, stem: j.heavenlyStem, branch: j.earthlyBranch,
      isSoul: j.earthlyBranch === a.earthlyBranchOfSoulPalace, isBody: !!j.isBodyPalace, isOrigin: !!j.isOriginalPalace,
      majorStars: stars(j.majorStars), minorStars: stars(j.minorStars), adjectiveStars: stars(j.adjectiveStars),
      changsheng12: j.changsheng12, boshi12: j.boshi12, jiangqian12: j.jiangqian12, suiqian12: j.suiqian12,
      decadal: { range: j.decadal.range, stem: j.decadal.heavenlyStem, branch: j.decadal.earthlyBranch },
      ages: j.ages,
    }
  })
  const mutagen = { 禄: undefined, 权: undefined, 科: undefined, 忌: undefined } as ZiweiChart['mutagen']
  for (const p of palaces) for (const s of [...p.majorStars, ...p.minorStars]) if (s.mutagen) mutagen[s.mutagen as keyof typeof mutagen] = s.name
  return {
    gender: a.gender, solarDate: a.solarDate, lunarDate: a.lunarDate, chineseDate: a.chineseDate, time: a.time, timeRange: a.timeRange,
    sign: a.sign, zodiac: a.zodiac, soulBranch: a.earthlyBranchOfSoulPalace, bodyBranch: a.earthlyBranchOfBodyPalace,
    soul: a.soul, body: a.body, fiveElementsClass: a.fiveElementsClass, palaces, mutagen,
    decadals: a.decadalList(), astrolabe: a,
  }
}
