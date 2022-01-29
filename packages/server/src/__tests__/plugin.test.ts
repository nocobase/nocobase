import { Application } from '../application';
import { Plugin } from '../plugin';
import Plugin3 from './plugins/plugin3';
import Plugin1 from './plugins/plugin1';
import Plugin2 from './plugins/plugin2';

describe('plugin', () => {
  let app: Application;

  beforeEach(() => {
    app = new Application({
      database: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT as any,
        dialect: process.env.DB_DIALECT as any,
        dialectOptions: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
        },
      },
      resourcer: {
        prefix: '/api',
      },
      dataWrapping: false,
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('define', () => {
    it('plugin name', async () => {
      class MyPlugin extends Plugin {
        load() {}
      }

      const plugin = app.plugin(MyPlugin);
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
