/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { offsetFromString } from './date';
import { dayjs } from './dayjs';
import { getDayRangeByParams } from './dateRangeUtils';

function parseUTC(value) {
  if (value instanceof Date || dayjs.isDayjs(value)) {
    return {
      unit: 'utc',
      start: value.toISOString(),
    };
  }
  if (value?.endsWith?.('Z')) {
    return {
      unit: 'utc',
      start: value,
    };
  }
}

function parseYear(value) {
  if (/^\d\d\d\d$/.test(value)) {
    return {
      unit: 'year',
      start: `${value}-01-01 00:00:00`,
    };
  }
}

function parseQuarter(value) {
  if (/^\d\d\d\dQ\d$/.test(value)) {
    const [year, q] = value.split('Q');
    return {
      unit: 'quarter',
      start: dayjs(year, 'YYYY').quarter(q).format('YYYY-MM-DD HH:mm:ss'),
    };
  }
}

export function parseWeek(value) {
  if (/^\d\d\d\d[W]\d\d$/.test(value)) {
    const arr = value.split('W');
    const year = dayjs(arr[0], 'YYYY').format('GGGG');
    if (year !== arr[0]) {
      return {
        unit: 'isoWeek',
        start: dayjs(arr[0], 'YYYY')
          .add(1, 'week')
          .startOf('isoWeek')
          .isoWeek(Number(arr[1]))
          .format('YYYY-MM-DD HH:mm:ss'),
      };
    }
    return {
      unit: 'isoWeek',
      start: dayjs(arr[0], 'YYYY').isoWeek(Number(arr[1])).format('YYYY-MM-DD HH:mm:ss'),
    };
  }
  if (/^\d\d\d\d[w]\d\d$/.test(value)) {
    const arr = value.split('w');
    const year = dayjs(arr[0], 'YYYY').format('gggg');
    if (year !== arr[0]) {
      return {
        unit: 'week',
        start: dayjs(arr[0], 'YYYY').add(1, 'week').startOf('week').week(Number(arr[1])).format('YYYY-MM-DD HH:mm:ss'),
      };
    }
    return {
      unit: 'week',
      start: dayjs(arr[0], 'YYYY').week(Number(arr[1])).format('YYYY-MM-DD HH:mm:ss'),
    };
  }
}

function parseMonth(value) {
  if (/^\d\d\d\d-\d\d$/.test(value)) {
    return {
      unit: 'month',
      start: `${value}-01 00:00:00`,
    };
  }
}

function parseDay(value) {
  if (/^\d\d\d\d-\d\d-\d\d$/.test(value)) {
    return {
      unit: 'day',
      start: `${value} 00:00:00`,
    };
  }
}

function parseHour(value) {
  if (/^\d\d\d\d-\d\d-\d\d(T|\s)\d\d$/.test(value)) {
    return {
      unit: 'hour',
      start: `${value}:00:00`,
    };
  }
}

function parseMinute(value) {
  if (/^\d\d\d\d-\d\d-\d\d(T|\s)\d\d:\d\d$/.test(value)) {
    return {
      unit: 'minute',
      start: `${value}:00`,
    };
  }
}

function parseSecond(value) {
  if (/^\d\d\d\d-\d\d-\d\d(T|\s)\d\d:\d\d:\d\d$/.test(value)) {
    return {
      unit: 'second',
      start: `${value}`,
    };
  }
}

function parseMillisecond(value) {
  if (/^\d\d\d\d-\d\d-\d\d(T|\s)\d\d:\d\d:\d\d\.\d\d\d$/.test(value)) {
    return {
      unit: 'millisecond',
      start: `${value}`,
    };
  }
}

const parsers = [
  parseUTC,
  parseYear,
  parseQuarter,
  parseWeek,
  parseMonth,
  parseDay,
  parseHour,
  parseMinute,
  parseSecond,
  parseMillisecond,
];

type ParseDateResult = {
  unit: any;
  start: string;
  timezone?: string;
};

function toISOString(m: dayjs.Dayjs) {
  return m.toISOString();
}

function dateRange(r: ParseDateResult) {
  if (!r.timezone) {
    r.timezone = '+00:00';
  }
  let m: dayjs.Dayjs;
  if (r.unit === 'utc') {
    return dayjs(r?.start).toISOString();
  } else {
    m = dayjs(`${r?.start}${r?.timezone}`);
  }
  m = m.utcOffset(offsetFromString(r.timezone));
  return [(m = m.startOf(r.unit)), m.add(1, r.unit === 'isoWeek' ? 'weeks' : r.unit).startOf(r.unit)].map(toISOString);
}

export function parseDate(value: any, options = {} as { timezone?: string }) {
  if (!value) {
    return;
  }
  if (value.type) {
    value = getDayRangeByParams({ ...value, ...options });
  }

  if (Array.isArray(value)) {
    return parseDateBetween(value, options);
  }

  let timezone = options.timezone || '+00:00';

  const input = value;
  if (typeof value === 'string') {
    const match = /(.+)((\+|-)\d\d:\d\d)$/.exec(value);
    if (match) {
      value = match[1];
      timezone = match[2];
    }
    if (/^(\(|\[)/.test(value)) {
      return parseDateBetween(input, options);
    }
  }
  for (const parse of parsers) {
    const r = parse(value);
    if (r) {
      r['input'] = input;
      if (!r['timezone']) {
        r['timezone'] = timezone;
      }
      return dateRange(r);
    }
  }
}

function parseDateBetween(value: any, options = {} as { timezone?: string }) {
  if (Array.isArray(value) && value.length > 1) {
    const [startValue, endValue, op = '[]', timezone] = value;
    const r0 = parseDate(startValue, { timezone });
    const r1 = parseDate(endValue, { timezone });
    let start;
    let startOp;
    let end;
    let endOp;
    if (typeof r0 === 'string') {
      start = r0;
      startOp = op[0];
    } else {
      start = op.startsWith('(') ? r0[1] : r0[0];
      startOp = '[';
    }
    if (typeof r1 === 'string') {
      end = r1;
      endOp = op[1];
    } else {
      end = op.endsWith(')') ? r1[0] : r1[1];
      endOp = ')';
    }
    const newOp = startOp + endOp;
    return newOp === '[)' ? [start, end] : [start, end, newOp];
  }
  if (typeof value !== 'string') {
    return;
  }
  const match = /(.+)((\+|-)\d\d:\d\d)$/.exec(value);
  let timezone = options.timezone || '+00:00';

  if (match) {
    value = match[1];
    timezone = match[2];
  }

  const m = /^(\(|\[)(.+),(.+)(\)|\])$/.exec(value);
  if (!m) {
    return;
  }
  return parseDateBetween([m[2], m[3], `${m[1]}${m[4]}`, timezone]);
}
