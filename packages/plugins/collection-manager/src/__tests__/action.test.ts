import { Database } from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';
import CollectionManagerPlugin from '@nocobase/plugin-collection-manager';
import { UiSchemaStoragePlugin } from '@nocobase/plugin-ui-schema-storage';
import { createApp } from '.';

describe('action test', () => {
  let db: Database;
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    await app.install({ clean: true });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });
  it('should append uiSchema', async () => {
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
        appends: ['uiSchema'],
        sort: ['sort'],
      });

    expect(response.statusCode).toEqual(200);
  });
});
