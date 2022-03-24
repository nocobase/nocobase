import { Plugin } from '@nocobase/server';
import { ApplicationModel } from '../models/application';
import { mockServer } from '@nocobase/test';
import { PluginMultipleApps } from '../server';

describe('test with start', () => {
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
    await app.destroy();
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

    expect(app.appManager.applications.get('sub1')).toBeDefined();

    await app.stop();

    let newApp = mockServer({
      database: app.db,
    });

    newApp.plugin(PluginMultipleApps);
    await newApp.db.reconnect();

    await newApp.load();
    await newApp.start();

    expect(await newApp.db.getRepository('applications').count()).toEqual(1);
    expect(newApp.appManager.applications.get('sub1')).toBeDefined();

    await app.destroy();
  });
});
