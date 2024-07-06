import Database from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('destory key that used by association field', () => {
  let db: Database;
  let app: MockServer;
  beforeEach(async () => {
    app = await createApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should throw error when destory a source key of hasMany field', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        autoGenId: false,
        fields: [
          {
            type: 'string',
            name: 'title',
            primaryKey: true,
          },
          {
            type: 'string',
            name: 'content',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('collections').create({
      values: {
        name: 'comments',
        fields: [
          {
            type: 'string',
            name: 'comment',
          },
        ],
      },
      context: {},
    });

    // add has many field
    await db.getRepository('fields').create({
      values: {
        name: 'comments',
        collectionName: 'posts',
        type: 'hasMany',
        target: 'comments',
        foreignKey: 'postTitle',
        sourceKey: 'title',
      },
      context: {},
    });

    // it should throw error when destroy title field
    let error;
    try {
      await db.getRepository('fields').destroy({
        filter: {
          name: 'title',
          collectionName: 'posts',
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeTruthy();
    expect(error.message).toBe(
      `Can't delete field title, it is used by field comments in collection posts as sourceKey`,
    );
  });
});
