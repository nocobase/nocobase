/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import { str2moment } from '@nocobase/utils/client';
import { getDateRanges, moment2str } from '../util';

describe('str2moment', () => {
  describe('string value', () => {
    test('gmt date', async () => {
      const m = str2moment('2022-06-21T00:00:00.000Z', { gmt: true });
      expect(m.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-06-21 00:00:00');
    });

    test('local date', async () => {
      const m = str2moment('2022-06-21T00:00:00.000Z');
      expect(m.toISOString()).toBe('2022-06-21T00:00:00.000Z');
    });

    test('value is null', async () => {
      const m = str2moment(null);
      expect(m).toBeNull();
    });

    test('picker is month', async () => {
      const m = str2moment('2022-06-01T00:00:00.000Z', { picker: 'month', gmt: true });
      expect(m.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-06-01 00:00:00');
    });
  });

  describe('array value', () => {
    test('gmt date', async () => {
      const arr = str2moment(['2022-06-21T00:00:00.000Z', '2022-06-21T00:00:00.000Z'], { gmt: true });
      for (const m of arr) {
        expect(m.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-06-21 00:00:00');
      }
    });

    test('local date', async () => {
      const arr = str2moment(['2022-06-21T00:00:00.000Z', '2022-06-21T00:00:00.000Z']);
      for (const m of arr) {
        expect(m.toISOString()).toBe('2022-06-21T00:00:00.000Z');
      }
    });
  });
});

describe('moment2str', () => {
  test('gmt date', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { showTime: true, gmt: true });
    expect(str).toBe('2023-06-21T10:10:00.000Z');
  });

  test('showTime is true, gmt is false', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { showTime: true, gmt: false });
    expect(str).toBe(m.toISOString());
  });

  test('gmt is true', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { gmt: true });
    expect(str).toBe('2023-06-21T10:10:00.000Z');
  });

  test('gmt is false', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { gmt: false });
    expect(str).toBe(dayjs('2023-06-21 10:10:00').toISOString());
  });

  test('gmt not configured', () => {
    const d = dayjs('2024-06-30');
    const str = moment2str(d);
    expect(str).toBe(dayjs('2024-06-30 00:00:00').toISOString());
  });

  test('with time', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { showTime: true });
    expect(str).toBe(m.toISOString());
  });

  test('picker is year, gmt is false', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { picker: 'year', gmt: false });
    expect(str).toBe(dayjs('2023-01-01 00:00:00').toISOString());
  });

  test('picker is year, gmt is true', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { picker: 'year', gmt: true });
    expect(str).toBe('2023-01-01T00:00:00.000Z');
  });

  test('picker is year', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { picker: 'year', gmt: true });
    expect(str).toBe('2023-01-01T00:00:00.000Z');
  });

  test('picker is quarter, gmt is false', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { picker: 'quarter', gmt: false });
    expect(str).toBe(dayjs('2023-04-01 00:00:00').toISOString());
  });

  test('picker is quarter, gmt is true', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { picker: 'quarter', gmt: true });
    expect(str).toBe('2023-04-01T00:00:00.000Z');
  });

  test('picker is month, gmt is false', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { picker: 'month', gmt: false });
    expect(str).toBe(dayjs('2023-06-01 00:00:00').toISOString());
  });

  test('picker is month, gmt is true', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { picker: 'month', gmt: true });
    expect(str).toBe('2023-06-01T00:00:00.000Z');
  });

  test('picker is month gmt is false', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { picker: 'month', gmt: false });
    expect(str).toBe(dayjs('2023-06-01 00:00:00').toISOString());
  });

  test('picker is week, gmt is false', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { picker: 'week', gmt: false });
    expect(str).toBe(dayjs('2023-06-19 00:00:00').toISOString());
  });

  test('picker is week, gmt is true', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { picker: 'week', gmt: true });
    expect(str).toBe('2023-06-19T00:00:00.000Z');
  });

  test('value is null', async () => {
    const m = moment2str(null);
    expect(m).toBeNull();
  });
});

