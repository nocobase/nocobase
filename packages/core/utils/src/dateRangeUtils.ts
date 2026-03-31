/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Dayjs, UnitType } from 'dayjs';
import { dayjs } from './dayjs';

type DateUnit = 'day' | 'week' | 'isoWeek' | 'month' | 'quarter' | 'year';
type RangeType =
  | 'today'
  | 'yesterday'
  | 'tomorrow'
  | 'thisWeek'
  | 'lastWeek'
  | 'nextWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'nextMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'nextQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'nextYear'
  | 'past'
  | 'next';

interface RangeParams {
  type: RangeType;
  unit?: DateUnit;
  number?: number;
  timezone?: string;
}

const getNow = (tz?: string): Dayjs => {
  if (!tz) return dayjs();
  if (/^[+-]\d{2}:\d{2}$/.test(tz)) {
    const [sign, hour, minute] = tz.match(/([+-])(\d{2}):(\d{2})/)!.slice(1);
    const offset = (parseInt(hour) * 60 + parseInt(minute)) * (sign === '+' ? 1 : -1);
    return dayjs().utcOffset(offset);
  }
  return dayjs().tz(tz); // IANA 时区
};

export const getOffsetRangeByParams = (params: RangeParams): [string, string] => {
  const { type, unit = 'day' as any, number = 1, timezone } = params;
  const now = getNow(timezone);
  const actualUnit: any = unit === 'week' ? 'isoWeek' : unit;

  let start: dayjs.Dayjs;
  let end: dayjs.Dayjs;

  if (type === 'past') {
    const base = now.startOf(actualUnit);
    start = base.subtract(number, unit).startOf(actualUnit);
    end = base.subtract(1, unit).endOf(actualUnit);
  } else if (type === 'next') {
    const base = now.startOf(actualUnit);
    start = base.add(1, unit).startOf(actualUnit);
    end = start.add(number - 1, unit).endOf(actualUnit);
  } else {
    throw new Error(`Unsupported type: ${type}`);
  }
  return [start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss')];
};

const getStart = (offset: number, unit: DateUnit, tz?: string): Dayjs => {
  const actualUnit = unit === 'isoWeek' ? 'week' : unit;
  return getNow(tz)
    .add(offset, actualUnit as dayjs.ManipulateType)
    .startOf(unit as UnitType);
};

const getEnd = (offset: number, unit: DateUnit, tz?: string): Dayjs => {
  const actualUnit = unit === 'isoWeek' ? 'week' : unit;
  return getNow(tz)
    .add(offset, actualUnit as dayjs.ManipulateType)
    .endOf(unit as UnitType);
};

const strategies: Record<Exclude<RangeType, 'past' | 'next'>, (params?: RangeParams) => [Dayjs, Dayjs]> = {
  today: (params) => [getStart(0, 'day', params?.timezone), getEnd(0, 'day', params?.timezone)],
  yesterday: (params) => [getStart(-1, 'day', params?.timezone), getEnd(-1, 'day', params?.timezone)],
  tomorrow: (params) => [getStart(1, 'day', params?.timezone), getEnd(1, 'day', params?.timezone)],

  thisWeek: (params) => [getStart(0, 'isoWeek', params?.timezone), getEnd(0, 'isoWeek', params?.timezone)],
  lastWeek: (params) => [getStart(-1, 'isoWeek', params?.timezone), getEnd(-1, 'isoWeek', params?.timezone)],
  nextWeek: (params) => [getStart(1, 'isoWeek', params?.timezone), getEnd(1, 'isoWeek', params?.timezone)],

  thisMonth: (params) => [getStart(0, 'month', params?.timezone), getEnd(0, 'month', params?.timezone)],
  lastMonth: (params) => [getStart(-1, 'month', params?.timezone), getEnd(-1, 'month', params?.timezone)],
  nextMonth: (params) => [getStart(1, 'month', params?.timezone), getEnd(1, 'month', params?.timezone)],

  thisQuarter: (params) => [getStart(0, 'quarter', params?.timezone), getEnd(0, 'quarter', params?.timezone)],
  lastQuarter: (params) => [getStart(-1, 'quarter', params?.timezone), getEnd(-1, 'quarter', params?.timezone)],
  nextQuarter: (params) => [getStart(1, 'quarter', params?.timezone), getEnd(1, 'quarter', params?.timezone)],

  thisYear: (params) => [getStart(0, 'year', params?.timezone), getEnd(0, 'year', params?.timezone)],
  lastYear: (params) => [getStart(-1, 'year', params?.timezone), getEnd(-1, 'year', params?.timezone)],
  nextYear: (params) => [getStart(1, 'year', params?.timezone), getEnd(1, 'year', params?.timezone)],
};

/**
 * 获取某个时间范围的起止时间（字符串格式）
 */
export const getDayRangeByParams = (params: RangeParams): [string, string] => {
  if (params.type === 'past' || params.type === 'next') {
    return getOffsetRangeByParams(params);
  }
  const fn = strategies[params.type];
  if (!fn) throw new Error(`Unsupported type: ${params.type}`);
  const [start, end] = fn(params);

  return [start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss')];
};
