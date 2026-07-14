/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { MockCluster, MockServer, createMockCluster, createMockServer } from '@nocobase/test';

import { cleanupExpiredFileUploads } from '../actions/fileUploads';
import PluginAgentGatewayServer from '../plugin';
import { parseSharedStorageObject, readSharedStorageBuffer } from '../services/sharedFileStorage';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiUrl } from '../../shared/apiContract';

function getTestApiPath(action: Parameters<typeof getAgentGatewayApiUrl>[0], targetKey?: unknown) {
  return `/${getAgentGatewayApiUrl(action, targetKey === undefined ? undefined : String(targetKey))}`;
}

interface ResponseLike {
  body: {
    data?: Record<string, unknown>;
  };
}

function getData(response: ResponseLike) {
  return response.body.data || response.body || {};
}

function getTestPlugins() {
  return [
    'file-manager',
    'system-settings',
    'field-sort',
    'users',
    'departments',
    'auth',
    'acl',
    'data-source-manager',
    'error-handler',
    [PluginAgentGatewayServer, { packageName: '@nocobase/plugin-agent-gateway' }],
  ];
}

async function getRootAgent(app: MockServer) {
  const rootUser = await app.db.getRepository('users').findOne({
    filter: {
      'roles.name': 'root',
    },
  });
  expect(rootUser).toBeTruthy();
  return await app.agent().login(rootUser);
}

function getCompletedStorageObject(upload: { get(name: string): unknown }) {
  return parseSharedStorageObject({
    storageId: upload.get('storageId'),
    objectPath: upload.get('objectPath'),
    objectFilename: upload.get('objectFilename'),
    objectKey: upload.get('objectKey'),
    sizeBytes: upload.get('expectedBytes'),
    mimetype: upload.get('mimeType'),
  });
}

function getFirstChunkStorageObject(upload: { get(name: string): unknown }) {
  const manifest = upload.get('chunkManifestJson');
  if (!Array.isArray(manifest) || !manifest.length) {
    throw new Error('Expected an upload chunk manifest');
  }
  const firstChunk = manifest[0];
  if (!firstChunk || typeof firstChunk !== 'object' || Array.isArray(firstChunk)) {
    throw new Error('Expected a valid upload chunk');
  }
  return parseSharedStorageObject((firstChunk as Record<string, unknown>).object);
}

