/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs/promises';
import JSZip from 'jszip';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

import { ClientAppService } from '../services/ClientAppService';
import {
  type ClientAppAssetStorage,
  type ClientAppStoredFile,
  FileManagerClientAppStorage,
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

  it('fails closed instead of using public File Manager storage', async () => {
    const uploadFile = vi.fn();
    const storage = new FileManagerClientAppStorage({
      storagesCache: new Map([
        [1, { id: 1, name: 'local', title: 'Public uploads', type: 'local', baseUrl: '/storage/uploads', options: {} }],
      ]),
      storageTypes: { get: vi.fn() },
      uploadFile,
      getFileStream: vi.fn(),
      loadStorages: vi.fn(),
    } as unknown as ConstructorParameters<typeof FileManagerClientAppStorage>[0]);

    await expect(
      storage.store({ assetSetId: 'set-1', relativePath: 'index.html', filePath: 'unused', byteSize: 1 }),
    ).rejects.toThrow(/unavailable/u);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  function createFixture() {
    const { db, repositories } = createReferenceServiceFixture({
      repos: [
        {
          id: 'repo-1',
          name: 'repo-1',
          title: 'Repository 1',
          lifecycleStatus: 'enabled',
          healthStatus: 'ready',
        },
      ],
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

  async store(input: {
    assetSetId: string;
    relativePath: string;
    filePath: string;
    byteSize: number;
  }): Promise<ClientAppStoredFile> {
    const key = `${input.assetSetId}/${input.relativePath}`;
    const extension = path.posix.extname(input.relativePath);
    const storedFile: ClientAppStoredFile = {
      title: path.posix.basename(input.relativePath, extension),
      filename: path.posix.basename(input.relativePath),
      size: input.byteSize,
      ...(input.relativePath.endsWith('.png') ? { mimetype: 'image/png' } : {}),
      path: path.posix.dirname(key),
      storageId: 1,
      meta: { key },
    };
    this.objects.set(String(storedFile.meta?.key), await fs.readFile(input.filePath));
    return storedFile;
  }

  async open(file: ClientAppStoredFile) {
    const content = this.objects.get(String(file.meta?.key));
    if (!content) {
      throw new Error('Missing client app asset');
    }
    return { stream: Readable.from(content) };
  }

  async delete(files: readonly ClientAppStoredFile[]) {
    for (const file of files) {
      this.objects.delete(String(file.meta?.key));
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
