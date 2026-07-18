/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import JSZip from 'jszip';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

import { ClientAppService, type ClientAppServiceHooks } from '../services/ClientAppService';
import {
  type ClientAppAssetStorage,
  type ClientAppStoredFile,
  FileManagerClientAppStorage,
  LIGHT_EXTENSION_CLIENT_APP_DOCUMENT_ROOT,
} from '../services/ClientAppStorage';
import type { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import type { LightExtensionRepoService } from '../services/LightExtensionRepoService';

describe('ClientAppService', () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(temporaryRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
  });

  it('publishes binary assets and keeps the Entry ID stable across replacements', async () => {
    const fixture = createFixture();
    const service = fixture.createService();
    const firstZip = await createClientAppZip('customer-app', {
      'index.html': '<html>first</html>',
      'assets/logo.png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]),
    });
    const first = await service.upload({ repoId: 'repo-1', zipPath: firstZip });
    const firstAsset = await service.openClientAppAsset(first.entryId, 'assets/logo.png');
    expect(firstAsset).not.toBeNull();
    expect(requireValue(firstAsset).clientAppContentHash).toBe(first.contentHash);
    await expect(readStream(requireValue(firstAsset).stream)).resolves.toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]),
    );

    const secondZip = await createClientAppZip('customer-app', {
      'index.html': '<html>second</html>',
      'assets/logo.png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01, 0xfe]),
    });
    const second = await service.upload({
      repoId: 'repo-1',
      zipPath: secondZip,
      expectedEntryId: first.entryId,
      expectedContentHash: first.contentHash,
    });
    expect(second.entryId).toBe(first.entryId);
    expect(second.contentHash).not.toBe(first.contentHash);
    const secondAsset = await service.openClientAppAsset(second.entryId, 'assets/logo.png');
    await expect(readStream(requireValue(secondAsset).stream)).resolves.toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01, 0xfe]),
    );
    expect(fixture.storage.objectCount()).toBe(second.fileCount);
  });

  it('rejects a replacement ZIP whose entry key targets a different application', async () => {
    const fixture = createFixture();
    const service = fixture.createService();
    const first = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('customer-app', { 'index.html': '<html>first</html>' }),
    });

    await expect(
      service.upload({
        repoId: 'repo-1',
        zipPath: await createClientAppZip('another-app', { 'index.html': '<html>other</html>' }),
        expectedEntryId: first.entryId,
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      details: expect.objectContaining({
        category: 'client-app-replacement',
        expectedKey: 'customer-app',
        actualKey: 'another-app',
      }),
    });
    expect(fixture.db.records('lightExtensionClientApps')).toHaveLength(1);
  });

  it('rejects a replacement based on an outdated content hash', async () => {
    const fixture = createFixture();
    const service = fixture.createService();
    const first = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('customer-app', { 'index.html': '<html>first</html>' }),
    });
    const current = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('customer-app', { 'index.html': '<html>current</html>' }),
      expectedEntryId: first.entryId,
      expectedContentHash: first.contentHash,
    });

    await expect(
      service.upload({
        repoId: 'repo-1',
        zipPath: await createClientAppZip('customer-app', { 'index.html': '<html>stale</html>' }),
        expectedEntryId: first.entryId,
        expectedContentHash: first.contentHash,
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_OUTDATED',
      details: expect.objectContaining({
        category: 'client-app-replacement-stale',
        expectedContentHash: first.contentHash,
        currentContentHash: current.contentHash,
      }),
    });
    await expect(service.resolveClientApp(first.entryId)).resolves.toMatchObject({
      contentHash: current.contentHash,
    });
  });

  it('keeps the current asset set intact when staging or pointer publication fails', async () => {
    let failAfterStage = false;
    let failBeforeSwitch = false;
    const fixture = createFixture({
      afterAssetStaged: () => {
        if (failAfterStage) {
          throw new Error('stage failure');
        }
      },
      beforePointerSwitch: () => {
        if (failBeforeSwitch) {
          throw new Error('pointer failure');
        }
      },
    });
    const service = fixture.createService();
    const firstZip = await createClientAppZip('stable-app', { 'index.html': '<html>stable</html>' });
    const first = await service.upload({ repoId: 'repo-1', zipPath: firstZip });

    failAfterStage = true;
    const stagingFailureZip = await createClientAppZip('stable-app', { 'index.html': '<html>staging</html>' });
    await expect(service.upload({ repoId: 'repo-1', zipPath: stagingFailureZip })).rejects.toThrow('stage failure');
    expect((await service.resolveClientApp(first.entryId)).contentHash).toBe(first.contentHash);
    expect(fixture.storage.objectCount()).toBe(first.fileCount);

    failAfterStage = false;
    failBeforeSwitch = true;
    const pointerFailureZip = await createClientAppZip('stable-app', { 'index.html': '<html>pointer</html>' });
    await expect(service.upload({ repoId: 'repo-1', zipPath: pointerFailureZip })).rejects.toThrow('pointer failure');
    expect((await service.resolveClientApp(first.entryId)).contentHash).toBe(first.contentHash);
    expect(fixture.storage.objectCount()).toBe(first.fileCount);
  });

  it('refuses to switch the pointer when staged storage does not read back byte-for-byte', async () => {
    const fixture = createFixture();
    const service = fixture.createService();
    fixture.storage.corruptNextStage();
    await expect(
      service.upload({
        repoId: 'repo-1',
        zipPath: await createClientAppZip('corrupt-app', { 'index.html': '<html>expected</html>' }),
      }),
    ).rejects.toThrow(/failed storage verification/u);
    expect(fixture.db.records('lightExtensionClientApps')).toEqual([]);
    expect(fixture.storage.objectCount()).toBe(0);
  });

  it('does not roll back a committed pointer when old asset cleanup fails', async () => {
    let failCleanup = false;
    const cleanupErrors: string[] = [];
    const fixture = createFixture({
      beforeOldAssetCleanup: () => {
        if (failCleanup) {
          throw new Error('cleanup failure');
        }
      },
      onCleanupError: (error) => cleanupErrors.push(error instanceof Error ? error.message : String(error)),
    });
    const service = fixture.createService();
    const first = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('cleanup-app', { 'index.html': '<html>first</html>' }),
    });
    failCleanup = true;
    const second = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('cleanup-app', { 'index.html': '<html>second</html>' }),
    });
    expect(second.entryId).toBe(first.entryId);
    expect((await service.resolveClientApp(first.entryId)).contentHash).toBe(second.contentHash);
    expect(cleanupErrors).toEqual(['cleanup failure']);
    expect(fixture.storage.objectCount()).toBe(first.fileCount + second.fileCount);

    failCleanup = false;
    await expect(service.sweepOrphanedAssetSets()).resolves.toEqual({ assetSets: 1, assets: first.fileCount });
    expect(fixture.storage.objectCount()).toBe(second.fileCount);
    expect(fixture.db.records('lightExtensionClientAppAssets')).toHaveLength(second.fileCount);
  });

  it('persists failed staging metadata so a later sweep can retry physical cleanup', async () => {
    let failCleanup = true;
    const fixture = createFixture({
      afterAssetStaged: () => {
        throw new Error('stage failure');
      },
      beforeOldAssetCleanup: () => {
        if (failCleanup) {
          throw new Error('cleanup failure');
        }
      },
    });
    const service = fixture.createService();
    await expect(
      service.upload({
        repoId: 'repo-1',
        zipPath: await createClientAppZip('orphan-app', { 'index.html': '<html>orphan</html>' }),
      }),
    ).rejects.toThrow('stage failure');
    expect(fixture.storage.objectCount()).toBe(1);
    expect(fixture.db.records('lightExtensionClientAppAssets')).toEqual([
      expect.objectContaining({ entryId: null, state: 'retiring', relativePath: 'index.html' }),
    ]);

    failCleanup = false;
    await expect(service.sweepOrphanedAssetSets({ stagingOlderThanMs: 0 })).resolves.toEqual({
      assetSets: 1,
      assets: 1,
    });
    expect(fixture.storage.objectCount()).toBe(0);
    expect(fixture.db.records('lightExtensionClientAppAssets')).toEqual([]);
  });

  it('cleans every staged object when persisting a later asset metadata row fails', async () => {
    const fixture = createFixture();
    fixture.db.failAssetCreateOnCall(2);
    const service = fixture.createService();

    await expect(
      service.upload({
        repoId: 'repo-1',
        zipPath: await createClientAppZip('metadata-failure-app', {
          'index.html': '<html>metadata failure</html>',
          'app.js': 'window.metadataFailure = true;',
        }),
      }),
    ).rejects.toThrow('asset metadata failure');
    expect(fixture.storage.objectCount()).toBe(0);
    expect(fixture.db.records('lightExtensionClientAppAssets')).toEqual([]);
    expect(fixture.db.records('lightExtensionClientApps')).toEqual([]);
  });

  it('uses the persisted reservation to clean an object when staging fails after the physical write', async () => {
    const fixture = createFixture();
    fixture.storage.failNextStageAfterWrite();
    const service = fixture.createService();

    await expect(
      service.upload({
        repoId: 'repo-1',
        zipPath: await createClientAppZip('stage-write-failure-app', { 'index.html': '<html>failure</html>' }),
      }),
    ).rejects.toThrow('stage failed after write');
    expect(fixture.storage.objectCount()).toBe(0);
    expect(fixture.db.records('lightExtensionClientAppAssets')).toEqual([]);
  });

  it('deletes client app metadata transactionally and retries asset retirement through the orphan sweep', async () => {
    let failCleanup = true;
    const fixture = createFixture({
      beforeOldAssetCleanup: () => {
        if (failCleanup) {
          throw new Error('cleanup failure');
        }
      },
    });
    const service = fixture.createService();
    const uploaded = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('delete-app', {
        'index.html': '<html>delete</html>',
        'app.js': 'window.deleted = true;',
      }),
    });

    await service.deleteClientApp(uploaded.entryId);
    expect(fixture.db.records('lightExtensionEntries')).toEqual([]);
    expect(fixture.db.records('lightExtensionClientApps')).toEqual([]);
    expect(fixture.db.records('lightExtensionClientAppAssets')).toHaveLength(uploaded.fileCount);
    expect(fixture.storage.objectCount()).toBe(uploaded.fileCount);

    failCleanup = false;
    await expect(service.sweepOrphanedAssetSets()).resolves.toEqual({
      assetSets: 1,
      assets: uploaded.fileCount,
    });
    expect(fixture.db.records('lightExtensionClientAppAssets')).toEqual([]);
    expect(fixture.storage.objectCount()).toBe(0);
  });

  it('checks repository references under the repository lock before retiring client apps', async () => {
    const fixture = createFixture();
    const service = fixture.createService();
    const uploaded = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('referenced-app', { 'index.html': '<html>current</html>' }),
    });
    const guard = vi.fn(async () => {
      throw new Error('repository is referenced');
    });
    service.useRepoDeleteGuard(guard);

    await expect(service.deleteClientAppsForRepo('repo-1')).rejects.toThrow('repository is referenced');
    expect(guard).toHaveBeenCalledTimes(1);
    await expect(service.resolveClientApp(uploaded.entryId)).resolves.toMatchObject({ entryId: uploaded.entryId });
    expect(fixture.storage.objectCount()).toBe(uploaded.fileCount);
  });

  it('serializes concurrent replacements so the current pointer references one complete asset set', async () => {
    const fixture = createFixture();
    const service = fixture.createService();
    const [left, right] = await Promise.all([
      service.upload({
        repoId: 'repo-1',
        zipPath: await createClientAppZip('concurrent-app', {
          'index.html': '<html>left</html>',
          'left.js': 'window.side = "left"',
        }),
      }),
      service.upload({
        repoId: 'repo-1',
        zipPath: await createClientAppZip('concurrent-app', {
          'index.html': '<html>right</html>',
          'right.js': 'window.side = "right"',
        }),
      }),
    ]);
    expect(left.entryId).toBe(right.entryId);
    const current = await service.resolveClientApp(left.entryId);
    expect([left.contentHash, right.contentHash]).toContain(current.contentHash);
    const assetPaths = fixture.db
      .records('lightExtensionClientAppAssets')
      .filter((record) => record.assetSetId === fixture.currentAssetSetId(left.entryId))
      .map((record) => record.relativePath)
      .sort();
    expect(assetPaths).toEqual(
      current.contentHash === left.contentHash ? ['index.html', 'left.js'] : ['index.html', 'right.js'],
    );
  });

  it('rechecks the current pointer under the repo lock before a sweep can retire a publishing set', async () => {
    const pointerBlock = createDeferred();
    let blockPointer = true;
    const fixture = createFixture({
      beforePointerSwitch: async () => {
        if (!blockPointer) {
          return;
        }
        pointerBlock.start();
        await pointerBlock.wait;
      },
    });
    const service = fixture.createService();
    const uploadPromise = service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('sweep-race-app', { 'index.html': '<html>complete</html>' }),
    });
    await pointerBlock.started;
    const sweepPromise = service.sweepOrphanedAssetSets({ stagingOlderThanMs: 0 });
    blockPointer = false;
    pointerBlock.release();

    const uploaded = await uploadPromise;
    await expect(sweepPromise).resolves.toEqual({ assetSets: 0, assets: 0 });
    const opened = await service.openClientAppAsset(uploaded.entryId, 'index.html');
    await expect(readStream(requireValue(opened).stream)).resolves.toEqual(Buffer.from('<html>complete</html>'));
  });

  it('does not sweep another repository staging set while deleting a client app', async () => {
    const stagingBlock = createDeferred();
    let blockStaging = false;
    const fixture = createFixture({
      afterAssetStaged: async () => {
        if (!blockStaging) {
          return;
        }
        stagingBlock.start();
        await stagingBlock.wait;
      },
    });
    const service = fixture.createService();
    const first = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('delete-race-app', { 'index.html': '<html>first</html>' }),
    });

    blockStaging = true;
    const secondUploadPromise = service.upload({
      repoId: 'repo-2',
      zipPath: await createClientAppZip('other-repo-app', { 'index.html': '<html>second</html>' }),
    });
    await stagingBlock.started;
    await service.deleteClientApp(first.entryId);
    blockStaging = false;
    stagingBlock.release();

    const second = await secondUploadPromise;
    const opened = await service.openClientAppAsset(second.entryId, 'index.html');
    await expect(readStream(requireValue(opened).stream)).resolves.toEqual(Buffer.from('<html>second</html>'));
  });

  it('deletes the replacement that commits before the delete acquires the repo lock', async () => {
    const pointerBlock = createDeferred();
    let blockPointer = false;
    const fixture = createFixture({
      beforePointerSwitch: async () => {
        if (!blockPointer) {
          return;
        }
        pointerBlock.start();
        await pointerBlock.wait;
      },
    });
    const service = fixture.createService();
    const first = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('replace-delete-app', { 'index.html': '<html>first</html>' }),
    });

    blockPointer = true;
    const replacementPromise = service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('replace-delete-app', { 'index.html': '<html>replacement</html>' }),
    });
    await pointerBlock.started;
    const deletePromise = service.deleteClientApp(first.entryId);
    blockPointer = false;
    pointerBlock.release();

    await replacementPromise;
    await deletePromise;
    expect(fixture.db.records('lightExtensionEntries')).toEqual([]);
    expect(fixture.db.records('lightExtensionClientApps')).toEqual([]);
    expect(fixture.db.records('lightExtensionClientAppAssets')).toEqual([]);
    expect(fixture.storage.objectCount()).toBe(0);
  });

  it('opens the old stream before a replacement can retire its asset set', async () => {
    const fixture = createFixture();
    const service = fixture.createService();
    const first = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('download-app', { 'index.html': '<html>old</html>' }),
    });
    const blockedOpen = fixture.storage.blockNextOpen();
    const openPromise = service.openClientAppAsset(first.entryId, 'index.html');
    await blockedOpen.started;
    let replacementFinished = false;
    const replacementPromise = service
      .upload({
        repoId: 'repo-1',
        zipPath: await createClientAppZip('download-app', { 'index.html': '<html>new</html>' }),
      })
      .then((result) => {
        replacementFinished = true;
        return result;
      });
    await Promise.resolve();
    expect(replacementFinished).toBe(false);
    blockedOpen.release();
    const opened = requireValue(await openPromise);
    await expect(readStream(opened.stream)).resolves.toEqual(Buffer.from('<html>old</html>'));
    const replacement = await replacementPromise;
    expect((await service.resolveClientApp(first.entryId)).contentHash).toBe(replacement.contentHash);
  });

  it('fails closed instead of falling back to the public default File Manager storage', async () => {
    const uploadFile = vi.fn();
    const fileManager = {
      storagesCache: new Map([
        [
          1,
          {
            id: 1,
            name: 'local',
            title: 'Public uploads',
            type: 'local',
            baseUrl: '/storage/uploads',
            options: {},
          },
        ],
      ]),
      storageTypes: { get: vi.fn() },
      uploadFile,
      getFileStream: vi.fn(),
      loadStorages: vi.fn(),
    } as unknown as ConstructorParameters<typeof FileManagerClientAppStorage>[0];
    const storage = new FileManagerClientAppStorage(fileManager);
    await expect(storage.reserve({ assetSetId: 'set-1', relativePath: 'index.html', byteSize: 1 })).rejects.toThrow(
      /unavailable/u,
    );
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('uses collision-proof physical object names for archive paths that File Manager would sanitize alike', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'client-app-object-name-test-'));
    temporaryRoots.push(root);
    const firstPath = path.join(root, 'first.js');
    const secondPath = path.join(root, 'second.js');
    await fs.writeFile(firstPath, 'first');
    await fs.writeFile(secondPath, 'second');
    const uploaded: Array<{ filename: string; content: Buffer }> = [];
    const fileManager = {
      storagesCache: new Map([
        [
          2,
          {
            id: 2,
            name: 'light-extension-client-app-internal',
            title: 'Internal client apps',
            type: 'local',
            baseUrl: '/_internal/light-extension-client-app-assets',
            options: { documentRoot: LIGHT_EXTENSION_CLIENT_APP_DOCUMENT_ROOT },
            path: '',
            renameMode: 'none',
            default: false,
          },
        ],
      ]),
      storageTypes: { get: vi.fn() },
      uploadFile: vi.fn(async (input: { filePath: string; subPath?: string }) => {
        const filename = path.basename(input.filePath);
        uploaded.push({ filename, content: await fs.readFile(input.filePath) });
        return {
          title: filename,
          filename,
          size: uploaded[uploaded.length - 1].content.length,
          path: input.subPath || '',
          storageId: 2,
        };
      }),
      getFileStream: vi.fn(),
      loadStorages: vi.fn(),
    } as unknown as ConstructorParameters<typeof FileManagerClientAppStorage>[0];
    const storage = new FileManagerClientAppStorage(fileManager);
    const first = await storage.stage({ assetSetId: 'set-1', relativePath: 'a<b.js', filePath: firstPath });
    const second = await storage.stage({ assetSetId: 'set-1', relativePath: 'a-b.js', filePath: secondPath });
    expect(first.filename).not.toBe(second.filename);
    expect(uploaded.map((item) => item.filename)).toEqual([first.filename, second.filename]);
    expect(uploaded.map((item) => item.content.toString())).toEqual(['first', 'second']);
    expect(first.filename).toMatch(/^[a-f0-9]{64}\.js$/u);
    expect(second.filename).toMatch(/^[a-f0-9]{64}\.js$/u);
  });

  it('waits until a local File Manager stream owns its file descriptor before returning', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'client-app-open-test-'));
    temporaryRoots.push(root);
    const filePath = path.join(root, 'asset.js');
    await fs.writeFile(filePath, 'window.ready = true;');
    const fileManager = {
      storagesCache: new Map(),
      storageTypes: { get: vi.fn() },
      uploadFile: vi.fn(),
      loadStorages: vi.fn(),
      getFileStream: vi.fn(async () => ({ stream: createReadStream(filePath) })),
    } as unknown as ConstructorParameters<typeof FileManagerClientAppStorage>[0];
    const storage = new FileManagerClientAppStorage(fileManager);
    const opened = await storage.open({
      title: 'asset',
      filename: 'asset.js',
      size: 20,
      path: '',
      storageId: 1,
    });
    expect('pending' in opened.stream ? opened.stream.pending : false).toBe(false);
    await fs.unlink(filePath);
    await expect(readStream(opened.stream)).resolves.toEqual(Buffer.from('window.ready = true;'));
  });

  it('rejects a stale resolve/open pair without exposing the internal asset-set ID', async () => {
    const fixture = createFixture();
    const service = fixture.createService();
    const first = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('snapshot-app', { 'index.html': '<html>old</html>' }),
    });
    const resolved = await service.resolveClientApp(first.entryId);
    const second = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('snapshot-app', { 'index.html': '<html>new</html>' }),
    });
    await expect(
      service.openClientAppAsset(first.entryId, 'index.html', { expectedContentHash: resolved.contentHash }),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_SOURCE_OUTDATED' });
    const opened = await service.openClientAppAsset(first.entryId, 'index.html', {
      expectedContentHash: second.contentHash,
    });
    expect(requireValue(opened).clientAppContentHash).toBe(second.contentHash);
    await expect(readStream(requireValue(opened).stream)).resolves.toEqual(Buffer.from('<html>new</html>'));
  });

  it('prefers the logical asset MIME when object storage reports generic binary content', async () => {
    const fixture = createFixture();
    const service = fixture.createService();
    const uploaded = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('mime-app', {
        'index.html': '<html></html>',
        'assets/app.js': 'window.mime = true;',
      }),
    });
    fixture.storage.setBackendContentType('application/octet-stream');
    const opened = await service.openClientAppAsset(uploaded.entryId, 'assets/app.js');
    expect(requireValue(opened).mimeType).toBe('application/javascript');
  });

  function createFixture(hooks: ClientAppServiceHooks = {}) {
    const db = new FakeDatabase();
    db.seed('lightExtensionRepos', {
      id: 'repo-1',
      name: 'repo-1',
      title: 'Repository 1',
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
    });
    db.seed('lightExtensionRepos', {
      id: 'repo-2',
      name: 'repo-2',
      title: 'Repository 2',
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
    });
    const storage = new MemoryClientAppStorage();
    const repoService = {
      getRepo: async (repoId: string) => ({
        id: repoId,
        name: repoId,
        title: repoId === 'repo-1' ? 'Repository 1' : 'Repository 2',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
      }),
    } as unknown as LightExtensionRepoService;
    const permissionService = {
      assertActionAllowed: async () => undefined,
    } as unknown as LightExtensionPermissionService;
    return {
      db,
      storage,
      createService: () =>
        new ClientAppService(db as unknown as Database, repoService, permissionService, storage, hooks),
      currentAssetSetId: (entryId: string) =>
        String(db.records('lightExtensionClientApps').find((record) => record.entryId === entryId)?.assetSetId),
    };
  }

  async function createClientAppZip(key: string, files: Record<string, string | Buffer>): Promise<string> {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'client-app-service-test-'));
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
});

