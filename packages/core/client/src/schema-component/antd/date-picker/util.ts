/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getDefaultFormat, str2moment, toGmt, toLocal } from '@nocobase/utils/client';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const toStringByPicker = (value, picker, timezone: 'gmt' | 'local') => {
  if (!dayjs.isDayjs(value)) return value;
  if (timezone === 'local') {
    const offset = new Date().getTimezoneOffset();
    return dayjs(toStringByPicker(value, picker, 'gmt'))
      .add(offset, 'minutes')
      .toISOString();
  }

  if (picker === 'year') {
    return value.format('YYYY') + '-01-01T00:00:00.000Z';
  }
  if (picker === 'month') {
    return value.format('YYYY-MM') + '-01T00:00:00.000Z';
  }
  if (picker === 'quarter') {
    return value.startOf('quarter').format('YYYY-MM') + '-01T00:00:00.000Z';
  }
  if (picker === 'week') {
    return value.startOf('week').add(1, 'day').format('YYYY-MM-DD') + 'T00:00:00.000Z';
  }
  return value.format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z';
};

const toGmtByPicker = (value: Dayjs, picker?: any) => {
  if (!value || !dayjs.isDayjs(value)) {
    return value;
  }
  return toStringByPicker(value, picker, 'gmt');
};

const toLocalByPicker = (value: Dayjs, picker?: any) => {
  if (!value || !dayjs.isDayjs(value)) {
    return value;
  }
  return toStringByPicker(value, picker, 'local');
};

export interface Moment2strOptions {
  showTime?: boolean;
  gmt?: boolean;
  utc?: boolean;
  picker?: 'year' | 'month' | 'week' | 'quarter';
}

export const moment2str = (value?: Dayjs | null, options: Moment2strOptions = {}) => {
  const { showTime, gmt, picker, utc = true } = options;
  if (!value) {
    return value;
  }
  if (!utc) {
    const format = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
    return value.format(format);
  }
  if (showTime) {
    return gmt ? toGmt(value) : toLocal(value);
  }
  if (typeof gmt === 'boolean') {
    return gmt ? toGmtByPicker(value, picker) : toLocalByPicker(value, picker);
  }
  return toLocalByPicker(value, picker);
};

export const mapDatePicker = function () {
  return (props: any) => {
    const format = getDefaultFormat(props) as any;
    const onChange = props.onChange;

    return {
      ...props,
      format: format,
      value: str2moment(props.value, props),
      onChange: (value: Dayjs | null) => {
        if (onChange) {
          if (!props.showTime && value) {
            value = value.startOf('day');
          }
          onChange(moment2str(value, props));
        }
      },
    };
  };
};

export const mapRangePicker = function () {
  return (props: any) => {
    const format = getDefaultFormat(props) as any;
    const onChange = props.onChange;

    return {
      ...props,
      format: format,
      value: str2moment(props.value, props),
      onChange: (value: Dayjs[]) => {
        if (onChange) {
          onChange(
            value
              ? [moment2str(getRangeStart(value[0], props), props), moment2str(getRangeEnd(value[1], props), props)]
              : [],
          );
        }
      },
    } as any;
  };
};

function getRangeStart(value: Dayjs, options: Moment2strOptions) {
  const { showTime } = options;
  if (showTime) {
    return value;
  }
  return value.startOf('day');
}

function getRangeEnd(value: Dayjs, options: Moment2strOptions) {
  const { showTime } = options;
  if (showTime) {
    return value;
  }
  return value.endOf('day');
}

const getStart = (offset: any, unit: any) => {
  return dayjs()
    .add(offset, unit === 'isoWeek' ? 'week' : unit)
    .startOf(unit);
};

const getEnd = (offset: any, unit: any) => {
  return dayjs()
    .add(offset, unit === 'isoWeek' ? 'week' : unit)
    .endOf(unit);
};

