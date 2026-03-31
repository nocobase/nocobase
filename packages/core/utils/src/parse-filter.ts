/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import set from 'lodash/set';
import moment from 'moment';
import { offsetFromString } from './date';
import { dayjs } from './dayjs';
import { getValuesByPath } from './getValuesByPath';
import { getDayRangeByParams } from './dateRangeUtils';

const re = /^\s*\{\{([\s\S]*)\}\}\s*$/;

function isBuffer(obj) {
  return obj && obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
}

function keyIdentity(key) {
  return key;
}

export function flatten(target, opts?: any) {
  opts = opts || {};

  const delimiter = opts.delimiter || '.';
  const maxDepth = opts.maxDepth;
  const transformKey = opts.transformKey || keyIdentity;
  const transformValue = opts.transformValue || keyIdentity;
  const output = {};

  function step(object, prev?: any, currentDepth?: any) {
    currentDepth = currentDepth || 1;
    if (_.isObjectLike(object)) {
      Object.keys(object).forEach(function (key) {
        const value = object[key];
        const isarray = opts.safe && Array.isArray(value);
        const type = Object.prototype.toString.call(value);
        const isbuffer = isBuffer(value);
        const isobject = type === '[object Object]' || type === '[object Array]';

        const newKey = prev ? prev + delimiter + transformKey(key) : transformKey(key);

        if (opts.breakOn?.({ key, value, path: newKey })) {
          output[newKey] = transformValue(value, newKey);
          return;
        }

        if (
          !isarray &&
          !isbuffer &&
          isobject &&
          Object.keys(value).length &&
          (!opts.maxDepth || currentDepth < maxDepth)
        ) {
          return step(value, newKey, currentDepth + 1);
        }

        output[newKey] = transformValue(value, newKey);
      });
    }
  }

  step(target);

  return output;
}

export function unflatten(obj, opts: any = {}) {
  const parsed = {};
  const transformValue = opts.transformValue || keyIdentity;
  for (const key of Object.keys(obj)) {
    set(parsed, key, transformValue(obj[key], key));
  }
  return parsed;
}

const parsePath = (path: string) => {
  let operator = path.split('.').pop() || '';
  if (!operator.startsWith('$')) {
    operator = '';
  }
  return { operator };
};

const isDateOperator = (op) => {
  return [
    '$dateOn',
    '$dateNotOn',
    '$dateBefore',
    '$dateAfter',
    '$dateNotBefore',
    '$dateNotAfter',
    '$dateBetween',
  ].includes(op);
};

function isDate(input) {
  return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
}

const dateValueWrapper = (value: any, timezone?: string) => {
  if (!value) {
    return null;
  }
  if (value.type) {
    value = getDayRangeByParams({ ...value, timezone });
  }
  if (Array.isArray(value)) {
    if (value.length === 2) {
      value.push('[]', timezone);
    } else if (value.length === 3) {
      value.push(timezone);
    }
    return value;
  }

  if (typeof value === 'string') {
    if (!timezone || /(\+|-)\d\d:\d\d$/.test(value)) {
      return value;
    }
    return value + timezone;
  }

  if (isDate(value)) {
    return value.toISOString();
  }
};

export type ParseFilterOptions = {
  vars?: Record<string, any>;
  now?: any;
  timezone?: string;
  getField?: any;
};

export const parseFilter = async (filter: any, opts: ParseFilterOptions = {}) => {
  const userFieldsSet = new Set();
  const vars = opts.vars || {};
  const timezone = opts.timezone;
  const now = opts.now;
  const getField = opts.getField;

  const flat = flatten(filter, {
    breakOn({ key }) {
      return key.startsWith('$') && key !== '$and' && key !== '$or';
    },
    transformValue(value) {
      if (typeof value !== 'string') {
        return value;
      }
      // parse user fields parameter
      const match = re.exec(value);
      if (match) {
        const key = match[1].trim();
        if (key.startsWith('$user')) {
          userFieldsSet.add(key.substring(6));
        }
      }
      return value;
    },
  });

  if (userFieldsSet.size > 0) {
    const $user = await vars.$user({ fields: [...userFieldsSet.values()] });
    Object.assign(vars, { $user });
  }

  return unflatten(flat, {
    transformValue(value, path) {
      const { operator } = parsePath(path);
      // parse string variables
      if (typeof value === 'string') {
        const match = re.exec(value);
        if (match) {
          const key = match[1].trim();
          const val = getValuesByPath(vars, key, null);
          const field = getField?.(path);
          value = typeof val === 'function' ? val?.({ field, operator, timezone, now }) : val;
        }
      }
      if (isDateOperator(operator)) {
        const field = getField?.(path);

        if (field?.constructor.name === 'DateOnlyField' || field?.constructor.name === 'DatetimeNoTzField') {
          if (value.type) {
            return getDayRangeByParams({ ...value, timezone: field?.timezone || timezone });
          }
          return value;
        }
        return dateValueWrapper(value, field?.timezone || timezone);
      }
      return value;
    },
  });
};