class MemoryClientAppStorage implements ClientAppAssetStorage {
  private readonly objects = new Map<string, Buffer>();
  private nextOpenBlock?: { started: () => void; wait: Promise<void> };
  private corruptNext = false;
  private backendContentType?: string;
  private failAfterWrite = false;

  async reserve(input: { assetSetId: string; relativePath: string; byteSize: number }): Promise<ClientAppStoredFile> {
    const key = `${input.assetSetId}/${input.relativePath}`;
    return {
      title: path.posix.basename(input.relativePath),
      filename: path.posix.basename(input.relativePath),
      size: input.byteSize,
      ...(input.relativePath.endsWith('.js') ? { mimetype: 'application/javascript' } : {}),
      path: path.posix.dirname(key),
      storageId: 1,
      meta: { key },
    };
  }

  async stage(input: {
    assetSetId: string;
    relativePath: string;
    filePath: string;
    reservedFile?: ClientAppStoredFile;
  }): Promise<ClientAppStoredFile> {
    const key = `${input.assetSetId}/${input.relativePath}`;
    const content = await fs.readFile(input.filePath);
    this.objects.set(key, this.corruptNext ? Buffer.from('corrupt') : content);
    this.corruptNext = false;
    if (this.failAfterWrite) {
      this.failAfterWrite = false;
      throw new Error('stage failed after write');
    }
    return input.reservedFile || this.reserve({ ...input, byteSize: content.length });
  }

