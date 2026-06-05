/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DatetimeInterface, getTimeZoneOffsetMinutes, resolveTimeZoneFromCtx } from './datetime-interface';

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateOnlyFromDate(date: Date, timezone: string | number | null) {
  const offsetMinutes = getTimeZoneOffsetMinutes(timezone);

  if (offsetMinutes == null) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  const shifted = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

export class DateInterface extends DatetimeInterface {
  async toValue(value: any, ctx?: any): Promise<any> {
    const normalized = await super.toValue(value, ctx);

    if (!normalized) {
      return normalized;
    }

    if (typeof normalized === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }

    const date = normalized instanceof Date ? normalized : new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return normalized;
    }

    return formatDateOnlyFromDate(date, resolveTimeZoneFromCtx(ctx));
  }

  toString(value: any, ctx?: any): any {
    return value;
  }
}
