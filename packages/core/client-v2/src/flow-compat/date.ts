/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import 'dayjs/plugin/isoWeek';
import 'dayjs/plugin/quarterOfYear';
import dayjs from 'dayjs';

type DateRangeUnit = 'day' | 'days' | 'month' | 'year' | 'quarter' | 'isoWeek';

export function inferPickerType(dateString: string, picker?): 'year' | 'month' | 'quarter' | 'date' {
  if (/^\d{4}$/.test(dateString)) {
    return 'year';
  } else if (/^\d{4}-\d{2}$/.test(dateString)) {
    return 'month';
  } else if (/^\d{4}Q[1-4]$/.test(dateString)) {
    return 'quarter';
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return 'date';
  } else {
    return picker || 'date';
  }
}

const getStart = (offset: number, unit: DateRangeUnit) => {
  if (unit === 'isoWeek') {
    return dayjs().add(offset, 'week').startOf('isoWeek');
  }

  if (unit === 'quarter') {
    return dayjs().add(offset, 'quarter').startOf('quarter');
  }

  return dayjs().add(offset, unit).startOf(unit);
};

const getEnd = (offset: number, unit: DateRangeUnit) => {
  if (unit === 'isoWeek') {
    return dayjs().add(offset, 'week').endOf('isoWeek');
  }

  if (unit === 'quarter') {
    return dayjs().add(offset, 'quarter').endOf('quarter');
  }

  return dayjs().add(offset, unit).endOf(unit);
};

function withParams(value: any[], params?: { fieldOperator?: string; isParsingVariable?: boolean }) {
  if (params?.isParsingVariable && params?.fieldOperator && params.fieldOperator !== '$dateBetween') {
    return value[0];
  }

  return value;
}

export const getDateRanges = () => {
  return {
    now: () => dayjs().toISOString(),
    today: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(0, 'day'), getEnd(0, 'day')], params),
    yesterday: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(-1, 'day'), getEnd(-1, 'day')], params),
    dayBeforeYesterday: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(-2, 'day'), getEnd(-2, 'day')], params),
    tomorrow: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(1, 'day'), getEnd(1, 'day')], params),
    thisWeek: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(0, 'isoWeek'), getEnd(0, 'isoWeek')], params),
    lastWeek: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(-1, 'isoWeek'), getEnd(-1, 'isoWeek')], params),
    nextWeek: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(1, 'isoWeek'), getEnd(1, 'isoWeek')], params),
    thisIsoWeek: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(0, 'isoWeek'), getEnd(0, 'isoWeek')], params),
    lastIsoWeek: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(-1, 'isoWeek'), getEnd(-1, 'isoWeek')], params),
    nextIsoWeek: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(1, 'isoWeek'), getEnd(1, 'isoWeek')], params),
    thisMonth: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(0, 'month'), getEnd(0, 'month')], params),
    lastMonth: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(-1, 'month'), getEnd(-1, 'month')], params),
    nextMonth: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(1, 'month'), getEnd(1, 'month')], params),
    thisQuarter: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(0, 'quarter'), getEnd(0, 'quarter')], params),
    lastQuarter: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(-1, 'quarter'), getEnd(-1, 'quarter')], params),
    nextQuarter: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(1, 'quarter'), getEnd(1, 'quarter')], params),
    thisYear: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(0, 'year'), getEnd(0, 'year')], params),
    lastYear: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(-1, 'year'), getEnd(-1, 'year')], params),
    nextYear: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(1, 'year'), getEnd(1, 'year')], params),
    last7Days: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(-6, 'days'), getEnd(0, 'days')], params),
    next7Days: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(1, 'day'), getEnd(7, 'days')], params),
    last30Days: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(-29, 'days'), getEnd(0, 'days')], params),
    next30Days: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(1, 'day'), getEnd(30, 'days')], params),
    last90Days: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(-89, 'days'), getEnd(0, 'days')], params),
    next90Days: (params?: { fieldOperator?: string; isParsingVariable?: boolean }) =>
      withParams([getStart(1, 'day'), getEnd(90, 'days')], params),
  };
};
