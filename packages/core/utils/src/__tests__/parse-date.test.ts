import dayjs from 'dayjs';
import { parseDate } from '../parse-date';

describe('parse date', () => {
  const expectDate = (date: any, options?: any) => {
    const r = parseDate(date, options);
    console.log(date, r);
    return expect(r);
  };

  it('should parse empty', async () => {
    expectDate(null).toBeUndefined();
    expectDate('').toBeUndefined();
  });

  it('should parse year', async () => {
    expectDate('2023').toEqual(['2023-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z']);
    expectDate('2023+08:00').toEqual(['2022-12-31T16:00:00.000Z', '2023-12-31T16:00:00.000Z']);
    expectDate('2023', { timezone: '+08:00' }).toEqual(['2022-12-31T16:00:00.000Z', '2023-12-31T16:00:00.000Z']);
  });

  it('should parse quarter', async () => {
    expectDate('2023Q1').toEqual(['2023-01-01T00:00:00.000Z', '2023-04-01T00:00:00.000Z']);
    expectDate('2023Q1+08:00').toEqual(['2022-12-31T16:00:00.000Z', '2023-03-31T16:00:00.000Z']);
    expectDate('2023Q1', { timezone: '+08:00' }).toEqual(['2022-12-31T16:00:00.000Z', '2023-03-31T16:00:00.000Z']);
  });

  it('should parse iso week', async () => {
    expectDate('2023W01').toEqual(['2023-01-02T00:00:00.000Z', '2023-01-09T00:00:00.000Z']);
    expectDate('2023W01+08:00').toEqual(['2023-01-01T16:00:00.000Z', '2023-01-08T16:00:00.000Z']);
    expectDate('2023W01', { timezone: '+08:00' }).toEqual(['2023-01-01T16:00:00.000Z', '2023-01-08T16:00:00.000Z']);
  });

  it('should parse week', async () => {
    expectDate('2023w01').toEqual(['2023-01-01T00:00:00.000Z', '2023-01-08T00:00:00.000Z']);
    expectDate('2023w01+08:00').toEqual(['2022-12-31T16:00:00.000Z', '2023-01-07T16:00:00.000Z']);
    expectDate('2023w01', { timezone: '+08:00' }).toEqual(['2022-12-31T16:00:00.000Z', '2023-01-07T16:00:00.000Z']);
  });

  it('should parse month', () => {
    expectDate('2023-03').toEqual(['2023-03-01T00:00:00.000Z', '2023-04-01T00:00:00.000Z']);
    expectDate('2023-03+08:00').toEqual(['2023-02-28T16:00:00.000Z', '2023-03-31T16:00:00.000Z']);
    expectDate('2023-03', { timezone: '+08:00' }).toEqual(['2023-02-28T16:00:00.000Z', '2023-03-31T16:00:00.000Z']);
  });

  it('should parse day', () => {
    expectDate('2023-01-12').toEqual(['2023-01-12T00:00:00.000Z', '2023-01-13T00:00:00.000Z']);
    expectDate('2023-01-12+08:00').toEqual(['2023-01-11T16:00:00.000Z', '2023-01-12T16:00:00.000Z']);
    expectDate('2023-01-12', { timezone: '+08:00' }).toEqual(['2023-01-11T16:00:00.000Z', '2023-01-12T16:00:00.000Z']);
  });

  it('should parse hour', () => {
    expectDate('2023-01-12T12').toEqual(['2023-01-12T12:00:00.000Z', '2023-01-12T13:00:00.000Z']);
    expectDate('2023-01-12T12+08:00').toEqual(['2023-01-12T04:00:00.000Z', '2023-01-12T05:00:00.000Z']);
    expectDate('2023-01-12T12', { timezone: '+08:00' }).toEqual([
      '2023-01-12T04:00:00.000Z',
      '2023-01-12T05:00:00.000Z',
    ]);
    expectDate('2023-01-12 12').toEqual(['2023-01-12T12:00:00.000Z', '2023-01-12T13:00:00.000Z']);
    expectDate('2023-01-12 12+08:00').toEqual(['2023-01-12T04:00:00.000Z', '2023-01-12T05:00:00.000Z']);
    expectDate('2023-01-12 12', { timezone: '+08:00' }).toEqual([
      '2023-01-12T04:00:00.000Z',
      '2023-01-12T05:00:00.000Z',
    ]);
  });

  it('should parse minute', () => {
    expectDate('2023-01-12T12:23').toEqual(['2023-01-12T12:23:00.000Z', '2023-01-12T12:24:00.000Z']);
    expectDate('2023-01-12T12:23+08:00').toEqual(['2023-01-12T04:23:00.000Z', '2023-01-12T04:24:00.000Z']);
    expectDate('2023-01-12T12:23', { timezone: '+08:00' }).toEqual([
      '2023-01-12T04:23:00.000Z',
      '2023-01-12T04:24:00.000Z',
    ]);
    expectDate('2023-01-12 12:23').toEqual(['2023-01-12T12:23:00.000Z', '2023-01-12T12:24:00.000Z']);
    expectDate('2023-01-12 12:23+08:00').toEqual(['2023-01-12T04:23:00.000Z', '2023-01-12T04:24:00.000Z']);
    expectDate('2023-01-12 12:23', { timezone: '+08:00' }).toEqual([
      '2023-01-12T04:23:00.000Z',
      '2023-01-12T04:24:00.000Z',
    ]);
  });

  it('should parse second', () => {
    expectDate('2023-01-12T12:23:59').toEqual(['2023-01-12T12:23:59.000Z', '2023-01-12T12:24:00.000Z']);
    expectDate('2023-01-12T12:23:59+08:00').toEqual(['2023-01-12T04:23:59.000Z', '2023-01-12T04:24:00.000Z']);
    expectDate('2023-01-12T12:23:59', { timezone: '+08:00' }).toEqual([
      '2023-01-12T04:23:59.000Z',
      '2023-01-12T04:24:00.000Z',
    ]);
    expectDate('2023-01-12 12:23:59').toEqual(['2023-01-12T12:23:59.000Z', '2023-01-12T12:24:00.000Z']);
    expectDate('2023-01-12 12:23:59+08:00').toEqual(['2023-01-12T04:23:59.000Z', '2023-01-12T04:24:00.000Z']);
    expectDate('2023-01-12 12:23:59', { timezone: '+08:00' }).toEqual([
      '2023-01-12T04:23:59.000Z',
      '2023-01-12T04:24:00.000Z',
    ]);
  });

  it('should parse millisecond', () => {
    expectDate('2023-01-12T12:23:59.326').toEqual(['2023-01-12T12:23:59.326Z', '2023-01-12T12:23:59.327Z']);
    expectDate('2023-01-12T12:23:59.326+08:00').toEqual(['2023-01-12T04:23:59.326Z', '2023-01-12T04:23:59.327Z']);
    expectDate('2023-01-12T12:23:59.326', { timezone: '+08:00' }).toEqual([
      '2023-01-12T04:23:59.326Z',
      '2023-01-12T04:23:59.327Z',
    ]);
    expectDate('2023-01-12 12:23:59.326').toEqual(['2023-01-12T12:23:59.326Z', '2023-01-12T12:23:59.327Z']);
    expectDate('2023-01-12 12:23:59.326+08:00').toEqual(['2023-01-12T04:23:59.326Z', '2023-01-12T04:23:59.327Z']);
    expectDate('2023-01-12 12:23:59.326', { timezone: '+08:00' }).toEqual([
      '2023-01-12T04:23:59.326Z',
      '2023-01-12T04:23:59.327Z',
    ]);
  });

  it('should parse utc', () => {
    expectDate(new Date('2023-01-12T12:23:59.326Z')).toEqual('2023-01-12T12:23:59.326Z');
    expectDate(dayjs('2023-01-12T12:23:59.326Z')).toEqual('2023-01-12T12:23:59.326Z');
    expectDate('2023-01-12T12:23:59.326Z').toEqual('2023-01-12T12:23:59.326Z');
    expectDate('2023-01-12T12:23:59.326Z+08:00').toEqual('2023-01-12T12:23:59.326Z');
    expectDate('2023-01-12T12:23:59.326Z', { timezone: '+08:00' }).toEqual('2023-01-12T12:23:59.326Z');
  });

  describe('parse date between', () => {
    it('should parse year', async () => {
      expectDate('[2023,2024]').toEqual(['2023-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z']);
      expectDate('(2023,2024]').toEqual(['2024-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z']);
      expectDate('[2023,2024)').toEqual(['2023-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z']);
      expectDate('(2023,2026)').toEqual(['2024-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']);
      expectDate(['2023', '2024']).toEqual(['2023-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z']);
      expectDate(['2023', '2024', '[]']).toEqual(['2023-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z']);
      expectDate(['2023', '2024', '(]']).toEqual(['2024-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z']);
      expectDate(['2023', '2024', '[)']).toEqual(['2023-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z']);
      expectDate(['2023', '2026', '()']).toEqual(['2024-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']);
      expectDate('[2023,2024]+08:00').toEqual(['2022-12-31T16:00:00.000Z', '2024-12-31T16:00:00.000Z']);
      expectDate('(2023,2024]+08:00').toEqual(['2023-12-31T16:00:00.000Z', '2024-12-31T16:00:00.000Z']);
      expectDate('[2023,2024)+08:00').toEqual(['2022-12-31T16:00:00.000Z', '2023-12-31T16:00:00.000Z']);
      expectDate('(2023,2026)+08:00').toEqual(['2023-12-31T16:00:00.000Z', '2025-12-31T16:00:00.000Z']);
      expectDate(['2023', '2024', '[]', '+08:00']).toEqual(['2022-12-31T16:00:00.000Z', '2024-12-31T16:00:00.000Z']);
      expectDate(['2023', '2024', '(]', '+08:00']).toEqual(['2023-12-31T16:00:00.000Z', '2024-12-31T16:00:00.000Z']);
      expectDate(['2023', '2024', '[)', '+08:00']).toEqual(['2022-12-31T16:00:00.000Z', '2023-12-31T16:00:00.000Z']);
      expectDate(['2023', '2026', '()', '+08:00']).toEqual(['2023-12-31T16:00:00.000Z', '2025-12-31T16:00:00.000Z']);
    });

    it('should parse day', async () => {
      expectDate('[2023-01-12,2023-09-12]').toEqual(['2023-01-12T00:00:00.000Z', '2023-09-13T00:00:00.000Z']);
      expectDate('[2023-01-12,2023-09-12)').toEqual(['2023-01-12T00:00:00.000Z', '2023-09-12T00:00:00.000Z']);
      expectDate('(2023-01-12,2023-09-12]').toEqual(['2023-01-13T00:00:00.000Z', '2023-09-13T00:00:00.000Z']);
      expectDate('(2023-01-12,2023-09-12)').toEqual(['2023-01-13T00:00:00.000Z', '2023-09-12T00:00:00.000Z']);
      expectDate('[2023-01-12,2023-09-12]+08:00').toEqual(['2023-01-11T16:00:00.000Z', '2023-09-12T16:00:00.000Z']);
      expectDate('[2023-01-12,2023-09-12)+08:00').toEqual(['2023-01-11T16:00:00.000Z', '2023-09-11T16:00:00.000Z']);
      expectDate('(2023-01-12,2023-09-12]+08:00').toEqual(['2023-01-12T16:00:00.000Z', '2023-09-12T16:00:00.000Z']);
      expectDate('(2023-01-12,2023-09-12)+08:00').toEqual(['2023-01-12T16:00:00.000Z', '2023-09-11T16:00:00.000Z']);
    });

    it('should parse utc', async () => {
      expectDate('[2023-01-12T12:23:59.326Z,2023-01-12T12:24:59.326Z]').toEqual([
        '2023-01-12T12:23:59.326Z',
        '2023-01-12T12:24:59.326Z',
        '[]',
      ]);
      expectDate('[2023-01-12T12:23:59.326Z,2023-01-12T12:24:59.326Z)').toEqual([
        '2023-01-12T12:23:59.326Z',
        '2023-01-12T12:24:59.326Z',
      ]);
      expectDate('(2023-01-12T12:23:59.326Z,2023-01-12T12:24:59.326Z)').toEqual([
        '2023-01-12T12:23:59.326Z',
        '2023-01-12T12:24:59.326Z',
        '()',
      ]);
      expectDate('(2023-01-12T12:23:59.326Z,2023-01-12T12:24:59.326Z]').toEqual([
        '2023-01-12T12:23:59.326Z',
        '2023-01-12T12:24:59.326Z',
        '(]',
      ]);
      expectDate('[2023-01-12T12:23:59.326Z,2023-01-12T12:24:59.326Z]+08:00').toEqual([
        '2023-01-12T12:23:59.326Z',
        '2023-01-12T12:24:59.326Z',
        '[]',
      ]);
      expectDate('[2023-01-12T12:23:59.326Z,2023-01-12T12:24:59.326Z)+08:00').toEqual([
        '2023-01-12T12:23:59.326Z',
        '2023-01-12T12:24:59.326Z',
      ]);
      expectDate('(2023-01-12T12:23:59.326Z,2023-01-12T12:24:59.326Z)+08:00').toEqual([
        '2023-01-12T12:23:59.326Z',
        '2023-01-12T12:24:59.326Z',
        '()',
      ]);
      expectDate('(2023-01-12T12:23:59.326Z,2023-01-12T12:24:59.326Z]+08:00').toEqual([
        '2023-01-12T12:23:59.326Z',
        '2023-01-12T12:24:59.326Z',
        '(]',
      ]);
    });
  });
});
