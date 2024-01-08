import dayjs from 'dayjs';
import { Database, mockDatabase } from '../..';
import { DateValueParser } from '../../value-parsers';

describe('number value parser', () => {
  let parser: DateValueParser;
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    db.collection({
      name: 'tests',
      fields: [
        {
          name: 'date',
          type: 'date',
        },
        {
          name: 'dateOnly',
          type: 'date',
          uiSchema: {
            ['x-component-props']: {
              showTime: false,
              gmt: false,
            },
          },
        },
        {
          name: 'dateTime',
          type: 'date',
          uiSchema: {
            ['x-component-props']: {
              showTime: true,
            },
          },
        },
        {
          name: 'dateTimeGmt',
          type: 'date',
          uiSchema: {
            ['x-component-props']: {
              showTime: true,
              gmt: true,
            },
          },
        },
      ],
    });
    parser = new DateValueParser({}, {});
  });

  const expectValue = (value, field = 'date') => {
    const collection = db.getCollection('tests');
    parser = new DateValueParser(collection.getField(field), {});
    parser.setValue(value);
    return expect(parser.getValue());
  };

  it('should be correct', () => {
    expectValue('20231223').toBe(dayjs('2023-12-23 00:00:00.000').toISOString());
    expectValue('2023/12/23').toBe(dayjs('2023-12-23 00:00:00.000').toISOString());
    expectValue('2023-12-23').toBe(dayjs('2023-12-23 00:00:00.000').toISOString());
    expectValue(42510).toBe('2016-05-20T00:00:00.000Z');
    expectValue('42510').toBe('2016-05-20T00:00:00.000Z');
    expectValue('2016-05-20T00:00:00.000Z').toBe('2016-05-20T00:00:00.000Z');
    expectValue('2016-05-20 04:22:22', 'dateOnly').toBe('2016-05-20T00:00:00.000Z');
    expectValue('2016-05-20 01:00:00', 'dateTime').toBe(dayjs('2016-05-20 01:00:00').toISOString());
    expectValue('2016-05-20 01:00:00', 'dateTimeGmt').toBe('2016-05-20T01:00:00.000Z');
  });
});
