/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseInterface } from './base-interface';
import { getDefaultFormat, str2moment } from '@nocobase/utils';
import dayjs from 'dayjs';
import { getJsDateFromExcel } from 'excel-date-to-js';

function isDate(v) {
  return v instanceof Date;
}

function isNumeric(str: any) {
  if (typeof str === 'number') return true;
  if (typeof str != 'string') return false;
  return !isNaN(str as any) && !isNaN(parseFloat(str));
}

export function getTimeZoneOffsetMinutes(timezone: string | number | null | undefined) {
  if (typeof timezone === 'number' && Number.isFinite(timezone)) {
    return timezone;
  }

  if (typeof timezone !== 'string') {
    return null;
  }

  const normalized = timezone.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (normalized === 'Z' || normalized === 'UTC') {
    return 0;
  }

  const match = normalized.match(/^([+-])(\d{2})(?::?(\d{2}))?$/);
  if (!match) {
    return null;
  }

  const [, sign, hours, minutes = '00'] = match;
  const totalMinutes = Number(hours) * 60 + Number(minutes);
  return sign === '+' ? totalMinutes : -totalMinutes;
}

export function resolveTimeZoneFromCtx(ctx) {
  let timezone;

  if (typeof ctx?.get === 'function') {
    timezone = ctx.get('X-Timezone') || ctx.get('x-timezone');
  } else if (typeof ctx?.request?.get === 'function') {
    timezone = ctx.request.get('X-Timezone') || ctx.request.get('x-timezone');
  }

  timezone =
    timezone ||
    ctx?.request?.headers?.['x-timezone'] ||
    ctx?.request?.headers?.['X-Timezone'] ||
    ctx?.request?.header?.['x-timezone'] ||
    ctx?.request?.header?.['X-Timezone'] ||
    ctx?.req?.headers?.['x-timezone'] ||
    ctx?.req?.headers?.['X-Timezone'];

  if (timezone !== undefined && timezone !== null && timezone !== '') {
    return timezone;
  }

  return null;
}

function toISOWithTimezone(
  dateInfo: {
    year: string;
    month: string;
    day: string;
    hour?: string;
    minute?: string;
    second?: string;
  },
  timezone: string | number | null,
) {
  const offsetMinutes = getTimeZoneOffsetMinutes(timezone);
  if (offsetMinutes == null) {
    return null;
  }

  const utcMillis =
    Date.UTC(
      Number(dateInfo.year),
      Number(dateInfo.month) - 1,
      Number(dateInfo.day),
      Number(dateInfo.hour || '00'),
      Number(dateInfo.minute || '00'),
      Number(dateInfo.second || '00'),
      0,
    ) -
    offsetMinutes * 60 * 1000;

  return new Date(utcMillis).toISOString();
}

function excelSerialToISO(value: number | string, timezone: string | number | null) {
  const wallClockUtcDate = getJsDateFromExcel(value);
  const offsetMinutes = getTimeZoneOffsetMinutes(timezone);
  if (offsetMinutes == null) {
    return wallClockUtcDate.toISOString();
  }

  const utcMillis =
    Date.UTC(
      wallClockUtcDate.getUTCFullYear(),
      wallClockUtcDate.getUTCMonth(),
      wallClockUtcDate.getUTCDate(),
      wallClockUtcDate.getUTCHours(),
      wallClockUtcDate.getUTCMinutes(),
      wallClockUtcDate.getUTCSeconds(),
      wallClockUtcDate.getUTCMilliseconds(),
    ) -
    offsetMinutes * 60 * 1000;

  return new Date(utcMillis).toISOString();
}

export class DatetimeInterface extends BaseInterface {
  protected parseDateString(value: string) {
    const dateOnlyMatch = /^(\d{4})[-/]?(\d{2})[-/]?(\d{2})$/.exec(value);
    const dateTimeMatch = /^(\d{4})(\d{2})(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(value);

    if (dateTimeMatch) {
      const [_, year, month, day, hour, minute, second] = dateTimeMatch;
      return { year, month, day, hour, minute, second };
    }

    if (dateOnlyMatch) {
      const [_, year, month, day] = dateOnlyMatch;
      return { year, month, day };
    }

    return null;
  }

  protected formatDateTimeToISO(
    dateInfo: {
      year: string;
      month: string;
      day: string;
      hour?: string;
      minute?: string;
      second?: string;
    },
    ctx?: any,
  ) {
    const timezone = resolveTimeZoneFromCtx(ctx);
    const timezoneAwareISO = toISOWithTimezone(dateInfo, timezone);
    if (timezoneAwareISO) {
      return timezoneAwareISO;
    }

    const { year, month, day, hour = '00', minute = '00', second = '00' } = dateInfo;
    const m = dayjs(`${year}-${month}-${day} ${hour}:${minute}:${second}.000`);
    return m.toISOString();
  }

  async toValue(value: any, ctx: any = {}): Promise<any> {
    if (!value) {
      return null;
    }

    if (typeof value === 'number') {
      const valueStr = value.toString();
      const dateOnlyMatch = /^(\d{4})[-/]?(\d{2})[-/]?(\d{2})$/.exec(valueStr);
      if (dateOnlyMatch) {
        value = valueStr;
      }
    }

    if (typeof value === 'string') {
      const dateInfo = this.parseDateString(value);
      if (dateInfo) {
        return this.formatDateTimeToISO(dateInfo, ctx);
      }
    }

    if (dayjs.isDayjs(value)) {
      return value;
    } else if (isDate(value)) {
      return value;
    } else if (isNumeric(value)) {
      return excelSerialToISO(value, resolveTimeZoneFromCtx(ctx));
    } else if (typeof value === 'string') {
      return value;
    }

    throw new Error(`Invalid date - ${value}`);
  }

  toString(value: any, ctx?: any) {
    const utcOffset = resolveTimeZoneFromCtx(ctx) ?? 0;
    const props = this.options?.uiSchema?.['x-component-props'] ?? {};
    const format = getDefaultFormat(props);
    const m = str2moment(value, { ...props, utcOffset });
    return m ? m.format(format) : '';
  }
}
