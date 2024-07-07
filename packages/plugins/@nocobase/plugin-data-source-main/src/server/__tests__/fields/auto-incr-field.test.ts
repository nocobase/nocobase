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

  it('should not create auto increnment field more than one', async () => {
    if (process.env.DB_DIALECT !== 'mysql') {
      return;
    }

    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        autoGenId: false,
        fields: [
          {
            name: 'id',
            type: 'integer',
            autoIncrement: true,
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
    expect(postCollection.getField('xxx')).toBeFalsy();
  });
});
