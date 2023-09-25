import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from '.';

describe('action test', () => {
  let db: Database;
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get uiSchema', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    await db.getRepository('fields').create({
      values: {
        name: 'title',
        collectionName: 'posts',
        type: 'string',
        uiSchema: {
          'x-uid': 'test',
        },
      },
    });

    // @ts-ignore
    await db.getRepository('collections').load();
    await db.sync();

    const response = await app
      .agent()
      .resource('collections.fields', 'posts')
      .list({
        pageSize: 5,
        sort: ['sort'],
      });

    expect(response.statusCode).toEqual(200);
    const data = response.body.data;

    expect(data[0].uiSchema).toMatchObject({
      'x-uid': 'test',
    });
  });
});
