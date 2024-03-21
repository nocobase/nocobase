import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Application } from '../Application';
import { Plugin } from '../Plugin';

describe('Plugin', () => {
  it('lifecycle', async () => {
    const afterAdd = vitest.fn();
    const beforeLoad = vitest.fn();
    const load = vitest.fn();
    class DemoPlugin extends Plugin {
      async afterAdd() {
        afterAdd();
      }
      async beforeLoad() {
        beforeLoad();
      }
      async load() {
        load();
      }
    }
    const app = new Application({
      plugins: [[DemoPlugin, { name: 'demo1' }]],
    });
    await app.load();

    expect(afterAdd).toBeCalledTimes(1);
    expect(beforeLoad).toBeCalledTimes(1);
    expect(load).toBeCalledTimes(1);
  });
});

describe('PluginManager', () => {
  it('static Plugins', async () => {
    const fn1 = vitest.fn();
    class Demo1Plugin extends Plugin {
      async load() {
        fn1();
      }
    }
    const fn2 = vitest.fn();
    const config = { a: 1 };
    class Demo2Plugin extends Plugin {
      async load() {
        fn2(this.options.config);
      }
    }

    const app = new Application({
      plugins: [
        [Demo1Plugin, { name: 'demo1' }],
        [Demo2Plugin, { name: 'demo2', config }],
      ],
    });
    await app.load();

    expect(fn1).toBeCalledTimes(1);
    expect(fn2).toBeCalledTimes(1);
    expect(fn2).toBeCalledWith(config);
  });

  it('remote plugins', async () => {
    const mock = new MockAdapter(axios);
    mock.onGet('pm:listEnabled').reply(200, {
      data: [
        {
          name: '@nocobase/demo',
          packageName: '@nocobase/demo',
          url: 'https://demo1.com',
        },
        {
          name: '@nocobase/demo2',
          packageName: '@nocobase/demo2',
          url: 'https://demo2.com',
        },
      ],
    });

    // mock requirejs
    const remoteFn = vi.fn();

    const demo1Mock = vi.fn();
    const demo2Mock = vi.fn();
    class Demo1Plugin extends Plugin {
      async load() {
        demo1Mock();
      }
    }

    class Demo2Plugin extends Plugin {
      async load() {
        demo2Mock();
      }
    }

    const mockPluginsModules = (pluginData, resolve) => {
      remoteFn();
      resolve({ default: Demo1Plugin }, { default: Demo2Plugin });
    };

    const requirejs: any = {
      requirejs: mockPluginsModules,
    };

    requirejs.requirejs.config = vi.fn();
    requirejs.requirejs.requirejs = vi.fn();

    const app = new Application({
      loadRemotePlugins: true,
    });
    app.requirejs = requirejs;

    await app.load();

    expect(remoteFn).toBeCalledTimes(1);
    expect(demo1Mock).toBeCalledTimes(1);
  });

  it('Load other plugins through plugins', async () => {
    const fn2 = vitest.fn();
    const config = { a: 1 };
    class Demo2 extends Plugin {
      async load() {
        fn2(this.options.config);
      }
    }

    class Demo1Plugin extends Plugin {
      async afterAdd() {
        await this.app.pm.add(Demo2, { name: 'demo2', config });
      }
    }
    const app = new Application({
      plugins: [[Demo1Plugin, { name: 'demo1' }]],
    });
    await app.load();
    expect(fn2).toBeCalledTimes(1);
    expect(fn2).toBeCalledWith(config);
  });

  it('getter', async () => {
    class DemoPlugin extends Plugin {
      async afterAdd() {
        expect(this.pm).toBe(this.app.pm);
        expect(this.router).toBe(this.app.router);
        expect(this.pluginManager).toBe(this.app.pluginManager);
        expect(this.pluginSettingsManager).toBe(this.app.pluginSettingsManager);
        expect(this.schemaInitializerManager).toBe(this.app.schemaInitializerManager);
        expect(this.schemaSettingsManager).toBe(this.app.schemaSettingsManager);
      }
    }
    const app = new Application({ plugins: [[DemoPlugin, { name: 'demo' }]] });
    await app.load();
  });

  it('get', async () => {
    class DemoPlugin extends Plugin {}
    const app = new Application({ plugins: [[DemoPlugin, { name: 'demo' }]] });
    await app.load();
    expect(app.pm.get('demo')).toBeInstanceOf(DemoPlugin);
  });
});
