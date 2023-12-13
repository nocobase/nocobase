import { Database } from '../database';
import { mockDatabase } from './';

describe('sort', function () {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('order nulls last', async () => {
    const Test = db.collection({
      name: 'test',
      fields: [
        {
          type: 'integer',
          name: 'num',
        },
      ],
    });
    await Test.sync();
    await Test.model.bulkCreate([
      {
        num: 3,
      },
      {
        num: 2,
      },
      {
        num: null,
      },
      {
        num: 1,
      },
    ]);
    const items = await Test.repository.find({
      sort: '-num',
    });
    const nums = items.map((item) => item.get('num'));
    expect(nums).toEqual([3, 2, 1, null]);
    const items2 = await Test.repository.find({
      sort: 'num',
    });
    const nums2 = items2.map((item) => item.get('num'));
    expect(nums2).toEqual([1, 2, 3, null]);
  });
});
