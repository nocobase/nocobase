/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DatetimeInterface } from './datetime-interface';
import dayjs from 'dayjs';
import { getJsDateFromExcel } from 'excel-date-to-js';
import { getDefaultFormat, str2moment } from '@nocobase/utils';

function isDate(v) {
  return v instanceof Date;
}

function isNumeric(str: any) {
  if (typeof str === 'number') return true;
  if (typeof str != 'string') return false;
  return !isNaN(str as any) && !isNaN(parseFloat(str));
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export class DatetimeNoTzInterface extends DatetimeInterface {
  protected formatDateTimeToString(dateInfo: {
    year: string;
    month: string;
    day: string;
    hour?: string;
    minute?: string;
    second?: string;
  }) {
    const { year, month, day, hour, minute, second } = dateInfo;
    if (hour !== undefined && minute !== undefined && second !== undefined) {
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
    return `${year}-${month}-${day}`;
  }

  protected formatExcelSerialToString(value: number | string) {
    const date = getJsDateFromExcel(value);
    return this.formatDateTimeToString({
      year: String(date.getUTCFullYear()),
      month: pad2(date.getUTCMonth() + 1),
      day: pad2(date.getUTCDate()),
      hour: pad2(date.getUTCHours()),
      minute: pad2(date.getUTCMinutes()),
      second: pad2(date.getUTCSeconds()),
    });
  }

  async toValue(value: any, ctx: any = {}): Promise<any> {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      const dateInfo = this.parseDateString(value);
      if (dateInfo) {
        return this.formatDateTimeToString(dateInfo);
      }
    }

    if (dayjs.isDayjs(value)) {
      return value;
    } else if (isDate(value)) {
      return value;
    } else if (isNumeric(value)) {
      return this.formatExcelSerialToString(value);
    } else if (typeof value === 'string') {
      return value;
    }

    throw new Error(`Invalid date - ${value}`);
  }

  toString(value: any, ctx?: any) {
    const props = this.options?.uiSchema?.['x-component-props'] ?? {};
    const format = getDefaultFormat(props);
    const m = str2moment(value, { ...props });
    return m ? m.format(format) : '';
  }
}
