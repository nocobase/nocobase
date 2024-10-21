/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import { getDateRanges, moment2str } from '../util';

describe('getDateRanges', () => {
  const dateRanges = getDateRanges();

  it('today', () => {
    const [start, end] = dateRanges.today();
    expect(start.toISOString()).toBe(dayjs().startOf('day').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('day').toISOString());
  });

  test('yesterday', () => {
    const [start, end] = dateRanges.yesterday();
    expect(dayjs(start).isSame(dayjs().subtract(1, 'day'), 'day')).toBe(true);
    expect(dayjs(end).isSame(dayjs().subtract(1, 'day'), 'day')).toBe(true);
  });

  test('tomorrow', () => {
    const [start, end] = dateRanges.tomorrow();
    expect(dayjs(start).isSame(dayjs().add(1, 'day'), 'day')).toBe(true);
    expect(dayjs(end).isSame(dayjs().add(1, 'day'), 'day')).toBe(true);
  });

  it('lastWeek', () => {
    const [start, end] = dateRanges.lastWeek();
    expect(start.toISOString()).toBe(dayjs().add(-1, 'week').startOf('isoWeek').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(-1, 'week').endOf('isoWeek').toISOString());
  });

  it('thisWeek', () => {
    const [start, end] = dateRanges.thisWeek();
    expect(start.toISOString()).toBe(dayjs().startOf('isoWeek').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('isoWeek').toISOString());
  });

  it('nextWeek', () => {
    const [start, end] = dateRanges.nextWeek();
    expect(start.toISOString()).toBe(dayjs().add(1, 'week').startOf('isoWeek').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(1, 'week').endOf('isoWeek').toISOString());
  });

  it('lastMonth', () => {
    const [start, end] = dateRanges.lastMonth();
    expect(start.toISOString()).toBe(dayjs().add(-1, 'month').startOf('month').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(-1, 'month').endOf('month').toISOString());
  });

  it('thisMonth', () => {
    const [start, end] = dateRanges.thisMonth();
    expect(start.toISOString()).toBe(dayjs().startOf('month').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('month').toISOString());
  });

  it('nextMonth', () => {
    const [start, end] = dateRanges.nextMonth();
    expect(start.toISOString()).toBe(dayjs().add(1, 'month').startOf('month').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(1, 'month').endOf('month').toISOString());
  });

  it('lastQuarter', () => {
    const [start, end] = dateRanges.lastQuarter();
    expect(start.toISOString()).toBe(dayjs().add(-1, 'quarter').startOf('quarter').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(-1, 'quarter').endOf('quarter').toISOString());
  });

  it('thisQuarter', () => {
    const [start, end] = dateRanges.thisQuarter();
    expect(start.toISOString()).toBe(dayjs().startOf('quarter').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('quarter').toISOString());
  });

  it('nextQuarter', () => {
    const [start, end] = dateRanges.nextQuarter();
    expect(start.toISOString()).toBe(dayjs().add(1, 'quarter').startOf('quarter').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(1, 'quarter').endOf('quarter').toISOString());
  });

  it('lastYear', () => {
    const [start, end] = dateRanges.lastYear();
    expect(start.toISOString()).toBe(dayjs().add(-1, 'year').startOf('year').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(-1, 'year').endOf('year').toISOString());
  });

  it('thisYear', () => {
    const [start, end] = dateRanges.thisYear();
    expect(start.toISOString()).toBe(dayjs().startOf('year').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('year').toISOString());
  });

  it('nextYear', () => {
    const [start, end] = dateRanges.nextYear();
    expect(start.toISOString()).toBe(dayjs().add(1, 'year').startOf('year').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(1, 'year').endOf('year').toISOString());
  });

  it('last7Days', () => {
    const [start, end] = dateRanges.last7Days();
    expect(start.toISOString()).toBe(dayjs().add(-6, 'days').startOf('days').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('days').toISOString());
  });

  it('next7Days', () => {
    const [start, end] = dateRanges.next7Days();
    expect(start.toISOString()).toBe(dayjs().add(1, 'day').startOf('day').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(7, 'days').endOf('days').toISOString());
  });

  it('last30Days', () => {
    const [start, end] = dateRanges.last30Days();
    expect(start.toISOString()).toBe(dayjs().add(-29, 'days').startOf('days').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('days').toISOString());
  });

  it('next30Days', () => {
    const [start, end] = dateRanges.next30Days();
    expect(start.toISOString()).toBe(dayjs().add(1, 'day').startOf('day').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(30, 'days').endOf('days').toISOString());
  });

  it('last90Days', () => {
    const [start, end] = dateRanges.last90Days();
    expect(start.toISOString()).toBe(dayjs().add(-89, 'days').startOf('days').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('days').toISOString());
  });

  it('next90Days', () => {
    const [start, end] = dateRanges.next90Days();
    expect(start.toISOString()).toBe(dayjs().add(1, 'day').startOf('day').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(90, 'days').endOf('days').toISOString());
  });
});