describe('agent gateway file uploads', () => {
  let app: MockServer;
  let rootAgent: Awaited<ReturnType<typeof getRootAgent>>;

  beforeEach(async () => {
    app = await createMockServer({ plugins: getTestPlugins() });
    rootAgent = await getRootAgent(app);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  async function createUploadRecord(values: Record<string, unknown> = {}) {
    const id = randomUUID();
    await app.db.getRepository('agFileUploads').create({
      values: {
        id,
        purpose: 'run-artifact',
        status: 'pending',
        expectedBytes: 1,
        receivedBytes: 0,
        chunkManifestJson: [],
        expiresAt: new Date(Date.now() + 60_000),
        ...values,
      },
    });
    return id;
  }

  it('completes a valid bounded upload lifecycle through shared storage', async () => {
    const initResponse = await rootAgent.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.initFileUpload)).send({
      purpose: 'run-artifact',
      sizeBytes: 3,
      fileName: 'artifact.txt',
      mimeType: 'text/plain',
    });
    expect(initResponse.status).toBe(200);
    const uploadId = String(getData(initResponse).id);

    const appendResponse = await rootAgent
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.appendFileUpload, uploadId))
      .send({
        offset: 0,
        contentBase64: Buffer.from('abc').toString('base64'),
      });
    expect(appendResponse.status).toBe(200);

    const completeResponse = await rootAgent
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.completeFileUpload, uploadId))
      .send({});
    expect(completeResponse.status).toBe(200);
    expect(getData(completeResponse).sha256).toMatch(/^[a-f0-9]{64}$/);

    const storedUpload = await app.db.getRepository('agFileUploads').findOne({ filterByTk: uploadId });
    const storageObject = getCompletedStorageObject(storedUpload);
    expect(storageObject.objectKey).toContain('agent-gateway/file-uploads/');
    expect(await readSharedStorageBuffer({ app }, storageObject, 3)).toEqual(Buffer.from('abc'));

    const abortResponse = await rootAgent
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.abortFileUpload, uploadId))
      .send({});
    expect(abortResponse.status).toBe(200);
    await expect(readSharedStorageBuffer({ app }, storageObject, 3)).rejects.toThrow();
    expect(await app.db.getRepository('agFileUploads').findOne({ filterByTk: uploadId })).toBeNull();
  });

  it('rejects database object locators outside the owned storage prefix', async () => {
    const unsafeLocators = [
      {
        storageId: 1,
        objectPath: 'uploads',
        objectFilename: 'outside.part',
        objectKey: 'uploads/outside.part',
        sizeBytes: 1,
      },
      {
        storageId: 1,
        objectPath: 'uploads/agent-gateway/file-uploads/test/chunks',
        objectFilename: '../outside.part',
        objectKey: 'uploads/agent-gateway/file-uploads/test/outside.part',
        sizeBytes: 1,
      },
      {
        storageId: 1,
        objectPath: 'uploads/agent-gateway/file-uploads/test/chunks',
        objectFilename: 'chunk.part',
        objectKey: 'uploads/agent-gateway/file-uploads/test/chunks/different.part',
        sizeBytes: 1,
      },
    ];

    for (const object of unsafeLocators) {
      const uploadId = await createUploadRecord({
        receivedBytes: 1,
        chunkManifestJson: [
          {
            offset: 0,
            sizeBytes: 1,
            sha256: 'a'.repeat(64),
            object,
          },
        ],
      });
      const abortResponse = await rootAgent
        .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.abortFileUpload, uploadId))
        .send({});
      expect(abortResponse.status).toBe(409);
      expect(JSON.stringify(abortResponse.body)).toContain('AGENT_GATEWAY_UNSAFE_FILE_UPLOAD_STORAGE_LOCATOR');
      expect(JSON.stringify(abortResponse.body)).not.toContain(String(object.objectKey));
    }
  });

  it('does not let one upload abort or expire another upload storage object', async () => {
    const ownerInit = await rootAgent.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.initFileUpload)).send({
      purpose: 'run-artifact',
      sizeBytes: 1,
    });
    const ownerUploadId = String(getData(ownerInit).id);
    expect(
      (
        await rootAgent.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.appendFileUpload, ownerUploadId)).send({
          offset: 0,
          contentBase64: Buffer.from('b').toString('base64'),
        })
      ).status,
    ).toBe(200);
    const ownerUpload = await app.db.getRepository('agFileUploads').findOne({ filterByTk: ownerUploadId });
    const ownerManifest = ownerUpload.get('chunkManifestJson');
    const ownerChunk = getFirstChunkStorageObject(ownerUpload);

    const forgedUploadId = await createUploadRecord({
      receivedBytes: 1,
      chunkManifestJson: ownerManifest,
    });
    const abortResponse = await rootAgent
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.abortFileUpload, forgedUploadId))
      .send({});
    expect(abortResponse.status).toBe(409);
    expect(await readSharedStorageBuffer({ app }, ownerChunk, 1)).toEqual(Buffer.from('b'));

    await app.db.getRepository('agFileUploads').update({
      filterByTk: forgedUploadId,
      values: { expiresAt: new Date(Date.now() - 1000) },
    });
    const plugin = app.pm.get(PluginAgentGatewayServer) as PluginAgentGatewayServer;
    expect(await cleanupExpiredFileUploads(plugin, new Date())).toBe(1);
    expect(await app.db.getRepository('agFileUploads').findOne({ filterByTk: forgedUploadId })).toBeNull();
    expect(await readSharedStorageBuffer({ app }, ownerChunk, 1)).toEqual(Buffer.from('b'));

    expect(
      (await rootAgent.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.completeFileUpload, ownerUploadId)).send({}))
        .status,
    ).toBe(200);
    const completedOwner = await app.db.getRepository('agFileUploads').findOne({ filterByTk: ownerUploadId });
    const completedOwnerObject = getCompletedStorageObject(completedOwner);
    const forgedCompletedId = await createUploadRecord({
      status: 'completed',
      receivedBytes: 1,
      storageId: completedOwner.get('storageId'),
      objectPath: completedOwner.get('objectPath'),
      objectFilename: completedOwner.get('objectFilename'),
      objectKey: completedOwner.get('objectKey'),
    });
    expect(
      (await rootAgent.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.abortFileUpload, forgedCompletedId)).send({}))
        .status,
    ).toBe(409);
    expect(await readSharedStorageBuffer({ app }, completedOwnerObject, 1)).toEqual(Buffer.from('b'));
  });

  it('drops expired invalid locator records without touching storage objects', async () => {
    const expiredAt = new Date(Date.now() - 60_000);
    const uploadId = await createUploadRecord({
      expiresAt: expiredAt,
      receivedBytes: 1,
      chunkManifestJson: [
        {
          offset: 0,
          sizeBytes: 1,
          sha256: 'a'.repeat(64),
          object: {
            storageId: 1,
            objectPath: 'outside',
            objectFilename: 'sentinel.part',
            objectKey: 'outside/sentinel.part',
            sizeBytes: 1,
          },
        },
      ],
    });

    const plugin = app.pm.get(PluginAgentGatewayServer) as PluginAgentGatewayServer;
    expect(await cleanupExpiredFileUploads(plugin, new Date())).toBe(1);
    expect(await app.db.getRepository('agFileUploads').findOne({ filterByTk: uploadId })).toBeNull();
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
          expiresAt: new Date(Date.now() + 60_000),
        })
      ).status,
    ).toBe(403);
  });
});

