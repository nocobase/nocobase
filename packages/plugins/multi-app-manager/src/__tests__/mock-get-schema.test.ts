import { Plugin, PluginManager } from '@nocobase/server';
import { mockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import { PluginMultiAppManager } from '../server';

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
    PluginManager.resolvePlugin = mockGetPluginByName;

    const app = mockServer();
    await app.cleanDb();

    app.plugin(PluginMultiAppManager);

    await app.loadAndInstall();
    await app.start();

    const db = app.db;

    const name = `d_${uid()}`;

    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: ['test-package'],
        },
      },
    });

    expect(loadFn).toHaveBeenCalledTimes(1);
    expect(installFn).toHaveBeenCalledTimes(1);

    const subApp = await app.appManager.getApplication(name);
    await subApp.destroy();
    await app.destroy();
  });

  it('should install into difference database', async () => {
    const app = mockServer();
    await app.cleanDb();
    app.plugin(PluginMultiAppManager);

    await app.loadAndInstall();
    await app.start();

    const db = app.db;

    const name = `d_${uid()}`;

    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: ['@nocobase/plugin-ui-schema-storage'],
        },
      },
    });
    const subApp = await app.appManager.getApplication(name);
    await subApp.destroy();
    await app.destroy();
  });

  it('should lazy load applications', async () => {
    class TestPlugin extends Plugin {
      getName(): string {
        return 'test-package';
      }
    }

    let app = mockServer();
    await app.cleanDb();
    app.plugin(PluginMultiAppManager);

    await app.loadAndInstall();
    await app.start();

    const db = app.db;

    const mockGetPluginByName = jest.fn();
    mockGetPluginByName.mockReturnValue(TestPlugin);
    PluginManager.resolvePlugin = mockGetPluginByName;

    await db.getRepository('applications').create({
      values: {
        name: 'sub1',
        options: {
          plugins: ['test-package'],
        },
      },
    });

    expect(app.appManager.applications.get('sub1')).toBeDefined();

    await app.appManager.applications.get('sub1').destroy();
    await app.stop();

    let newApp = mockServer({
      database: app.db,
    });

    newApp.plugin(PluginMultiAppManager);
    await newApp.db.reconnect();

    await newApp.load();
    await newApp.start();

    expect(await newApp.db.getRepository('applications').count()).toEqual(1);
    expect(newApp.appManager.applications.get('sub1')).not.toBeDefined();

    newApp.appManager.setAppSelector(() => {
      return 'sub1';
    });

    await newApp.agent().resource('test').test();
    expect(newApp.appManager.applications.get('sub1')).toBeDefined();

    await newApp.appManager.applications.get('sub1').destroy();

    await app.destroy();
  });
});
