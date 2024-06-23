/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getDayRange, utc2unit } from '@nocobase/utils';
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
