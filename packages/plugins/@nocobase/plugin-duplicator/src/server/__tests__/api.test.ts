import { mockServer, MockServer } from '@nocobase/test';
import path from 'path';

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

  it('should request dump api', async () => {
    const dumpResponse = await app.agent().post('/duplicator:dump').send({});

    expect(dumpResponse.status).toBe(200);
  });

  it('should request restore api', async () => {
    const packageInfoResponse = await app
      .agent()
      .post('/duplicator:upload')
      .attach('file', path.resolve(__dirname, './fixtures/dump.nbdump.fixture'));

    console.log(packageInfoResponse.body);
    expect(packageInfoResponse.status).toBe(200);
    const data = packageInfoResponse.body.data;

    expect(data['key']).toBeTruthy();
    expect(data['meta']).toBeTruthy();

    const restoreResponse = await app.agent().post('/duplicator:restore').send({
      restoreKey: data['key'],
      selectedOptionalGroups: [],
      selectedUserCollections: [],
    });

    expect(restoreResponse.status).toBe(200);
  });
});
