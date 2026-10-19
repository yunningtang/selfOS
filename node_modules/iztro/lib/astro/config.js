"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withConfig = exports.config = exports.resolveConfig = exports.resetConfig = exports.getConfig = void 0;
var i18n_1 = require("../i18n");
/**
 * 创建默认配置。
 * @internal
 * @version 2.6.2
 */
var defaults = function () { return ({
    mutagens: {},
    brightness: {},
    yearDivide: 'normal',
    horoscopeDivide: 'normal',
    ageDivide: 'normal',
    dayDivide: 'forward',
    algorithm: 'default',
}); };
/**
 * 复制配置表及其数组。
 * @internal
 * @version 2.6.2
 */
var cloneTable = function (table) {
    var result = {};
    Object.entries(table).forEach(function (_a) {
        var key = _a[0], values = _a[1];
        if (values)
            result[key] = __spreadArray([], values, true);
    });
    return result;
};
/**
 * 创建完整配置的独立副本。
 * @internal
 * @version 2.6.2
 */
var clone = function (value) { return (__assign(__assign({}, value), { mutagens: cloneTable(value.mutagens), brightness: cloneTable(value.brightness) })); };
var globalConfig = defaults();
var activeConfig;
/**
 * 获取配置的独立副本，修改返回值不会影响库。
 *
 * @version 2.3.0
 * @since 2.6.2 返回深拷贝
 * @returns 当前生效配置的独立副本
 */
var getConfig = function () { return clone(activeConfig !== null && activeConfig !== void 0 ? activeConfig : globalConfig); };
exports.getConfig = getConfig;
/**
 * 将配置恢复为出厂默认值，并清除自定义四化和亮度表。
 * 已经生成的星盘不受影响。
 *
 * @version 2.6.2
 */
var resetConfig = function () {
    globalConfig = defaults();
};
exports.resetConfig = resetConfig;
/**
 * 将单次排盘配置合并到当前配置，返回独立副本。
 *
 * @internal
 * @version 2.6.2
 * @param options 配置覆盖项
 * @param base 基础配置，默认使用当前生效配置
 */
var resolveConfig = function (options, base) {
    if (options === void 0) { options = {}; }
    if (base === void 0) { base = activeConfig !== null && activeConfig !== void 0 ? activeConfig : globalConfig; }
    var result = clone(base);
    var choices = {
        yearDivide: ['normal', 'exact'],
        horoscopeDivide: ['normal', 'exact'],
        ageDivide: ['normal', 'birthday'],
        dayDivide: ['current', 'forward'],
        algorithm: ['default', 'zhongzhou'],
    };
    Object.keys(choices).forEach(function (key) {
        var _a;
        var value = options[key];
        if (value !== undefined) {
            if (!choices[key].includes(value))
                throw new Error("invalid ".concat(key, "."));
            Object.assign(result, (_a = {}, _a[key] = value, _a));
        }
    });
    if (options.mutagens) {
        Object.entries(options.mutagens).forEach(function (_a) {
            var key = _a[0], stars = _a[1];
            result.mutagens[(0, i18n_1.kot)(key)] = stars.map(function (star) { return (0, i18n_1.kot)(star); });
        });
    }
    if (options.brightness) {
        Object.entries(options.brightness).forEach(function (_a) {
            var key = _a[0], levels = _a[1];
            result.brightness[(0, i18n_1.kot)(key)] = levels.map(function (level) { return (0, i18n_1.kot)(level); });
        });
    }
    return result;
};
exports.resolveConfig = resolveConfig;
/**
 * 设置后续排盘的全局默认配置；不会修改已经生成的星盘。
 *
 * @version 2.3.0
 * @since 2.6.2 已有星盘保留生成时的配置
 * @param options 全局默认配置覆盖项
 */
var config = function (options) {
    globalConfig = (0, exports.resolveConfig)(options, globalConfig);
};
exports.config = config;
/**
 * 在同步计算中使用指定配置，嵌套调用和异常退出时恢复上一层上下文。
 *
 * @internal
 * @version 2.6.2
 * @param snapshot 当前计算使用的配置
 * @param calculate 同步计算方法
 */
var withConfig = function (snapshot, calculate) {
    var previous = activeConfig;
    activeConfig = snapshot;
    try {
        return calculate();
    }
    finally {
        activeConfig = previous;
    }
};
exports.withConfig = withConfig;
