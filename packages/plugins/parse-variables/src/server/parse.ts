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
 * @param template
 * @param context
 * @returns
 */
export const parse = (template: string, context: Record<string, any>): string | any[] => {
  const regex = /\{\{(.+?)\}\}/g;
  const matches = [...template.matchAll(regex)];
  if (matches.length === 0) {
    return template;
  }

  let result: string | any[] = template;

  for (const match of matches) {
    const [, variable] = match;
    const value = getValueFromContext(context, variable);
    result = value;
  }

  return result;
};

export const getValueFromContext = (context: Record<string, any>, variable: string): any => {
  const parts = variable.split('.');
  let value = context;
  for (const part of parts) {
    value = value[part];
    if (value === undefined) {
      throw new Error(`Could not find value for variable ${variable}`);
    }
  }
  return value;
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