export type GetDayRangeOptions = {
  now?: any;
  timezone?: string | number;
  offset: number;
};

export function getDayRange(options: GetDayRangeOptions) {
  const { now, timezone = '+00:00', offset } = options;
  let m = toMoment(now).utcOffset(offsetFromString(timezone));
  if (offset > 0) {
    return [
      // 第二天开始计算
      (m = m.add(1, 'day').startOf('day')).format('YYYY-MM-DD'),
      // 第九天开始前结束
      m.clone().add(offset, 'day').startOf('day').format('YYYY-MM-DD'),
      '[)',
      timezone,
    ];
  }
  return [
    // 今天开始前
    m
      .clone()
      .subtract(-1 * offset - 1, 'day')
      .startOf('day')
      .format('YYYY-MM-DD'),
    // 明天开始前
    m.clone().add(1, 'day').startOf('day').format('YYYY-MM-DD'),
    '[)',
    timezone,
  ];
}

function toMoment(value, useMoment = false) {
  if (!value) {
    return (useMoment ? moment() : dayjs()) as dayjs.Dayjs;
  }
  if (dayjs.isDayjs(value)) {
    return value;
  }
  return (useMoment ? moment(value) : dayjs(value)) as dayjs.Dayjs;
}

export type Utc2unitOptions = {
  now?: any;
  unit: any;
  timezone?: string | number;
  offset?: number;
};

export function utc2unit(options: Utc2unitOptions) {
  const { now, unit, timezone = '+00:00', offset } = options;
  let m = toMoment(now, unit === 'isoWeek');
  m = m.utcOffset(offsetFromString(timezone));
  m = m.startOf(unit);
  if (offset > 0) {
    m = m.add(offset, unit);
  } else if (offset < 0) {
    m = m.subtract(-1 * offset, unit);
  }
  const fn = {
    year: () => m.format('YYYY'),
    quarter: () => m.format('YYYY[Q]Q'),
    month: () => m.format('YYYY-MM'),
    week: () => m.format('gggg[w]ww'),
    isoWeek: () => m.format('GGGG[W]WW'),
    day: () => m.format('YYYY-MM-DD'),
  };
  const r = fn[unit]?.();
  return timezone ? r + timezone : r;
}
type ToUnitParams = {
  now?: any;
  timezone?: string | number;
  field?: {
    timezone?: string | number;
  };
};
export const toUnit = (unit, offset?: number) => {
  return ({ now, timezone, field }: ToUnitParams) => {
    if (field?.timezone) {
      timezone = field?.timezone;
    }
    return utc2unit({ now, timezone, unit, offset });
  };
};

const toDays = (offset: number) => {
  return ({ now, timezone, field }: ToUnitParams) => {
    if (field?.timezone) {
      timezone = field?.timezone;
    }
    return getDayRange({ now, timezone, offset });
  };
};

export function getDateVars() {
  return {
    now: new Date().toISOString(),
    today: toUnit('day'),
    yesterday: toUnit('day', -1),
    tomorrow: toUnit('day', 1),
    thisWeek: toUnit('week'),
    lastWeek: toUnit('week', -1),
    nextWeek: toUnit('week', 1),
    thisIsoWeek: toUnit('isoWeek'),
    lastIsoWeek: toUnit('isoWeek', -1),
    nextIsoWeek: toUnit('isoWeek', 1),
    thisMonth: toUnit('month'),
    lastMonth: toUnit('month', -1),
    nextMonth: toUnit('month', 1),
    thisQuarter: toUnit('quarter'),
    lastQuarter: toUnit('quarter', -1),
    nextQuarter: toUnit('quarter', 1),
    thisYear: toUnit('year'),
    lastYear: toUnit('year', -1),
    nextYear: toUnit('year', 1),
    last7Days: toDays(-7),
    next7Days: toDays(7),
    last30Days: toDays(-30),
    next30Days: toDays(30),
    last90Days: toDays(-90),
    next90Days: toDays(90),
  };
}

export function splitPathToTwoParts(path: string) {
  const parts = path.split('.');
  return [parts.shift(), parts.join('.')];
}