describe('getDateRanges: fieldOperator is $dateBetween', () => {
  const dateRanges = getDateRanges();

  it('today', () => {
    const [start, end] = dateRanges.today({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().startOf('day').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('day').toISOString());
  });

  test('yesterday', () => {
    const [start, end] = dateRanges.yesterday({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(dayjs(start).isSame(dayjs().subtract(1, 'day'), 'day')).toBe(true);
    expect(dayjs(end).isSame(dayjs().subtract(1, 'day'), 'day')).toBe(true);
  });

  test('tomorrow', () => {
    const [start, end] = dateRanges.tomorrow({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(dayjs(start).isSame(dayjs().add(1, 'day'), 'day')).toBe(true);
    expect(dayjs(end).isSame(dayjs().add(1, 'day'), 'day')).toBe(true);
  });

  it('lastWeek', () => {
    const [start, end] = dateRanges.lastWeek({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-1, 'week').startOf('isoWeek').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(-1, 'week').endOf('isoWeek').toISOString());
  });

  it('thisWeek', () => {
    const [start, end] = dateRanges.thisWeek({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().startOf('isoWeek').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('isoWeek').toISOString());
  });

  it('nextWeek', () => {
    const [start, end] = dateRanges.nextWeek({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'week').startOf('isoWeek').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(1, 'week').endOf('isoWeek').toISOString());
  });

  it('lastMonth', () => {
    const [start, end] = dateRanges.lastMonth({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-1, 'month').startOf('month').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(-1, 'month').endOf('month').toISOString());
  });

  it('thisMonth', () => {
    const [start, end] = dateRanges.thisMonth({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().startOf('month').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('month').toISOString());
  });

  it('nextMonth', () => {
    const [start, end] = dateRanges.nextMonth({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'month').startOf('month').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(1, 'month').endOf('month').toISOString());
  });

  it('lastQuarter', () => {
    const [start, end] = dateRanges.lastQuarter({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-1, 'quarter').startOf('quarter').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(-1, 'quarter').endOf('quarter').toISOString());
  });

  it('thisQuarter', () => {
    const [start, end] = dateRanges.thisQuarter({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().startOf('quarter').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('quarter').toISOString());
  });

  it('nextQuarter', () => {
    const [start, end] = dateRanges.nextQuarter({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'quarter').startOf('quarter').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(1, 'quarter').endOf('quarter').toISOString());
  });

  it('lastYear', () => {
    const [start, end] = dateRanges.lastYear({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-1, 'year').startOf('year').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(-1, 'year').endOf('year').toISOString());
  });

  it('thisYear', () => {
    const [start, end] = dateRanges.thisYear({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().startOf('year').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('year').toISOString());
  });

  it('nextYear', () => {
    const [start, end] = dateRanges.nextYear({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'year').startOf('year').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(1, 'year').endOf('year').toISOString());
  });

  it('last7Days', () => {
    const [start, end] = dateRanges.last7Days({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-6, 'days').startOf('days').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('days').toISOString());
  });

  it('next7Days', () => {
    const [start, end] = dateRanges.next7Days({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'day').startOf('day').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(7, 'days').endOf('days').toISOString());
  });

  it('last30Days', () => {
    const [start, end] = dateRanges.last30Days({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-29, 'days').startOf('days').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('days').toISOString());
  });

  it('next30Days', () => {
    const [start, end] = dateRanges.next30Days({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'day').startOf('day').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(30, 'days').endOf('days').toISOString());
  });

  it('last90Days', () => {
    const [start, end] = dateRanges.last90Days({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-89, 'days').startOf('days').toISOString());
    expect(end.toISOString()).toBe(dayjs().endOf('days').toISOString());
  });

  it('next90Days', () => {
    const [start, end] = dateRanges.next90Days({ fieldOperator: '$dateBetween', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'day').startOf('day').toISOString());
    expect(end.toISOString()).toBe(dayjs().add(90, 'days').endOf('days').toISOString());
  });
});

describe('getDateRanges: fieldOperator is not $dateBetween', () => {
  const dateRanges = getDateRanges();

  it('today', () => {
    const start = dateRanges.today({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().startOf('day').toISOString());
  });

  test('yesterday', () => {
    const start = dateRanges.yesterday({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(dayjs(start).isSame(dayjs().subtract(1, 'day'), 'day')).toBe(true);
  });

  test('tomorrow', () => {
    const start = dateRanges.tomorrow({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(dayjs(start).isSame(dayjs().add(1, 'day'), 'day')).toBe(true);
  });

  it('lastWeek', () => {
    const start = dateRanges.lastWeek({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-1, 'week').startOf('isoWeek').toISOString());
  });

  it('thisWeek', () => {
    const start = dateRanges.thisWeek({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().startOf('isoWeek').toISOString());
  });

  it('nextWeek', () => {
    const start = dateRanges.nextWeek({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'week').startOf('isoWeek').toISOString());
  });

  it('lastMonth', () => {
    const start = dateRanges.lastMonth({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-1, 'month').startOf('month').toISOString());
  });

  it('thisMonth', () => {
    const start = dateRanges.thisMonth({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().startOf('month').toISOString());
  });

  it('nextMonth', () => {
    const start = dateRanges.nextMonth({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'month').startOf('month').toISOString());
  });

  it('lastQuarter', () => {
    const start = dateRanges.lastQuarter({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-1, 'quarter').startOf('quarter').toISOString());
  });

  it('thisQuarter', () => {
    const start = dateRanges.thisQuarter({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().startOf('quarter').toISOString());
  });

  it('nextQuarter', () => {
    const start = dateRanges.nextQuarter({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'quarter').startOf('quarter').toISOString());
  });

  it('lastYear', () => {
    const start = dateRanges.lastYear({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-1, 'year').startOf('year').toISOString());
  });

  it('thisYear', () => {
    const start = dateRanges.thisYear({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().startOf('year').toISOString());
  });

  it('nextYear', () => {
    const start = dateRanges.nextYear({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'year').startOf('year').toISOString());
  });

  it('last7Days', () => {
    const start = dateRanges.last7Days({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-6, 'days').startOf('days').toISOString());
  });

  it('next7Days', () => {
    const start = dateRanges.next7Days({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'day').startOf('day').toISOString());
  });

  it('last30Days', () => {
    const start = dateRanges.last30Days({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-29, 'days').startOf('days').toISOString());
  });

  it('next30Days', () => {
    const start = dateRanges.next30Days({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'day').startOf('day').toISOString());
  });

  it('last90Days', () => {
    const start = dateRanges.last90Days({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(-89, 'days').startOf('days').toISOString());
  });

  it('next90Days', () => {
    const start = dateRanges.next90Days({ fieldOperator: '$dateOn', isParsingVariable: true });
    expect(start.toISOString()).toBe(dayjs().add(1, 'day').startOf('day').toISOString());
  });
});

describe('getDateRanges: shouldBeString is true and utc is false', () => {
  const dateRanges = getDateRanges({ shouldBeString: true, utc: false });

  it('today', () => {
    const [start, end] = dateRanges.today();
    expect(start).toBe(moment2str(dayjs().startOf('day'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().endOf('day'), { utc: false }));
  });

  test('yesterday', () => {
    const [start, end] = dateRanges.yesterday();
    expect(start).toBe(moment2str(dayjs().subtract(1, 'day').startOf('day'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().subtract(1, 'day').endOf('day'), { utc: false }));
  });

  test('tomorrow', () => {
    const [start, end] = dateRanges.tomorrow();
    expect(start).toBe(moment2str(dayjs().add(1, 'day').startOf('day'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().add(1, 'day').endOf('day'), { utc: false }));
  });

  it('lastWeek', () => {
    const [start, end] = dateRanges.lastWeek();
    expect(start).toBe(moment2str(dayjs().add(-1, 'week').startOf('isoWeek'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().add(-1, 'week').endOf('isoWeek'), { utc: false }));
  });

  it('thisWeek', () => {
    const [start, end] = dateRanges.thisWeek();
    expect(start).toBe(moment2str(dayjs().startOf('isoWeek'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().endOf('isoWeek'), { utc: false }));
  });

  it('nextWeek', () => {
    const [start, end] = dateRanges.nextWeek();
    expect(start).toBe(moment2str(dayjs().add(1, 'week').startOf('isoWeek'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().add(1, 'week').endOf('isoWeek'), { utc: false }));
  });

  it('lastMonth', () => {
    const [start, end] = dateRanges.lastMonth();
    expect(start).toBe(moment2str(dayjs().add(-1, 'month').startOf('month'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().add(-1, 'month').endOf('month'), { utc: false }));
  });

  it('thisMonth', () => {
    const [start, end] = dateRanges.thisMonth();
    expect(start).toBe(moment2str(dayjs().startOf('month'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().endOf('month'), { utc: false }));
  });

  it('nextMonth', () => {
    const [start, end] = dateRanges.nextMonth();
    expect(start).toBe(moment2str(dayjs().add(1, 'month').startOf('month'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().add(1, 'month').endOf('month'), { utc: false }));
  });

  it('lastQuarter', () => {
    const [start, end] = dateRanges.lastQuarter();
    expect(start).toBe(moment2str(dayjs().add(-1, 'quarter').startOf('quarter'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().add(-1, 'quarter').endOf('quarter'), { utc: false }));
  });

  it('thisQuarter', () => {
    const [start, end] = dateRanges.thisQuarter();
    expect(start).toBe(moment2str(dayjs().startOf('quarter'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().endOf('quarter'), { utc: false }));
  });

  it('nextQuarter', () => {
    const [start, end] = dateRanges.nextQuarter();
    expect(start).toBe(moment2str(dayjs().add(1, 'quarter').startOf('quarter'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().add(1, 'quarter').endOf('quarter'), { utc: false }));
  });

  it('lastYear', () => {
    const [start, end] = dateRanges.lastYear();
    expect(start).toBe(moment2str(dayjs().add(-1, 'year').startOf('year'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().add(-1, 'year').endOf('year'), { utc: false }));
  });

  it('thisYear', () => {
    const [start, end] = dateRanges.thisYear();
    expect(start).toBe(moment2str(dayjs().startOf('year'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().endOf('year'), { utc: false }));
  });

  it('nextYear', () => {
    const [start, end] = dateRanges.nextYear();
    expect(start).toBe(moment2str(dayjs().add(1, 'year').startOf('year'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().add(1, 'year').endOf('year'), { utc: false }));
  });

  it('last7Days', () => {
    const [start, end] = dateRanges.last7Days();
    expect(start).toBe(moment2str(dayjs().add(-6, 'days').startOf('days'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().endOf('days'), { utc: false }));
  });

  it('next7Days', () => {
    const [start, end] = dateRanges.next7Days();
    expect(start).toBe(moment2str(dayjs().add(1, 'day').startOf('day'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().add(7, 'days').endOf('days'), { utc: false }));
  });

  it('last30Days', () => {
    const [start, end] = dateRanges.last30Days();
    expect(start).toBe(moment2str(dayjs().add(-29, 'days').startOf('days'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().endOf('days'), { utc: false }));
  });

  it('next30Days', () => {
    const [start, end] = dateRanges.next30Days();
    expect(start).toBe(moment2str(dayjs().add(1, 'day').startOf('day'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().add(30, 'days').endOf('days'), { utc: false }));
  });

  it('last90Days', () => {
    const [start, end] = dateRanges.last90Days();
    expect(start).toBe(moment2str(dayjs().add(-89, 'days').startOf('days'), { utc: false }));
    expect(end).toBe(moment2str(dayjs().endOf('days'), { utc: false }));
  });
});
