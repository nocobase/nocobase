import Database from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from './index';

describe('reference integrity check', () => {
  let db: Database;
  let app: Application;

  beforeEach(async () => {
    app = await createApp({
      database: {
        tablePrefix: '',
      },
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should cascade delete on belongs to relation with multiple belongs to field', async () => {
    const Group = db.collection({
      name: 'groups',
      fields: [{ type: 'string', name: 'name' }],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsTo',
          name: 'group2',
          target: 'groups',
          onDelete: 'SET NULL',
          foreignKey: 'group2_id',
          targetKey: 'id',
        },
        {
          type: 'belongsTo',
          name: 'group',
          target: 'groups',
          onDelete: 'CASCADE',
          foreignKey: 'group_id',
          targetKey: 'id',
        },
      ],
    });

    await db.sync();

    const g1 = await Group.repository.create({
      values: {
        name: 'group1',
      },
    });

    const g2 = await Group.repository.create({
      values: {
        name: 'group2',
      },
    });

    const u1 = await User.repository.create({
      values: {
        name: 'user1',
        group_id: g1.id,
        group2_id: g2.id,
      },
    });

    expect(await User.repository.count()).toEqual(1);

    await g2.destroy();

    await u1.reload();

    expect(u1.group2_id).toBeNull();

    await g1.destroy();

    expect(await User.repository.count()).toEqual(0);
  });

  it('should cascade delete on belongs to many relation on collection', async () => {
    const users = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'collections',
          target: 'collections',
          sourceKey: 'id',
          foreignKey: 'user_id',
          otherKey: 'collection_name',
          targetKey: 'name',
          onDelete: 'cascade',
          through: 'users_collections',
        },
      ],
    });

    db.extendCollection({
      name: 'collections',
      fields: [
        {
          type: 'belongsToMany',
          name: 'users',
          target: 'users',
          onDelete: 'cascade',
          through: 'users_collections',
          sourceKey: 'name',
          foreignKey: 'collection_name',
          otherKey: 'user_id',
          targetKey: 'id',
        },
      ],
    });

    await db.sync();

    const postsCollection = await db.getCollection('collections').repository.create({
      values: {
        name: 'posts',
      },
    });

    const user1 = await users.repository.create({
      values: {
        name: 'foo',
        collections: [postsCollection],
      },
    });

    const throughCollection = db.getCollection('users_collections');

    expect(await throughCollection.repository.count()).toEqual(1);
    await user1.destroy();
    expect(await throughCollection.repository.count()).toEqual(0);

    const user2 = await users.repository.create({
      values: {
        name: 'bar',
        collections: [postsCollection],
      },
    });

    expect(await throughCollection.repository.count()).toEqual(1);
    await postsCollection.destroy();
    expect(await throughCollection.repository.count()).toEqual(0);
  });
});
