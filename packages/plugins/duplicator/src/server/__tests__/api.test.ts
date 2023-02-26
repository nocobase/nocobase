import { mockServer, MockServer } from '@nocobase/test';

describe('duplicator api', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer();
    app.plugin(require('../server').default, { name: 'duplicator' });
    await app.load();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get collection groups', async () => {
    const collectionGroupsResponse = await app.agent().resource('duplicator').collectionGroups();
    expect(collectionGroupsResponse.status).toBe(200);
  });
});
