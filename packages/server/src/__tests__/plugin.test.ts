import supertest from 'supertest';
import { Application } from '../application';
import { Plugin } from '../plugin';
import path from 'path';
import Plugin3 from './plugins/plugin3';

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
    return app.db.close();
  });

  describe('define', () => {
    it('plugin name', async () => {
      const plugin = app.plugin(function abc() {});
      expect(plugin).toBeInstanceOf(Plugin);
      expect(plugin.getName()).toBe('abc');
    });
    it('plugin name', async () => {
      const plugin = app.plugin(function abc() {}, {
        name: 'plugin-name2'
      });
      expect(plugin).toBeInstanceOf(Plugin);
      expect(plugin.getName()).toBe('plugin-name2');
    });
    it('plugin name', async () => {
      const plugin = app.plugin(function () {}, {
        name: 'plugin-name3'
      });
      expect(plugin).toBeInstanceOf(Plugin);
      expect(plugin.getName()).toBe('plugin-name3');
    });
    it('plugin name', async () => {
      class MyPlugin extends Plugin {}
      const plugin = app.plugin(MyPlugin);
      expect(plugin).toBeInstanceOf(MyPlugin);
      expect(plugin.getName()).toBe('MyPlugin');
    });

    it('plugin name', async () => {
      const plugin = app.plugin(path.resolve(__dirname, './plugins/plugin1'));
      expect(plugin).toBeInstanceOf(Plugin);
      expect(plugin.getName()).toBe('abc');
    });

    it('plugin name', async () => {
      const plugin = app.plugin(path.resolve(__dirname, './plugins/plugin3'));
      expect(plugin).toBeInstanceOf(Plugin3);
      expect(plugin.getName()).toBe('Plugin3');
    });
  });

  describe('load', () => {
    it('plugin load', async () => {
      app.plugin(function abc(this: Plugin) {
        this.app.collection({
          name: 'tests',
        });
      });
      await app.load();
      const Test = app.db.getModel('tests');
      expect(Test).toBeDefined();
    });

    it('plugin load', async () => {
      app.plugin({
        load() {
          app.collection({
            name: 'tests',
          });
        }
      });
      await app.load();
      const Test = app.db.getModel('tests');
      expect(Test).toBeDefined();
    });

    it('plugin load', async () => {
      app.plugin({
        load: () => {
          app.collection({
            name: 'tests',
          });
        }
      });
      await app.load();
      const Test = app.db.getModel('tests');
      expect(Test).toBeDefined();
    });

    it('plugin load', async () => {
      app.plugin(class MyPlugin extends Plugin {
        async load() {
          this.app.collection({
            name: 'tests',
          });
        }
      });
      await app.load();
      const Test = app.db.getModel('tests');
      expect(Test).toBeDefined();
    });

    it('plugin load', async () => {
      app.plugin(path.resolve(__dirname, './plugins/plugin1'));
      await app.load();
      const Test = app.db.getModel('tests');
      expect(Test).toBeDefined();
    });

    it('plugin load', async () => {
      app.plugin(path.resolve(__dirname, './plugins/plugin2'));
      await app.load();
      const Test = app.db.getModel('tests');
      expect(Test).toBeDefined();
    });

    it('plugin load', async () => {
      app.plugin(path.resolve(__dirname, './plugins/plugin3'));
      await app.load();
      const Test = app.db.getModel('tests');
      expect(Test).toBeDefined();
    });
  });
});
