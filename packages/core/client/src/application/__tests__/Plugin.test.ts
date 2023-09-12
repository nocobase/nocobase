import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Application } from '../Application';
import { Plugin } from '../Plugin';

describe('Plugin', () => {
  beforeAll(() => {
    const mock = new MockAdapter(axios);
    mock.onGet('pm:listEnabled').reply(200, {
      data: [],
    });
  });

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

  it('dynamic Plugins', async () => {
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
