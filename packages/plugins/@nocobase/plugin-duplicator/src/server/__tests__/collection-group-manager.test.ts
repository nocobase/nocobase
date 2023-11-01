import { mockServer, MockServer } from '@nocobase/test';
import { CollectionGroupManager } from '../collection-group-manager';

describe('collection group manager', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer({
      plugins: ['error-handler', 'collection-manager'],
    });

    await app.loadAndInstall({
      clean: true,
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should list collection groups from db collections', async () => {
    const collectionGroups = CollectionGroupManager.getGroups(app);

    expect(collectionGroups.map((i) => i.function)).toMatchObject(['server', 'core']);

    expect(collectionGroups.find((i) => i.function === 'core')).toMatchObject({
      namespace: 'collection-manager',
      function: 'core',
      collections: ['collectionCategory', 'collectionCategories', 'collections', 'fields'].map((name) => {
        const collection = app.db.getCollection(name);
        return {
          name: collection.name,
          title: collection.options.title || collection.name,
        };
      }),
      dataType: 'meta',
    });
  });

  it('should handle dumpable with attribute', async () => {
    app.db.collection({
      namespace: 'test.test',
      name: 'test',
      duplicator: {
        dataType: 'meta',
        with: 'test1',
      },
    });

    app.db.collection({
      namespace: 'test.test',
      name: 'test1',
      duplicator: {
        dataType: 'meta',
        with: 'test2',
      },
    });

    app.db.collection({
      name: 'test2',
      title: 'test2Title',
    });

    const collectionGroups = CollectionGroupManager.getGroups(app);
    const testGroup = collectionGroups.find((i) => i.function === 'test');

    const test2Collection = testGroup.collections.find((i) => i.name === 'test2');

    expect(test2Collection).toBeTruthy();
  });
});
