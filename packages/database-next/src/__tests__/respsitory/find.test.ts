import { mockDatabase } from '../index';
import Database from '@nocobase/database';
import { Collection } from '../../collection';

describe('count', () => {
  let db: Database;
  let User: Collection;

  beforeEach(async () => {
    const db = mockDatabase();
    User = db.collection<{ id: number; name: string }, { name: string }>({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();
    const repository = User.repository;
    await repository.createMany([
      { name: 'test' },
      { name: 'test2' },
      { name: 'test3' },
    ]);
  });

  test('without filter params', async () => {
    expect(await User.repository.count()).toEqual(3);
  });

  test('with filter params', async () => {
    expect(
      await User.repository.count({
        name: 'test',
      }),
    ).toEqual(1);
  });
});
