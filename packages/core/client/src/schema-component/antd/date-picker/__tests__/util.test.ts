import moment from 'moment';
import { moment2str, str2moment } from '../util';

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
    const m = moment('2022-06-21 10:10:00');
    const str = moment2str(m, { showTime: true, gmt: true });
    expect(str).toBe('2022-06-21T10:10:00.000Z');
  });

  test('gmt date only', () => {
    const m = moment('2022-06-21 10:10:00');
    const str = moment2str(m);
    expect(str).toBe('2022-06-21T00:00:00.000Z');
  });

  test('with time', () => {
    const m = moment('2022-06-21 10:10:00');
    const str = moment2str(m, { showTime: true });
    expect(str).toBe(m.toISOString());
  });

  test('picker is year', () => {
    const m = moment('2022-06-21 10:10:00');
    const str = moment2str(m, { picker: 'year' });
    expect(str).toBe('2022-01-01T00:00:00.000Z');
  });

  test('picker is month', () => {
    const m = moment('2022-06-21 10:10:00');
    const str = moment2str(m, { picker: 'month' });
    expect(str).toBe('2022-06-01T00:00:00.000Z');
  });

  test('value is null', async () => {
    const m = moment2str(null);
    expect(m).toBeNull();
  });
});
