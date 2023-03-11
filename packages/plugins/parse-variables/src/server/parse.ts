import { isPlainObject, forEach, isString, isArray } from '@nocobase/utils';

/**
 * 根据上下文对象解析变量的值，例如：
 * ```js
 * const ctx = {
 *   abc: 123,
 * }
 *
 * // 下面的值将被解析为 123
 * parse('{{abc}}', ctx)
 * ```
 * @param str
 * @param ctx
 * @returns
 */
export const parse = (str: string, ctx: Record<string, any>) => {
  const regex = /{{(.*?)}}/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const [full, key] = match;
    const value = key.split('.').reduce((prev, next) => {
      return prev[next];
    }, ctx);
    str = str.replace(full, value);
  }
  return str;
};

/**
 * 遍历 filter 对象，解析其中的变量
 * @param filter
 * @param ctx
 * @returns
 */
export const parseFilter = (filter: Record<string, any>, ctx: Record<string, any>) => {
  if (!isPlainObject(filter) && !isArray(filter)) return;

  forEach(filter, (value, key) => {
    if (isString(value)) {
      filter[key] = parse(value, ctx);
      return;
    }
    parseFilter(value, ctx);
  });

  return filter;
};
