import { mockServer, MockServer } from '@nocobase/test';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { promisify } from 'util';

const closeFileAsync = promisify(fs.close);

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

  it('should request dump and restore api', async () => {
    const dumpResponse = await app.agent().post('/duplicator:dump').send({});

    expect(dumpResponse.status).toBe(200);
    const filePath = path.resolve(os.tmpdir(), 'dump.nbdump');

    fs.writeFileSync(filePath, dumpResponse.body);

    const packageInfoResponse = await app.agent().post('/duplicator:upload').attach('file', filePath);

    console.log(packageInfoResponse.body);
    expect(packageInfoResponse.status).toBe(200);
    const data = packageInfoResponse.body.data;

    expect(data['key']).toBeTruthy();
    expect(data['meta']).toBeTruthy();

    const restoreResponse = await app.agent().post('/duplicator:restore').send({
      restoreKey: data['key'],
      dataTypes: data['meta']['dataTypes'],
    });

    expect(restoreResponse.status).toBe(200);
  });
});
