import { Config } from '../data/types';
import { BrightnessKey, HeavenlyStemKey, StarKey } from '../i18n';
type ResolvedConfig = {
    mutagens: Partial<Record<HeavenlyStemKey, StarKey[]>>;
    brightness: Partial<Record<StarKey, BrightnessKey[]>>;
} & Required<Omit<Config, 'mutagens' | 'brightness'>>;
/**
 * 获取配置的独立副本，修改返回值不会影响库。
 *
 * @version 2.3.0
 * @since 2.6.2 返回深拷贝
 * @returns 当前生效配置的独立副本
 */
export declare const getConfig: () => ResolvedConfig;
/**
 * 将配置恢复为出厂默认值，并清除自定义四化和亮度表。
 * 已经生成的星盘不受影响。
 *
 * @version 2.6.2
 */
export declare const resetConfig: () => void;
/**
 * 将单次排盘配置合并到当前配置，返回独立副本。
 *
 * @internal
 * @version 2.6.2
 * @param options 配置覆盖项
 * @param base 基础配置，默认使用当前生效配置
 */
export declare const resolveConfig: (options?: Config, base?: ResolvedConfig) => ResolvedConfig;
/**
 * 设置后续排盘的全局默认配置；不会修改已经生成的星盘。
 *
 * @version 2.3.0
 * @since 2.6.2 已有星盘保留生成时的配置
 * @param options 全局默认配置覆盖项
 */
export declare const config: (options: Config) => void;
/**
 * 在同步计算中使用指定配置，嵌套调用和异常退出时恢复上一层上下文。
 *
 * @internal
 * @version 2.6.2
 * @param snapshot 当前计算使用的配置
 * @param calculate 同步计算方法
 */
export declare const withConfig: <T>(snapshot: ResolvedConfig, calculate: () => T) => T;
export {};
