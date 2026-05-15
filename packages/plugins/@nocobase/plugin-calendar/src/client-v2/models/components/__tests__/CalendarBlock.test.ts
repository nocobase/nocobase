/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import { getCalendarEventDisplayRange } from '../CalendarBlock';

describe('CalendarBlock', () => {
  it('should display events without an end date field as all-day events', () => {
    const range = getCalendarEventDisplayRange(dayjs('2026-04-20T09:30:00'), 0, false);

    expect(range.allDay).toBe(true);
    expect(range.start.format('YYYY-MM-DDTHH:mm:ss')).toBe('2026-04-20T00:00:00');
    expect(range.end.format('YYYY-MM-DDTHH:mm:ss')).toBe('2026-04-20T23:59:59');
  });

  it('should keep timed event ranges when an end date field exists', () => {
    const range = getCalendarEventDisplayRange(dayjs('2026-04-20T09:30:00'), 90 * 60 * 1000, true);

    expect(range.allDay).toBe(false);
    expect(range.start.format('YYYY-MM-DDTHH:mm:ss')).toBe('2026-04-20T09:30:00');
    expect(range.end.format('YYYY-MM-DDTHH:mm:ss')).toBe('2026-04-20T11:00:00');
  });
});