// CI 环境会报错，可能因为时区问题
describe.skip('getDateRanges', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-15T10:10:10.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('now', () => {
    const now = getDateRanges().now();
    expect(now.valueOf()).toMatchInlineSnapshot(`"2024-03-15T10:10:10.000Z"`);
  });

  test('today', () => {
    const [start, end] = getDateRanges().today();
    expect(start.valueOf()).toMatchInlineSnapshot(`1710432000000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1710518399999`);
  });

  test('lastWeek', () => {
    const [start, end] = getDateRanges().lastWeek();
    expect(start.valueOf()).toMatchInlineSnapshot(`1709481600000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1710086399999`);
  });

  test('thisWeek', () => {
    const [start, end] = getDateRanges().thisWeek();
    expect(start.valueOf()).toMatchInlineSnapshot(`1710086400000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1710691199999`);
  });

  test('nextWeek', () => {
    const [start, end] = getDateRanges().nextWeek();
    expect(start.valueOf()).toMatchInlineSnapshot(`1710691200000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1711295999999`);
  });

  test('thisIsoWeek', () => {
    const [start, end] = getDateRanges().thisIsoWeek();
    expect(start.valueOf()).toMatchInlineSnapshot(`1710086400000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1710691199999`);
  });

  test('lastIsoWeek', () => {
    const [start, end] = getDateRanges().lastIsoWeek();
    expect(start.valueOf()).toMatchInlineSnapshot(`1709481600000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1710086399999`);
  });

  test('nextIsoWeek', () => {
    const [start, end] = getDateRanges().nextIsoWeek();
    expect(start.valueOf()).toMatchInlineSnapshot(`1710691200000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1711295999999`);
  });

  test('lastMonth', () => {
    const [start, end] = getDateRanges().lastMonth();
    expect(start.valueOf()).toMatchInlineSnapshot(`1706716800000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1709222399999`);
  });

  test('thisMonth', () => {
    const [start, end] = getDateRanges().thisMonth();
    expect(start.valueOf()).toMatchInlineSnapshot(`1709222400000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1711900799999`);
  });

  test('nextMonth', () => {
    const [start, end] = getDateRanges().nextMonth();
    expect(start.valueOf()).toMatchInlineSnapshot(`1711900800000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1714492799999`);
  });

  test('lastQuarter', () => {
    const [start, end] = getDateRanges().lastQuarter();
    expect(start.valueOf()).toMatchInlineSnapshot(`1696089600000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1704038399999`);
  });

  test('thisQuarter', () => {
    const [start, end] = getDateRanges().thisQuarter();
    expect(start.valueOf()).toMatchInlineSnapshot(`1704038400000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1711900799999`);
  });

  test('nextQuarter', () => {
    const [start, end] = getDateRanges().nextQuarter();
    expect(start.valueOf()).toMatchInlineSnapshot(`1711900800000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1719763199999`);
  });

  test('lastYear', () => {
    const [start, end] = getDateRanges().lastYear();
    expect(start.valueOf()).toMatchInlineSnapshot(`1672502400000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1704038399999`);
  });

  test('thisYear', () => {
    const [start, end] = getDateRanges().thisYear();
    expect(start.valueOf()).toMatchInlineSnapshot(`1704038400000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1735660799999`);
  });

  test('nextYear', () => {
    const [start, end] = getDateRanges().nextYear();
    expect(start.valueOf()).toMatchInlineSnapshot(`1735660800000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1767196799999`);
  });

  test('last7Days', () => {
    const [start, end] = getDateRanges().last7Days();
    expect(start.valueOf()).toMatchInlineSnapshot(`1709913600000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1710518399999`);
  });

  test('next7Days', () => {
    const [start, end] = getDateRanges().next7Days();
    expect(start.valueOf()).toMatchInlineSnapshot(`1710518400000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1711123199999`);
  });

  test('last30Days', () => {
    const [start, end] = getDateRanges().last30Days();
    expect(start.valueOf()).toMatchInlineSnapshot(`1707926400000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1710518399999`);
  });

  test('next30Days', () => {
    const [start, end] = getDateRanges().next30Days();
    expect(start.valueOf()).toMatchInlineSnapshot(`1710518400000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1713110399999`);
  });

  test('last90Days', () => {
    const [start, end] = getDateRanges().last90Days();
    expect(start.valueOf()).toMatchInlineSnapshot(`1702742400000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1710518399999`);
  });

  test('next90Days', () => {
    const [start, end] = getDateRanges().next90Days();
    expect(start.valueOf()).toMatchInlineSnapshot(`1710518400000`);
    expect(end.valueOf()).toMatchInlineSnapshot(`1718294399999`);
  });
});
