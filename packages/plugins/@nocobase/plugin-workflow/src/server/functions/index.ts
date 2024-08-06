/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { utc2unit, getDateVars } from '@nocobase/utils';
import dayjs, { Dayjs } from 'dayjs';
import Plugin from '..';
import type { ExecutionModel, FlowNodeModel } from '../types';

export type CustomFunction = (this: { execution: ExecutionModel; node?: FlowNodeModel }) => any;

function getTimezone() {
  const offset = new Date().getTimezoneOffset();
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  const sign = offset <= 0 ? '+' : '-';
  return `${sign}${hours}:${minutes}`;
}
const getRangeByDay = (offset: number) =>
  utc2unit({ now: new Date(), unit: 'day', offset: offset, timezone: getTimezone() });

const getOffsetFromMS = (start, end) => Math.floor((end - start) / 1000 / 60 / 60 / 24);

function now() {
  return new Date();
}
const dateVars = getDateVars();
export const dateRangeFns = {
  yesterday() {
    return dateVars.yesterday({ now: new Date(), timezone: getTimezone() });
  },
  today() {
    return dateVars.today({ now: new Date(), timezone: getTimezone() });
  },
  tomorrow() {
    return dateVars.tomorrow({ now: new Date(), timezone: getTimezone() });
  },
  lastWeek() {
    return dateVars.lastWeek({ now: new Date(), timezone: getTimezone() });
  },
  thisWeek() {
    return dateVars.thisWeek({ now: new Date(), timezone: getTimezone() });
  },
  nextWeek() {
    return dateVars.nextWeek({ now: new Date(), timezone: getTimezone() });
  },
  lastMonth() {
    return dateVars.lastMonth({ now: new Date(), timezone: getTimezone() });
  },
  thisMonth() {
    return dateVars.thisMonth({ now: new Date(), timezone: getTimezone() });
  },
  nextMonth() {
    return dateVars.nextMonth({ now: new Date(), timezone: getTimezone() });
  },
  lastQuarter() {
    return dateVars.lastQuarter({ now: new Date(), timezone: getTimezone() });
  },
  thisQuarter() {
    return dateVars.thisQuarter({ now: new Date(), timezone: getTimezone() });
  },
  nextQuarter() {
    return dateVars.nextQuarter({ now: new Date(), timezone: getTimezone() });
  },
  lastYear() {
    return dateVars.lastYear({ now: new Date(), timezone: getTimezone() });
  },
  thisYear() {
    return dateVars.thisYear({ now: new Date(), timezone: getTimezone() });
  },
  nextYear() {
    return dateVars.nextYear({ now: new Date(), timezone: getTimezone() });
  },
  last7Days() {
    return dateVars.last7Days({ now: new Date(), timezone: getTimezone() });
  },
  next7Days() {
    return dateVars.next7Days({ now: new Date(), timezone: getTimezone() });
  },
  last30Days() {
    return dateVars.last30Days({ now: new Date(), timezone: getTimezone() });
  },
  next30Days() {
    return dateVars.next30Days({ now: new Date(), timezone: getTimezone() });
  },
  last90Days() {
    return dateVars.last90Days({ now: new Date(), timezone: getTimezone() });
  },
  next90Days() {
    return dateVars.next90Days({ now: new Date(), timezone: getTimezone() });
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
