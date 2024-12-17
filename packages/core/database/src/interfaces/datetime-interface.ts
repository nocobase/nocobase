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

function resolveTimeZoneFromCtx(ctx) {
  if (ctx?.get && ctx?.get('X-Timezone')) {
    return ctx.get('X-Timezone');
  }

  return 0;
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

  protected formatDateTimeToISO(dateInfo: {
    year: string;
    month: string;
    day: string;
    hour?: string;
    minute?: string;
    second?: string;
  }) {
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
        return this.formatDateTimeToISO(dateInfo);
      }
    }

    if (dayjs.isDayjs(value)) {
      return value;
    } else if (isDate(value)) {
      return value;
    } else if (isNumeric(value)) {
      return getJsDateFromExcel(value).toISOString();
    } else if (typeof value === 'string') {
      return value;
    }

    throw new Error(`Invalid date - ${value}`);
  }

  toString(value: any, ctx?: any) {
    const utcOffset = resolveTimeZoneFromCtx(ctx);
    const props = this.options?.uiSchema?.['x-component-props'] ?? {};
    const format = getDefaultFormat(props);
    const m = str2moment(value, { ...props, utcOffset });
    return m ? m.format(format) : '';
  }
}