describe('agent gateway file uploads in a cluster', () => {
  let cluster: MockCluster;

  beforeEach(async () => {
    cluster = await createMockCluster({ plugins: getTestPlugins() });
  });

  afterEach(async () => {
    await cluster?.destroy();
  });

  it('continues append, complete, abort, and expiry cleanup across instances', async () => {
    const [appA, appB] = cluster.nodes;
    const [agentA, agentB] = await Promise.all([getRootAgent(appA), getRootAgent(appB)]);
    const contentBase64 = Buffer.from('shared').toString('base64');
    const initResponse = await agentA.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.initFileUpload)).send({
      purpose: 'run-artifact',
      sizeBytes: 6,
      fileName: 'shared.txt',
      mimeType: 'text/plain',
    });
    expect(initResponse.status).toBe(200);
    const uploadId = String(getData(initResponse).id);

    const appendResponses = await Promise.all([
      agentB
        .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.appendFileUpload, uploadId))
        .send({ offset: 0, contentBase64 }),
      agentB
        .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.appendFileUpload, uploadId))
        .send({ offset: 0, contentBase64 }),
    ]);
    expect(appendResponses.map((response) => response.status)).toEqual([200, 200]);
    expect(appendResponses.map((response) => Boolean(getData(response).idempotent)).sort()).toEqual([false, true]);

    const completeResponse = await agentA
      .post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.completeFileUpload, uploadId))
      .send({});
    expect(completeResponse.status).toBe(200);
    const completedUpload = await appB.db.getRepository('agFileUploads').findOne({ filterByTk: uploadId });
    const storageObject = getCompletedStorageObject(completedUpload);
    expect(await readSharedStorageBuffer({ app: appB }, storageObject, 6)).toEqual(Buffer.from('shared'));

    expect(
      (await agentB.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.abortFileUpload, uploadId)).send({})).status,
    ).toBe(200);
    expect(await appA.db.getRepository('agFileUploads').findOne({ filterByTk: uploadId })).toBeNull();

    const expiringInit = await agentA.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.initFileUpload)).send({
      purpose: 'run-artifact',
      sizeBytes: 1,
    });
    const expiringUploadId = String(getData(expiringInit).id);
    expect(
      (
        await agentA.post(getTestApiPath(AGENT_GATEWAY_API_ACTIONS.appendFileUpload, expiringUploadId)).send({
          offset: 0,
          contentBase64: Buffer.from('x').toString('base64'),
        })
      ).status,
    ).toBe(200);
    await appA.db.getRepository('agFileUploads').update({
      filterByTk: expiringUploadId,
      values: { expiresAt: new Date(Date.now() - 1000) },
    });
    const pluginB = appB.pm.get(PluginAgentGatewayServer) as PluginAgentGatewayServer;
    expect(await cleanupExpiredFileUploads(pluginB, new Date())).toBe(1);
    expect(await appA.db.getRepository('agFileUploads').findOne({ filterByTk: expiringUploadId })).toBeNull();
  });
});
