import Database from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';
import AuthPlugin from '../';

describe('authenticators', () => {
  let app: MockServer;
  let db: Database;
  let agent;

  beforeAll(async () => {
    app = mockServer();
    await app.cleanDb();
    app.plugin(AuthPlugin);
    await app.loadAndInstall();
    db = app.db;

    agent = app.agent();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should list authenticator types', async () => {
    const res = await agent.get('/authenticators:listTypes');
    console.log(res.body);
  });
});
