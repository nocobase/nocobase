import { mockServer, MockServer } from '@nocobase/test';
import { PresetNocoBase } from '../index';
import { Database } from '@nocobase/database';
describe('test', () => {
  let app: MockServer;
  let agent;
  let db: Database;

  beforeEach(async () => {
    app = mockServer();
    app.plugin(PresetNocoBase);
    agent = app.agent();
    db = app.db;

    await app.loadAndInstall();
    await db.sync();
  });

  it('should be ok', async () => {
    const user = await db.getRepository('users').find({});

    console.log({ user });
  });
});
