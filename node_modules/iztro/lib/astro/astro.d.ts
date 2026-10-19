import { Language, Option, Plugin } from '../data/types';
import { EarthlyBranchName, GenderName, HeavenlyStemName } from '../i18n';
import FunctionalAstrolabe from './FunctionalAstrolabe';
/**
 * 批量加载插件
 *
 * @version v2.3.0
 *
 * @param plugins 插件方法数组
 */
export declare const loadPlugins: (plugins: Plugin[]) => void;
/**
 * 加载单个插件
 *
 * @version v2.3.0
 *
 * @param plugin 插件方法
 */
export declare const loadPlugin: (plugin: Plugin) => void;
export { config, getConfig, resetConfig } from './config';
/**
 * 通过阳历获取星盘信息
 *
 * @deprecated 此方法已在`v2.0.5`废弃，请用 `bySolar` 方法替换，参数不变
 *
 * @param solarDateStr 阳历日期【YYYY-M-D】
 * @param timeIndex 出生时辰序号【0~12】
 * @param gender 性别【男|女】
 * @param fixLeap 是否调整闰月情况【默认 true】，假入调整闰月，则闰月的前半个月算上个月，后半个月算下个月
 * @param language 输出语言
 * @returns 星盘信息
 */
export declare function astrolabeBySolarDate<T extends FunctionalAstrolabe>(solarDateStr: string, timeIndex: number, gender: GenderName, fixLeap?: boolean, language?: Language): T;
/**
 * 通过阳历获取星盘信息
 *
 * @param solarDate 阳历日期【YYYY-M-D】
 * @param timeIndex 出生时辰序号【0~12】
 * @param gender 性别【男|女】
 * @param fixLeap 是否调整闰月情况【默认 true】，假入调整闰月，则闰月的前半个月算上个月，后半个月算下个月
 * @param language 输出语言
 * @returns 星盘信息
 */
export declare function bySolar<T extends FunctionalAstrolabe>(solarDate: string, timeIndex: number, gender: GenderName, fixLeap?: boolean, language?: Language): T;
/**
 * 通过农历获取星盘信息
 *
 * @deprecated 此方法已在`v2.0.5`废弃，请用 `byLunar` 方法替换，参数不变
 *
 * @param lunarDateStr 农历日期【YYYY-M-D】，例如2000年七月十七则传入 2000-7-17
 * @param timeIndex 出生时辰序号【0~12】
 * @param gender 性别【男|女】
 * @param isLeapMonth 是否闰月【默认 false】，当实际月份没有闰月时该参数不生效
 * @param fixLeap 是否调整闰月情况【默认 true】，假入调整闰月，则闰月的前半个月算上个月，后半个月算下个月
 * @param language 输出语言
 * @returns 星盘数据
 */
export declare function astrolabeByLunarDate<T extends FunctionalAstrolabe>(lunarDateStr: string, timeIndex: number, gender: GenderName, isLeapMonth?: boolean, fixLeap?: boolean, language?: Language): T;
/**
 * 通过农历获取星盘信息
 *
 * @param lunarDateStr 农历日期【YYYY-M-D】，例如2000年七月十七则传入 2000-7-17
 * @param timeIndex 出生时辰序号【0~12】
 * @param gender 性别【男|女】
 * @param isLeapMonth 是否闰月【默认 false】，当实际月份没有闰月时该参数不生效
 * @param fixLeap 是否调整闰月情况【默认 true】，假入调整闰月，则闰月的前半个月算上个月，后半个月算下个月
 * @param language 输出语言
 * @returns 星盘数据
 */
export declare function byLunar<T extends FunctionalAstrolabe>(lunarDateStr: string, timeIndex: number, gender: GenderName, isLeapMonth?: boolean, fixLeap?: boolean, language?: Language): T;
export declare function rearrangeAstrolable<T extends FunctionalAstrolabe>({ from, astrolable, option, }: {
    from: {
        heavenlyStem: HeavenlyStemName;
        earthlyBranch: EarthlyBranchName;
    };
    astrolable: T;
    option: Option;
}): T;
/**
 * 获取排盘信息。
 * config 只覆盖当前星盘，不改变全局默认配置。
 * 返回的星盘及其运限查询保留生成时的配置和语言。
 *
 * @param param0 排盘参数
 * @returns 星盘信息
 */
export declare function withOptions<T extends FunctionalAstrolabe>(option: Option): T;
/**
 * 通过公历获取十二生肖
 *
 * @version v1.2.1
 *
 * @param solarDateStr 阳历日期【YYYY-M-D】
 * @param language 输出语言，默认为中文
 * @returns 十二生肖
 */
export declare const getZodiacBySolarDate: (solarDateStr: string, language?: Language) => string;
/**
 * 通过阳历获取星座
 *
 * @version v1.2.1
 *
 * @param solarDateStr 阳历日期【YYYY-M-D】
 * @param language 输出语言，默认为中文
 * @returns 星座
 */
export declare const getSignBySolarDate: (solarDateStr: string, language?: Language) => string;
/**
 * 通过农历获取星座
 *
 * @version v1.2.1
 *
 * @param lunarDateStr 农历日期【YYYY-M-D】
 * @param isLeapMonth 是否闰月，如果该月没有闰月则此字段不生效
 * @param language 输出语言，默认为中文
 * @returns 星座
 */
export declare const getSignByLunarDate: (lunarDateStr: string, isLeapMonth?: boolean, language?: Language) => string;
/**
 * 通过阳历获取命宫主星
 *
 * @version v1.2.1
 *
 * @param solarDateStr 阳历日期【YYYY-M-D】
 * @param timeIndex 出生时辰序号【0~12】
 * @param fixLeap 是否调整闰月情况【默认 true】，假入调整闰月，则闰月的前半个月算上个月，后半个月算下个月
 * @param language 输出语言，默认为中文
 * @returns 命宫主星
 */
export declare const getMajorStarBySolarDate: (solarDateStr: string, timeIndex: number, fixLeap?: boolean, language?: Language) => string;
/**
 * 通过农历获取命宫主星
 *
 * @version v1.2.1
 *
 * @param lunarDateStr 农历日期【YYYY-M-D】，例如2000年七月十七则传入 2000-7-17
 * @param timeIndex 出生时辰序号【0~12】
 * @param isLeapMonth 是否闰月，如果该月没有闰月则此字段不生效
 * @param fixLeap 是否调整闰月情况【默认 true】，假入调整闰月，则闰月的前半个月算上个月，后半个月算下个月
 * @param language 输出语言，默认为中文
 * @returns 命宫主星
 */
export declare const getMajorStarByLunarDate: (lunarDateStr: string, timeIndex: number, isLeapMonth?: boolean, fixLeap?: boolean, language?: Language) => string;
