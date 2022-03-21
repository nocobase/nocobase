import { mockServer, MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { PluginMultipleApps } from '../server';

describe('multiple apps', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = mockServer({});
    db = app.db;
    await app.cleanDb();
    app.plugin(PluginMultipleApps);

    await app.loadAndInstall();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create application', async () => {
    const miniApp = await db.getRepository('applications').create({
      values: {
        name: 'miniApp',
      },
    });
    expect(app.multiAppManager.applications.get('miniApp')).toBeDefined();
  });
});
