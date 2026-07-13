/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

import {
  SharedStorageObject,
  copySharedStorageObject,
  deleteSharedStorageObject,
  putSharedStorageFile,
  readSharedStorageBuffer,
} from '../sharedFileStorage';

interface TestStorage {
  id: string;
  default: boolean;
  type: 'local';
  path: string;
  options: {
    documentRoot: string;
  };
}

class TestLocalStorage {
  constructor(private readonly storage: TestStorage) {}

  async copy(source: SharedStorageObject, target: SharedStorageObject) {
    const sourcePath = path.resolve(this.storage.options.documentRoot, source.path, source.filename);
    const targetPath = path.resolve(this.storage.options.documentRoot, target.path, target.filename);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }

  async delete(records: SharedStorageObject[]): Promise<[number, SharedStorageObject[]]> {
    for (const record of records) {
      await fs.unlink(path.resolve(this.storage.options.documentRoot, record.path, record.filename));
    }
    return [records.length, []];
  }
}

function createStorageHost(documentRoot: string) {
  const storage: TestStorage = {
    id: 'local-storage',
    default: true,
    type: 'local',
    path: '',
    options: { documentRoot },
  };
  const fileManager = {
    storagesCache: new Map([[storage.id, storage]]),
    storageTypes: new Map([['local', TestLocalStorage]]),
    async loadStorages() {},
    async uploadFile(options: { filePath: string; subPath: string }) {
      const filename = path.basename(options.filePath);
      const targetDirectory = path.resolve(documentRoot, options.subPath);
      await fs.mkdir(targetDirectory, { recursive: true });
      await fs.copyFile(options.filePath, path.join(targetDirectory, filename));
      const stat = await fs.stat(options.filePath);
      return {
        storageId: storage.id,
        path: options.subPath,
        filename,
        size: stat.size,
        mimetype: 'text/plain',
      };
    },
    async getFileStream(file: SharedStorageObject) {
      const content = await fs.readFile(path.resolve(documentRoot, file.path, file.filename));
      return { stream: Readable.from(content), contentType: file.mimetype };
    },
  };
  return {
    app: {
      pm: {
        get(name: string) {
          return name === 'file-manager' ? fileManager : undefined;
        },
      },
    },
  } as unknown as Parameters<typeof putSharedStorageFile>[0];
}

function createLocator(pathname: string, filename: string, sizeBytes: number): SharedStorageObject {
  return {
    storageId: 'local-storage',
    path: pathname,
    filename,
    objectKey: `${pathname}/${filename}`,
    sizeBytes,
    mimetype: 'text/plain',
    title: path.parse(filename).name,
  };
}

describe('agent gateway shared local file storage', () => {
  let documentRoot: string;
  let outsideRoot: string;

  beforeEach(async () => {
    documentRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-gateway-storage-root-'));
    outsideRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-gateway-storage-outside-'));
  });

  afterEach(async () => {
    await fs.rm(documentRoot, { recursive: true, force: true });
    await fs.rm(outsideRoot, { recursive: true, force: true });
  });

  it('rejects local symlink destinations and object operations without changing the outside sentinel', async () => {
    const host = createStorageHost(documentRoot);
    const sentinelPath = path.join(outsideRoot, 'sentinel.txt');
    const sentinelContent = 'outside sentinel';
    await fs.writeFile(sentinelPath, sentinelContent);
    await fs.mkdir(path.join(documentRoot, 'agent-gateway'), { recursive: true });
    await fs.symlink(outsideRoot, path.join(documentRoot, 'agent-gateway', 'escape'), 'dir');

    const sourceDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-gateway-storage-source-'));
    const uploadSource = path.join(sourceDirectory, 'sentinel.txt');
    await fs.writeFile(uploadSource, 'unsafe replacement');
    try {
      await expect(
        putSharedStorageFile(host, {
          filePath: uploadSource,
          subPath: 'agent-gateway/escape',
        }),
      ).rejects.toThrow(/symbolic link/);

      const validSourcePath = path.join(documentRoot, 'agent-gateway', 'source');
      await fs.mkdir(validSourcePath, { recursive: true });
      await fs.writeFile(path.join(validSourcePath, 'source.txt'), 'safe source');
      const validSource = createLocator('agent-gateway/source', 'source.txt', Buffer.byteLength('safe source'));
      await expect(
        copySharedStorageObject(host, validSource, {
          filename: 'sentinel.txt',
          subPath: 'agent-gateway/escape',
        }),
      ).rejects.toThrow(/symbolic link/);

      const escapedObject = createLocator('agent-gateway/escape', 'sentinel.txt', Buffer.byteLength(sentinelContent));
      await expect(readSharedStorageBuffer(host, escapedObject, 1024)).rejects.toThrow(/symbolic link/);
      await expect(deleteSharedStorageObject(host, escapedObject)).rejects.toThrow(/symbolic link/);
      await expect(fs.readFile(sentinelPath, 'utf8')).resolves.toBe(sentinelContent);
    } finally {
      await fs.rm(sourceDirectory, { recursive: true, force: true });
    }
  });

  it('rejects symbolic-link upload source files', async () => {
    const host = createStorageHost(documentRoot);
    const sourcePath = path.join(outsideRoot, 'source.txt');
    const sourceLink = path.join(outsideRoot, 'source-link.txt');
    await fs.writeFile(sourcePath, 'source');
    await fs.symlink(sourcePath, sourceLink, 'file');

    await expect(
      putSharedStorageFile(host, {
        filePath: sourceLink,
        subPath: 'agent-gateway/uploads',
      }),
    ).rejects.toThrow(/source must not be a symbolic link/);
  });
});