  async open(file: ClientAppStoredFile) {
    const key = String(file.meta?.key || `${file.path}/${file.filename}`);
    const content = this.objects.get(key);
    if (!content) {
      throw new Error(`Missing object ${key}`);
    }
    const block = this.nextOpenBlock;
    this.nextOpenBlock = undefined;
    if (block) {
      block.started();
      await block.wait;
    }
    return {
      stream: Readable.from(content),
      ...(this.backendContentType ? { contentType: this.backendContentType } : {}),
    };
  }

  async delete(files: readonly ClientAppStoredFile[]) {
    for (const file of files) {
      const key = String(file.meta?.key || `${file.path}/${file.filename}`);
      this.objects.delete(key);
    }
  }

  objectCount() {
    return this.objects.size;
  }

  blockNextOpen() {
    let start = () => undefined;
    let release = () => undefined;
    const started = new Promise<void>((resolve) => {
      start = resolve;
    });
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.nextOpenBlock = { started: start, wait };
    return { started, release };
  }

  corruptNextStage() {
    this.corruptNext = true;
  }

  setBackendContentType(contentType: string) {
    this.backendContentType = contentType;
  }

  failNextStageAfterWrite() {
    this.failAfterWrite = true;
  }
}

type FakeRecord = Record<string, unknown>;

