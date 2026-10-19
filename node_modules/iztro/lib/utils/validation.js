"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBoolean = exports.validateGender = exports.validateTimeIndex = exports.validateDate = void 0;
var lunar_typescript_1 = require("lunar-typescript");
var i18n_1 = require("../i18n");
/**
 * 校验公历/农历 1～9999 年的真实日期，不接受自动滚动到下个月的无效日期。
 *
 * @internal
 * @version 2.6.2
 * @param date 待校验的日期
 * @param type 日期类型，默认为阳历
 * @param isLeapMonth 是否为农历闰月
 */
var validateDate = function (date, type, isLeapMonth) {
    if (type === void 0) { type = 'solar'; }
    if (isLeapMonth === void 0) { isLeapMonth = false; }
    var parts;
    if (date instanceof Date) {
        if (!Number.isFinite(date.getTime()))
            throw new Error('invalid date.');
        parts = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
    }
    else {
        if (typeof date !== 'string' || !/^\d{1,4}([-/.])\d{1,2}\1\d{1,2}(?: \d{1,2}:\d{1,2}(?::\d{1,2})?)?$/.test(date)) {
            throw new Error('invalid date.');
        }
        var _a = date.split(' '), day_1 = _a[0], time = _a[1];
        parts = day_1.split(/[-/.]/).map(Number);
        if (time) {
            var _b = time.split(':').map(Number), hour = _b[0], minute = _b[1], _c = _b[2], second = _c === void 0 ? 0 : _c;
            if (hour > 23 || minute > 59 || second > 59)
                throw new Error('invalid time.');
        }
    }
    var year = parts[0], month = parts[1], day = parts[2];
    if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1)
        throw new Error('invalid date.');
    if (type === 'lunar') {
        var lunarYear = lunar_typescript_1.LunarYear.fromYear(year);
        var leap = isLeapMonth && lunarYear.getLeapMonth() === month;
        var lunarMonth = lunarYear.getMonth(leap ? -month : month);
        if (!lunarMonth || day > lunarMonth.getDayCount())
            throw new Error('invalid lunar date.');
    }
    else {
        // 与底层历法一致：历史日期使用儒略历/格里历切换规则。
        if (year === 1582 && month === 10 && day >= 5 && day <= 14)
            throw new Error('invalid solar date.');
        var leap = lunar_typescript_1.SolarUtil.isLeapYear(year);
        var days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (day > days[month - 1])
            throw new Error('invalid solar date.');
    }
};
exports.validateDate = validateDate;
/**
 * 校验时辰为 0～12 的整数。
 *
 * @internal
 * @version 2.6.2
 */
var validateTimeIndex = function (index) {
    if (!Number.isInteger(index) || index < 0 || index > 12)
        throw new Error('invalid timeIndex: expected an integer from 0 to 12.');
};
exports.validateTimeIndex = validateTimeIndex;
/**
 * 校验已支持语言中的有效性别。
 *
 * @internal
 * @version 2.6.2
 */
var validateGender = function (gender) {
    if (typeof gender !== 'string' || !['male', 'female'].includes((0, i18n_1.kot)(gender)))
        throw new Error('invalid gender.');
};
exports.validateGender = validateGender;
/**
 * 校验布尔选项，不进行隐式类型转换。
 *
 * @internal
 * @version 2.6.2
 */
var validateBoolean = function (value, name) {
    if (typeof value !== 'boolean')
        throw new Error("invalid ".concat(name, ": expected a boolean."));
};
exports.validateBoolean = validateBoolean;
