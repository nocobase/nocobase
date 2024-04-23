import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';
import { CollectionRepository } from '../../index';

describe('belongsTo', () => {
  let db: Database;
  let app: Application;
  let Collection: DBCollection;
  let Field: DBCollection;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
    Collection = db.getCollection('collections');
    Field = db.getCollection('fields');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should check belongs to association keys', async () => {
    const Post = await Collection.repository.create({
      values: {
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'bigInt',
            name: 'postId',
          },
        ],
      },
      context: {},
    });

    const Tag = await Collection.repository.create({
      values: {
        name: 'tags',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    let error;
    try {
      await Field.repository.create({
        values: {
          collectionName: 'posts',
          type: 'belongsTo',
          name: 'tags',
          targetKey: 'name',
          foreignKey: 'postId',
        },
        context: {},
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain(
      'Foreign key "postId" type "BIGINT" does not match target key "name" type "STRING"',
    );
  });
  it('should load belongsTo field', async () => {
    await Collection.repository.create({
      values: {
        name: 'orders',
        fields: [
          {
            type: 'integer',
            name: 'amount',
          },
          {
            type: 'belongsTo',
            name: 'users',
            targetKey: 'uid',
            foreignKey: 'userId',
          },
        ],
      },
    });

    await Collection.repository.create({
      values: {
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'string',
            name: 'uid',
          },
        ],
      },
    });

    let error;

    try {
      await db.getRepository<CollectionRepository>('collections').load();
    } catch (e) {
      error = e;
    }

    expect(error).toBeUndefined();
  });
});
