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

    expect(collectionGroups.map((i) => i.function)).toMatchObject([
      'migration',
      'applicationPlugins',
      'applicationVersion',
      'collections',
    ]);

    expect(collectionGroups.find((i) => i.function === 'collections')).toMatchObject({
      namespace: 'collection-manager',
      function: 'collections',
      collections: ['collectionCategory', 'collectionCategories', 'collections', 'fields'],
      dumpable: 'required',
    });
  });
});
