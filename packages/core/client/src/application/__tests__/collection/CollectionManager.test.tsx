import {
  Application,
  CollectionFieldInterface,
  CollectionTemplate,
  CollectionV2,
  DEFAULT_DATA_SOURCE_NAME,
  Plugin,
} from '@nocobase/client';
import collections from './collections.json';

describe('CollectionManager', () => {
  const collectionLength = collections.length;

  describe('collections', () => {
    describe('init', () => {
      test('init should work', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });

        expect(app.collectionManager.getCollections().length).toBe(collectionLength);
      });

      test('plugin should work', async () => {
        class MyPlugin extends Plugin {
          async load() {
            this.app.collectionManager.addCollections(collections as any);
          }
        }
        const app = new Application({
          plugins: [MyPlugin],
        });
        await app.load();
        expect(app.collectionManager.getCollections().length).toBe(collectionLength);
      });

      test('collection should be instantiated', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });

        const collectionInstances = app.collectionManager.getCollections();
        collectionInstances.forEach((collection) => {
          expect(collection).toBeInstanceOf(CollectionV2);
        });
      });
    });

    describe('addCollection()', () => {
      test('addCollections(collections)', async () => {
        class MyPlugin extends Plugin {
          async load() {
            this.app.collectionManager.addCollections(collections as any);
          }
        }
        const app = new Application({
          plugins: [MyPlugin],
        });
        await app.load();
        expect(app.collectionManager.getCollections().length).toBe(collectionLength);
      });

      test('addCollections(collections) should deduplicate when adding collections', () => {
        const app = new Application();
        app.collectionManager.addCollections([collections[0]] as any);
        app.collectionManager.addCollections([collections[1]] as any);
        app.collectionManager.addCollections(collections as any);

        expect(app.collectionManager.getCollections().length).toBe(collectionLength);
      });

      test('addCollections(collections, { dataSource })', () => {
        const app = new Application({
          collectionManager: {
            dataSources: [
              {
                key: 'a',
                displayName: 'a',
              },
            ],
          },
        });

        app.collectionManager.addCollections(collections as any, { dataSource: 'a' });
        expect(app.collectionManager.getCollections({ dataSource: 'a' }).length).toBe(collectionLength);
      });
    });

    describe('setCollections()', () => {
      test('setCollections(collections) will reset the corresponding data source content', () => {
        const app = new Application();
        app.collectionManager.setCollections(collections as any);
        app.collectionManager.setCollections([collections[1] as any]);

        const collectionInstances = app.collectionManager.getCollections();
        expect(collectionInstances.length).toBe(1);
        expect(collectionInstances[0].name).toBe(collections[1]['name']);
      });

      test('setCollections(collections, { dataSource })', () => {
        const app = new Application({
          collectionManager: {
            dataSources: [
              {
                key: 'a',
                displayName: 'a',
              },
            ],
          },
        });

        app.collectionManager.addCollections(collections as any, { dataSource: 'a' });
        app.collectionManager.setCollections([collections[1]] as any, { dataSource: 'a' });

        const collectionInstances = app.collectionManager.getCollections({ dataSource: 'a' });
        expect(collectionInstances.length).toBe(1);
        expect(collectionInstances[0].name).toBe(collections[1]['name']);
      });
    });

    describe('getCollections()', () => {
      test('getCollections({ dataSource })', () => {
        const app = new Application({
          collectionManager: {
            dataSources: [
              {
                key: 'a',
                displayName: 'a',
              },
            ],
          },
        });
        app.collectionManager.addCollections(collections as any);
        app.collectionManager.addCollections(collections as any, { dataSource: 'a' });
        expect(app.collectionManager.getCollections().length).toBe(collectionLength);
        expect(app.collectionManager.getCollections({ dataSource: 'a' }).length).toBe(collectionLength);
      });

      test('getCollections({ predicate })', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });

        expect(app.collectionManager.getCollections().length).toBe(collectionLength);
        expect(
          app.collectionManager.getCollections({
            predicate: (collection) => collection.name === collections[0]['name'],
          }).length,
        ).toBe(1);
        expect(
          app.collectionManager.getCollections({ predicate: (collection) => collection.hidden === false }).length,
        ).toBe(2);
      });
    });

    describe('getAllCollections', () => {
      test('getAllCollections() should work', () => {
        const app = new Application({
          collectionManager: {
            dataSources: [
              {
                key: 'a',
                displayName: 'a',
              },
            ],
          },
        });
        app.collectionManager.addCollections(collections as any);
        app.collectionManager.addCollections([collections[0]] as any, { dataSource: 'a' });

        const allCollections = app.collectionManager.getAllCollections();

        expect(allCollections.length).toBe(2);
        expect(allCollections[0].key).toBe(DEFAULT_DATA_SOURCE_NAME);
        expect(allCollections[1].key).toBe('a');

        expect(allCollections[0].collections.length).toBe(2);
        expect(allCollections[1].collections.length).toBe(1);
      });
    });

    describe('getCollection()', () => {
      test('getCollection("collectionName")', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const collection = app.collectionManager.getCollection('users');
        expect(collection instanceof CollectionV2).toBeTruthy();
        expect(collection.name).toBe('users');
      });
      test('getCollection("collectionName.associationFieldName")', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const collection = app.collectionManager.getCollection('users.roles');
        expect(collection instanceof CollectionV2).toBeTruthy();
        expect(collection.name).toBe('roles');
      });

      test('getCollection(object) should return an instance without performing a lookup', () => {
        const app = new Application();
        const collection = app.collectionManager.getCollection(collections[0] as any);
        expect(collection instanceof CollectionV2).toBeTruthy();
        expect(collection.name).toBe('users');
      });

      test('getCollection("collectionName", { dataSource })', () => {
        const app = new Application({
          collectionManager: {
            dataSources: [
              {
                key: 'a',
                displayName: 'a',
              },
            ],
          },
        });
        app.collectionManager.addCollections(collections as any, { dataSource: 'a' });
        const collection = app.collectionManager.getCollection('users', { dataSource: 'a' });
        expect(collection instanceof CollectionV2).toBeTruthy();
        expect(collection.name).toBe('users');
      });

      test('getCollection("not-exists") should return undefined', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const collection1 = app.collectionManager.getCollection('not-exists');
        const collection2 = app.collectionManager.getCollection('users.not-exists');
        expect(collection1).toBeUndefined();
        expect(collection2).toBeUndefined();
      });

      test('getCollection(undefined) should return undefined', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const collection = app.collectionManager.getCollection(undefined);
        expect(collection).toBeUndefined();
      });
    });

    describe('getCollectionName()', () => {
      test('getCollectionName("collectionName")', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const collectionName = app.collectionManager.getCollectionName('users');
        expect(collectionName).toBe('users');
      });
      test('getCollectionName("collectionName.associationFieldName")', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const collectionName = app.collectionManager.getCollectionName('users.roles');
        expect(collectionName).toBe('roles');
      });
      test('getCollectionName("collectionName", { dataSource })', () => {
        const app = new Application({
          collectionManager: {
            dataSources: [
              {
                key: 'a',
                displayName: 'a',
              },
            ],
          },
        });
        app.collectionManager.addCollections(collections as any, { dataSource: 'a' });
        const collectionName = app.collectionManager.getCollectionName('users', { dataSource: 'a' });
        expect(collectionName).toBe('users');
      });
      test('getCollectionName("not-exists") should return undefined', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const collection1 = app.collectionManager.getCollectionName('not-exists');
        const collection2 = app.collectionManager.getCollectionName('users.not-exists');
        expect(collection1).toBeUndefined();
        expect(collection2).toBeUndefined();
      });
    });

    describe('getCollectionField()', () => {
      test('getCollectionField("collectionName.fieldName")', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const field = app.collectionManager.getCollectionField('users.nickname');
        expect(field).toBeTruthy();
        expect(field.name).toBe('nickname');
      });

      test('getCollectionField("collectionName.associationFieldName.fieldName")', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const field = app.collectionManager.getCollectionField('users.roles.name');
        expect(field).toBeTruthy();
        expect(field.name).toBe('name');
        expect(field.collectionName).toBe('roles');
      });

      test('getCollectionField("collectionName.fieldName", { dataSource })', () => {
        const app = new Application({
          collectionManager: {
            dataSources: [
              {
                key: 'a',
                displayName: 'a',
                collections: collections as any,
              },
            ],
          },
        });
        const field = app.collectionManager.getCollectionField('users.nickname', { dataSource: 'a' });
        expect(field).toBeTruthy();
        expect(field.name).toBe('nickname');
      });

      test('getCollectionField("not-exists") should return undefined', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const field1 = app.collectionManager.getCollectionField('not-exists');
        const field2 = app.collectionManager.getCollectionField('users.not-exists');
        const field3 = app.collectionManager.getCollectionField('not-exists.not-exists');
        expect(field1).toBeUndefined();
        expect(field2).toBeUndefined();
        expect(field3).toBeUndefined();
      });

      test('getCollectionField(undefined) should return undefined', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const field = app.collectionManager.getCollectionField(undefined);
        expect(field).toBeUndefined();
      });

      test('getCollectionField(object) should return object', () => {
        const app = new Application();
        const obj = {
          name: 'nickname',
          type: 'string',
        };

        const field = app.collectionManager.getCollectionField(obj);
        expect(field).toEqual(obj);
      });
    });

    describe('getCollectionFields()', () => {
      const roles = collections.find((item) => item.name === 'roles');
      const users = collections.find((item) => item.name === 'users');
      test('getCollectionFields("collectionName")', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const fields = app.collectionManager.getCollectionFields('users');
        expect(fields).toEqual(users.fields);
      });

      test('getCollectionFields("collectionName", { dataSource })', () => {
        const app = new Application({
          collectionManager: {
            dataSources: [
              {
                key: 'a',
                displayName: 'a',
                collections: collections as any,
              },
            ],
          },
        });
        const fields = app.collectionManager.getCollectionFields('users', { dataSource: 'a' });
        expect(fields).toEqual(users.fields);
      });

      test('getCollectionFields("collectionName.associationFieldName")', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const fields = app.collectionManager.getCollectionFields('users.roles');
        expect(fields).toEqual(roles.fields);
      });

      test('getCollectionFields("not-exists")', () => {
        const app = new Application({
          collectionManager: {
            collections: collections as any,
          },
        });
        const fields = app.collectionManager.getCollectionFields('not-exists');
        expect(Array.isArray(fields)).toBeTruthy();
        expect(fields.length).toBe(0);
      });
    });
  });

  describe('mixins', () => {
    test('init should work', () => {
      class DemoCollectionMixin extends CollectionV2 {
        a() {
          return 'test-' + this.name;
        }
      }

      const app = new Application({
        collectionManager: {
          collections: collections as any,
          collectionMixins: [DemoCollectionMixin],
        },
      });

      const user = app.collectionManager.getCollection<DemoCollectionMixin>('users');
      expect(user.a()).toBe('test-users');
    });

    test('plugin should work', async () => {
      class DemoCollectionMixin extends CollectionV2 {
        b() {
          return 'test-' + this.name;
        }
      }

      class MyPlugin extends Plugin {
        async load() {
          this.app.collectionManager.addCollections(collections as any);
          this.app.collectionManager.addCollectionMixins([DemoCollectionMixin]);
        }
      }

      const app = new Application({
        plugins: [MyPlugin],
      });

      await app.load();

      const user = app.collectionManager.getCollection<DemoCollectionMixin>('users');
      expect(user.b()).toBe('test-users');
    });

    test('multiple mixins should work', () => {
      class DemoCollectionMixin1 extends CollectionV2 {
        c() {
          return 'test1-' + this.name;
        }
      }

      class DemoCollectionMixin2 extends CollectionV2 {
        d() {
          return 'test2-' + this.name;
        }
      }

      const app = new Application({
        collectionManager: {
          collections: collections as any,
          collectionMixins: [DemoCollectionMixin1, DemoCollectionMixin2],
        },
      });

      const user = app.collectionManager.getCollection<DemoCollectionMixin1 & DemoCollectionMixin2>('users');
      expect(user.c()).toBe('test1-users');
      expect(user.d()).toBe('test2-users');
    });

    test('after add mixins, collection should be re-instantiated', () => {
      class DemoCollectionMixin extends CollectionV2 {
        e() {
          return 'test-' + this.name;
        }
      }

      const app = new Application({
        collectionManager: {
          collections: collections as any,
        },
      });

      const user = app.collectionManager.getCollection<DemoCollectionMixin>('users');
      expect(user.e).toBeUndefined();

      app.collectionManager.addCollectionMixins([DemoCollectionMixin]);

      const user2 = app.collectionManager.getCollection<DemoCollectionMixin>('users');
      expect(user2.e()).toBe('test-users');
    });
  });

  describe('templates', () => {
    test('init should work', () => {
      class DemoTemplate extends CollectionTemplate {
        name = 'demo';
        title = 'Demo';
      }

      const app = new Application({
        collectionManager: {
          collectionTemplates: [DemoTemplate],
        },
      });

      const templates = app.collectionManager.getCollectionTemplates();
      expect(templates.length).toBe(1);
      expect(templates[0].name).toBe('demo');
    });

    test('plugin should work', async () => {
      class DemoTemplate extends CollectionTemplate {
        name = 'demo';
        title = 'Demo';
      }

      class MyPlugin extends Plugin {
        async load() {
          this.app.collectionManager.addCollectionTemplates([DemoTemplate]);
        }
      }

      const app = new Application({
        plugins: [MyPlugin],
      });

      await app.load();

      const templates = app.collectionManager.getCollectionTemplates();
      expect(templates.length).toBe(1);
      expect(templates[0].name).toBe('demo');
    });

    test('If the Template has a Collection property and the template property of collections is equal to Template.name, use the custom Collection for initialization', () => {
      class CustomCollection extends CollectionV2 {
        custom() {
          return 'custom-' + this.name;
        }
      }

      class DemoTemplate extends CollectionTemplate {
        name = 'demo';
        title = 'Demo';
        Collection = CustomCollection;
      }

      const app = new Application({
        collectionManager: {
          collections: collections.map((item) => ({ ...item, template: 'demo' })) as any,
          collectionTemplates: [DemoTemplate],
        },
      });

      const user = app.collectionManager.getCollection<CustomCollection>('users');
      expect(user.custom()).toBe('custom-users');
    });

    test('after add templates, collection should be re-instantiated', () => {
      class CustomCollection extends CollectionV2 {
        custom() {
          return 'custom-' + this.name;
        }
      }

      class DemoTemplate extends CollectionTemplate {
        name = 'demo';
        title = 'Demo';
        Collection = CustomCollection;
      }
      const app = new Application({
        collectionManager: {
          collections: collections.map((item) => ({ ...item, template: 'demo' })) as any,
        },
      });

      const user = app.collectionManager.getCollection<CustomCollection>('users');
      expect(user.custom).toBeUndefined();

      app.collectionManager.addCollectionTemplates([DemoTemplate]);

      const user2 = app.collectionManager.getCollection<CustomCollection>('users');
      expect(user2.custom()).toBe('custom-users');
    });

    test('getCollectionTemplate', () => {
      class DemoTemplate extends CollectionTemplate {
        name = 'demo';
        title = 'Demo';
      }

      const app = new Application({
        collectionManager: {
          collectionTemplates: [DemoTemplate],
        },
      });

      const template = app.collectionManager.getCollectionTemplate('demo');
      expect(template.name).toBe('demo');
    });

    test('transformCollection', () => {
      const mockFn = vitest.fn();

      class DemoTemplate extends CollectionTemplate {
        name = 'demo';
        title = 'Demo';
        transform(collection) {
          mockFn(collection);
          return collection;
        }
      }

      new Application({
        collectionManager: {
          collections: collections.map((item) => ({ ...item, template: 'demo' })) as any,
          collectionTemplates: [DemoTemplate],
        },
      });

      expect(mockFn).toBeCalledTimes(collectionLength);
    });
  });

  describe('field interface', () => {
    test('init should work', () => {
      class DemoFieldInterface extends CollectionFieldInterface {
        name = 'demo';
        title = 'Demo';
      }

      const app = new Application({
        collectionManager: {
          fieldInterfaces: [DemoFieldInterface],
        },
      });

      const fieldInterfaces = app.collectionManager.getFieldInterfaces();
      expect(Object.keys(fieldInterfaces).length).toBe(1);
      expect(fieldInterfaces.demo instanceof DemoFieldInterface).toBeTruthy();
    });

    test('plugin should work', async () => {
      class DemoFieldInterface extends CollectionFieldInterface {
        name = 'demo';
        title = 'Demo';
      }

      class MyPlugin extends Plugin {
        async load() {
          this.app.collectionManager.addFieldInterfaces([DemoFieldInterface]);
        }
      }

      const app = new Application({
        plugins: [MyPlugin],
      });

      await app.load();

      const fieldInterfaces = app.collectionManager.getFieldInterfaces();
      expect(Object.keys(fieldInterfaces).length).toBe(1);
      expect(fieldInterfaces.demo instanceof DemoFieldInterface).toBeTruthy();
    });

    test('getFieldInterface()', () => {
      class DemoFieldInterface extends CollectionFieldInterface {
        name = 'demo';
        title = 'Demo';
      }

      const app = new Application({
        collectionManager: {
          fieldInterfaces: [DemoFieldInterface],
        },
      });

      const fieldInterface = app.collectionManager.getFieldInterface('demo');
      expect(fieldInterface.name).toBe('demo');
      expect(fieldInterface instanceof DemoFieldInterface).toBeTruthy();
    });

    test('getFieldInterfaces()', () => {
      class DemoFieldInterface extends CollectionFieldInterface {
        name = 'demo';
        title = 'Demo';
      }
      class Demo2FieldInterface extends CollectionFieldInterface {
        name = 'demo2';
        title = 'Demo';
      }

      const app = new Application({
        collectionManager: {
          fieldInterfaces: [DemoFieldInterface, Demo2FieldInterface],
        },
      });

      const fieldInterfaces = app.collectionManager.getFieldInterfaces();
      expect(Object.keys(fieldInterfaces).length).toBe(2);
    });
  });

  describe('field groups', () => {
    test('init add', () => {
      const app = new Application({
        collectionManager: {
          fieldGroups: {
            demo: {
              label: 'Demo',
              order: 1,
            },
          },
        },
      });

      const fieldGroups = app.collectionManager.getFieldGroups();
      expect(Object.keys(fieldGroups).length).toBe(1);
      expect(fieldGroups.demo).toBeTruthy();
    });

    test('plugin add', async () => {
      class MyPlugin extends Plugin {
        async load() {
          this.app.collectionManager.addFieldGroups({
            demo: {
              label: 'Demo',
              order: 1,
            },
          });
        }
      }

      const app = new Application({
        plugins: [MyPlugin],
      });

      await app.load();

      const fieldGroups = app.collectionManager.getFieldGroups();
      expect(Object.keys(fieldGroups).length).toBe(1);
      expect(fieldGroups.demo).toBeTruthy();
    });

    test('getFieldGroup(name)', () => {
      const app = new Application({
        collectionManager: {
          fieldGroups: {
            demo: {
              label: 'Demo',
              order: 1,
            },
          },
        },
      });

      const fieldGroup = app.collectionManager.getFieldGroup('demo');
      expect(fieldGroup.label).toBe('Demo');
    });
  });

  describe('dataSource and reload', () => {
    test('reload main', async () => {
      const app = new Application({
        collectionManager: {
          collections: [collections[0]] as any,
        },
      });
      const mainDataSourceFn = () => {
        return Promise.resolve([collections[1]] as any);
      };

      const mockFn = vitest.fn();
      const mockFn2 = vitest.fn();

      app.collectionManager.setMainDataSource(mainDataSourceFn);
      app.collectionManager.addReloadCallback(mockFn);

      await app.collectionManager.reloadMain(mockFn2);

      const collectionInstances = app.collectionManager.getCollections();
      expect(collectionInstances.length).toBe(1);
      expect(collectionInstances[0].name).toBe(collections[1]['name']);
      expect(mockFn).toBeCalledTimes(1);
      expect(mockFn2).toBeCalledTimes(1);
    });

    test('reload third dataSource', async () => {
      const app = new Application({
        collectionManager: {
          collections: collections as any,
        },
      });

      const dataSourceFn = () => {
        return Promise.resolve([
          {
            key: 'a',
            displayName: 'a',
            collections: collections as any,
          },
        ]);
      };

      const mockFn = vitest.fn();
      const mockFn2 = vitest.fn();

      app.collectionManager.setThirdDataSource(dataSourceFn);
      app.collectionManager.addReloadCallback(mockFn, 'a');

      await app.collectionManager.reloadThirdDataSource(mockFn2);

      expect(app.collectionManager.getCollections().length).toBe(collectionLength);
      expect(app.collectionManager.getCollections({ dataSource: 'a' }).length).toBe(collectionLength);
      expect(app.collectionManager.getDataSources().length).toBe(2);
      expect(app.collectionManager.getDataSource('a').key).toBe('a');

      expect(mockFn).toBeCalledTimes(1);
      expect(mockFn2).toBeCalledTimes(1);
    });

    test('reload all', async () => {
      const app = new Application();

      app.collectionManager.setMainDataSource(() => {
        return Promise.resolve(collections as any);
      });
      app.collectionManager.setThirdDataSource(() => {
        return Promise.resolve([
          {
            key: 'a',
            displayName: 'a',
            collections: collections as any,
          },
        ]);
      });

      const mockFn = vitest.fn();
      const mockFn2 = vitest.fn();

      app.collectionManager.addReloadCallback(mockFn);
      app.collectionManager.addReloadCallback(mockFn, 'a');
      await app.collectionManager.reloadAll(mockFn2);

      expect(app.collectionManager.getCollections().length).toBe(collectionLength);
      expect(app.collectionManager.getCollections({ dataSource: 'a' }).length).toBe(collectionLength);
      expect(app.collectionManager.getDataSources().length).toBe(2);
      expect(app.collectionManager.getDataSource('a').key).toBe('a');

      expect(mockFn).toBeCalledTimes(2);
      expect(mockFn2).toBeCalledTimes(1);
    });

    test('not set reload fn', async () => {
      const app = new Application();

      const mockFn = vitest.fn();
      const mockFn2 = vitest.fn();

      app.collectionManager.addReloadCallback(mockFn);
      app.collectionManager.addReloadCallback(mockFn, 'a');
      await app.collectionManager.reloadAll(mockFn2);

      expect(mockFn).toBeCalledTimes(0);
      expect(mockFn2).toBeCalledTimes(1);
    });
  });

  describe('inherit', () => {
    test('inherit', async () => {
      const app = new Application({
        collectionManager: {
          collections: [collections[0]] as any,
        },
      });

      const mockFn = vitest.fn();

      const mainDataSourceFn = () => {
        return Promise.resolve([collections[0]] as any);
      };
      app.collectionManager.setMainDataSource(mainDataSourceFn);

      const cm = app.collectionManager.inherit({
        collections: [collections[1]] as any,
        reloadCallback: mockFn,
      });

      expect(cm.getCollections().length).toBe(2);

      await cm.reloadAll();
      expect(cm.getCollections().length).toBe(1);
      expect(mockFn).toBeCalledTimes(1);

      expect(app.collectionManager.getCollections().length).toBe(1);
    });
  });
});
