/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getDayRange, utc2unit } from '@nocobase/utils';
import dayjs, { Dayjs } from 'dayjs';
import Plugin from '..';
import type { ExecutionModel, FlowNodeModel } from '../types';

export type CustomFunction = (this: { execution: ExecutionModel; node?: FlowNodeModel }) => any;

function getTimezone() {
  const timezoneOffset = 0 - new Date().getTimezoneOffset() / 60;
  const timezoneString = `${
    Math.abs(timezoneOffset) > 10 ? Math.abs(timezoneOffset) : `0${Math.abs(timezoneOffset)}`
  }:00`;
  const timezone = `${timezoneOffset > 0 ? '+' : '-'}${timezoneString}`;
  return timezone;
}
const getRangeByDay = (offset: number) =>
  utc2unit({ now: new Date(), unit: 'day', offset: offset, timezone: getTimezone() });

const getOffsetFromMS = (start, end) => Math.floor((end - start) / 1000 / 60 / 60 / 24);

function now() {
  return new Date();
}

const dateRangeFns = {
  yesterday() {
    return getRangeByDay(-1);
  },
  today() {
    return getRangeByDay(0);
  },
  tomorrow() {
    return getRangeByDay(1);
  },
  lastIsoWeek() {
    const start = dayjs().subtract(1, 'w').startOf('w');
    return getDayRange({ now: start, offset: 7, timezone: getTimezone() });
  },
  thisIsoWeek() {
    const start = dayjs().startOf('w');
    return getDayRange({ now: start, offset: 7, timezone: getTimezone() });
  },
  nextIsoWeek() {
    const start = dayjs().add(1, 'w').startOf('w');
    return getDayRange({ now: start, offset: 7, timezone: getTimezone() });
  },
  lastMonth() {
    const start = dayjs().subtract(1, 'month').startOf('month');
    return getDayRange({ now: start, offset: start.daysInMonth(), timezone: getTimezone() });
  },
  thisMonth() {
    const start = dayjs().startOf('month');
    return getDayRange({ now: start, offset: start.daysInMonth(), timezone: getTimezone() });
  },
  nextMonth() {
    const start = dayjs().add(1, 'month').startOf('month');
    return getDayRange({ now: start, offset: start.daysInMonth(), timezone: getTimezone() });
  },
  lastQuarter() {
    const quarter = dayjs().subtract(1, 'quarter');
    const start = quarter.clone().startOf('quarter');
    const end = quarter.clone().endOf('quarter');
    return getDayRange({ now: start, offset: getOffsetFromMS(start, end), timezone: getTimezone() });
  },
  thisQuarter() {
    const quarter = dayjs().subtract(1, 'quarter');
    const start = quarter.clone().startOf('quarter');
    const end = quarter.clone().endOf('quarter');
    return getDayRange({ now: start, offset: getOffsetFromMS(start, end), timezone: getTimezone() });
  },
  nextQuarter() {
    const quarter = dayjs().subtract(1, 'quarter');
    const start = quarter.clone().startOf('quarter');
    const end = quarter.clone().endOf('quarter');
    return getDayRange({ now: start, offset: getOffsetFromMS(start, end), timezone: getTimezone() });
  },
  lastYear() {
    const quarter = dayjs().subtract(1, 'year');
    const start = quarter.clone().startOf('year');
    const end = quarter.clone().endOf('year');
    return getDayRange({ now: start, offset: getOffsetFromMS(start, end), timezone: getTimezone() });
  },
  thisYear() {
    const quarter = dayjs();
    const start = quarter.clone().startOf('year');
    const end = quarter.clone().endOf('year');
    return getDayRange({ now: start, offset: getOffsetFromMS(start, end), timezone: getTimezone() });
  },
  nextYear() {
    const quarter = dayjs().add(1, 'year');
    const start = quarter.clone().startOf('year');
    const end = quarter.clone().endOf('year');
    return getDayRange({ now: start, offset: getOffsetFromMS(start, end), timezone: getTimezone() });
  },
  last7Days() {
    const now = new Date();
    return getDayRange({ now: now, offset: -7, timezone: getTimezone() });
  },
  next7Days() {
    const now = new Date();
    return getDayRange({ now: now, offset: 7, timezone: getTimezone() });
  },
  last30Days() {
    const now = new Date();
    return getDayRange({ now: now, offset: -30, timezone: getTimezone() });
  },
  next30Days() {
    const now = new Date();
    return getDayRange({ now: now, offset: 30, timezone: getTimezone() });
  },
  last90Days() {
    const now = new Date();
    return getDayRange({ now: now, offset: -90, timezone: getTimezone() });
  },
  next90Days() {
    const now = new Date();
    return getDayRange({ now: now, offset: 90, timezone: getTimezone() });
  },
};

export default function ({ functions }: Plugin, more: { [key: string]: CustomFunction } = {}) {
  functions.register('now', now);

  Object.keys(dateRangeFns).forEach((key) => {
    functions.register(`dateRange.${key}`, dateRangeFns[key]);
  });

  for (const [name, fn] of Object.entries(more)) {
    functions.register(name, fn);
  }
}
