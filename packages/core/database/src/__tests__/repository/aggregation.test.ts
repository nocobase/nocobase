import { mockDatabase } from '@nocobase/database';
import Database from '../../database';
import { Collection } from '../../collection';

describe('Aggregation', () => {
  let db: Database;

  let User: Collection;
  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'integer',
          name: 'age',
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        { name: 'u1', age: 1 },
        { name: 'u2', age: 2 },
        { name: 'u3', age: 3 },
        { name: 'u4', age: 4 },
        { name: 'u5', age: 5 },
      ],
    });
  });

  describe('sum', () => {
    it('should sum field', async () => {
      const sumResult = await User.repository.aggregate({
        method: 'sum',
        field: 'age',
      });

      console.log(sumResult);
    });
  });
});
