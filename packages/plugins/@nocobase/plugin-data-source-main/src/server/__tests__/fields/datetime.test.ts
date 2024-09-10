import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '../index';

describe('datetime', () => {
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

  it('should create datetimeNoTz field', async () => {
    await Collection.repository.create({
      values: {
        name: 'tests',
        fields: [
          {
            type: 'datetimeNoTz',
            name: 'date1',
          },
        ],
      },
      context: {},
    });

    // @ts-ignore
    const agent = app.agent();

    const createRes = await agent.resource('tests').create({
      values: {
        date1: '2023-03-24 12:00:00',
      },
    });

    expect(createRes.status).toBe(200);

    // get item
    const res = await agent.resource('tests').list();
    expect(res.body.data[0].date1).toBe('2023-03-24 12:00:00');
  });
});
