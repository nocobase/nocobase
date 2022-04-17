import { Application } from '../application';
import { Plugin } from '../plugin';
import Plugin1 from './plugins/plugin1';
import Plugin2 from './plugins/plugin2';
import Plugin3 from './plugins/plugin3';
import { mockServer, MockServer } from '@nocobase/test';

describe('plugin', () => {
  let app: MockServer;

  beforeEach(() => {
    app = mockServer();
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('define', () => {
    it('should add plugin with options', async () => {
      class MyPlugin extends Plugin {
        getName(): string {
          return 'test';
        }
      }

      const plugin = app.plugin(MyPlugin, {
        test: 'hello',
      });

      expect(plugin.options['test']).toEqual('hello');
    });

    it('plugin name', async () => {
      interface Options {
        a?: string;
      }
      class MyPlugin extends Plugin<Options> {
        async load() {
          this.options.a;
        }

        getName(): string {
          return 'MyPlugin';
        }
      }
      const plugin = app.plugin<Options>(MyPlugin, {
        a: 'aa',
      });
      plugin.setOptions({
        a: 'a',
      });
      expect(plugin).toBeInstanceOf(MyPlugin);
      expect(plugin.getName()).toBe('MyPlugin');
    });

    it('plugin name', async () => {
      const plugin = app.plugin(Plugin1);
      expect(plugin).toBeInstanceOf(Plugin);
      expect(plugin.getName()).toBe('Plugin1');
    });

    it('plugin name', async () => {
      const plugin = app.plugin(Plugin3);
      expect(plugin).toBeInstanceOf(Plugin3);
      expect(plugin.getName()).toBe('Plugin3');
    });
  });

  describe('load', () => {
    it('plugin load', async () => {
      app.plugin(
        class MyPlugin extends Plugin {
          async load() {
            this.app.collection({
              name: 'tests',
            });
          }

          getName(): string {
            return 'test';
          }
        },
      );
      await app.load();
      const Test = app.db.getCollection('tests');
      expect(Test).toBeDefined();
    });

    it('plugin load', async () => {
      app.plugin(Plugin1);
      await app.load();
      const Test = app.db.getCollection('tests');
      expect(Test).toBeDefined();
    });

    it('plugin load', async () => {
      app.plugin(Plugin2);
      await app.load();
      const Test = app.db.getCollection('tests');
      expect(Test).toBeDefined();
    });

    it('plugin load', async () => {
      app.plugin(Plugin3);
      await app.load();
      const Test = app.db.getCollection('tests');
      expect(Test).toBeDefined();
    });
  });
});