class FakeModel {
  constructor(
    private readonly record: FakeRecord,
    private readonly touch: () => void,
  ) {}

  get(key: string) {
    return this.record[key];
  }

  async update(values: FakeRecord) {
    Object.assign(this.record, clone(values));
    this.touch();
    return this;
  }

  toJSON() {
    return clone(this.record);
  }
}

class FakeDatabase {
  private state = new Map<string, FakeRecord[]>();
  private transactionQueue: Promise<unknown> = Promise.resolve();
  private clock = 0;
  private assetCreateCalls = 0;
  private failedAssetCreateCall?: number;

  readonly options = { dialect: 'sqlite' };

  readonly sequelize = {
    transaction: <T>(
      optionsOrRunner: object | ((transaction: Transaction) => Promise<T>),
      optionalRunner?: (transaction: Transaction) => Promise<T>,
    ): Promise<T> => {
      const transactionRunner =
        typeof optionsOrRunner === 'function' ? optionsOrRunner : requireValue(optionalRunner || null);
      const run = this.transactionQueue.then(async () => {
        const snapshot = this.snapshot();
        try {
          return await transactionRunner({ LOCK: { SHARE: 'SHARE', UPDATE: 'UPDATE' } } as unknown as Transaction);
        } catch (error) {
          this.restore(snapshot);
          throw error;
        }
      });
      this.transactionQueue = run.catch(() => undefined);
      return run;
    },
  };

