import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from './index';

describe('primary key test', function () {
  let db: Database;
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should throw error when create field in collection that already has primary key', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const response = await app
      .agent()
      .resource('collections.fields', 'posts')
      .create({
        values: {
          name: 'name',
          type: 'string',
          primaryKey: true,
        },
        context: {},
      });

    expect(response.statusCode).not.toBe(200);
    const errorMessage = response.body.errors[0].message;
    expect(errorMessage).toContain('already has primary key');
  });
});
