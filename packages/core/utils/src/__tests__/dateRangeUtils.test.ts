/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getDayRangeByParams } from '../client';
import dayjs from 'dayjs';

describe('getDayRangeByParams', () => {
  const format = 'YYYY-MM-DD HH:mm:ss';

  it('should return today range in Asia/Shanghai', () => {
    const [start, end] = getDayRangeByParams({ type: 'today', timezone: 'Asia/Shanghai' });
    const now = dayjs().tz('Asia/Shanghai');
    expect(start).toBe(now.startOf('day').format(format));
    expect(end).toBe(now.endOf('day').format(format));
  });

  it('should return yesterday range in UTC', () => {
    const [start, end] = getDayRangeByParams({ type: 'yesterday', timezone: 'UTC' });
    const now = dayjs().utc().subtract(1, 'day');
    expect(start).toBe(now.startOf('day').format(format));
    expect(end).toBe(now.endOf('day').format(format));
  });

  it('should return nextWeek range using offset timezone +08:00', () => {
    const [start, end] = getDayRangeByParams({ type: 'nextWeek', timezone: '+08:00', unit: 'week' });
    const now = dayjs()
      .utcOffset(8 * 60)
      .add(1, 'week');
    expect(start).toBe(now.startOf('isoWeek').format(format));
    expect(end).toBe(now.endOf('isoWeek').format(format));
  });

  it('should return future range by 2 months', () => {
    const [start, end] = getDayRangeByParams({
      type: 'future',
      unit: 'month',
      number: 2,
      timezone: 'UTC',
    });
    const now = dayjs().utc().add(2, 'month');
    expect(start).toBe(now.startOf('month').format(format));
    expect(end).toBe(now.endOf('month').format(format));
  });

  it('should throw error for invalid timezone', () => {
    expect(() => getDayRangeByParams({ type: 'today', timezone: 'Invalid/Zone' })).toThrow(
      'Invalid time zone specified: Invalid/Zone',
    );
  });

  it('should return lastQuarter in -05:00 timezone', () => {
    const [start, end] = getDayRangeByParams({
      type: 'lastQuarter',
      timezone: '-05:00',
    });
    const now = dayjs()
      .utcOffset(-5 * 60)
      .subtract(1, 'quarter');
    expect(start).toBe(now.startOf('quarter').format(format));
    expect(end).toBe(now.endOf('quarter').format(format));
  });
});
