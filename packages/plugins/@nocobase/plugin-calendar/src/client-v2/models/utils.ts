/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';

export const CALENDAR_RANGE_FILTER_GROUP = '__calendar_view_range__';

export type CalendarVisibleRange = {
  start: Date;
  end: Date;
};

export const normalizeCalendarFieldPath = (fieldPath?: string | string[]) => {
  if (Array.isArray(fieldPath)) {
    return fieldPath.join('.');
  }

  return fieldPath;
};

export const parseCalendarWeekStart = (weekStart?: number | string) => {
  const parsed = Number(weekStart);
  return parsed === 0 ? 0 : 1;
};

const alignCalendarWeekStart = (value: dayjs.Dayjs, weekStart = 1) => {
  const offset = (value.day() - weekStart + 7) % 7;
  return value.subtract(offset, 'day').startOf('day');
};

const alignCalendarWeekEnd = (value: dayjs.Dayjs, weekStart = 1) => {
  const weekEnd = (weekStart + 6) % 7;
  const offset = (weekEnd - value.day() + 7) % 7;
  return value.add(offset, 'day').endOf('day');
};

export const getCalendarVisibleRange = (
  value: Date | string,
  view: 'month' | 'week' | 'day' | string = 'month',
  weekStart?: number | string,
): CalendarVisibleRange => {
  const current = dayjs(value);
  const normalizedWeekStart = parseCalendarWeekStart(weekStart);

  if (view === 'day') {
    return {
      start: current.startOf('day').toDate(),
      end: current.endOf('day').toDate(),
    };
  }

  if (view === 'week') {
    const start = alignCalendarWeekStart(current, normalizedWeekStart);
    return {
      start: start.toDate(),
      end: start.add(6, 'day').endOf('day').toDate(),
    };
  }

  const monthStart = alignCalendarWeekStart(current.startOf('month'), normalizedWeekStart);
  const monthEnd = alignCalendarWeekEnd(current.endOf('month'), normalizedWeekStart);

  return {
    start: monthStart.toDate(),
    end: monthEnd.toDate(),
  };
};

export const formatDate = (date: dayjs.Dayjs) => {
  return date.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
};

export const createCalendarRangeFilter = (
  fieldNames: {
    start?: string | string[];
    end?: string | string[];
  },
  range: CalendarVisibleRange,
) => {
  const startField = normalizeCalendarFieldPath(fieldNames?.start);
  const endField = normalizeCalendarFieldPath(fieldNames?.end);

  if (!startField) {
    return null;
  }

  const startValue = formatDate(dayjs(range.start));
  const endValue = formatDate(dayjs(range.end));
  const startBetween = {
    [startField]: {
      $gte: startValue,
      $lte: endValue,
    },
  };

  if (!endField || endField === startField) {
    return startBetween;
  }

  return {
    $or: [
      startBetween,
      {
        [endField]: {
          $gte: startValue,
          $lte: endValue,
        },
      },
      {
        $and: [
          {
            [startField]: {
              $lte: startValue,
            },
          },
          {
            [endField]: {
              $gte: endValue,
            },
          },
        ],
      },
    ],
  };
};
