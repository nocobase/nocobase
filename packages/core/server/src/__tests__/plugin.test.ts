import { vi } from 'vitest';
import { mockServer, MockServer } from '@nocobase/test';
import { Plugin } from '../plugin';
import Plugin1 from './plugins/plugin1';
import Plugin2 from './plugins/plugin2';
import Plugin3 from './plugins/plugin3';

describe('plugin', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = mockServer();
    await app.db.clean({ drop: true });

    await app.db.sync();
  });

  afterEach(async () => {
    await app.destroy();
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

  describe.skip('enable', function () {
    it('should call beforeEnable', async () => {
      const beforeEnable = vi.fn();

      class TestPlugin extends Plugin {
        async beforeEnable() {
          beforeEnable();
        }
      }

      app.plugin(TestPlugin);
      await app.pm.enable('TestPlugin');
      expect(beforeEnable).toBeCalled();
    });
  });
});
