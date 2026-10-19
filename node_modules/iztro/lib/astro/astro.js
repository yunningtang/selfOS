"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMajorStarByLunarDate = exports.getMajorStarBySolarDate = exports.getSignByLunarDate = exports.getSignBySolarDate = exports.getZodiacBySolarDate = exports.withOptions = exports.rearrangeAstrolable = exports.byLunar = exports.astrolabeByLunarDate = exports.bySolar = exports.astrolabeBySolarDate = exports.resetConfig = exports.getConfig = exports.config = exports.loadPlugin = exports.loadPlugins = void 0;
var lunar_lite_1 = require("lunar-lite");
var data_1 = require("../data");
var i18n_1 = require("../i18n");
var star_1 = require("../star");
var utils_1 = require("../utils");
var FunctionalAstrolabe_1 = __importDefault(require("./FunctionalAstrolabe"));
var FunctionalPalace_1 = __importDefault(require("./FunctionalPalace"));
var palace_1 = require("./palace");
var FunctionalStar_1 = __importDefault(require("../star/FunctionalStar"));
var config_1 = require("./config");
var context_1 = require("./context");
var validation_1 = require("../utils/validation");
var _plugins = [];
/**
 * 按当前排盘语言格式化农历日期。
 *
 * @internal
 * @version 2.6.2
 */
var formatLunarDate = function (lunarDate) {
    var language = (0, i18n_1.getLanguage)();
    if (language === 'zh-CN' || language === 'zh-TW') {
        return lunarDate.toString(true);
    }
    return (0, i18n_1.t)('lunarDate', {
        year: lunarDate.lunarYear,
        month: lunarDate.lunarMonth,
        day: lunarDate.lunarDay,
        leapMonth: lunarDate.isLeap ? (0, i18n_1.t)('leapMonth') : '',
    });
};
/**
 * 批量加载插件
 *
 * @version v2.3.0
 *
 * @param plugins 插件方法数组
 */
var loadPlugins = function (plugins) {
    Array.prototype.push.apply(_plugins, plugins);
};
exports.loadPlugins = loadPlugins;
/**
 * 加载单个插件
 *
 * @version v2.3.0
 *
 * @param plugin 插件方法
 */
