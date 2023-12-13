import dayjs from 'dayjs';
import { getDateRanges } from '../util';

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
