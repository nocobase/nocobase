/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { createMockServer, type MockServer } from '@nocobase/test';
import fs from 'fs/promises';
import JSZip from 'jszip';
import os from 'os';
import path from 'path';

import {
  LIGHT_EXTENSION_CLIENT_APP_STORAGE_BASE_URL,
  LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME,
  LIGHT_EXTENSION_CLIENT_APP_DOCUMENT_ROOT,
  ensureClientAppInternalStorage,
  FileManagerClientAppStorage,
} from '../services/ClientAppStorage';
import PluginLightExtensionServer from '../plugin';

interface UploadedClientApp {
  entryId: string;
  contentHash: string;
  fileCount: number;
}

const describePostgres = process.env.DB_DIALECT === 'postgres' ? describe : describe.skip;

describePostgres('client-app PostgreSQL integration', () => {
  let app: MockServer;
  let plugin: PluginLightExtensionServer;
  const temporaryRoots: string[] = [];
  const createdEntryIds = new Set<string>();
  const unregisterAdapters: Array<() => void> = [];

  beforeAll(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['file-manager', PluginLightExtensionServer],
    });
    plugin = app.pm.get(PluginLightExtensionServer) as PluginLightExtensionServer;
  });

  afterEach(async () => {
    await app.db.getModel('lightExtensionReferences').destroy({ where: {} });
    for (const entryId of createdEntryIds) {
      const entry = await app.db.getRepository('lightExtensionEntries').findOne({ filterByTk: entryId });
      if (entry) {
        await plugin.deleteClientApp(entryId);
      }
    }
    createdEntryIds.clear();
    for (const unregister of unregisterAdapters.splice(0)) {
      unregister();
    }
    await Promise.all(temporaryRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
  });

  afterAll(async () => {
    await app?.destroy();
  });

  it('uploads and replaces through private File Manager storage while preserving the old pointer after a bad ZIP', async () => {
    const repoId = await createRepo('postgres-upload-replace');
    const first = await uploadClientApp(
      repoId,
      await createClientAppZip('postgres-client-app', {
        'index.html': '<html>first</html>',
        'assets/logo.png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]),
      }),
    );
    createdEntryIds.add(first.entryId);

    const firstAsset = await app.db.getRepository('lightExtensionClientAppAssets').findOne({
      filter: { entryId: first.entryId, relativePath: 'assets/logo.png', state: 'ready' },
    });
    expect(firstAsset).toBeTruthy();
    expect(firstAsset?.get('url')).toMatch(/^\/files\/main\/main\/lightExtensionClientAppAssets\//u);
    const permanentUrlResponse = await app.agent().get(String(firstAsset?.get('url')));
    expect(permanentUrlResponse.status).toBe(302);
    expect(permanentUrlResponse.headers.location).toMatch(/^\/_internal\/light-extension-client-app-assets\//u);
    expect(await app.agent().get(permanentUrlResponse.headers.location)).toMatchObject({ status: 404 });

    const second = await uploadClientApp(
      repoId,
      await createClientAppZip('postgres-client-app', {
        'index.html': '<html>second</html>',
        'assets/logo.png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01, 0xfe]),
      }),
      {
        expectedEntryId: first.entryId,
      },
    );
    expect(second.entryId).toBe(first.entryId);
    expect(second.contentHash).not.toBe(first.contentHash);
    await expect(readAsset(second.entryId, 'index.html')).resolves.toEqual(Buffer.from('<html>second</html>'));

    const invalidZipPath = await createInvalidZip();
    const failedReplacement = await app
      .agent()
      .post('/lightExtensionClientApps:upload')
      .field('repoId', repoId)
      .field('expectedEntryId', second.entryId)
      .attach('file', invalidZipPath);
    expect(failedReplacement.status).toBe(422);
    expect(failedReplacement.body.errors?.[0]).toMatchObject({ code: 'LIGHT_EXTENSION_VALIDATION_FAILED' });
    await expect(plugin.resolveClientApp(second.entryId)).resolves.toMatchObject({
      contentHash: second.contentHash,
      fileCount: second.fileCount,
    });
    await expect(readAsset(second.entryId, 'index.html')).resolves.toEqual(Buffer.from('<html>second</html>'));
  });

  it('serializes concurrent replacements into one complete current asset set', async () => {
    const repoId = await createRepo('postgres-concurrent-replace');
    const initial = await uploadClientApp(
      repoId,
      await createClientAppZip('postgres-concurrent-app', { 'index.html': '<html>initial</html>' }),
    );
    createdEntryIds.add(initial.entryId);

    const [left, right] = await Promise.all([
      uploadClientApp(
        repoId,
        await createClientAppZip('postgres-concurrent-app', {
          'index.html': '<html>left</html>',
          'left.js': 'window.side = "left";',
        }),
        { expectedEntryId: initial.entryId },
      ),
      uploadClientApp(
        repoId,
        await createClientAppZip('postgres-concurrent-app', {
          'index.html': '<html>right</html>',
          'right.js': 'window.side = "right";',
        }),
        { expectedEntryId: initial.entryId },
      ),
    ]);

    expect(left.entryId).toBe(initial.entryId);
    expect(right.entryId).toBe(initial.entryId);
    const current = await plugin.resolveClientApp(initial.entryId);
    expect([left.contentHash, right.contentHash]).toContain(current.contentHash);
    const currentAssets = await app.db.getRepository('lightExtensionClientAppAssets').find({
      filter: { entryId: initial.entryId, state: 'ready' },
      sort: ['relativePath'],
    });
    expect(currentAssets.map((asset) => asset.get('assetSetId'))).toEqual(
      Array(current.fileCount).fill(
        (await app.db.getRepository('lightExtensionClientApps').findOne({ filterByTk: initial.entryId }))?.get(
          'assetSetId',
        ),
      ),
    );
    expect(currentAssets.map((asset) => asset.get('relativePath'))).toEqual(
      current.contentHash === left.contentHash ? ['index.html', 'left.js'] : ['index.html', 'right.js'],
    );
  });

  it('holds the repository lock across reference creation so a concurrent delete observes the committed reference', async () => {
    const repoId = await createRepo('postgres-reference-delete');
    const uploaded = await uploadClientApp(
      repoId,
      await createClientAppZip('postgres-referenced-app', { 'index.html': '<html>referenced</html>' }),
    );
    createdEntryIds.add(uploaded.entryId);
    const ownerKind = 'multiPortal.frontend';
    const ownerId = 'postgres-portal';
    unregisterAdapters.push(
      plugin.registerExternalReferenceOwnerAdapter({
        ownerKind,
        listBindings: async () => [{ ownerId, entryIds: [uploaded.entryId] }],
        getBindingForUpdate: async () => ({ ownerId, entryIds: [uploaded.entryId] }),
      }),
    );

    const referenceTransaction = await app.db.sequelize.transaction();
    await plugin.syncExternalReferences(
      { ownerKind, ownerId, entryIds: [uploaded.entryId] },
      { transaction: referenceTransaction },
    );
    let deletionSettled = false;
    const deletion = plugin.deleteClientApp(uploaded.entryId).then(
      () => {
        deletionSettled = true;
        return null;
      },
      (error: unknown) => {
        deletionSettled = true;
        return error;
      },
    );
    await delay(100);
    expect(deletionSettled).toBe(false);
    await referenceTransaction.commit();

    await expect(deletion).resolves.toMatchObject({
      code: 'LIGHT_EXTENSION_REFERENCE_EXISTS',
      status: 409,
      details: expect.objectContaining({
        entryId: uploaded.entryId,
        references: [{ ownerKind, ownerId }],
      }),
    });
    await expect(plugin.resolveClientApp(uploaded.entryId)).resolves.toMatchObject({
      entryId: uploaded.entryId,
      contentHash: uploaded.contentHash,
    });
    const assets = await app.db.getRepository('lightExtensionClientAppAssets').find({
      filter: { entryId: uploaded.entryId },
    });
    expect(assets).toHaveLength(uploaded.fileCount);
    expect(assets.every((asset) => asset.get('state') === 'ready')).toBe(true);
  });

  it('creates and repairs one private internal storage record without falling back to the public default', async () => {
    const fileManager = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;
    const storageRepository = app.db.getRepository('storages');
    const internal = await storageRepository.findOne({
      filter: { name: LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME },
    });
    expect(internal).toBeTruthy();
    const internalId = internal?.get('id');
    expect(internal?.toJSON()).toMatchObject({
      type: 'local',
      baseUrl: LIGHT_EXTENSION_CLIENT_APP_STORAGE_BASE_URL,
      path: '',
      renameMode: 'none',
      default: false,
      paranoid: false,
      options: { documentRoot: LIGHT_EXTENSION_CLIENT_APP_DOCUMENT_ROOT },
    });

    await internal?.update({
      baseUrl: '/storage/uploads',
      path: 'public-client-apps',
      renameMode: 'random',
      default: true,
      options: { documentRoot: 'storage/uploads' },
    });
    await ensureClientAppInternalStorage(app.db, fileManager);

    const repaired = await storageRepository.findOne({
      filter: { name: LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME },
    });
    expect(repaired?.get('id')).toBe(internalId);
    expect(await storageRepository.count({ filter: { name: LIGHT_EXTENSION_CLIENT_APP_STORAGE_NAME } })).toBe(1);
    expect(repaired?.toJSON()).toMatchObject({
      type: 'local',
      baseUrl: LIGHT_EXTENSION_CLIENT_APP_STORAGE_BASE_URL,
      path: '',
      renameMode: 'none',
      default: false,
      paranoid: false,
      options: { documentRoot: LIGHT_EXTENSION_CLIENT_APP_DOCUMENT_ROOT },
    });

    const reserved = await new FileManagerClientAppStorage(fileManager).reserve({
      assetSetId: 'leas_postgres_boundary',
      relativePath: 'assets/app.js',
      byteSize: 16,
    });
    expect(String(reserved.storageId)).toBe(String(internalId));
    expect(reserved.path).toBe('leas_postgres_boundary');
  });

  async function createRepo(name: string): Promise<string> {
    const id = `ler_${name.replaceAll('-', '_')}`;
    await app.db.getRepository('lightExtensionRepos').create({
      values: {
        id,
        vscRepoId: `vscr_${name.replaceAll('-', '_')}`,
        name,
        normalizedName: name,
        title: name,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
      },
    });
    return id;
  }

  async function uploadClientApp(
    repoId: string,
    zipPath: string,
    expected: { expectedEntryId?: string; expectedContentHash?: string } = {},
  ): Promise<UploadedClientApp> {
    let request = app.agent().post('/lightExtensionClientApps:upload').field('repoId', repoId);
    if (expected.expectedEntryId) {
      request = request.field('expectedEntryId', expected.expectedEntryId);
    }
    if (expected.expectedContentHash) {
      request = request.field('expectedContentHash', expected.expectedContentHash);
    }
    const response = await request.attach('file', zipPath);
    expect(response.status).toBe(200);
    return response.body.data as UploadedClientApp;
  }

  async function createClientAppZip(key: string, files: Record<string, string | Buffer>): Promise<string> {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'client-app-postgres-test-'));
    temporaryRoots.push(root);
    const zip = new JSZip();
    zip.file('entry.json', JSON.stringify({ schemaVersion: 1, key }));
    for (const [name, content] of Object.entries(files)) {
      zip.file(name, content);
    }
    const zipPath = path.join(root, 'fixture.zip');
    await fs.writeFile(zipPath, await zip.generateAsync({ type: 'nodebuffer' }));
    return zipPath;
  }

  async function createInvalidZip(): Promise<string> {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'client-app-postgres-invalid-test-'));
    temporaryRoots.push(root);
    const zipPath = path.join(root, 'invalid.zip');
    await fs.writeFile(zipPath, Buffer.from('not a zip archive'));
    return zipPath;
  }

  async function readAsset(entryId: string, relativePath: string): Promise<Buffer> {
    const asset = await plugin.openClientAppAsset(entryId, relativePath);
    if (!asset) {
      throw new Error(`Expected client app asset "${relativePath}"`);
    }
    const chunks: Buffer[] = [];
    for await (const chunk of asset.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
});

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
