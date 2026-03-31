/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, waitSecond } from '@nocobase/test';
import { Dumper } from '../dumper';
import createApp from './index';
let adminAgent;
describe('backup files', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    const user = await app.db.getRepository('users').findOne();
    adminAgent = await app.agent().login(user.id);
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create dump file', async () => {
    const createResponse = await adminAgent.resource('backupFiles').create({
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
      const listResponse = await adminAgent.resource('backupFiles').list();

      expect(listResponse.status).toBe(200);

      const body = listResponse.body;

      const firstItem = body.data[0];
      expect(firstItem.status).toEqual('in_progress');
    });

    it('should list backup file', async () => {
      const listResponse = await adminAgent.resource('backupFiles').list();

      expect(listResponse.status).toBe(200);

      const body = listResponse.body;

      expect(body.meta.count).toBeDefined();
      expect(body.meta.totalPage).toBeDefined();
    });

    it('should get backup file', async () => {
      const getResponse = await adminAgent.resource('backupFiles').get({
        filterByTk: dumpKey,
      });

      expect(getResponse.status).toBe(200);

      expect(getResponse.body.data.name).toEqual(dumpKey);

      console.log({ getResponse: getResponse.body.data });
    });

    it('should restore from file name', async () => {
      const restoreResponse = await adminAgent.resource('backupFiles').restore({
        values: {
          filterByTk: dumpKey,
          dataTypes: ['meta', 'config', 'business'],
        },
      });

      expect(restoreResponse.status).toBe(200);
    });

    it('should destroy dump file', async () => {
      const destroyResponse = await adminAgent.resource('backupFiles').destroy({
        filterByTk: dumpKey,
      });

      expect(destroyResponse.status).toBe(200);

      const getResponse = await adminAgent.resource('backupFiles').get({
        filterByTk: dumpKey,
      });

      expect(getResponse.status).toBe(404);
    });

    it('should restore from upload file', async () => {
      const filePath = dumper.backUpFilePath(dumpKey);
      const packageInfoResponse = await adminAgent.post('/backupFiles:upload').attach('file', filePath);

      expect(packageInfoResponse.status).toBe(200);
      const data = packageInfoResponse.body.data;

      expect(data['key']).toBeTruthy();
      expect(data['meta']).toBeTruthy();

      const restoreResponse = await adminAgent.resource('backupFiles').restore({
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

    const response = await adminAgent.get('/backupFiles:dumpableCollections');

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
      origin: '@nocobase/plugin-data-source-main',
    });
  });
});
