import { getDateVars, getDayRange, parseFilter, utc2unit, Utc2unitOptions } from '../parse-filter';

describe('utc to unit', () => {
  const expectUtc2unit = (options: Utc2unitOptions) => {
    const r = utc2unit(options);
    console.log(options, r);
    return expect(r);
  };
  it('should be year', async () => {
    expectUtc2unit({
      now: '2023-01-05T16:00:00.000Z',
      timezone: '+00:00',
      unit: 'year',
    }).toBe('2023+00:00');
    expectUtc2unit({
      now: '2022-12-31T16:00:00.000Z',
      timezone: '+08:00',
      unit: 'year',
    }).toBe('2023+08:00');
    expectUtc2unit({
      now: '2022-12-31T15:00:00.000Z',
      timezone: '+08:00',
      unit: 'year',
    }).toBe('2022+08:00');
    expectUtc2unit({
      now: '2023-01-05T16:00:00.000Z',
      unit: 'year',
    }).toBe('2023+00:00');
  });
  it('should be month', async () => {
    expectUtc2unit({
      now: '2023-01-05T16:00:00.000Z',
      timezone: '+00:00',
      unit: 'month',
    }).toBe('2023-01+00:00');
    expectUtc2unit({
      now: '2022-12-31T16:00:00.000Z',
      timezone: '+08:00',
      unit: 'month',
    }).toBe('2023-01+08:00');
    expectUtc2unit({
      now: '2023-01-05T16:00:00.000Z',
      unit: 'month',
    }).toBe('2023-01+00:00');
  });
  it('should be quarter', async () => {
    expectUtc2unit({
      now: '2023-01-05T16:00:00.000Z',
      timezone: '+00:00',
      unit: 'quarter',
    }).toBe('2023Q1+00:00');
    expectUtc2unit({
      now: '2022-12-31T16:00:00.000Z',
      timezone: '+08:00',
      unit: 'quarter',
    }).toBe('2023Q1+08:00');
    expectUtc2unit({
      now: '2022-12-31T15:00:00.000Z',
      timezone: '+08:00',
      unit: 'quarter',
    }).toBe('2022Q4+08:00');
    expectUtc2unit({
      now: '2023-01-05T16:00:00.000Z',
      unit: 'quarter',
    }).toBe('2023Q1+00:00');
  });
  it('should be week', async () => {
    expectUtc2unit({
      now: '2023-01-08T00:00:00.000Z',
      timezone: '+00:00',
      unit: 'week',
    }).toBe('2023w02+00:00');
    expectUtc2unit({
      now: '2022-12-31T16:00:00.000Z',
      timezone: '+08:00',
      unit: 'week',
    }).toBe('2023w01+08:00');
    expectUtc2unit({
      now: '2023-01-01T00:00:00.000Z',
      unit: 'week',
    }).toBe('2023w01+00:00');
  });
  it('should be iso week', async () => {
    expectUtc2unit({
      now: '2023-01-08T00:00:00.000Z',
      timezone: '+00:00',
      unit: 'isoWeek',
    }).toBe('2023W01+00:00');
    expectUtc2unit({
      now: '2022-12-31T16:00:00.000Z',
      timezone: '+08:00',
      unit: 'isoWeek',
    }).toBe('2022W52+08:00');
    expectUtc2unit({
      now: '2023-01-01T00:00:00.000Z',
      unit: 'isoWeek',
    }).toBe('2022W52+00:00');
  });
  it('should be day', async () => {
    expectUtc2unit({
      now: '2023-01-05T16:00:00.000Z',
      timezone: '+00:00',
      unit: 'day',
    }).toBe('2023-01-05+00:00');
    expectUtc2unit({
      now: '2023-01-05T16:00:00.000Z',
      timezone: '+08:00',
      unit: 'day',
    }).toBe('2023-01-06+08:00');
    expectUtc2unit({
      now: '2023-01-05T16:00:00.000Z',
      unit: 'day',
    }).toBe('2023-01-05+00:00');
  });
});

describe('getDayRange', () => {
  const expectDayRange = (options) => {
    const r = getDayRange(options);
    console.log(r, options);
    return expect(r);
  };
  test('next7days', () => {
    expectDayRange({
      now: '2023-03-28T16:00:00.000Z',
      offset: 7,
      timezone: '+00:00',
    }).toEqual(['2023-03-29', '2023-04-05', '[)', '+00:00']);
    expectDayRange({
      now: '2023-03-28T16:00:00.000Z',
      offset: 7,
      timezone: '+08:00',
    }).toEqual(['2023-03-30', '2023-04-06', '[)', '+08:00']);
  });
  test('last7days', () => {
    expectDayRange({
      now: '2023-03-28T16:00:00.000Z',
      offset: -7,
      timezone: '+00:00',
    }).toEqual(['2023-03-21', '2023-03-28', '[)', '+00:00']);
    expectDayRange({
      now: '2023-03-28T16:00:00.000Z',
      offset: -7,
      timezone: '+08:00',
    }).toEqual(['2023-03-22', '2023-03-29', '[)', '+08:00']);
  });
});

describe('parseFilter', () => {
  const expectParseFilter = (filter, options) => {
    return {
      async toEqual(expected) {
        const r = await parseFilter(filter, options);
        return expect(r).toEqual(expected);
      },
    };
  };

  test('timezone', async () => {
    await expectParseFilter(
      {
        'a.$dateOn': '2023',
      },
      {
        timezone: '+00:00',
      },
    ).toEqual({ a: { $dateOn: '2023+00:00' } });
  });

  test('vars', async () => {
    await expectParseFilter(
      {
        'a.$dateOn': '{{$date.today}}',
        'b.$eq': '{{$custom.foo}}',
        'b.$ne': '{{$foo.bar}}',
      },
      {
        timezone: '+08:00',
        vars: {
          $custom: {
            foo: () => 'bar',
          },
          $date: {
            today: () => '2023-01-01',
          },
        },
      },
    ).toEqual({ a: { $dateOn: '2023-01-01+08:00' }, b: { $eq: 'bar', $ne: null } });
  });

  test('$date.today', async () => {
    await expectParseFilter(
      {
        'a.$dateOn': '{{$date.today}}',
      },
      {
        now: '2022-12-31T16:00:00.000Z',
        timezone: '+08:00',
        vars: {
          $date: getDateVars(),
        },
      },
    ).toEqual({ a: { $dateOn: '2023-01-01+08:00' } });
  });
});
