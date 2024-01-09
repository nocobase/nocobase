import { MockServer, waitSecond } from '@nocobase/test';
import { Dumper } from '../dumper';
import createApp from './index';

describe('backup files', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create dump file', async () => {
    const createResponse = await app
      .agent()
      .resource('backupFiles')
      .create({
        dataTypes: ['meta', 'config', 'business'],
      });

    expect(createResponse.status).toBe(200);

    const dumpKey = createResponse.body.data.key;
    expect(dumpKey).toBeDefined();

    const promise = Dumper.getTaskPromise(dumpKey);

    await promise;
  });

  describe('resource action', () => {
    let dumpKey: string;

    let dumper: Dumper;

    beforeEach(async () => {
      dumper = new Dumper(app);

      dumpKey = await dumper.runDumpTask({
        groups: new Set(['meta', 'config', 'business']),
      });

      const promise = Dumper.getTaskPromise(dumpKey);

      await promise;
    });

    it('should list backup file with in progress status', async () => {
      await waitSecond(1000);
      const fileName = Dumper.generateFileName();
      await dumper.writeLockFile(fileName);
      const listResponse = await app.agent().resource('backupFiles').list();

      expect(listResponse.status).toBe(200);

      const body = listResponse.body;

      const firstItem = body.data[0];
      expect(firstItem.status).toEqual('in_progress');
    });

    it('should list backup file', async () => {
      const listResponse = await app.agent().resource('backupFiles').list();

      expect(listResponse.status).toBe(200);

      const body = listResponse.body;

      expect(body.meta.count).toBeDefined();
      expect(body.meta.totalPage).toBeDefined();
    });

    it('should get backup file', async () => {
      const getResponse = await app.agent().resource('backupFiles').get({
        filterByTk: dumpKey,
      });

      expect(getResponse.status).toBe(200);

      expect(getResponse.body.data.name).toEqual(dumpKey);

      console.log({ getResponse: getResponse.body.data });
    });

    it('should restore from file name', async () => {
      const restoreResponse = await app
        .agent()
        .resource('backupFiles')
        .restore({
          values: {
            filterByTk: dumpKey,
            dataTypes: ['meta', 'config', 'business'],
          },
        });

      expect(restoreResponse.status).toBe(200);
    });

    it('should destroy dump file', async () => {
      const destroyResponse = await app.agent().resource('backupFiles').destroy({
        filterByTk: dumpKey,
      });

      expect(destroyResponse.status).toBe(200);

      const getResponse = await app.agent().resource('backupFiles').get({
        filterByTk: dumpKey,
      });

      expect(getResponse.status).toBe(404);
    });

    it('should restore from upload file', async () => {
      const filePath = dumper.backUpFilePath(dumpKey);
      const packageInfoResponse = await app.agent().post('/backupFiles:upload').attach('file', filePath);

      expect(packageInfoResponse.status).toBe(200);
      const data = packageInfoResponse.body.data;

      expect(data['key']).toBeTruthy();
      expect(data['meta']).toBeTruthy();

      const restoreResponse = await app
        .agent()
        .resource('backupFiles')
        .restore({
          values: {
            key: data['key'],
            dataTypes: ['meta', 'config', 'business'],
          },
        });

      expect(restoreResponse.status).toBe(200);
    });
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

    const response = await app.agent().get('/backupFiles:dumpableCollections');

    expect(response.status).toBe(200);

    const body = response.body;

    expect(body['required']).toBeTruthy();
    expect(body['third-party']).toBeTruthy();
    expect(body['custom']).toBeTruthy();

    const testCollectionInfo = body['custom'].find((item: any) => item.name === 'test');

    expect(testCollectionInfo).toMatchObject({
      name: 'test',
      title: '测试',
      group: 'custom',
      origin:'@nocobase/plugin-collection-manager',
    });
  });
});
