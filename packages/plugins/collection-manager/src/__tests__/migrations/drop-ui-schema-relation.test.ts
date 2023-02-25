import { MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { createApp } from '../index';

describe('drop ui schema', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createApp({
      afterLoad(app) {
        const fieldCollection = app.db.getCollection('fields');
        console.log(fieldCollection.options);
      },
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should update uiSchema to options field', async () => {
    console.log('hello world');
  });
});
