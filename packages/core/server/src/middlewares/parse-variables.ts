import { isPlainObject, forEach, isString, isArray } from '@nocobase/utils';
import moment from 'moment';
import { toGmt } from '@nocobase/utils';
import { ResourcerContext } from '@nocobase/resourcer';

/**
 * 解析变量所需的上下文
 * @returns
 */
export const getContext = (ctx?: ResourcerContext) => {
  const currentUser = ctx?.state.currentUser;

  return {
    $system: {
      now: toGmt(moment()) as string,
    },
    $date: {
      today: [toGmt(moment()), toGmt(moment())] as string[],
      lastWeek: [
        toGmt(moment().subtract(1, 'week').startOf('week')),
        toGmt(moment().subtract(1, 'week').endOf('week')),
      ] as string[],
      thisWeek: [toGmt(moment().startOf('week')), toGmt(moment().endOf('week'))] as string[],
      nextWeek: [
        toGmt(moment().add(1, 'week').startOf('week')),
        toGmt(moment().add(1, 'week').endOf('week')),
      ] as string[],
      lastMonth: [
        toGmt(moment().subtract(1, 'month').startOf('month')),
        toGmt(moment().subtract(1, 'month').endOf('month')),
      ] as string[],
      thisMonth: [toGmt(moment().startOf('month')), toGmt(moment().endOf('month'))] as string[],
      nextMonth: [
        toGmt(moment().add(1, 'month').startOf('month')),
        toGmt(moment().add(1, 'month').endOf('month')),
      ] as string[],
      lastYear: [
        toGmt(moment().subtract(1, 'year').startOf('year')),
        toGmt(moment().subtract(1, 'year').endOf('year')),
      ] as string[],
      thisYear: [toGmt(moment().startOf('year')), toGmt(moment().endOf('year'))] as string[],
      nextYear: [
        toGmt(moment().add(1, 'year').startOf('year')),
        toGmt(moment().add(1, 'year').endOf('year')),
      ] as string[],
      last7Days: [toGmt(moment().subtract(7, 'days')), toGmt(moment())] as string[],
      next7Days: [toGmt(moment()), toGmt(moment().add(7, 'days'))] as string[],
      last30Days: [toGmt(moment().subtract(30, 'days')), toGmt(moment())] as string[],
      next30Days: [toGmt(moment()), toGmt(moment().add(30, 'days'))] as string[],
      last90Days: [toGmt(moment().subtract(90, 'days')), toGmt(moment())] as string[],
      next90Days: [toGmt(moment()), toGmt(moment().add(90, 'days'))] as string[],
    },
    $user: currentUser || {},
  };
};

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

export const parseVariables = async (ctx, next) => {
  const filter = ctx.action.params.filter || {};
  parseFilter(filter, getContext(ctx));
  await next();
};
