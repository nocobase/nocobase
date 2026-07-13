/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { MockServer, createMockServer } from '@nocobase/test';

import { cleanupExpiredFileUploads } from '../actions/fileUploads';
import PluginAgentGatewayServer from '../plugin';
import { FILE_UPLOAD_STORAGE_ROOT } from '../services/fileUploadStorage';

interface ResponseLike {
  body: {
    data?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

describe('agent gateway file uploads', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;
  let externalDirectory = '';

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [
        'system-settings',
        'field-sort',
        'users',
        'departments',
        'auth',
        'acl',
        'data-source-manager',
        'error-handler',
        [PluginAgentGatewayServer, { packageName: '@nocobase/plugin-agent-gateway' }],
      ],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    expect(rootUser).toBeTruthy();
    rootAgent = await app.agent().login(rootUser);
    externalDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-file-upload-sentinel-'));
    await fs.mkdir(FILE_UPLOAD_STORAGE_ROOT, { recursive: true });
  });

  afterEach(async () => {
    await app?.destroy();
    if (externalDirectory) {
      await fs.rm(externalDirectory, { recursive: true, force: true });
    }
  });

  async function createUploadRecord(storagePath: string, values: Record<string, unknown> = {}) {
    const id = randomUUID();
    await app.db.getRepository('agFileUploads').create({
      values: {
        id,
        purpose: 'run-artifact',
        status: 'pending',
        expectedBytes: 1,
        receivedBytes: 0,
        storagePath,
        expiresAt: new Date(Date.now() + 60_000),
        ...values,
      },
    });
    return id;
  }

  it('completes a valid bounded upload lifecycle', async () => {
    const initResponse = await rootAgent.post('/agentGatewayApi:initFileUpload').send({
      purpose: 'run-artifact',
      sizeBytes: 3,
      fileName: 'artifact.txt',
      mimeType: 'text/plain',
    });
    expect(initResponse.status).toBe(200);
    const uploadId = String(getData(initResponse).id);
    const storedUpload = await app.db.getRepository('agFileUploads').findOne({ filterByTk: uploadId });
    const storagePath = String(storedUpload.get('storagePath'));

    const appendResponse = await rootAgent.post(`/agentGatewayApi:appendFileUpload/${uploadId}`).send({
      offset: 0,
      contentBase64: Buffer.from('abc').toString('base64'),
    });
    expect(appendResponse.status).toBe(200);

    const completeResponse = await rootAgent.post(`/agentGatewayApi:completeFileUpload/${uploadId}`).send({});
    expect(completeResponse.status).toBe(200);
    expect(getData(completeResponse).sha256).toMatch(/^[a-f0-9]{64}$/);

    const abortResponse = await rootAgent.post(`/agentGatewayApi:abortFileUpload/${uploadId}`).send({});
    expect(abortResponse.status).toBe(200);
    await expect(fs.stat(storagePath)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await app.db.getRepository('agFileUploads').findOne({ filterByTk: uploadId })).toBeNull();
  });

