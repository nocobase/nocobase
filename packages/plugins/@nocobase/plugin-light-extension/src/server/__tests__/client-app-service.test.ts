/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';
import fs from 'fs/promises';
import JSZip from 'jszip';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

import { ClientAppService } from '../services/ClientAppService';
import {
  type ClientAppAssetStorage,
  type ClientAppSourceFile,
  type ClientAppStoredFile,
  LocalClientAppStorage,
} from '../services/ClientAppStorage';
import type { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import type { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { createReferenceServiceFixture } from './reference-test-helpers';

describe('ClientAppService', () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(temporaryRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
  });

  it('publishes and replaces a client app without creating a RunJS Entry', async () => {
    const { repositories, service, storage } = createFixture();
    const first = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('customer-app', {
        'index.html': '<html>first</html>',
        'assets/logo.png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]),
      }),
    });
    const second = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('customer-app', {
        'index.html': '<html>second</html>',
        'assets/logo.png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01, 0xfe]),
      }),
      expectedEntryId: first.entryId,
    });

    expect(second.entryId).toBe(first.entryId);
    expect(second.contentHash).not.toBe(first.contentHash);
    expect(repositories.lightExtensionEntries.records).toHaveLength(0);
    expect(repositories.lightExtensionClientApps.records).toHaveLength(1);
    const asset = await service.openClientAppAsset(second.entryId, 'assets/logo.png');
    expect(asset?.mimeType).toBe('image/png');
    await expect(readStream(asset?.stream)).resolves.toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01, 0xfe]));
    expect(storage.objectCount()).toBe(second.fileCount);
  });

  it('rejects mismatched replacements and referenced deletions', async () => {
    const { repositories, service, storage } = createFixture();
    const uploaded = await service.upload({
      repoId: 'repo-1',
      zipPath: await createClientAppZip('customer-app', { 'index.html': '<html>first</html>' }),
    });

    await expect(
      service.upload({
        repoId: 'repo-1',
        zipPath: await createClientAppZip('other-app', { 'index.html': '<html>other</html>' }),
        expectedEntryId: uploaded.entryId,
      }),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_INVALID_INPUT' });

    const unregister = service.useReferenceResolver(async () => [
      { entryId: uploaded.entryId, ownerKind: 'multiPortal.frontend', ownerId: 'portal-1' },
    ]);
    await expect(service.deleteClientApp(uploaded.entryId)).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_REFERENCE_EXISTS',
    });
    unregister();
    await service.deleteClientApp(uploaded.entryId);

    expect(repositories.lightExtensionClientApps.records).toHaveLength(0);
    expect(repositories.lightExtensionClientAppAssets.records).toHaveLength(0);
    expect(storage.objectCount()).toBe(0);
  });

  it('lists client apps for repository management regardless of repository lifecycle', async () => {
    const { repositories, service } = createFixture([
      { id: 'app-disabled', repoId: 'repo-disabled', key: 'disabled-app' },
      { id: 'app-archived', repoId: 'repo-archived', key: 'archived-app' },
    ]);

    await expect(service.listClientApps('repo-disabled')).resolves.toMatchObject([
      { entryId: 'app-disabled', repoId: 'repo-disabled', key: 'disabled-app', kind: 'client-app' },
    ]);
    await expect(service.listClientApps('repo-archived')).resolves.toMatchObject([
      { entryId: 'app-archived', repoId: 'repo-archived', key: 'archived-app', kind: 'client-app' },
    ]);
    expect(repositories.lightExtensionRepos.findOne).not.toHaveBeenCalled();
  });

  it('keeps disabled client apps unavailable at runtime', async () => {
    const { service } = createFixture([{ id: 'app-disabled', repoId: 'repo-1', key: 'disabled-app' }], 'disabled');

    await expect(service.resolveClientApp('app-disabled')).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_REPO_DISABLED',
    });
  });

  it('uses only the latest client app reference resolver', async () => {
    const { service } = createFixture([{ id: 'app-1', repoId: 'repo-1', key: 'customer-app' }]);
    const firstResolver = vi.fn(async () => [
      { entryId: 'app-1', ownerKind: 'multiPortal.frontend', ownerId: 'portal-1' },
    ]);
    const secondResolver = vi.fn(async () => [
      { entryId: 'app-1', ownerKind: 'multiPortal.frontend', ownerId: 'portal-2' },
    ]);
    const unregisterFirst = service.useReferenceResolver(firstResolver);
    const unregisterSecond = service.useReferenceResolver(secondResolver);

    const references = await service.listReferencesForRepo('repo-1', {} as Transaction);

    expect(firstResolver).not.toHaveBeenCalled();
    expect(secondResolver).toHaveBeenCalledOnce();
    expect(references).toEqual([{ entryId: 'app-1', ownerKind: 'multiPortal.frontend', ownerId: 'portal-2' }]);
    unregisterFirst();
    await expect(service.listReferencesForRepo('repo-1', {} as Transaction)).resolves.toEqual(references);
    unregisterSecond();
    await expect(service.listReferencesForRepo('repo-1', {} as Transaction)).resolves.toEqual([]);
  });

  it('publishes and removes a complete local asset set', async () => {
    const source = await fs.mkdtemp(path.join(os.tmpdir(), 'client-app-local-source-'));
    const storageRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'client-app-local-storage-'));
    temporaryRoots.push(source, storageRoot);
    await fs.mkdir(path.join(source, 'assets'));
    await fs.writeFile(path.join(source, 'index.html'), '<html>app</html>');
    await fs.writeFile(path.join(source, 'assets', 'app.js'), 'window.app = true;');
    const storage = new LocalClientAppStorage(storageRoot);
    const files: ClientAppSourceFile[] = [
      { relativePath: 'index.html', filePath: path.join(source, 'index.html'), byteSize: 16 },
      { relativePath: 'assets/app.js', filePath: path.join(source, 'assets', 'app.js'), byteSize: 18 },
    ];

    const stored = await storage.publish({ assetSetId: 'leas_test', files });
    await expect(readStream((await storage.open(stored[1])).stream)).resolves.toEqual(
      Buffer.from('window.app = true;'),
    );
    await expect(fs.stat(path.join(storageRoot, 'leas_test', 'index.html'))).resolves.toBeTruthy();

    await storage.delete('leas_test');
    await expect(fs.stat(path.join(storageRoot, 'leas_test'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  function createFixture(clientApps: Record<string, unknown>[] = [], lifecycleStatus = 'enabled') {
    const { db, repositories } = createReferenceServiceFixture({
      repos: [
        {
          id: 'repo-1',
          name: 'repo-1',
          title: 'Repository 1',
          lifecycleStatus,
          healthStatus: 'ready',
        },
      ],
      clientApps,
    });
    const storage = new MemoryClientAppStorage();
    const repoService = {
      getRepo: async () => ({
        id: 'repo-1',
        name: 'repo-1',
        title: 'Repository 1',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
      }),
    } as unknown as LightExtensionRepoService;
    const permissionService = {
      assertActionAllowed: async () => undefined,
    } as unknown as LightExtensionPermissionService;
    return {
      repositories,
      storage,
      service: new ClientAppService(db, repoService, permissionService, storage),
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

  async publish(input: { assetSetId: string; files: readonly ClientAppSourceFile[] }): Promise<ClientAppStoredFile[]> {
    return Promise.all(
      input.files.map(async (file) => {
        const key = `${input.assetSetId}/${file.relativePath}`;
        const extension = path.posix.extname(file.relativePath);
        const storedFile: ClientAppStoredFile = {
          title: path.posix.basename(file.relativePath, extension),
          filename: path.posix.basename(file.relativePath),
          size: file.byteSize,
          ...(file.relativePath.endsWith('.png') ? { mimetype: 'image/png' } : {}),
          path: path.posix.dirname(key),
        };
        this.objects.set(key, await fs.readFile(file.filePath));
        return storedFile;
      }),
    );
  }

  async open(file: ClientAppStoredFile) {
    const content = this.objects.get(path.posix.join(file.path, file.filename));
    if (!content) {
      throw new Error('Missing client app asset');
    }
    return { stream: Readable.from(content) };
  }

  async delete(assetSetId: string) {
    for (const key of this.objects.keys()) {
      if (key.startsWith(`${assetSetId}/`)) {
        this.objects.delete(key);
      }
    }
  }

  objectCount() {
    return this.objects.size;
  }
}

async function readStream(stream: Readable | undefined): Promise<Buffer> {
  if (!stream) {
    throw new Error('Expected stream');
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