  seed(collection: string, record: FakeRecord) {
    this.collection(collection).push({ ...clone(record), createdAt: this.now(), updatedAt: this.now() });
  }

  records(collection: string) {
    return this.collection(collection).map((record) => clone(record));
  }

  failAssetCreateOnCall(call: number) {
    this.failedAssetCreateCall = call;
  }

  getRepository(collection: string) {
    return {
      find: async (options: { filter?: FakeRecord } = {}) =>
        this.collection(collection)
          .filter((record) => matches(record, options.filter))
          .map((record) => this.model(record)),
      findOne: async (options: { filter?: FakeRecord; filterByTk?: unknown } = {}) => {
        const record = this.collection(collection).find((candidate) =>
          typeof options.filterByTk !== 'undefined'
            ? candidate[primaryKey(collection)] === options.filterByTk
            : matches(candidate, options.filter),
        );
        return record ? this.model(record) : null;
      },
      create: async (options: { values: FakeRecord }) => {
        if (collection === 'lightExtensionClientAppAssets') {
          this.assetCreateCalls += 1;
          if (this.assetCreateCalls === this.failedAssetCreateCall) {
            throw new Error('asset metadata failure');
          }
        }
        const record = {
          ...clone(options.values),
          ...(collection === 'lightExtensionClientAppAssets' ? { id: `asset-${this.now()}` } : {}),
          createdAt: this.now(),
          updatedAt: this.now(),
        };
        this.collection(collection).push(record);
        return this.model(record);
      },
      createMany: async (options: { records: FakeRecord[] }) => {
        for (const values of options.records) {
          const record = {
            ...clone(values),
            id: values.id || `asset-${this.now()}`,
            createdAt: this.now(),
            updatedAt: this.now(),
          };
          this.collection(collection).push(record);
        }
      },
    };
  }

