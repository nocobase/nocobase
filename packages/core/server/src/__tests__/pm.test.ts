import Plugin from '../plugin';
import { PluginManager } from '../plugin-manager';
import { vi } from 'vitest';
import { MockServer, mockServer } from '@nocobase/test';

describe('pm', () => {
  let app: MockServer;
  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });
  test('addPreset', async () => {
    class Plugin1 extends Plugin {}
    app = mockServer({
      plugins: [
        [
          Plugin1,
          {
            name: 'plugin1',
          },
        ],
      ],
    });
    await app.load();
    expect(app.pm.get('plugin1').enabled).toBeTruthy();
    expect(app.pm.get(Plugin1).enabled).toBeTruthy();
    expect(app.pm.get('plugin1').options.isPreset).toBeTruthy();
    expect(app.pm.get(Plugin1).options.isPreset).toBeTruthy();
  });
  test('addPreset', async () => {
    class Plugin1 extends Plugin {}
    app = mockServer({
      plugins: [Plugin1],
    });
    await app.load();
    expect(app.pm.get(Plugin1).enabled).toBeTruthy();
    expect(app.pm.get(Plugin1).options.isPreset).toBeTruthy();
  });
  test('add', async () => {
    class Plugin1 extends Plugin {}
    app = mockServer();
    await app.pm.add(Plugin1);
    expect(app.pm.get(Plugin1).enabled).toBeFalsy();
    expect(app.pm.get(Plugin1).options.isPreset).toBeFalsy();
  });
  test('add', async () => {
    class Plugin1 extends Plugin {}
    app = mockServer();
    await app.pm.add(Plugin1, {
      enabled: true,
    });
    expect(app.pm.get(Plugin1).enabled).toBeTruthy();
  });
  test('add', async () => {
    class Plugin1 extends Plugin {}
    app = mockServer();
    await app.pm.add(Plugin1, {
      name: 'plugin1',
      enabled: true,
    });
    expect(app.pm.get(Plugin1).enabled).toBeTruthy();
    expect(app.pm.get('plugin1').enabled).toBeTruthy();
    expect(app.pm.get(Plugin1).options.isPreset).toBeFalsy();
    expect(app.pm.get('plugin1').options.isPreset).toBeFalsy();
  });
  test('load', async () => {
    const arr = [];
    class Plugin1 extends Plugin {
      async afterAdd() {
        arr.push(1);
      }
      async beforeLoad() {
        arr.push(2);
      }
      async load() {
        arr.push(3);
      }
    }
    class Plugin2 extends Plugin {
      async afterAdd() {
        arr.push(4);
        await app.pm.add(Plugin3, {
          enabled: true,
        });
      }
      async beforeLoad() {
        arr.push(5);
      }
      async load() {
        arr.push(6);
      }
    }
    class Plugin3 extends Plugin {
      async afterAdd() {
        arr.push(7);
      }
      async beforeLoad() {
        arr.push(8);
      }
      async load() {
        arr.push(9);
      }
    }
    app = mockServer({
      plugins: [Plugin1, Plugin2],
    });
    await app.pm.initPlugins();
    await app.pm.load();
    await app.pm.load();
    expect(arr).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9]);
  });
  test('install', async () => {
    const arr = [];
    class Plugin1 extends Plugin {
      async install() {
        arr.push(1);
      }
    }
    class Plugin2 extends Plugin {
      async install() {
        arr.push(2);
        await app.pm.add(Plugin3, {
          enabled: true,
        });
        await app.pm.install();
      }
    }
    class Plugin3 extends Plugin {
      async install() {
        arr.push(3);
      }
    }
    app = mockServer({
      plugins: [Plugin1, Plugin2],
    });
    await app.load();
    await app.pm.install();
    await app.pm.install();
    expect(arr).toEqual([1, 2, 3]);
  });
  test('enable', async () => {
    app = mockServer();
    await app.load();
    await expect(() => app.pm.enable('Plugin0')).rejects.toThrow('Plugin0 plugin does not exist');
  });
  test('enable', async () => {
    const loadFn = vi.fn();
    class Plugin1 extends Plugin {
      async beforeEnable() {
        loadFn();
      }
      async install() {
        loadFn();
      }
      async afterEnable() {
        loadFn();
      }
    }
    app = mockServer({
      plugins: [
        [
          Plugin1,
          {
            name: 'Plugin1',
          },
        ],
      ],
    });
    await app.load();
    await app.pm.enable('Plugin1');
    expect(loadFn).not.toBeCalled();
  });
  test('enable', async () => {
    const resolvePlugin = PluginManager.resolvePlugin;
    PluginManager.resolvePlugin = async (pluginName) => {
      return Plugin1;
    };
    const loadFn = vi.fn();
    class Plugin1 extends Plugin {
      async beforeEnable() {
        loadFn();
      }
      async install() {
        loadFn();
      }
      async afterEnable() {
        loadFn();
      }
    }
    app = mockServer();
    await app.cleanDb();
    await app.load();
    await app.install();
    await app.pm.repository.create({
      values: {
        name: 'Plugin1',
        enabled: true,
        installed: true,
      },
    });
    await app.reload();
    expect(app.pm.get('Plugin1').enabled).toBeTruthy();
    expect(app.pm.get('Plugin1').installed).toBeTruthy();
    await app.pm.enable('Plugin1');
    expect(loadFn).not.toBeCalled();
    PluginManager.resolvePlugin = resolvePlugin;
  });

  test('enable12', async () => {
    const resolvePlugin = PluginManager.resolvePlugin;
    PluginManager.resolvePlugin = async (pluginName) => {
      return Plugin1;
    };

    const loadFn = vi.fn();

    class Plugin1 extends Plugin {
      async beforeEnable() {
        loadFn();
      }
      async install() {
        loadFn();
      }
      async afterEnable() {
        loadFn();
      }
    }
    app = mockServer();
    await app.cleanDb();
    await app.load();
    await app.install();
    await app.pm.repository.create({
      values: {
        name: 'Plugin1',
      },
    });
    await app.reload();
    await app.pm.enable('Plugin1');
    expect(app.pm.get('Plugin1').enabled).toBeTruthy();
    expect(app.pm.get('Plugin1').installed).toBeTruthy();
    expect(loadFn).toBeCalled();
    expect(loadFn).toBeCalledTimes(3);
    await app.pm.enable('Plugin1');
    expect(loadFn).toBeCalledTimes(3);
    await app.pm.disable('Plugin1');
    await app.pm.enable('Plugin1');
    expect(loadFn).toBeCalledTimes(5);
    PluginManager.resolvePlugin = resolvePlugin;
  });
  test('enable11', async () => {
    const loadFn = vi.fn();
    class Plugin1 extends Plugin {
      async beforeEnable() {
        loadFn();
      }
      async install() {
        loadFn();
      }
      async afterEnable() {
        loadFn();
      }
    }
    class Plugin2 extends Plugin {
      async beforeEnable() {
        loadFn();
      }
      async install() {
        loadFn();
      }
      async afterEnable() {
        loadFn();
      }
    }
    const resolvePlugin = PluginManager.resolvePlugin;
    PluginManager.resolvePlugin = async (pluginName: string) => {
      return {
        Plugin1,
        Plugin2,
      }[pluginName];
    };
    app = mockServer();
    await app.cleanDb();
    await app.load();
    await app.install();
    await app.pm.repository.create({
      values: [
        {
          name: 'Plugin1',
        },
        {
          name: 'Plugin2',
        },
      ],
    });
    await app.reload();
    await app.pm.enable(['Plugin1', 'Plugin2']);
    expect(app.pm.get('Plugin1').enabled).toBeTruthy();
    expect(app.pm.get('Plugin1').installed).toBeTruthy();
    expect(app.pm.get('Plugin2').enabled).toBeTruthy();
    expect(app.pm.get('Plugin2').installed).toBeTruthy();
    expect(loadFn).toBeCalled();
    expect(loadFn).toBeCalledTimes(6);
    await app.pm.enable(['Plugin1', 'Plugin2']);
    expect(loadFn).toBeCalledTimes(6);
    PluginManager.resolvePlugin = resolvePlugin;
  });
  test('disable', async () => {
    const resolvePlugin = PluginManager.resolvePlugin;
    PluginManager.resolvePlugin = async (pluginName) => {
      return Plugin1;
    };
    const loadFn = vi.fn();
    class Plugin1 extends Plugin {
      async beforeDisable() {
        loadFn();
      }
      async afterDisable() {
        loadFn();
      }
    }
    app = mockServer();
    await app.cleanDb();
    await app.load();
    await app.install();
    await app.pm.repository.create({
      values: {
        name: 'Plugin1',
      },
    });
    await app.reload();
    expect(app.pm.get('Plugin1').enabled).toBeFalsy();
    expect(app.pm.get('Plugin1').installed).toBeFalsy();
    await app.pm.disable('Plugin1');
    expect(loadFn).not.toBeCalled();
    PluginManager.resolvePlugin = resolvePlugin;
  });
  test('disable', async () => {
    const resolvePlugin = PluginManager.resolvePlugin;
    PluginManager.resolvePlugin = async (pluginName) => {
      return Plugin1;
    };
    const loadFn = vi.fn();
    class Plugin1 extends Plugin {
      async beforeDisable() {
        loadFn();
      }
      async afterDisable() {
        loadFn();
      }
    }
    app = mockServer();
    await app.cleanDb();
    await app.load();
    await app.install();
    await app.pm.repository.create({
      values: {
        name: 'Plugin1',
        enabled: true,
        installed: true,
      },
    });
    await app.reload();
    expect(app.pm.get('Plugin1').enabled).toBeTruthy();
    expect(app.pm.get('Plugin1').installed).toBeTruthy();
    await app.pm.disable('Plugin1');
    expect(loadFn).toBeCalled();
    expect(loadFn).toBeCalledTimes(2);
    expect(app.pm.get('Plugin1').enabled).toBeFalsy();
    expect(app.pm.get('Plugin1').installed).toBeTruthy();
    PluginManager.resolvePlugin = resolvePlugin;
  });
  test('install', async () => {
    class Plugin0 extends Plugin {
      async install() {
        await this.app.pm.repository.create({
          values: {
            name: 'Plugin1',
            enabled: true,
          },
        });
        await this.app.pm.repository.init();
        await this.app.pm.load();
        await this.app.pm.install();
      }
    }
    class Plugin1 extends Plugin {}
    class Plugin2 extends Plugin {}
    const resolvePlugin = PluginManager.resolvePlugin;
    PluginManager.resolvePlugin = async (pluginName: string) => {
      return {
        Plugin0,
        Plugin1,
        Plugin2,
      }[pluginName];
    };
    app = mockServer({
      plugins: ['Plugin0'],
    });
    await app.cleanDb();
    await app.load();
    await app.install();
    expect(app.pm.get('Plugin1').enabled).toBeTruthy();
    expect(app.pm.get('Plugin1').installed).toBeTruthy();
    const record = await app.pm.repository.findOne({
      filter: {
        name: 'Plugin1',
      },
    });
    expect(record.enabled).toBeTruthy();
    expect(record.installed).toBeTruthy();
    PluginManager.resolvePlugin = resolvePlugin;
  });
  test('life-cycle', async () => {
    const resolvePlugin = PluginManager.resolvePlugin;
    PluginManager.resolvePlugin = async (pluginName) => {
      return Plugin1;
    };
    const hooks = [];
    const result = [];
    class Plugin1 extends Plugin {
      prop: any;
      async afterAdd() {
        hooks.push('afterAdd');
      }
      async beforeLoad() {
        hooks.push('beforeLoad');
      }
      async load() {
        this.prop = 'a';
        hooks.push('load');
      }
      async beforeEnable() {
        hooks.push('beforeEnable');
        result.push(this.prop === 'a');
      }
      async install() {
        hooks.push('install');
        result.push(this.prop === 'a');
      }
      async afterEnable() {
        hooks.push('afterEnable');
        result.push(this.prop === 'a');
      }
      async beforeDisable() {
        hooks.push('beforeDisable');
        result.push(this.prop === 'a');
      }
      async afterDisable() {
        hooks.push('afterDisable');
        result.push(this.prop === 'a');
      }
    }
    app = mockServer();
    await app.cleanDb();
    await app.load();
    await app.install();
    const plugin = await app.pm.repository.create({
      values: {
        name: 'Plugin1',
      },
    });
    await app.reload();
    expect(app.pm.get('Plugin1')['prop']).toBeUndefined();
    expect(result).toEqual([]);
    await app.pm.enable('Plugin1');
    expect(app.pm.get('Plugin1')['prop']).toBe('a');
    // console.log(hooks.join('/'));
    expect(result).toEqual([false, true, true]);
    await app.pm.disable('Plugin1');
    // console.log(hooks.join('/'));
    expect(app.pm.get('Plugin1')['prop']).toBeUndefined();
    expect(result).toEqual([false, true, true, true, false]);
    // console.log(hooks.join('/'));
    PluginManager.resolvePlugin = resolvePlugin;
  });
});
