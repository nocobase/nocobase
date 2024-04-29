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
