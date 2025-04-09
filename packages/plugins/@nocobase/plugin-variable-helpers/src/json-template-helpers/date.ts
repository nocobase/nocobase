/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import IsBetween from 'dayjs/plugin/isBetween';
import IsSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isoWeek from 'dayjs/plugin/isoWeek';
import localeData from 'dayjs/plugin/localeData';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(tz);
dayjs.extend(utc);
dayjs.extend(quarterOfYear);
dayjs.extend(isoWeek);
dayjs.extend(IsBetween);
dayjs.extend(IsSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

export function dateFormat(initialValue: any, format: string) {
  const handler = (value: any) => {
    return dayjs.isDayjs(value) ? value.format(format) : dayjs(value).format(format);
  };
  if (Array.isArray(initialValue)) {
    return initialValue.map(handler);
  } else {
    return handler(initialValue);
  }
}

export function dateAdd(initialValue: any, unit: any, number: number) {
  const handler = (value: any) => {
    return dayjs.isDayjs(value) ? value.add(number, unit) : dayjs(value).add(number, unit);
  };
  if (Array.isArray(initialValue)) {
    return initialValue.map(handler);
  } else {
    return handler(initialValue);
  }
}

export function dateSubtract(initialValue: any, unit: any, number: number) {
  const handler = (value: any) => {
    return dayjs.isDayjs(value) ? value.subtract(number, unit) : dayjs(value).subtract(number, unit);
  };
  if (Array.isArray(initialValue)) {
    const results = initialValue.map(handler);
    return results;
  } else {
    const result = handler(initialValue);
    return handler(initialValue);
  }
}

export function dateCalculate(initialValue: any, action: 'add' | 'subtract', number: number, unit: any) {
  const handler = (value: any) => {
    if (action === 'add') {
      return dayjs.isDayjs(value) ? value.add(number, unit) : dayjs(value).add(number, unit);
    } else if (action === 'subtract') {
      return dayjs.isDayjs(value) ? value.subtract(number, unit) : dayjs(value).subtract(number, unit);
    } else return initialValue;
  };
  const date = handler(initialValue);
  if (dayjs.isDayjs(date)) {
    date.toString = function () {
      return this.format();
    };
  }
  return date;
}
