import { mockDatabase } from '../index';
import { Collection } from '../../collection';
import { Database } from '@nocobase/database';

describe('destroy with targetKey', function () {
  let db: Database;
  let User: Collection;
  let u1;
  let u2;
  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();
    User = db.collection({
      name: 'users',
      autoGenId: false,
      fields: [
        { type: 'string', name: 'name', primaryKey: true },
        { type: 'string', name: 'status' },
      ],
    });

    await db.sync({
      force: true,
    });

    u1 = await User.repository.create({
      values: {
        name: 'u1',
        status: 'published',
      },
    });

    u2 = await User.repository.create({
      values: {
        name: 'u2',
        status: 'draft',
      },
    });
  });

  it('should destroy all', async () => {
    expect(await User.repository.count()).toEqual(2);
    await User.repository.destroy({ truncate: true });
    expect(await User.repository.count()).toEqual(0);
  });

  it('should destroy by target key', async () => {
    await User.repository.destroy({
      filterByTk: 'u2',
    });

    expect(await User.repository.count()).toEqual(1);
  });

  it('should destroy by target key and filter', async () => {
    await User.repository.destroy({
      filterByTk: 'u1',
      filter: {
        status: 'draft',
      },
    });

    expect(await User.repository.count()).toEqual(2);

    await User.repository.destroy({
      filterByTk: 'u2',
      filter: {
        status: 'draft',
      },
    });
    expect(await User.repository.count()).toEqual(1);
  });
});

describe('destroy', () => {
  let db;
  let User: Collection;
  let Post: Collection;

  afterEach(async () => {
    await db.close();
  });

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
        { type: 'string', name: 'status' },
        { type: 'belongsTo', name: 'user' },
      ],
    });
    await db.sync();
  });

  test('destroy with filter and filterByPk', async () => {
    const p1 = await Post.repository.create({
      values: {
        name: 'u1',
        status: 'published',
      },
    });

    await Post.repository.destroy({
      filterByTk: p1.get('id') as number,
      filter: {
        status: 'draft',
      },
    });

    expect(await Post.repository.count()).toEqual(1);
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

    await Post.repository.destroy({ truncate: true });
    expect(await Post.repository.count()).toEqual(0);
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
