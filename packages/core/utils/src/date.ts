/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { dayjs } from './dayjs';

export interface Str2momentOptions {
  gmt?: boolean;
  picker?: 'year' | 'month' | 'week' | 'quarter';
  utcOffset?: number;
  utc?: boolean;
  dateOnly?: boolean;
}

export type Str2momentValue = string | string[] | dayjs.Dayjs | dayjs.Dayjs[];

export interface GetDefaultFormatProps {
  format?: string;
  dateFormat?: string;
  timeFormat?: string;
  picker?: 'year' | 'month' | 'week' | 'quarter';
  showTime?: boolean;
}

export const getDefaultFormat = (props: GetDefaultFormatProps) => {
  if (props.format) {
    return props.format;
  }
  if (props.dateFormat) {
    if (props['showTime']) {
      return `${props.dateFormat} ${props.timeFormat || 'HH:mm:ss'}`;
    }
    return props.dateFormat;
  }
  if (props['picker'] === 'month') {
    return 'YYYY-MM';
  } else if (props['picker'] === 'quarter') {
    return 'YYYY-\\QQ';
  } else if (props['picker'] === 'year') {
    return 'YYYY';
  } else if (props['picker'] === 'week') {
    return 'YYYY[W]W';
  }
  return props['showTime'] ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
};

export const toGmt = (value: dayjs.Dayjs) => {
  if (!value || !dayjs.isDayjs(value)) {
    return value;
  }
  return `${value.format('YYYY-MM-DD')}T${value.format('HH:mm:ss.SSS')}Z`;
};

export const toLocal = (value: dayjs.Dayjs) => {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((val) => val.startOf('second').toISOString());
  }
  if (dayjs.isDayjs(value)) {
    return value.startOf('second').toISOString();
  }
};

const convertQuarterToFirstDay = (quarterStr) => {
  try {
    const year = parseInt(quarterStr.slice(0, 4)); // 提取年份
    const quarter = parseInt(quarterStr.slice(-1)); // 提取季度数字
    return dayjs().quarter(quarter).year(year);
  } catch (error) {
    return null;
  }
};

const toMoment = (val: any, options?: Str2momentOptions) => {
  if (!val) {
    return;
  }
  const offset = options.utcOffset;
  const { gmt, picker, utc = true, dateOnly } = options;

  if (dayjs(val).isValid()) {
    if (dateOnly) {
      return dayjs.utc(val, 'YYYY-MM-DD');
    }
    if (!utc) {
      return dayjs.utc(val);
    }

    if (dayjs.isDayjs(val)) {
      return offset ? val.utcOffset(offsetFromString(offset)) : val;
    }
    if (gmt) {
      return dayjs(val).utcOffset(0);
    }
    return offset ? dayjs(val).utcOffset(offsetFromString(offset)) : dayjs(val);
  } else {
    return convertQuarterToFirstDay(val);
  }
};

export const str2moment = (
  value?: string | string[] | dayjs.Dayjs | dayjs.Dayjs[],
  options: Str2momentOptions = {},
): any => {
  return Array.isArray(value)
    ? value.map((val) => {
        return toMoment(val, options);
      })
    : value
      ? toMoment(value, options)
      : value;
};

const toStringByPicker = (value, picker) => {
  if (picker === 'year') {
    return value.format('YYYY') + '-01-01T00:00:00.000Z';
  }
  if (picker === 'month') {
    return value.format('YYYY-MM') + '-01T00:00:00.000Z';
  }
  if (picker === 'quarter') {
    return value.format('YYYY-MM') + '-01T00:00:00.000Z';
  }
  if (picker === 'week') {
    return value.format('YYYY-MM-DD') + 'T00:00:00.000Z';
  }
  return value.format('YYYY-MM-DD') + 'T00:00:00.000Z';
};

const toGmtByPicker = (value: dayjs.Dayjs | dayjs.Dayjs[], picker?: any) => {
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((val) => toStringByPicker(val, picker));
  }
  if (dayjs.isDayjs(value)) {
    return toStringByPicker(value, picker);
  }
};

export interface Moment2strOptions {
  showTime?: boolean;
  gmt?: boolean;
  picker?: 'year' | 'month' | 'week' | 'quarter';
}

export const moment2str = (value?: dayjs.Dayjs, options: Moment2strOptions = {}) => {
  const { showTime, gmt, picker } = options;
  if (!value) {
    return value;
  }
  if (showTime) {
    return gmt ? toGmt(value) : toLocal(value);
  }
  return toGmtByPicker(value, picker);
};

/**
 * from https://github.com/moment/moment/blob/dca02edaeceda3fcd52b20b51c130631a058a022/src/lib/units/offset.js#L55-L70
 */
export function offsetFromString(string: string | number) {
  if (!_.isString(string)) {
    return string;
  }

  // timezone chunker
  // '+10:00' > ['10',  '00']
  // '-1530'  > ['-15', '30']
  const chunkOffset = /([+-]|\d\d)/gi;

  const matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, // +00 -00 +00:00 -00:00 +0000 -0000 or Z
    matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

  let matches = (string || '').match(matchShortOffset);
  if (matches === null) {
    matches = (string || '').match(matchTimestamp);
  }

  if (matches === null) {
    return null;
  }

  const chunk = matches[matches.length - 1] || [];
  const parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
  const minutes = +(Number(parts[1]) * 60) + toInt(parts[2]);

  return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
}

function toInt(argumentForCoercion) {
  // eslint-disable-next-line prefer-const
  let coercedNumber = +argumentForCoercion,
    value = 0;

  if (coercedNumber !== 0 && isFinite(coercedNumber)) {
    value = absFloor(coercedNumber);
  }

  return value;
}

function absFloor(number) {
  if (number < 0) {
    // -0 -> 0
    return Math.ceil(number) || 0;
  } else {
    return Math.floor(number);
  }
}

export const getPickerFormat = (picker) => {
  switch (picker) {
    case 'week':
      return 'YYYY[W]W';
    case 'month':
      return 'YYYY-MM';
    case 'quarter':
      return 'YYYY[Q]Q';
    case 'year':
      return 'YYYY';
    default:
      return 'YYYY-MM-DD';
  }
};

export const getDateTimeFormat = (picker, format, showTime, timeFormat) => {
  if (picker === 'date') {
    if (showTime) {
      return `${format} ${timeFormat || 'HH:mm:ss'}`;
    }
    return format;
  }
  return format;
};

export function getFormatFromDateStr(dateStr: string): string | null {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) return 'YYYY-MM-DD HH:mm:ss';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'YYYY-MM-DD';
  if (/^\d{4}-\d{2}$/.test(dateStr)) return 'YYYY-MM';
  if (/^\d{4}$/.test(dateStr)) return 'YYYY';
  if (/^\d{4}Q[1-4]$/.test(dateStr)) return 'YYYY[Q]Q';
  if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) return 'YYYY-MM-DDTHH:mm:ss.SSSZ';
  return null;
}
