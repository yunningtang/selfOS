/**
 * 校验公历/农历 1～9999 年的真实日期，不接受自动滚动到下个月的无效日期。
 *
 * @internal
 * @version 2.6.2
 * @param date 待校验的日期
 * @param type 日期类型，默认为阳历
 * @param isLeapMonth 是否为农历闰月
 */
export declare const validateDate: (date: string | Date, type?: 'solar' | 'lunar', isLeapMonth?: boolean) => void;
/**
 * 校验时辰为 0～12 的整数。
 *
 * @internal
 * @version 2.6.2
 */
export declare const validateTimeIndex: (index: number) => void;
/**
 * 校验已支持语言中的有效性别。
 *
 * @internal
 * @version 2.6.2
 */
export declare const validateGender: (gender: string) => void;
/**
 * 校验布尔选项，不进行隐式类型转换。
 *
 * @internal
 * @version 2.6.2
 */
export declare const validateBoolean: (value: boolean, name: string) => void;
