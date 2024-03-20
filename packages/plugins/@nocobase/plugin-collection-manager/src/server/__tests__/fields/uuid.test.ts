import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';

describe('uuid', () => {
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

  it('should create uuid field', async () => {
    await Collection.repository.create({
      values: {
        name: 'tests',
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        collectionName: 'tests',
        type: 'uuid',
        name: 'uuid',
      },
      context: {},
    });

    // @ts-ignore
    const resp = await app.agent().resource('tests').create({});
    expect(resp.status).toBe(200);

    const data = resp.body.data;
    expect(data['uuid']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
