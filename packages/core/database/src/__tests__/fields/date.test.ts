import { mockDatabase } from '../';
import { Database } from '../../database';
import { Repository } from '../../repository';

describe('date-field', () => {
  let db: Database;
  let repository: Repository;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    db.collection({
      name: 'tests',
      fields: [{ name: 'date1', type: 'date' }],
    });
    await db.sync();
    repository = db.getRepository('tests');
  });

  afterEach(async () => {
    await db.close();
  });

  const createExpectToBe = async (key, actual, expected) => {
    const instance = await repository.create({
      values: {
        [key]: actual,
      },
    });
    return expect(instance.get(key).toISOString()).toEqual(expected);
  };

  test('create', async () => {
    // sqlite 时区不能自定义，只有 +00:00，postgres 和 mysql 可以自定义 DB_TIMEZONE
    await createExpectToBe('date1', '2023-03-24', '2023-03-24T00:00:00.000Z');
    await createExpectToBe('date1', '2023-03-24T16:00:00.000Z', '2023-03-24T16:00:00.000Z');
  });

  // dateXX 相关 Operator 都是去 time 比较的
  describe('dateOn', () => {
    test('dateOn operator', async () => {
      console.log('timezone', db.options.timezone);
      // 默认的情况，时区为 db.options.timezone
      await repository.find({
        filter: {
          date1: {
            // 由 db.options.timezone 来处理日期转换，假设是 +08:00 的时区
            // 2023-03-24表示的范围：2023-03-23T16:00:00 ~ 2023-03-24T16:00:00
            $dateOn: '2023-03-24',
          },
        },
      });

      await repository.find({
        filter: {
          date1: {
            // +06:00 时区 2023-03-24 的范围：2023-03-23T18:00:00 ~ 2023-03-24T18:00:00
            $dateOn: '2023-03-24+06:00',
          },
        },
      });

      await repository.find({
        filter: {
          date1: {
            // 2023-03-23T20:00:00+08:00 在 +08:00 时区的时间是：2023-03-24 04:00:00
            // 也就是 +08:00 时区 2023-03-24 这一天的范围：2023-03-23T16:00:00 ~ 2023-03-24T16:00:00
            $dateOn: '2023-03-23T20:00:00+08:00',
          },
        },
      });
    });
  });
});
