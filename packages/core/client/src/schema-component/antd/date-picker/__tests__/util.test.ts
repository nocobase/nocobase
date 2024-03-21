import { str2moment } from '@nocobase/utils/client';
import dayjs from 'dayjs';
import { moment2str } from '../util';

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
      const m = str2moment('2022-06-01T00:00:00.000Z', { picker: 'month' });
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
    const str = moment2str(m, { picker: 'year' });
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

  test('picker is month', () => {
    const m = dayjs('2023-06-21 10:10:00');
    const str = moment2str(m, { picker: 'month' });
    expect(str).toBe('2023-06-01T00:00:00.000Z');
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
