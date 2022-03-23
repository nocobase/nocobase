import { mockServer, MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { PluginMultipleApps } from '../server';
import { Plugin } from '@nocobase/server';
import { ApplicationModel } from '../models/application';

describe('multiple apps', () => {
  it('should load subApp on create', async () => {
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

  it('should install into difference database', async () => {
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
            name: '@nocobase/plugin-ui-schema-storage',
          },
        ],
      },
    });
  });

  it('should load applications on start', async () => {
    class TestPlugin extends Plugin {
      getName(): string {
        return 'test-package';
      }
    }

    let app = mockServer();
    await app.cleanDb();
    app.plugin(PluginMultipleApps);

    await app.loadAndInstall();
    await app.start();

    const db = app.db;

    const mockGetPluginByName = jest.fn();
    mockGetPluginByName.mockReturnValue(TestPlugin);
    ApplicationModel.getPluginByName = mockGetPluginByName;

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

    expect(app.multiAppManager.applications.get('sub1')).toBeDefined();

    await app.stop();

    let newApp = mockServer({
      database: app.db,
    });

    newApp.plugin(PluginMultipleApps);
    await newApp.db.reconnect();

    await newApp.load();
    await newApp.start();

    expect(await newApp.db.getRepository('applications').count()).toEqual(1);
    expect(newApp.multiAppManager.applications.get('sub1')).toBeDefined();
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
