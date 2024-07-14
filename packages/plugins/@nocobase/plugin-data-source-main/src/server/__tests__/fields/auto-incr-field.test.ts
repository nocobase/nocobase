import Database from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('destroy', () => {
  let db: Database;
  let app: MockServer;

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

  it.runIf(process.env.DB_DIALECT === 'mysql')('should not create auto increment field more than one', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        autoGenId: false,
        fields: [
          {
            name: 'id',
            type: 'integer',
            autoIncrement: true,
            primaryKey: true,
          },
        ],
      },
      context: {},
    });

    const postCollection = db.getCollection('posts');
    expect(postCollection.getField('id')).toBeTruthy();

    let error = null;

    try {
      await db.getRepository('fields').create({
        values: {
          name: 'xxx',
          type: 'integer',
          collectionName: 'posts',
          autoIncrement: true,
        },
        context: {},
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeTruthy();
    expect(
      await db.getRepository('fields').count({
        filter: {
          collectionName: 'posts',
          name: 'xxx',
        },
      }),
    ).toBe(0);

    expect(postCollection.getField('xxx')).toBeFalsy();
  });
});
