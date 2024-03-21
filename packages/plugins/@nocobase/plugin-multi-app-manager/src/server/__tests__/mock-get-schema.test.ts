import { AppSupervisor, Plugin, PluginManager } from '@nocobase/server';
import { createMockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import { vi } from 'vitest';

describe('test with start', () => {
  it('should load subApp on create', async () => {
    const loadFn = vi.fn();
    const installFn = vi.fn();

    class TestPlugin extends Plugin {
      getName(): string {
        return 'test-package';
      }

      get name() {
        return 'test-package';
      }

      async load(): Promise<void> {
        loadFn();
      }

      async install() {
        installFn();
      }
    }

    const resolvePlugin = PluginManager.resolvePlugin;
    PluginManager.resolvePlugin = function (name, ...args) {
      if (name === 'test-package') {
        return TestPlugin;
      }
      return resolvePlugin.bind(this)(name, ...args);
    };

    const app = await createMockServer({
      plugins: ['multi-app-manager'],
    });

    const db = app.db;

    const name = `d_${uid()}`;

    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: ['test-package'],
        },
      },
      context: {
        waitSubAppInstall: true,
      },
    });

    expect(loadFn).toHaveBeenCalled();
    expect(installFn).toHaveBeenCalledTimes(1);

    const subApp = await AppSupervisor.getInstance().getApp(name);
    await subApp.destroy();
    await app.destroy();
    PluginManager.resolvePlugin = resolvePlugin;
  });

  it('should install into difference database', async () => {
    const app = await createMockServer({
      plugins: ['multi-app-manager'],
    });

    const db = app.db;

    const name = `d_${uid()}`;

    await db.getRepository('applications').create({
      values: {
        name,
        options: {
          plugins: ['ui-schema-storage'],
        },
      },
      context: {
        waitSubAppInstall: true,
      },
    });
    const subApp = await AppSupervisor.getInstance().getApp(name);
    await subApp.destroy();
    await app.destroy();
  });
});
