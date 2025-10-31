/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { toGmt } from '@nocobase/utils/client';
import dayjs from 'dayjs';

export const handleDateChangeOnForm = (value, dateOnly, utc, picker, showTime, gmt) => {
  // @ts-ignore
  const currentTimeZone = dayjs.tz.guess();
  const format = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
  if (!value) {
    return value;
  }
  if (dateOnly) {
    return dayjs(value).startOf(picker).format('YYYY-MM-DD');
  }
  if (utc) {
    if (gmt) {
      return toGmt(value);
    }
    if (picker !== 'date') {
      return dayjs(value).startOf(picker).toISOString();
    }
    const formattedDate = dayjs(value).format(format);
    // @ts-ignore
    return dayjs(formattedDate).tz(currentTimeZone, true).toISOString();
  }
  if (showTime) {
    return dayjs(value).format(format);
  }
  return dayjs(value).startOf(picker).format(format);
};

export const handleDateChangeOnFormWithTz = (value, picker, showTime) => {
  // @ts-ignore
  const currentTimeZone = dayjs.tz.guess();
  const format = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
  if (!value) {
    return value;
  }
  if (picker !== 'date') {
    return dayjs(value).startOf(picker).toISOString();
  }
  const formattedDate = dayjs(value).format(format);
  // @ts-ignore
  return dayjs(formattedDate).tz(currentTimeZone, true).toISOString();
};
