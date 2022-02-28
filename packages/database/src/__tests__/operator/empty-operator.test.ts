import Database from '../../database';
import { Collection } from '../../collection';

import { mockDatabase } from '../index';

describe('empty operator', () => {
  let db: Database;

  let User: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase({});
    User = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync({
      force: true,
    });
  });

  test('string field empty', async () => {
    const u1 = await User.repository.create({
      values: {
        name: 'u1',
      },
    });

    const u2 = await User.repository.create({
      values: {
        name: '',
      },
    });

    const result = await User.repository.find({
      filter: {
        'name.$empty': true,
      },
    });

    expect(result.length).toEqual(1);
    expect(result[0].get('id')).toEqual(u2.get('id'));
  });

  test('string empty with or operator ', async () => {
    const u1 = await User.repository.create({
      values: {
        name: 'u1',
      },
    });

    const u2 = await User.repository.create({
      values: {
        name: '',
      },
    });

    const u3 = await User.repository.create({
      values: {
        name: 'u3',
      },
    });

    const result = await User.repository.find({
      filter: {
        $or: [{ 'name.$empty': true }, { name: 'u1' }],
      },
    });

    expect(result.length).toEqual(2);
  });
});
