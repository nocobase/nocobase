/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import {
  createCalendarRangeFilter,
  formatDate,
  getCalendarVisibleRange,
  normalizeCalendarFieldPath,
  parseCalendarWeekStart,
} from '../models/utils';

describe('calendar v2 utils', () => {
  it('should normalize field path values', () => {
    expect(normalizeCalendarFieldPath(['event', 'startAt'])).toBe('event.startAt');
    expect(normalizeCalendarFieldPath('startAt')).toBe('startAt');
    expect(normalizeCalendarFieldPath()).toBeUndefined();
  });

  it('should parse week start consistently', () => {
    expect(parseCalendarWeekStart(0)).toBe(0);
    expect(parseCalendarWeekStart('0')).toBe(0);
    expect(parseCalendarWeekStart(1)).toBe(1);
    expect(parseCalendarWeekStart(undefined)).toBe(1);
    expect(parseCalendarWeekStart('unexpected')).toBe(1);
  });

  it('should calculate visible month range with monday as week start', () => {
    const range = getCalendarVisibleRange(new Date(2024, 5, 15, 12, 0, 0), 'month', 1);

    expect(dayjs(range.start).format('YYYY-MM-DD HH:mm:ss')).toBe('2024-05-27 00:00:00');
    expect(dayjs(range.end).format('YYYY-MM-DD HH:mm:ss')).toBe('2024-06-30 23:59:59');
  });

  it('should calculate visible month range with sunday as week start', () => {
    const range = getCalendarVisibleRange(new Date(2024, 5, 15, 12, 0, 0), 'month', 0);

    expect(dayjs(range.start).format('YYYY-MM-DD HH:mm:ss')).toBe('2024-05-26 00:00:00');
    expect(dayjs(range.end).format('YYYY-MM-DD HH:mm:ss')).toBe('2024-07-06 23:59:59');
  });

  it('should create a simple range filter when only a start field exists', () => {
    const range = {
      start: new Date(2024, 5, 1, 0, 0, 0),
      end: new Date(2024, 5, 30, 23, 59, 59),
    };

    expect(createCalendarRangeFilter({ start: 'startAt' }, range)).toEqual({
      startAt: {
        $gte: formatDate(dayjs(range.start)),
        $lte: formatDate(dayjs(range.end)),
      },
    });
  });

  it('should create an overlap-aware range filter when start and end fields differ', () => {
    const range = {
      start: new Date(2024, 5, 1, 0, 0, 0),
      end: new Date(2024, 5, 30, 23, 59, 59),
    };

    expect(createCalendarRangeFilter({ start: ['event', 'startAt'], end: ['event', 'endAt'] }, range)).toEqual({
      $or: [
        {
          'event.startAt': {
            $gte: formatDate(dayjs(range.start)),
            $lte: formatDate(dayjs(range.end)),
          },
        },
        {
          'event.endAt': {
            $gte: formatDate(dayjs(range.start)),
            $lte: formatDate(dayjs(range.end)),
          },
        },
        {
          $and: [
            {
              'event.startAt': {
                $lte: formatDate(dayjs(range.start)),
              },
            },
            {
              'event.endAt': {
                $gte: formatDate(dayjs(range.end)),
              },
            },
          ],
        },
      ],
    });
  });
});
