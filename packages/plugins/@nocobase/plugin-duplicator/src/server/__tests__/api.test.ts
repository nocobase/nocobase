import { MockServer } from '@nocobase/test';
import path from 'path';
import os from 'os';
import fs from 'fs';
import createApp from './index';
import { Dumper } from '../dumper';

describe('duplicator api', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should request create dump api', async () => {
    const dumpResponse = await app
      .agent()
      .post('/duplicator:dump')
      .send({
        dataTypes: ['meta', 'config', 'business'],
      });

    expect(dumpResponse.status).toBe(200);

    const data = dumpResponse.body.data;

    expect(data.key).toBeDefined();

    const promise = Dumper.getTaskPromise(data.key);

    await promise;
  });

  it('should request dump and restore api', async () => {
    await app.db.getCollection('collections').repository.create({
      values: {
        name: 'test',
        title: '测试',
        autoGenId: false,
        timestamps: false,
        fields: [],
      },
      context: {},
    });

    const dumpResponse = await app
      .agent()
      .post('/duplicator:dump')
      .send({
        dataTypes: ['meta', 'config', 'business'],
      });

    expect(dumpResponse.status).toBe(200);
    // should response file name
    const headers = dumpResponse.headers;
    expect(headers['content-disposition']).toBeTruthy();
    const filePath = path.resolve(os.tmpdir(), 'dump.nbdump');

    fs.writeFileSync(filePath, dumpResponse.body);

    const packageInfoResponse = await app.agent().post('/duplicator:upload').attach('file', filePath);

    expect(packageInfoResponse.status).toBe(200);
    const data = packageInfoResponse.body.data;

    expect(data['key']).toBeTruthy();
    expect(data['meta']).toBeTruthy();

    const restoreResponse = await app.agent().post('/duplicator:restore').send({
      key: data['key'],
      dataTypes: data['meta']['dataTypes'],
    });

    expect(restoreResponse.status).toBe(200);
  });

  it('should get dumpable collections', async () => {
    await app.db.getCollection('collections').repository.create({
      values: {
        name: 'test',
        title: '测试',
        fields: [
          {
            name: 'title',
            type: 'string',
            title: '标题',
          },
        ],
      },
      context: {},
    });
    const response = await app.agent().get('/duplicator:dumpableCollections');

    expect(response.status).toBe(200);

    const body = response.body;

    expect(body['meta']).toBeTruthy();
    expect(body['config']).toBeTruthy();
    expect(body['business']).toBeTruthy();

    const testCollectionInfo = body['business'].find((item: any) => item.name === 'test');

    console.log(JSON.stringify(body, null, 2));
    expect(testCollectionInfo).toMatchObject({
      name: 'test',
      title: '测试',
      dataType: 'business',
      origin: {
        name: 'user',
        title: 'user',
      },
    });
  });
});
