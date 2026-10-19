/**
 * 注册需要绑定排盘上下文的功能类原型，不依赖压缩后的类名。
 *
 * @internal
 * @version 2.6.2
 * @param prototype 功能类的原型对象
 */
export declare const registerContextClass: (prototype: object) => void;
/**
 * 将功能对象及其返回的功能对象绑定到生成时的配置和语言。
 *
 * @internal
 * @version 2.6.2
 * @param root 需要绑定上下文的功能对象
 * @returns 原功能对象
 */
export declare const bindContext: <T extends object>(root: T) => T;
