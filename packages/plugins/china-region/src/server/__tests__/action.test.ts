import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import Plugin from '../index';

describe('actions test', () => {
  let app: MockServer;
  let db: Database;
  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
    });

    await app.cleanDb();

    app.plugin(Plugin);
    await app.load();
    await app.db.sync();

    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should only call list action on chinaRegions resource', async () => {
    const listResponse = await app.agent().resource('chinaRegions').list();

    expect(listResponse.statusCode).toEqual(200);

    const createResponse = await app.agent().resource('chinaRegions').create();

    expect(createResponse.statusCode).toEqual(404);
  });
});
