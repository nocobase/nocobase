import { AppSupervisor, Plugin, PluginManager } from '@nocobase/server';
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

    expect(loadFn).toHaveBeenCalled();
    expect(installFn).toHaveBeenCalledTimes(1);

    const subApp = await AppSupervisor.getInstance().getApp(name);
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
          plugins: ['ui-schema-storage'],
        },
      },
    });
    const subApp = await AppSupervisor.getInstance().getApp(name);
    await subApp.destroy();
    await app.destroy();
  });
});
