import { mockServer, MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { PluginMultipleApps } from '../server';

describe('multiple apps create', () => {
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

    expect(app.appManager.applications.get('miniApp')).toBeDefined();
  });

  it('should remove application', async () => {
    await db.getRepository('applications').create({
      values: {
        name: 'miniApp',
      },
    });

    expect(app.appManager.applications.get('miniApp')).toBeDefined();

    await db.getRepository('applications').destroy({
      filter: {
        name: 'miniApp',
      },
    });

    expect(app.appManager.applications.get('miniApp')).toBeUndefined();
  });

  it('should create with plugins', async () => {
    await db.getRepository('applications').create({
      values: {
        name: 'miniApp',
        plugins: [
          {
            name: '@nocobase/plugin-ui-schema-storage',
          },
        ],
      },
    });

    const miniApp = app.appManager.applications.get('miniApp');
    expect(miniApp).toBeDefined();

    expect(miniApp.pm.get('@nocobase/plugin-ui-schema-storage')).toBeDefined();
  });
});
