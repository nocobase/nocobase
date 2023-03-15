import { toGmt } from '@nocobase/utils';
import moment from 'moment';
import { getContext, parse, parseFilter } from '../middlewares/parse-variables';

describe('context', () => {
  test('$system.now', () => {
    const now = toGmt(moment()) as string;
    const ctx = getContext();
    expect(ctx.$system.now.slice(0, -3)).toBe(now.slice(0, -3));
  });

  test('$date.today', () => {
    const now = toGmt(moment()) as string;
    const ctx = getContext();
    expect(ctx.$date.today[0].slice(0, -3)).toBe(now.slice(0, -3));
    expect(ctx.$date.today[1].slice(0, -3)).toBe(now.slice(0, -3));
  });

  test('$date.lastWeek', () => {
    const start = toGmt(moment().subtract(1, 'week').startOf('week')) as string;
    const end = toGmt(moment().subtract(1, 'week').endOf('week')) as string;
    const ctx = getContext();
    expect(ctx.$date.lastWeek[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.lastWeek[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.thisWeek', () => {
    const start = toGmt(moment().startOf('week')) as string;
    const end = toGmt(moment().endOf('week')) as string;
    const ctx = getContext();
    expect(ctx.$date.thisWeek[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.thisWeek[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.nextWeek', () => {
    const start = toGmt(moment().add(1, 'week').startOf('week')) as string;
    const end = toGmt(moment().add(1, 'week').endOf('week')) as string;
    const ctx = getContext();
    expect(ctx.$date.nextWeek[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.nextWeek[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.lastMonth', () => {
    const start = toGmt(moment().subtract(1, 'month').startOf('month')) as string;
    const end = toGmt(moment().subtract(1, 'month').endOf('month')) as string;
    const ctx = getContext();
    expect(ctx.$date.lastMonth[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.lastMonth[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.thisMonth', () => {
    const start = toGmt(moment().startOf('month')) as string;
    const end = toGmt(moment().endOf('month')) as string;
    const ctx = getContext();
    expect(ctx.$date.thisMonth[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.thisMonth[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.nextMonth', () => {
    const start = toGmt(moment().add(1, 'month').startOf('month')) as string;
    const end = toGmt(moment().add(1, 'month').endOf('month')) as string;
    const ctx = getContext();
    expect(ctx.$date.nextMonth[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.nextMonth[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.lastYear', () => {
    const start = toGmt(moment().subtract(1, 'year').startOf('year')) as string;
    const end = toGmt(moment().subtract(1, 'year').endOf('year')) as string;
    const ctx = getContext();
    expect(ctx.$date.lastYear[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.lastYear[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.thisYear', () => {
    const start = toGmt(moment().startOf('year')) as string;
    const end = toGmt(moment().endOf('year')) as string;
    const ctx = getContext();
    expect(ctx.$date.thisYear[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.thisYear[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.nextYear', () => {
    const start = toGmt(moment().add(1, 'year').startOf('year')) as string;
    const end = toGmt(moment().add(1, 'year').endOf('year')) as string;
    const ctx = getContext();
    expect(ctx.$date.nextYear[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.nextYear[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.last7Days', () => {
    const start = toGmt(moment().subtract(7, 'days')) as string;
    const end = toGmt(moment()) as string;
    const ctx = getContext();
    expect(ctx.$date.last7Days[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.last7Days[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.next7Days', () => {
    const start = toGmt(moment()) as string;
    const end = toGmt(moment().add(7, 'days')) as string;
    const ctx = getContext();
    expect(ctx.$date.next7Days[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.next7Days[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.last30Days', () => {
    const start = toGmt(moment().subtract(30, 'days')) as string;
    const end = toGmt(moment()) as string;
    const ctx = getContext();
    expect(ctx.$date.last30Days[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.last30Days[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.next30Days', () => {
    const start = toGmt(moment()) as string;
    const end = toGmt(moment().add(30, 'days')) as string;
    const ctx = getContext();
    expect(ctx.$date.next30Days[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.next30Days[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.last90Days', () => {
    const start = toGmt(moment().subtract(90, 'days')) as string;
    const end = toGmt(moment()) as string;
    const ctx = getContext();
    expect(ctx.$date.last90Days[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.last90Days[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$date.next90Days', () => {
    const start = toGmt(moment()) as string;
    const end = toGmt(moment().add(90, 'days')) as string;
    const ctx = getContext();
    expect(ctx.$date.next90Days[0].slice(0, -3)).toBe(start.slice(0, -3));
    expect(ctx.$date.next90Days[1].slice(0, -3)).toBe(end.slice(0, -3));
  });

  test('$user.id', () => {
    const ctx = getContext({
      state: {
        currentUser: {
          id: '123',
        },
      },
    });
    expect(ctx.$user.id).toBe('123');
  });

  test('current is empty', () => {
    const ctx = getContext();
    expect(ctx.$user.id).toBe(undefined);
  });
});

describe('parse', () => {
  test('non-variable', () => {
    expect(parse('abc', {})).toBe('abc');
  });

  test('variable', () => {
    const ctx = { abc: '123' };
    expect(parse('{{abc}}', ctx)).toBe('123');
  });

  test('nested variable', () => {
    const ctx = { abc: { def: '456' } };
    expect(parse('{{abc.def}}', ctx)).toBe('456');
  });

  test('variable with array type', () => {
    const ctx = { abc: ['123', '456'] };
    expect(parse('{{abc}}', ctx)).toEqual(['123', '456']);
  });
});

describe('parseFilter', () => {
  test('$and', () => {
    const ctx = { abc: '123' };
    const filter = {
      $and: [{ a: { $eq: '{{abc}}' } }],
    };

    expect(parseFilter(filter, ctx)).toEqual({
      $and: [{ a: { $eq: '123' } }],
    });
  });

  test('$or', () => {
    const ctx = { abc: '123' };
    const filter = {
      $or: [{ a: { $eq: '{{abc}}' } }],
    };

    expect(parseFilter(filter, ctx)).toEqual({
      $or: [{ a: { $eq: '123' } }],
    });
  });

  test('$and and $or', () => {
    const ctx = { abc: '123' };
    const filter = {
      $and: [{ a: { $eq: '{{abc}}' } }],
      $or: [{ b: { $eq: '{{abc}}' } }],
    };

    expect(parseFilter(filter, ctx)).toEqual({
      $and: [{ a: { $eq: '123' } }],
      $or: [{ b: { $eq: '123' } }],
    });
  });

  test('nested $and', () => {
    const ctx = { abc: '123' };
    const filter = {
      $and: [{ a: { $eq: '{{abc}}' } }, { $and: [{ b: { $eq: '{{abc}}' } }] }],
    };

    expect(parseFilter(filter, ctx)).toEqual({
      $and: [{ a: { $eq: '123' } }, { $and: [{ b: { $eq: '123' } }] }],
    });
  });

  test('nested $or', () => {
    const ctx = { abc: '123' };
    const filter = {
      $or: [{ a: { $eq: '{{abc}}' } }, { $or: [{ b: { $eq: '{{abc}}' } }] }],
    };

    expect(parseFilter(filter, ctx)).toEqual({
      $or: [{ a: { $eq: '123' } }, { $or: [{ b: { $eq: '123' } }] }],
    });
  });
});
