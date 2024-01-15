import { vi } from 'vitest';
import Application from '../application';
import { Plugin } from '../plugin';

describe('application life cycle', () => {
  let app: Application;

  beforeEach(async () => {
    app = new Application({
      database: {
        dialect: 'sqlite',
        storage: ':memory:',
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should start application', async () => {
    const loadFn = vi.fn();
    const installFn = vi.fn();

    // register plugin
    class TestPlugin extends Plugin {
      beforeLoad() {}

      getName() {
        return 'Test';
      }

      async load() {
        loadFn();
        this.app.on('beforeInstall', () => {
          installFn();
        });
      }
    }
    app.plugin(TestPlugin);
    await app.load();
    expect(loadFn).toHaveBeenCalledTimes(1);
    expect(installFn).toHaveBeenCalledTimes(0);
    await app.install();
    expect(installFn).toHaveBeenCalledTimes(1);
  });
});