  it('rejects unsafe database locators before append, complete, or abort touches a file', async () => {
    const sentinelPath = path.join(externalDirectory, 'sentinel.txt');
    await fs.writeFile(sentinelPath, 'do-not-touch', 'utf8');
    const symlinkPath = path.join(FILE_UPLOAD_STORAGE_ROOT, `task08-symlink-${randomUUID()}.part`);
    await fs.symlink(sentinelPath, symlinkPath);
    const traversalPath = path.resolve(FILE_UPLOAD_STORAGE_ROOT, '..', `task08-traversal-${randomUUID()}.part`);
    await fs.writeFile(traversalPath, 'do-not-touch', 'utf8');

    const unsafeLocators = ['', '../outside.part', sentinelPath, traversalPath, symlinkPath];
    const actions = [
      {
        name: 'appendFileUpload',
        values: { offset: 0, contentBase64: Buffer.from('x').toString('base64') },
        recordValues: {},
      },
      {
        name: 'completeFileUpload',
        values: {},
        recordValues: { receivedBytes: 1 },
      },
      {
        name: 'abortFileUpload',
        values: {},
        recordValues: {},
      },
    ];

    try {
      for (const storagePath of unsafeLocators) {
        for (const action of actions) {
          const uploadId = await createUploadRecord(storagePath, action.recordValues);
          const response = await rootAgent.post(`/agentGatewayApi:${action.name}/${uploadId}`).send(action.values);
          expect(response.status, `${action.name}: ${storagePath || '<empty>'}`).toBe(409);
          expect(JSON.stringify(response.body)).toContain('AGENT_GATEWAY_UNSAFE_FILE_UPLOAD_STORAGE_LOCATOR');
          if (storagePath) {
            expect(JSON.stringify(response.body)).not.toContain(storagePath);
          }
          await app.db.getRepository('agFileUploads').destroy({ filterByTk: uploadId });
        }
      }

      expect(await fs.readFile(sentinelPath, 'utf8')).toBe('do-not-touch');
      expect(await fs.readFile(traversalPath, 'utf8')).toBe('do-not-touch');
    } finally {
      await fs.rm(symlinkPath, { force: true });
      await fs.rm(traversalPath, { force: true });
    }
  });

  it('deletes expired unsafe locator records without deleting files outside the storage root', async () => {
    const sentinelPath = path.join(externalDirectory, 'cleanup-sentinel.txt');
    await fs.writeFile(sentinelPath, 'keep-me', 'utf8');
    const symlinkPath = path.join(FILE_UPLOAD_STORAGE_ROOT, `task08-cleanup-symlink-${randomUUID()}.part`);
    await fs.symlink(sentinelPath, symlinkPath);
    const expiredAt = new Date(Date.now() - 60_000);
    const uploadIds = await Promise.all(
      ['', '../cleanup.part', sentinelPath, symlinkPath].map(
        async (storagePath) => await createUploadRecord(storagePath, { expiresAt: expiredAt }),
      ),
    );

    try {
      const plugin = app.pm.get(PluginAgentGatewayServer) as PluginAgentGatewayServer;
      expect(await cleanupExpiredFileUploads(plugin, new Date())).toBe(uploadIds.length);
      expect(await fs.readFile(sentinelPath, 'utf8')).toBe('keep-me');
      expect(await app.db.getRepository('agFileUploads').count({ filter: { id: { $in: uploadIds } } })).toBe(0);
    } finally {
      await fs.rm(symlinkPath, { force: true });
    }
  });

  it('requires Agent Gateway management permission even when direct technical collection CRUD is granted', async () => {
    const roleName = `task08-direct-file-upload-${randomUUID()}`;
    await app.db.getRepository('roles').create({
      values: {
        name: roleName,
        snippets: [],
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        username: roleName,
        roles: [roleName],
      },
    });
    const scopeResponse = await rootAgent.resource('dataSourcesRolesResourcesScopes').create({
      values: {
        resourceName: 'agFileUploads',
        name: `${roleName}-all`,
        scope: {},
      },
    });
    expect(scopeResponse.status).toBe(200);
    const roleResourceResponse = await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: 'agFileUploads',
        usingActionsConfig: true,
        actions: [
          { name: 'view', scope: scopeResponse.body.data.id },
          { name: 'create' },
          { name: 'update', scope: scopeResponse.body.data.id },
          { name: 'destroy', scope: scopeResponse.body.data.id },
        ],
      },
    });
    expect(roleResourceResponse.status).toBe(200);
    const directAgent = await app.agent().login(user);

    expect((await directAgent.get('/agFileUploads:list')).status).toBe(403);
    expect(
      (
        await directAgent.post('/agFileUploads:create').send({
          id: randomUUID(),
          purpose: 'run-artifact',
          status: 'pending',
          expectedBytes: 1,
          receivedBytes: 0,
          storagePath: path.join(FILE_UPLOAD_STORAGE_ROOT, `${randomUUID()}.part`),
          expiresAt: new Date(Date.now() + 60_000),
        })
      ).status,
    ).toBe(403);
  });
});
