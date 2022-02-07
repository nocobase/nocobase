import Application from '../application';
import { Plugin } from '../plugin';

describe('application life cycle', () => {
  it('should start application', async () => {
    const app = new Application({
      database: {
        dialect: 'sqlite',
        storage: ':memory:',
      },
    });

    const loadFn = jest.fn();
    const installFn = jest.fn();

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

  it('should listen application', async () => {
    const app = new Application({
      database: {
        dialect: 'sqlite',
        storage: ':memory:',
      },
    });

    await app.start({ listen: { port: 13090 } });
    expect(app.listenServer).not.toBeNull();

    await app.stop();
    expect(app.listenServer).toBeNull();
  });
});
