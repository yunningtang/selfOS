"use strict";
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
exports.bindContext = exports.registerContextClass = void 0;
var i18n_1 = require("../i18n");
var config_1 = require("./config");
var functionalPrototypes = new WeakSet();
/**
 * 注册需要绑定排盘上下文的功能类原型，不依赖压缩后的类名。
 *
 * @internal
 * @version 2.6.2
 * @param prototype 功能类的原型对象
 */
var registerContextClass = function (prototype) {
    functionalPrototypes.add(prototype);
};
exports.registerContextClass = registerContextClass;
/**
 * 将功能对象及其返回的功能对象绑定到生成时的配置和语言。
 *
 * @internal
 * @version 2.6.2
 * @param root 需要绑定上下文的功能对象
 * @returns 原功能对象
 */
var bindContext = function (root) {
    var config = (0, config_1.getConfig)();
    var language = (0, i18n_1.getLanguage)();
    var bound = new WeakSet();
    var wrapped = new WeakSet();
    var bind = function (value) {
        if (!value || typeof value !== 'object' || bound.has(value))
            return;
        if (Array.isArray(value)) {
            bound.add(value);
            value.forEach(bind);
            return;
        }
        var prototype = Object.getPrototypeOf(value);
        while (prototype && !functionalPrototypes.has(prototype))
            prototype = Object.getPrototypeOf(prototype);
        if (!prototype)
            return;
        bound.add(value);
        var object = value;
        var keys = new Set(__spreadArray(__spreadArray([], Object.keys(object), true), Object.getOwnPropertyNames(prototype), true));
        keys.forEach(function (key) {
            if (key === 'constructor' || key.startsWith('_') || key === 'plugins')
                return;
            var member = object[key];
            if (typeof member === 'function') {
                if (wrapped.has(member))
                    return;
                var method = function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    return (0, config_1.withConfig)(config, function () {
                        return (0, i18n_1.withLanguage)(language, function () {
                            var result = member.apply(value, args);
                            bind(result);
                            // 插件和重排可能新增方法或星曜。
                            bound.delete(value);
                            bind(value);
                            return result;
                        });
                    });
                };
                wrapped.add(method);
                object[key] = method;
            }
            else {
                bind(member);
            }
        });
    };
    bind(root);
    return root;
};
exports.bindContext = bindContext;
