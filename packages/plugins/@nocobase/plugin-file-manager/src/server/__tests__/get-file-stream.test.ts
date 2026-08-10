/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import PluginFileManagerServer from '../server';
import type { AttachmentModel, StorageModel, StorageType } from '../storages';

function createPlugin(options: { dataSource?: unknown; storage?: StorageModel; storageType?: typeof StorageType }) {
  const plugin = Object.create(PluginFileManagerServer.prototype) as PluginFileManagerServer;
  Object.assign(plugin, {
    app: {
      dataSourceManager: {
        get: () => options.dataSource,
      },
    },
    storagesCache: new Map(options.storage ? [[options.storage.id, options.storage]] : []),
    storageTypes: {
      get: () => options.storageType,
    },
  });
  return plugin;
}

const remoteFile: AttachmentModel = {
  id: 10,
  title: 'remote',
  filename: 'remote.txt',
  path: '',
  storageId: null,
  source: {
    dataSourceKey: 'external',
    collectionName: 'attachments',
  },
};

describe('file manager data source streams', () => {
  it('delegates source-aware files to the owning data source', async () => {
    const stream = Readable.from([Buffer.from('remote-file')]);
    const getFileStream = vi.fn(async () => ({ stream, contentType: 'text/plain' }));
    const plugin = createPlugin({ dataSource: { getFileStream } });

    const result = await plugin.getFileStream(remoteFile);

    expect(getFileStream).toHaveBeenCalledOnce();
    expect(result).toEqual({ stream, contentType: 'text/plain' });
  });

  it('falls back to the legacy storage logic when the data source has no file stream capability', async () => {
    const stream = Readable.from([Buffer.from('legacy-file')]);
    const getFileStream = vi.fn(async () => ({ stream, contentType: 'text/plain' }));
    class LegacyStorage {
      constructor(public storage: StorageModel) {}
      getFileStream = getFileStream;
    }
    const storage: StorageModel = {
      id: 1,
      title: 'Local',
      type: 'local',
      name: 'local',
      baseUrl: '/storage/uploads',
      options: {},
    };
    const plugin = createPlugin({
      dataSource: {},
      storage,
      storageType: LegacyStorage as unknown as typeof StorageType,
    });

    const result = await plugin.getFileStream({ ...remoteFile, storageId: 1 });

    expect(getFileStream).toHaveBeenCalledOnce();
    expect(result).toEqual({ stream, contentType: 'text/plain' });
  });

  it('does not fall back when the owning data source fails to read the file', async () => {
    const externalError = new Error('remote file unavailable');
    const externalGetFileStream = vi.fn(async () => {
      throw externalError;
    });
    const legacyGetFileStream = vi.fn(async () => ({
      stream: Readable.from([Buffer.from('legacy-file')]),
      contentType: 'text/plain',
    }));
    class LegacyStorage {
      constructor(public storage: StorageModel) {}
      getFileStream = legacyGetFileStream;
    }
    const storage: StorageModel = {
      id: 1,
      title: 'Local',
      type: 'local',
      name: 'local',
      baseUrl: '/storage/uploads',
      options: {},
    };
    const plugin = createPlugin({
      dataSource: { getFileStream: externalGetFileStream },
      storage,
      storageType: LegacyStorage as unknown as typeof StorageType,
    });

    await expect(plugin.getFileStream({ ...remoteFile, storageId: 1 })).rejects.toBe(externalError);
    expect(externalGetFileStream).toHaveBeenCalledOnce();
    expect(legacyGetFileStream).not.toHaveBeenCalled();
  });
});
