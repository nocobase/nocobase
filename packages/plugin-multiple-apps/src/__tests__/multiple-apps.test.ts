import { mockServer, MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { PluginMultipleApps } from '../server';
import { Plugin } from '@nocobase/server';
import { ApplicationModel } from '../models/application';

describe('multiple apps', () => {
  it('should load subApp', async () => {
    const loadFn = jest.fn();
    const installFn = jest.fn();

    class TestPlugin extends Plugin {
      getName(): string {
        return 'test-package';
      }

      async load(): Promise<void> {
        loadFn();
      }

      async install() {
        installFn();
      }
    }

    const mockGetPluginByName = jest.fn();
    mockGetPluginByName.mockReturnValue(TestPlugin);
    ApplicationModel.getPluginByName = mockGetPluginByName;

    const app = mockServer();
    await app.cleanDb();
    app.plugin(PluginMultipleApps);

    await app.loadAndInstall();
    await app.start();

    const db = app.db;

    await db.getRepository('applications').create({
      values: {
        name: 'sub1',
        plugins: [
          {
            name: 'test-package',
          },
        ],
      },
    });

    expect(loadFn).toHaveBeenCalledTimes(1);
    expect(installFn).toHaveBeenCalledTimes(1);

    await app.destroy();
  });
});

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

    expect(app.multiAppManager.applications.get('miniApp')).toBeDefined();
  });

  it('should remove application', async () => {
    await db.getRepository('applications').create({
      values: {
        name: 'miniApp',
      },
    });

    expect(app.multiAppManager.applications.get('miniApp')).toBeDefined();

    await db.getRepository('applications').destroy({
      filter: {
        name: 'miniApp',
      },
    });

    expect(app.multiAppManager.applications.get('miniApp')).toBeUndefined();
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

    const miniApp = app.multiAppManager.applications.get('miniApp');
    expect(miniApp).toBeDefined();

    expect(miniApp.pm.get('@nocobase/plugin-ui-schema-storage')).toBeDefined();
  });
});