var loadPlugin = function (plugin) {
    _plugins.push(plugin);
};
exports.loadPlugin = loadPlugin;
var config_2 = require("./config");
Object.defineProperty(exports, "config", { enumerable: true, get: function () { return config_2.config; } });
Object.defineProperty(exports, "getConfig", { enumerable: true, get: function () { return config_2.getConfig; } });
Object.defineProperty(exports, "resetConfig", { enumerable: true, get: function () { return config_2.resetConfig; } });
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
function astrolabeBySolarDate(solarDateStr, timeIndex, gender, fixLeap, language) {
    if (fixLeap === void 0) { fixLeap = true; }
    return bySolar(solarDateStr, timeIndex, gender, fixLeap, language);
}
exports.astrolabeBySolarDate = astrolabeBySolarDate;
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
function bySolar(solarDate, timeIndex, gender, fixLeap, language) {
    if (fixLeap === void 0) { fixLeap = true; }
    (0, validation_1.validateDate)(solarDate);
    (0, validation_1.validateTimeIndex)(timeIndex);
    (0, validation_1.validateGender)(gender);
    (0, validation_1.validateBoolean)(fixLeap, 'fixLeap');
    return (0, i18n_1.withLanguage)(language !== null && language !== void 0 ? language : 'zh-CN', function () {
        var palaces = [];
        var dayDivide = (0, config_1.getConfig)().dayDivide;
        var tIndex = timeIndex;
        if (dayDivide === 'current' && tIndex >= 12) {
            // 如果当前时辰为晚子时并且晚子时算当天时，将时辰调整为当日早子时
            tIndex = 0;
        }
        var yearly = (0, lunar_lite_1.getHeavenlyStemAndEarthlyBranchBySolarDate)(solarDate, tIndex, {
            year: (0, config_1.getConfig)().yearDivide,
            month: (0, config_1.getConfig)().horoscopeDivide,
        }).yearly;
        var earthlyBranchOfYear = (0, i18n_1.kot)(yearly[1], 'Earthly');
        var heavenlyStemOfYear = (0, i18n_1.kot)(yearly[0], 'Heavenly');
        var _a = (0, palace_1.getSoulAndBody)({
            solarDate: solarDate,
            timeIndex: tIndex,
            fixLeap: fixLeap,
        }), bodyIndex = _a.bodyIndex, soulIndex = _a.soulIndex, heavenlyStemOfSoul = _a.heavenlyStemOfSoul, earthlyBranchOfSoul = _a.earthlyBranchOfSoul;
        var palaceNames = (0, palace_1.getPalaceNames)(soulIndex);
        var majorStars = (0, star_1.getMajorStar)({ solarDate: solarDate, timeIndex: tIndex, fixLeap: fixLeap });
        var minorStars = (0, star_1.getMinorStar)(solarDate, tIndex, fixLeap);
        var adjectiveStars = (0, star_1.getAdjectiveStar)({
            solarDate: solarDate,
            timeIndex: tIndex,
            gender: gender,
            fixLeap: fixLeap,
        });
        var changsheng12 = (0, star_1.getchangsheng12)({
            solarDate: solarDate,
            timeIndex: tIndex,
            gender: gender,
            fixLeap: fixLeap,
        });
        var boshi12 = (0, star_1.getBoShi12)(solarDate, gender);
        var _b = (0, star_1.getYearly12)(solarDate), jiangqian12 = _b.jiangqian12, suiqian12 = _b.suiqian12;
        var _c = (0, palace_1.getHoroscope)({ solarDate: solarDate, timeIndex: tIndex, gender: gender, fixLeap: fixLeap }), decadals = _c.decadals, ages = _c.ages;
        for (var i = 0; i < 12; i++) {
            var heavenlyStemOfPalace = data_1.HEAVENLY_STEMS[(0, utils_1.fixIndex)(data_1.HEAVENLY_STEMS.indexOf((0, i18n_1.kot)(heavenlyStemOfSoul, 'Heavenly')) - soulIndex + i, 10)];
            var earthlyBranchOfPalace = data_1.EARTHLY_BRANCHES[(0, utils_1.fixIndex)(2 + i)];
            palaces.push(new FunctionalPalace_1.default({
                index: i,
                name: palaceNames[i],
                isBodyPalace: bodyIndex === i,
                isOriginalPalace: !['ziEarthly', 'chouEarthly'].includes(earthlyBranchOfPalace) &&
                    heavenlyStemOfPalace === heavenlyStemOfYear,
                heavenlyStem: (0, i18n_1.t)(heavenlyStemOfPalace),
                earthlyBranch: (0, i18n_1.t)(earthlyBranchOfPalace),
                majorStars: majorStars[i],
                minorStars: minorStars[i],
                adjectiveStars: adjectiveStars[i],
                changsheng12: changsheng12[i],
                boshi12: boshi12[i],
                jiangqian12: jiangqian12[i],
                suiqian12: suiqian12[i],
                decadal: decadals[i],
                ages: ages[i],
            }));
        }
        // 宫位是从寅宫开始，而寅的索引是2，所以需要+2
        var earthlyBranchOfSoulPalace = data_1.EARTHLY_BRANCHES[(0, utils_1.fixIndex)(soulIndex + 2)];
        var earthlyBranchOfBodyPalace = (0, i18n_1.t)(data_1.EARTHLY_BRANCHES[(0, utils_1.fixIndex)(bodyIndex + 2)]);
        var chineseDate = (0, lunar_lite_1.getHeavenlyStemAndEarthlyBranchBySolarDate)(solarDate, tIndex, {
            year: (0, config_1.getConfig)().yearDivide,
            month: (0, config_1.getConfig)().horoscopeDivide,
        });
        var lunarDate = (0, lunar_lite_1.solar2lunar)(solarDate);
        // 中州派地支以年支找命主
        // 通用派别以命宫地支找命主
        var soul = (0, i18n_1.t)(data_1.earthlyBranches[(0, config_1.getConfig)().algorithm === 'zhongzhou' ? earthlyBranchOfYear : earthlyBranchOfSoulPalace].soul);
        var result = new FunctionalAstrolabe_1.default({
            gender: (0, i18n_1.t)((0, i18n_1.kot)(gender)),
            solarDate: solarDate,
            lunarDate: formatLunarDate(lunarDate),
            chineseDate: (0, utils_1.translateChineseDate)(chineseDate),
            rawDates: { lunarDate: lunarDate, chineseDate: chineseDate },
            time: (0, i18n_1.t)(data_1.CHINESE_TIME[timeIndex]),
            timeRange: data_1.TIME_RANGE[timeIndex],
            sign: (0, exports.getSignBySolarDate)(solarDate, language),
            zodiac: (0, exports.getZodiacBySolarDate)(solarDate, language),
            earthlyBranchOfSoulPalace: (0, i18n_1.t)(earthlyBranchOfSoulPalace),
            earthlyBranchOfBodyPalace: earthlyBranchOfBodyPalace,
            soul: soul,
            body: (0, i18n_1.t)(data_1.earthlyBranches[earthlyBranchOfYear].body),
            fiveElementsClass: (0, palace_1.getFiveElementsClass)(heavenlyStemOfSoul, earthlyBranchOfSoul),
            palaces: palaces,
            copyright: "copyright \u00A9 2023-".concat(new Date().getFullYear(), " iztro (https://github.com/SylarLong/iztro)"),
        });
        (0, context_1.bindContext)(result);
        _plugins.map(function (plugin) { return result.use(plugin); });
        return result;
    });
}
exports.bySolar = bySolar;
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
function astrolabeByLunarDate(lunarDateStr, timeIndex, gender, isLeapMonth, fixLeap, language) {
    if (isLeapMonth === void 0) { isLeapMonth = false; }
    if (fixLeap === void 0) { fixLeap = true; }
    return byLunar(lunarDateStr, timeIndex, gender, isLeapMonth, fixLeap, language);
}
exports.astrolabeByLunarDate = astrolabeByLunarDate;
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
function byLunar(lunarDateStr, timeIndex, gender, isLeapMonth, fixLeap, language) {
    if (isLeapMonth === void 0) { isLeapMonth = false; }
    if (fixLeap === void 0) { fixLeap = true; }
    (0, validation_1.validateDate)(lunarDateStr, 'lunar', isLeapMonth);
    (0, validation_1.validateTimeIndex)(timeIndex);
    (0, validation_1.validateGender)(gender);
    (0, validation_1.validateBoolean)(isLeapMonth, 'isLeapMonth');
    (0, validation_1.validateBoolean)(fixLeap, 'fixLeap');
    var solarDate = (0, lunar_lite_1.lunar2solar)(lunarDateStr, isLeapMonth);
    return bySolar(solarDate.toString(), timeIndex, gender, fixLeap, language);
}
exports.byLunar = byLunar;
function rearrangeAstrolable(_a) {
    var from = _a.from, astrolable = _a.astrolable, option = _a.option;
    var timeIndex = option.timeIndex, fixLeap = option.fixLeap;
    var dayDivide = (0, config_1.getConfig)().dayDivide;
    var tIndex = timeIndex;
    if (dayDivide === 'current' && tIndex >= 12) {
        // 如果当前时辰为晚子时并且晚子时算当天时，将时辰调整为当日早子时
        tIndex = 0;
    }
    // 以传入地支为命宫
    var _b = (0, palace_1.getSoulAndBody)({
        solarDate: astrolable.solarDate,
        timeIndex: tIndex,
        fixLeap: fixLeap,
        from: from,
    }), soulIndex = _b.soulIndex, bodyIndex = _b.bodyIndex;
    var fiveElementsClass = (0, palace_1.getFiveElementsClass)(from.heavenlyStem, from.earthlyBranch);
    var palaceNames = (0, palace_1.getPalaceNames)(soulIndex);
    var majorStars = (0, star_1.getMajorStar)({ solarDate: astrolable.solarDate, timeIndex: tIndex, fixLeap: fixLeap, from: from });
    var changsheng12 = (0, star_1.getchangsheng12)({
        solarDate: astrolable.solarDate,
        gender: astrolable.gender,
        timeIndex: tIndex,
        fixLeap: fixLeap,
        from: from,
    });
    var _c = (0, palace_1.getHoroscope)({
        solarDate: astrolable.solarDate,
        timeIndex: tIndex,
        gender: astrolable.gender,
        fixLeap: fixLeap,
        from: from,
    }), decadals = _c.decadals, ages = _c.ages;
    astrolable.fiveElementsClass = fiveElementsClass;
    // 重新获取天使、天伤的索引
    var _d = (0, star_1.getTianshiTianshangIndex)(astrolable.gender, (0, i18n_1.kot)(astrolable.rawDates.chineseDate.yearly[1]), soulIndex), tianshiIndex = _d.tianshiIndex, tianshangIndex = _d.tianshangIndex;
    // 重新获取天才星的位置
    var tiancaiIndex = (0, utils_1.fixIndex)(soulIndex + data_1.EARTHLY_BRANCHES.indexOf((0, i18n_1.kot)(astrolable.rawDates.chineseDate.yearly[1])));
    astrolable.palaces.forEach(function (palace, i) {
        var _tianshangIdx = palace.adjectiveStars.findIndex(function (item) { return (0, i18n_1.kot)(item.name) === 'tianshang'; });
        if (_tianshangIdx !== -1 && tianshangIndex !== i) {
            // 当天伤不应该在该宫位时，删之
            palace.adjectiveStars.splice(_tianshangIdx, 1);
        }
        if (_tianshangIdx === -1 && tianshangIndex === i) {
            // 当天伤应该在该宫位却不在，加之
            palace.adjectiveStars.push(new FunctionalStar_1.default({ name: (0, i18n_1.t)('tianshang'), type: 'adjective', scope: 'origin' }));
        }
        var _tianshiIdx = palace.adjectiveStars.findIndex(function (item) { return (0, i18n_1.kot)(item.name) === 'tianshi'; });
        if (_tianshiIdx !== -1 && tianshiIndex !== i) {
            // 当天使不应该在该宫位时，删之
            palace.adjectiveStars.splice(_tianshiIdx, 1);
        }
        if (_tianshiIdx === -1 && tianshiIndex === i) {
            // 当天使应该在该宫位却不在，加之
            palace.adjectiveStars.push(new FunctionalStar_1.default({ name: (0, i18n_1.t)('tianshi'), type: 'adjective', scope: 'origin' }));
        }
        var _tiancaiIndex = palace.adjectiveStars.findIndex(function (item) { return (0, i18n_1.kot)(item.name) === 'tiancai'; });
        if (_tiancaiIndex !== -1 && tiancaiIndex !== i) {
            // 当天才不应该在该宫位时，删之
            palace.adjectiveStars.splice(_tiancaiIndex, 1);
        }
        if (_tiancaiIndex === -1 && tiancaiIndex === i) {
            // 当天才应该在该宫位却不在，加之
            palace.adjectiveStars.push(new FunctionalStar_1.default({ name: (0, i18n_1.t)('tiancai'), type: 'adjective', scope: 'origin' }));
        }
        palace.name = palaceNames[i];
        palace.majorStars = majorStars[i];
        palace.changsheng12 = changsheng12[i];
        palace.decadal = decadals[i];
        palace.ages = ages[i];
        palace.isBodyPalace = bodyIndex === i;
    });
    astrolable.earthlyBranchOfSoulPalace = (0, i18n_1.t)(astrolable.palace('命宫').earthlyBranch);
    return astrolable;
}
exports.rearrangeAstrolable = rearrangeAstrolable;
/**
 * 获取排盘信息。
 * config 只覆盖当前星盘，不改变全局默认配置。
 * 返回的星盘及其运限查询保留生成时的配置和语言。
 *
 * @param param0 排盘参数
 * @returns 星盘信息
 */