  getModel(collection: string) {
    return {
      findOne: async (options: { where?: FakeRecord }) => {
        const record = this.collection(collection).find((candidate) => matches(candidate, options.where));
        return record ? this.model(record) : null;
      },
      destroy: async (options: { where?: FakeRecord }) => {
        const next = this.collection(collection).filter((candidate) => !matches(candidate, options.where));
        this.state.set(collection, next);
        return next.length;
      },
    };
  }

  private model(record: FakeRecord) {
    return new FakeModel(record, () => {
      record.updatedAt = this.now();
    });
  }

  private collection(name: string) {
    const records = this.state.get(name) || [];
    this.state.set(name, records);
    return records;
  }

  private snapshot() {
    return new Map([...this.state].map(([name, records]) => [name, records.map((record) => clone(record))]));
  }

  private restore(snapshot: Map<string, FakeRecord[]>) {
    this.state = snapshot;
  }

  private now() {
    this.clock += 1;
    return new Date(1_700_000_000_000 + this.clock).toISOString();
  }
}

function matches(record: FakeRecord, filter?: FakeRecord): boolean {
  return !filter || Object.entries(filter).every(([key, value]) => record[key] === value);
}

function primaryKey(collection: string): string {
  return collection === 'lightExtensionClientApps' ? 'entryId' : 'id';
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

async function readStream(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function requireValue<T>(value: T | null): T {
  if (value === null) {
    throw new Error('Expected value to be available');
  }
  return value;
}

function createDeferred() {
  let start = () => undefined;
  let release = () => undefined;
  const started = new Promise<void>((resolve) => {
    start = resolve;
  });
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { start, started, wait, release };
}
