import { mockDatabase } from '../index';
import { Collection } from '../../collection';

describe('destroy', () => {
  let db;
  let User: Collection;
  let Post: Collection;

  beforeEach(async () => {
    db = mockDatabase();
    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
      ],
    });
    await db.sync();
  });

  test('destroy all', async () => {
    await User.repository.create({
      values: {
        name: 'u1',
        posts: [{ title: 'u1p1' }],
      },
    });

    await User.repository.destroy();
    expect(await User.repository.count()).toEqual(1);
    await User.repository.destroy({ truncate: true });
    expect(await User.repository.count()).toEqual(0);
  });

  test('destroy with filter', async () => {
    await User.repository.createMany({
      records: [
        {
          name: 'u1',
        },
        {
          name: 'u3',
        },
        {
          name: 'u2',
        },
      ],
    });

    await User.repository.destroy({
      filter: {
        name: 'u1',
      },
    });

    expect(
      await User.repository.findOne({
        filter: {
          name: 'u1',
        },
      }),
    ).toBeNull();
    expect(await User.repository.count()).toEqual(2);
  });

  test('destroy with filterByPK', async () => {
    await User.repository.createMany({
      records: [
        {
          name: 'u1',
        },
        {
          name: 'u3',
        },
        {
          name: 'u2',
        },
      ],
    });

    const u2 = await User.repository.findOne({
      filter: {
        name: 'u2',
      },
    });

    await User.repository.destroy(u2['id']);
    expect(await User.repository.count()).toEqual(2);
  });
});