function withOptions(option) {
    var _a = option.type, type = _a === void 0 ? 'solar' : _a, dateStr = option.dateStr, timeIndex = option.timeIndex, gender = option.gender, isLeapMonth = option.isLeapMonth, fixLeap = option.fixLeap, language = option.language, astroType = option.astroType, cfg = option.config;
    if (!['solar', 'lunar'].includes(type))
        throw new Error('invalid date type.');
    if (astroType !== undefined && !['heaven', 'earth', 'human'].includes(astroType))
        throw new Error('invalid astroType.');
    return (0, config_1.withConfig)((0, config_1.resolveConfig)(cfg), function () {
        return (0, i18n_1.withLanguage)(language !== null && language !== void 0 ? language : 'zh-CN', function () {
            var result;
            if (type === 'solar') {
                result = bySolar(dateStr, timeIndex, gender, fixLeap, language);
            }
            else {
                result = byLunar(dateStr, timeIndex, gender, isLeapMonth, fixLeap, language);
            }
            switch (astroType) {
                case 'earth': {
                    // 以身宫干支起五行局重排，身宫为命宫
                    var bodyPalace = result.palace('身宫');
                    var _a = bodyPalace, heavenlyStem = _a.heavenlyStem, earthlyBranch = _a.earthlyBranch;
                    return rearrangeAstrolable({ from: { heavenlyStem: heavenlyStem, earthlyBranch: earthlyBranch }, astrolable: result, option: option });
                }
                case 'human': {
                    // 以福德宫干支起五行局重排，福德宫为命宫
                    var bodyPalace = result.palace('福德');
                    var _b = bodyPalace, heavenlyStem = _b.heavenlyStem, earthlyBranch = _b.earthlyBranch;
                    return rearrangeAstrolable({ from: { heavenlyStem: heavenlyStem, earthlyBranch: earthlyBranch }, astrolable: result, option: option });
                }
                default: {
                    // 直接返回天盘
                    return result;
                }
            }
        });
    });
}
exports.withOptions = withOptions;
/**
 * 通过公历获取十二生肖
 *
 * @version v1.2.1
 *
 * @param solarDateStr 阳历日期【YYYY-M-D】
 * @param language 输出语言，默认为中文
 * @returns 十二生肖
 */
