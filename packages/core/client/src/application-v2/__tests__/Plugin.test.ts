import { Application } from '../Application';
import { Plugin } from '../Plugin';

describe('Plugin', () => {
  it('lifecycle', async () => {
    const afterAdd = vitest.fn();
    const beforeLoad = vitest.fn();
    const load = vitest.fn();
    class MyPlugin extends Plugin {
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
    const app = new Application({ plugins: [MyPlugin] });
    await app.load();

    expect(afterAdd).toBeCalledTimes(1);
    expect(beforeLoad).toBeCalledTimes(1);
    expect(load).toBeCalledTimes(1);
  });
});

describe('PluginManager', () => {
  it('static Plugins', async () => {
    const fn1 = vitest.fn();
    class MyPlugin extends Plugin {
      async load() {
        fn1();
      }
    }
    const fn2 = vitest.fn();
    const options = { a: 1 };
    class MyPlugin2 extends Plugin {
      async load() {
        fn2(this.options);
      }
    }

    const app = new Application({
      plugins: [MyPlugin, [MyPlugin2, options]],
    });
    await app.load();

    expect(fn1).toBeCalledTimes(1);
    expect(fn2).toBeCalledTimes(1);
    expect(fn2).toBeCalledWith(options);
  });

  it('dynamic Plugins', async () => {
    const fn2 = vitest.fn();
    const options = { a: 1 };
    class MyPlugin2 extends Plugin {
      async load() {
        fn2(this.options);
      }
    }

    class MyPlugin extends Plugin {
      async afterAdd() {
        this.app.pm.add(MyPlugin2, options);
      }
    }
    const app = new Application({ plugins: [MyPlugin] });
    await app.load();
    expect(fn2).toBeCalledTimes(1);
    expect(fn2).toBeCalledWith(options);
  });

  it('getter', async () => {
    class MyPlugin extends Plugin {
      async afterAdd() {
        expect(this.pm).toBe(this.app.pm);
        expect(this.router).toBe(this.app.router);
      }
    }
    const app = new Application({ plugins: [MyPlugin] });
    await app.load();
  });
});
