/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parseExpression } from 'cron-parser';
import dayjs from 'dayjs';
import { calendarCronOptions } from '../../shared/calendar';
import { createCalendarRangeFilter, formatDate } from '../../client-v2/models/utils';

describe('calendarRecurrence', () => {
  it('loads earlier recurrence records for the visible week', () => {
    const range = { start: new Date(2025, 10, 3), end: new Date(2025, 10, 9) };
    const filter = createCalendarRangeFilter({ start: 'starts' }, range, true);
    expect(filter).toHaveProperty('$or.1.cron.$notEmpty', true);
    expect(filter).toHaveProperty('$or.1.starts.$lte', formatDate(dayjs(range.end)));
  });
  it.each(['0 0 * * 1-6', '0 0 0 * * 1-6'])('respects the event time zone across DST for %s', (cron) => {
    const start = new Date('2025-10-01T07:00:00Z');
    const rangeStart = new Date('2025-10-27T07:00:00Z');
    const end = new Date('2025-11-09T07:59:59Z');
    const interval = parseExpression(cron, calendarCronOptions(start, rangeStart, end, 'America/Los_Angeles'));
    const dates: string[] = [];
    while (interval.hasNext()) dates.push(interval.next().value.toDate().toISOString());
    expect(dates).toHaveLength(12);
    expect(dates[0]).toBe('2025-10-27T07:00:00.000Z');
    expect(dates[5]).toBe('2025-11-01T07:00:00.000Z');
    expect(dates[6]).toBe('2025-11-03T08:00:00.000Z');
    expect(dates[11]).toBe('2025-11-08T08:00:00.000Z');
    const legacy = parseExpression(cron, calendarCronOptions(start, rangeStart, end));
    expect(legacy.next().value.toDate().getUTCHours()).toBe(0);
  });
});