export const getDateRanges = (props?: {
  /** 日期是否是 UTC 格式 */
  utc?: boolean;
  /** 如果为 true 则返回的值是一个字符串 */
  shouldBeString?: boolean;
}) => {
  if (props?.shouldBeString) {
    const toString = (date) => {
      if (Array.isArray(date)) {
        return date.map((d) => moment2str(d, { utc: props?.utc }));
      }
      return moment2str(date, { utc: props?.utc });
    };
    return {
      now: () => toString(dayjs()),
      today: (params?: any) => withParams(toString([getStart(0, 'day'), getEnd(0, 'day')]), params),
      yesterday: (params?: any) => withParams(toString([getStart(-1, 'day'), getEnd(-1, 'day')]), params),
      tomorrow: (params?: any) => withParams(toString([getStart(1, 'day'), getEnd(1, 'day')]), params),
      thisWeek: (params?: any) => withParams(toString([getStart(0, 'isoWeek'), getEnd(0, 'isoWeek')]), params),
      lastWeek: (params?: any) => withParams(toString([getStart(-1, 'isoWeek'), getEnd(-1, 'isoWeek')]), params),
      nextWeek: (params?: any) => withParams(toString([getStart(1, 'isoWeek'), getEnd(1, 'isoWeek')]), params),
      thisIsoWeek: (params?: any) => withParams(toString([getStart(0, 'isoWeek'), getEnd(0, 'isoWeek')]), params),
      lastIsoWeek: (params?: any) => withParams(toString([getStart(-1, 'isoWeek'), getEnd(-1, 'isoWeek')]), params),
      nextIsoWeek: (params?: any) => withParams(toString([getStart(1, 'isoWeek'), getEnd(1, 'isoWeek')]), params),
      thisMonth: (params?: any) => withParams(toString([getStart(0, 'month'), getEnd(0, 'month')]), params),
      lastMonth: (params?: any) => withParams(toString([getStart(-1, 'month'), getEnd(-1, 'month')]), params),
      nextMonth: (params?: any) => withParams(toString([getStart(1, 'month'), getEnd(1, 'month')]), params),
      thisQuarter: (params?: any) => withParams(toString([getStart(0, 'quarter'), getEnd(0, 'quarter')]), params),
      lastQuarter: (params?: any) => withParams(toString([getStart(-1, 'quarter'), getEnd(-1, 'quarter')]), params),
      nextQuarter: (params?: any) => withParams(toString([getStart(1, 'quarter'), getEnd(1, 'quarter')]), params),
      thisYear: (params?: any) => withParams(toString([getStart(0, 'year'), getEnd(0, 'year')]), params),
      lastYear: (params?: any) => withParams(toString([getStart(-1, 'year'), getEnd(-1, 'year')]), params),
      nextYear: (params?: any) => withParams(toString([getStart(1, 'year'), getEnd(1, 'year')]), params),
      last7Days: (params?: any) => withParams(toString([getStart(-6, 'days'), getEnd(0, 'days')]), params),
      next7Days: (params?: any) => withParams(toString([getStart(1, 'day'), getEnd(7, 'days')]), params),
      last30Days: (params?: any) => withParams(toString([getStart(-29, 'days'), getEnd(0, 'days')]), params),
      next30Days: (params?: any) => withParams(toString([getStart(1, 'day'), getEnd(30, 'days')]), params),
      last90Days: (params?: any) => withParams(toString([getStart(-89, 'days'), getEnd(0, 'days')]), params),
      next90Days: (params?: any) => withParams(toString([getStart(1, 'day'), getEnd(90, 'days')]), params),
    };
  }

  return {
    now: () => dayjs().toISOString(),
    today: (params?: any) => withParams([getStart(0, 'day'), getEnd(0, 'day')], params),
    yesterday: (params?: any) => withParams([getStart(-1, 'day'), getEnd(-1, 'day')], params),
    tomorrow: (params?: any) => withParams([getStart(1, 'day'), getEnd(1, 'day')], params),
    thisWeek: (params?: any) => withParams([getStart(0, 'isoWeek'), getEnd(0, 'isoWeek')], params),
    lastWeek: (params?: any) => withParams([getStart(-1, 'isoWeek'), getEnd(-1, 'isoWeek')], params),
    nextWeek: (params?: any) => withParams([getStart(1, 'isoWeek'), getEnd(1, 'isoWeek')], params),
    thisIsoWeek: (params?: any) => withParams([getStart(0, 'isoWeek'), getEnd(0, 'isoWeek')], params),
    lastIsoWeek: (params?: any) => withParams([getStart(-1, 'isoWeek'), getEnd(-1, 'isoWeek')], params),
    nextIsoWeek: (params?: any) => withParams([getStart(1, 'isoWeek'), getEnd(1, 'isoWeek')], params),
    thisMonth: (params?: any) => withParams([getStart(0, 'month'), getEnd(0, 'month')], params),
    lastMonth: (params?: any) => withParams([getStart(-1, 'month'), getEnd(-1, 'month')], params),
    nextMonth: (params?: any) => withParams([getStart(1, 'month'), getEnd(1, 'month')], params),
    thisQuarter: (params?: any) => withParams([getStart(0, 'quarter'), getEnd(0, 'quarter')], params),
    lastQuarter: (params?: any) => withParams([getStart(-1, 'quarter'), getEnd(-1, 'quarter')], params),
    nextQuarter: (params?: any) => withParams([getStart(1, 'quarter'), getEnd(1, 'quarter')], params),
    thisYear: (params?: any) => withParams([getStart(0, 'year'), getEnd(0, 'year')], params),
    lastYear: (params?: any) => withParams([getStart(-1, 'year'), getEnd(-1, 'year')], params),
    nextYear: (params?: any) => withParams([getStart(1, 'year'), getEnd(1, 'year')], params),
    last7Days: (params?: any) => withParams([getStart(-6, 'days'), getEnd(0, 'days')], params),
    next7Days: (params?: any) => withParams([getStart(1, 'day'), getEnd(7, 'days')], params),
    last30Days: (params?: any) => withParams([getStart(-29, 'days'), getEnd(0, 'days')], params),
    next30Days: (params?: any) => withParams([getStart(1, 'day'), getEnd(30, 'days')], params),
    last90Days: (params?: any) => withParams([getStart(-89, 'days'), getEnd(0, 'days')], params),
    next90Days: (params?: any) => withParams([getStart(1, 'day'), getEnd(90, 'days')], params),
  };
};

function withParams(value: any[], params: { fieldOperator?: string }) {
  if (params?.fieldOperator === '$dateBetween') {
    return value;
  }

  return value[0];
}
