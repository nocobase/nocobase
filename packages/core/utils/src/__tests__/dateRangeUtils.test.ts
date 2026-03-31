/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getDayRangeByParams } from '../client';

dayjs.extend(utc);
dayjs.extend(timezone);

// 固定当前时间为 2025-05-22 15:00:00 +08:00
const mockNow = dayjs.tz('2025-05-22 15:00:00', 'Asia/Shanghai');
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

const originalDateNow = Date.now;
Date.now = () => mockNow.valueOf();

const cases = [
  {
    title: 'Today',
    input: { type: 'today', timezone: '+08:00' },
    expected: ['2025-05-22 00:00:00', '2025-05-22 23:59:59'],
  },
  {
    title: 'Yesterday',
    input: { type: 'yesterday', timezone: '+08:00' },
    expected: ['2025-05-21 00:00:00', '2025-05-21 23:59:59'],
  },
  {
    title: 'Tomorrow',
    input: { type: 'tomorrow', timezone: '+08:00' },
    expected: ['2025-05-23 00:00:00', '2025-05-23 23:59:59'],
  },

  {
    title: 'This Week',
    input: { type: 'thisWeek', timezone: '+08:00' },
    expected: ['2025-05-19 00:00:00', '2025-05-25 23:59:59'],
  },
  {
    title: 'Last Week',
    input: { type: 'lastWeek', timezone: '+08:00' },
    expected: ['2025-05-12 00:00:00', '2025-05-18 23:59:59'],
  },
  {
    title: 'Next Week',
    input: { type: 'nextWeek', timezone: '+08:00' },
    expected: ['2025-05-26 00:00:00', '2025-06-01 23:59:59'],
  },

  {
    title: 'This Month',
    input: { type: 'thisMonth', timezone: '+08:00' },
    expected: ['2025-05-01 00:00:00', '2025-05-31 23:59:59'],
  },
  {
    title: 'Last Month',
    input: { type: 'lastMonth', timezone: '+08:00' },
    expected: ['2025-04-01 00:00:00', '2025-04-30 23:59:59'],
  },
  {
    title: 'Next Month',
    input: { type: 'nextMonth', timezone: '+08:00' },
    expected: ['2025-06-01 00:00:00', '2025-06-30 23:59:59'],
  },

  {
    title: 'This Quarter',
    input: { type: 'thisQuarter', timezone: '+08:00' },
    expected: ['2025-04-01 00:00:00', '2025-06-30 23:59:59'],
  },
  {
    title: 'Last Quarter',
    input: { type: 'lastQuarter', timezone: '+08:00' },
    expected: ['2025-01-01 00:00:00', '2025-03-31 23:59:59'],
  },
  {
    title: 'Next Quarter',
    input: { type: 'nextQuarter', timezone: '+08:00' },
    expected: ['2025-07-01 00:00:00', '2025-09-30 23:59:59'],
  },

  {
    title: 'This Year',
    input: { type: 'thisYear', timezone: '+08:00' },
    expected: ['2025-01-01 00:00:00', '2025-12-31 23:59:59'],
  },
  {
    title: 'Last Year',
    input: { type: 'lastYear', timezone: '+08:00' },
    expected: ['2024-01-01 00:00:00', '2024-12-31 23:59:59'],
  },
  {
    title: 'Next Year',
    input: { type: 'nextYear', timezone: '+08:00' },
    expected: ['2026-01-01 00:00:00', '2026-12-31 23:59:59'],
  },
  {
    title: 'past one calendar week → 上周一到周日',
    input: { type: 'past', unit: 'week', number: 1, timezone: '+08:00' },
    expected: ['2025-05-12 00:00:00', '2025-05-18 23:59:59'],
  },
  {
    title: 'past one day → 昨天',
    input: { type: 'past', unit: 'day', number: 1, timezone: '+08:00' },
    expected: ['2025-05-21 00:00:00', '2025-05-21 23:59:59'],
  },
  {
    title: 'past one calendar month → 上月整月',
    input: { type: 'past', unit: 'month', number: 1, timezone: '+08:00' },
    expected: ['2025-04-01 00:00:00', '2025-04-30 23:59:59'],
  },
  {
    title: 'past one calendar year → 去年',
    input: { type: 'past', unit: 'year', number: 1, timezone: '+08:00' },
    expected: ['2024-01-01 00:00:00', '2024-12-31 23:59:59'],
  },
  {
    title: 'next one calendar month → 下月整月',
    input: { type: 'next', unit: 'month', number: 1, timezone: '+08:00' },
    expected: ['2025-06-01 00:00:00', '2025-06-30 23:59:59'],
  },
  {
    title: 'next two calendar months → 下两个月整月',
    input: { type: 'next', unit: 'month', number: 2, timezone: '+08:00' },
    expected: ['2025-06-01 00:00:00', '2025-07-31 23:59:59'],
  },
];

describe('getOffsetRangeByParams', () => {
  cases.forEach(({ title, input, expected }) => {
    it(title, () => {
      const result = getDayRangeByParams(input as any);
      if (result[0] !== expected[0] || result[1] !== expected[1]) {
        console.error(`❌ ${title}\nExpected: ${expected}\nReceived: ${result}`);
      } else {
        console.log(`✅ ${title}`);
      }
    });
  });
});

// 恢复 Date.now
Date.now = originalDateNow;