var getZodiacBySolarDate = function (solarDateStr, language) {
    (0, validation_1.validateDate)(solarDateStr);
    return (0, i18n_1.withLanguage)(language !== null && language !== void 0 ? language : 'zh-CN', function () {
        var yearly = (0, lunar_lite_1.getHeavenlyStemAndEarthlyBranchBySolarDate)(solarDateStr, 0, {
            year: (0, config_1.getConfig)().yearDivide,
        }).yearly;
        return (0, i18n_1.t)((0, i18n_1.kot)((0, lunar_lite_1.getZodiac)(yearly[1])));
    });
};
exports.getZodiacBySolarDate = getZodiacBySolarDate;
/**
 * 通过阳历获取星座
 *
 * @version v1.2.1
 *
 * @param solarDateStr 阳历日期【YYYY-M-D】
 * @param language 输出语言，默认为中文
 * @returns 星座
 */
var getSignBySolarDate = function (solarDateStr, language) {
    (0, validation_1.validateDate)(solarDateStr);
    return (0, i18n_1.withLanguage)(language !== null && language !== void 0 ? language : 'zh-CN', function () {
        return (0, i18n_1.t)((0, i18n_1.kot)((0, lunar_lite_1.getSign)(solarDateStr)));
    });
};
exports.getSignBySolarDate = getSignBySolarDate;
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
var getSignByLunarDate = function (lunarDateStr, isLeapMonth, language) {
    (0, validation_1.validateDate)(lunarDateStr, 'lunar', isLeapMonth);
    if (isLeapMonth !== undefined)
        (0, validation_1.validateBoolean)(isLeapMonth, 'isLeapMonth');
    return (0, i18n_1.withLanguage)(language !== null && language !== void 0 ? language : 'zh-CN', function () {
        var solarDate = (0, lunar_lite_1.lunar2solar)(lunarDateStr, isLeapMonth);
        return (0, exports.getSignBySolarDate)(solarDate.toString(), language);
    });
};
exports.getSignByLunarDate = getSignByLunarDate;
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
var getMajorStarBySolarDate = function (solarDateStr, timeIndex, fixLeap, language) {
    if (fixLeap === void 0) { fixLeap = true; }
    (0, validation_1.validateDate)(solarDateStr);
    (0, validation_1.validateTimeIndex)(timeIndex);
    (0, validation_1.validateBoolean)(fixLeap, 'fixLeap');
    return (0, i18n_1.withLanguage)(language !== null && language !== void 0 ? language : 'zh-CN', function () {
        var soulIndex = (0, palace_1.getSoulAndBody)({ solarDate: solarDateStr, timeIndex: timeIndex, fixLeap: fixLeap }).soulIndex;
        var majorStars = (0, star_1.getMajorStar)({ solarDate: solarDateStr, timeIndex: timeIndex, fixLeap: fixLeap });
        var stars = majorStars[soulIndex].filter(function (star) { return star.type === 'major'; });
        if (stars.length) {
            return stars.map(function (star) { return (0, i18n_1.t)(star.name); }).join(',');
        }
        // 如果命宫为空宫，则借对宫主星
        return majorStars[(0, utils_1.fixIndex)(soulIndex + 6)]
            .filter(function (star) { return star.type === 'major'; })
            .map(function (star) { return (0, i18n_1.t)(star.name); })
            .join(',');
    });
};
exports.getMajorStarBySolarDate = getMajorStarBySolarDate;
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
var getMajorStarByLunarDate = function (lunarDateStr, timeIndex, isLeapMonth, fixLeap, language) {
    if (isLeapMonth === void 0) { isLeapMonth = false; }
    if (fixLeap === void 0) { fixLeap = true; }
    (0, validation_1.validateDate)(lunarDateStr, 'lunar', isLeapMonth);
    (0, validation_1.validateBoolean)(isLeapMonth, 'isLeapMonth');
    var solarDate = (0, lunar_lite_1.lunar2solar)(lunarDateStr, isLeapMonth);
    return (0, exports.getMajorStarBySolarDate)(solarDate.toString(), timeIndex, fixLeap, language);
};
exports.getMajorStarByLunarDate = getMajorStarByLunarDate;
