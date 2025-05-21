/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getDayRangeByParams, getOffsetRangeByParams } from '../client';
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
    const now = dayjs().startOf('month'); // 当前月起始
    const expectedEnd = now.add(1, 'month').endOf('month'); // 未来2个月，实际是当前月 + 下一个月的结束
    expect(start).toBe(now.format('YYYY-MM-DD HH:mm:ss'));
    expect(end).toBe(expectedEnd.format('YYYY-MM-DD HH:mm:ss'));
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

describe('getOffsetRangeByParams', () => {
  it('应返回过去1天的起止时间', () => {
    const [start, end] = getOffsetRangeByParams({ type: 'past', unit: 'day', number: 1 });
    const now = dayjs();
    expect(start).toBe(now.startOf('day').format('YYYY-MM-DD HH:mm:ss'));
    expect(end).toBe(now.endOf('day').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('应返回未来3个月的起止时间', () => {
    const [start, end] = getOffsetRangeByParams({ type: 'future', unit: 'month', number: 3 });
    const now = dayjs().startOf('month');
    const expectedEnd = now.add(2, 'month').endOf('month');
    expect(start).toBe(now.format('YYYY-MM-DD HH:mm:ss'));
    expect(end).toBe(expectedEnd.format('YYYY-MM-DD HH:mm:ss'));
  });

  it('应正确处理 isoWeek 单位', () => {
    const [start, end] = getOffsetRangeByParams({ type: 'past', unit: 'week', number: 2 });
    const now = dayjs();
    const expectedStart = now.startOf('isoWeek').subtract(1, 'week');
    const expectedEnd = now.endOf('isoWeek');
    expect(start).toBe(expectedStart.format('YYYY-MM-DD HH:mm:ss'));
    expect(end).toBe(expectedEnd.format('YYYY-MM-DD HH:mm:ss'));
  });

  it('应支持自定义 IANA 时区（如 Asia/Shanghai）', () => {
    const [start, end] = getOffsetRangeByParams({
      type: 'past',
      unit: 'day',
      number: 1,
      timezone: 'Asia/Shanghai',
    });
    const now = dayjs().tz('Asia/Shanghai');
    expect(start).toBe(now.startOf('day').format('YYYY-MM-DD HH:mm:ss'));
    expect(end).toBe(now.endOf('day').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('应支持 UTC 偏移时区（如 +08:00）', () => {
    const [start, end] = getOffsetRangeByParams({
      type: 'future',
      unit: 'day',
      number: 1,
      timezone: '+08:00',
    });
    const now = dayjs().utcOffset(8 * 60);
    expect(start).toBe(now.startOf('day').format('YYYY-MM-DD HH:mm:ss'));
    expect(end).toBe(now.endOf('day').format('YYYY-MM-DD HH:mm:ss'));
  });

  it('当 type 非法时应抛出错误', () => {
    expect(() => {
      getOffsetRangeByParams({ type: 'invalid' as any });
    }).toThrow('Unsupported type: invalid');
  });
});
