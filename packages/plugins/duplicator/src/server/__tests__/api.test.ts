import { mockServer, MockServer } from '@nocobase/test';

describe('duplicator api', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer();
    app.plugin(require('../server').default, { name: 'duplicator' });
    app.plugin('error-handler');
    app.plugin('collection-manager');
    await app.loadAndInstall({ clean: true });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get collection groups', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test_collection',
        fields: [
          {
            name: 'test_field1',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const collectionGroupsResponse = await app.agent().resource('duplicator').collectionGroups();
    expect(collectionGroupsResponse.status).toBe(200);

    const data = collectionGroupsResponse.body;

    expect(data['collectionGroups']).toBeTruthy();
    expect(data['userCollections']).toBeTruthy();
  });
});
