import { Application, Collection, DEFAULT_DATA_SOURCE_KEY, LocalDataSource, Plugin } from '@nocobase/client';
import collections from '../collections.json';

describe('DataSourceManager', () => {
  describe('mixins', () => {
    test('init should work', () => {
      class DemoCollectionMixin extends Collection {
        a() {
          return 'test-' + this.name;
        }
      }

      const app = new Application({
        dataSourceManager: {
          collections: collections as any,
          collectionMixins: [DemoCollectionMixin],
        },
      });

      const user = app.getCollectionManager().getCollection<DemoCollectionMixin>('users');
      expect(user.a()).toBe('test-users');
    });

    test('plugin should work', async () => {
      class DemoCollectionMixin extends Collection {
        b() {
          return 'test-' + this.name;
        }
      }

      class MyPlugin extends Plugin {
        async load() {
          this.app.getCollectionManager().addCollections(collections as any);
          this.app.dataSourceManager.addCollectionMixins([DemoCollectionMixin]);
        }
      }

      const app = new Application({
        plugins: [MyPlugin],
      });

      await app.load();

      const user = app.getCollectionManager().getCollection<DemoCollectionMixin>('users');
      expect(user.b()).toBe('test-users');
    });

    test('multiple mixins should work', () => {
      class DemoCollectionMixin1 extends Collection {
        c() {
          return 'test1-' + this.name;
        }
      }

      class DemoCollectionMixin2 extends Collection {
        d() {
          return 'test2-' + this.name;
        }
      }

      const app = new Application({
        dataSourceManager: {
          collections: collections as any,
          collectionMixins: [DemoCollectionMixin1, DemoCollectionMixin2],
        },
      });

      const user = app.getCollectionManager().getCollection<DemoCollectionMixin1 & DemoCollectionMixin2>('users');
      expect(user.c()).toBe('test1-users');
      expect(user.d()).toBe('test2-users');
    });

    test('after add mixins, collection should be re-instantiated', () => {
      class DemoCollectionMixin extends Collection {
        e() {
          return 'test-' + this.name;
        }
      }

      const app = new Application({
        dataSourceManager: {
          collections: collections as any,
        },
      });

      const user = app.getCollectionManager().getCollection<DemoCollectionMixin>('users');
      expect(user.e).toBeUndefined();

      app.dataSourceManager.addCollectionMixins([DemoCollectionMixin]);

      const user2 = app.getCollectionManager().getCollection<DemoCollectionMixin>('users');
      expect(user2.e()).toBe('test-users');
    });
  });

  describe('getAllCollections', () => {
    test('getAllCollections() should work', () => {
      const app = new Application({
        dataSourceManager: {
          dataSources: [
            {
              key: 'a',
              displayName: 'a',
            },
          ],
        },
      });
      app.getCollectionManager().addCollections(collections as any);
      app.getCollectionManager('a').addCollections([collections[0]] as any);

      const allCollections = app.dataSourceManager.getAllCollections();

      expect(allCollections.length).toBe(2);
      expect(allCollections[0].key).toBe(DEFAULT_DATA_SOURCE_KEY);
      expect(allCollections[1].key).toBe('a');

      expect(allCollections[0].collections.length).toBe(2);
      expect(allCollections[1].collections.length).toBe(1);
    });
  });

  describe('addDataSource', () => {
    test('should add a data source', () => {
      const app = new Application();
      const dataSourceManager = app.dataSourceManager;

      expect(dataSourceManager.getDataSources()).toHaveLength(1);

      const dataSource = dataSourceManager.addDataSource(LocalDataSource, {
        key: 'test',
        displayName: 'Test',
      });

      expect(dataSourceManager.getDataSources()).toHaveLength(2);
      expect(dataSourceManager.getDataSource('test')).toBe(dataSource);
    });
  });

  describe('removeDataSources', () => {
    test('should remove data sources', () => {
      const app = new Application();
      const dataSourceManager = app.dataSourceManager;

      dataSourceManager.addDataSource(LocalDataSource, {
        key: 'test1',
        displayName: 'Test 1',
      });

      dataSourceManager.addDataSource(LocalDataSource, {
        key: 'test2',
        displayName: 'Test 2',
      });

      expect(dataSourceManager.getDataSources()).toHaveLength(3);

      dataSourceManager.removeDataSources(['test1']);

      expect(dataSourceManager.getDataSources()).toHaveLength(2);
      expect(dataSourceManager.getDataSource('test1')).toBeUndefined();
      expect(dataSourceManager.getDataSource('test2')).toBeDefined();
    });
  });

  describe('reload', () => {
    test('should reload data sources', async () => {
      const app = new Application();
      const dataSourceManager = app.dataSourceManager;

      const dataSource1 = dataSourceManager.addDataSource(LocalDataSource, {
        key: 'test1',
        displayName: 'Test 1',
      });

      const dataSource2 = dataSourceManager.addDataSource(LocalDataSource, {
        key: 'test2',
        displayName: 'Test 2',
      });

      const reloadSpy1 = vitest.spyOn(dataSource1, 'reload');
      const reloadSpy2 = vitest.spyOn(dataSource2, 'reload');

      await dataSourceManager.reload();

      expect(reloadSpy1).toHaveBeenCalledTimes(1);
      expect(reloadSpy2).toHaveBeenCalledTimes(1);
    });
  });
});
