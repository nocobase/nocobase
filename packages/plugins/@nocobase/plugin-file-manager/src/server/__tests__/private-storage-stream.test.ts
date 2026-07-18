/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import PluginFileManagerServer from '../server';
import type { AttachmentModel, StorageModel, StorageType } from '../storages';
import LocalStorage from '../storages/local';

const INTERNAL_STORAGE_NAME = 'client-app-internal';

describe('private storage streams', () => {
  it('writes and reads binary data without requiring a public storage URL', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-private-storage-'));
    const sourcePath = path.join(root, 'fixture.png');
    const source = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0x7f, 0x80]);
    await fs.writeFile(sourcePath, source);

    const documentRoot = path.join(root, 'objects');
    const storage: StorageModel = {
      id: 1,
      title: 'Client app internal storage',
      type: 'local',
      name: INTERNAL_STORAGE_NAME,
      baseUrl: '/_internal/client-app-assets',
      options: { documentRoot },
      path: '',
    };
    const created: AttachmentModel[] = [];
    const plugin = createPlugin(storage, created);

    try {
      const record = await plugin.createFileRecord({
        collectionName: 'lightExtensionClientAppAssets',
        storageName: INTERNAL_STORAGE_NAME,
        filePath: sourcePath,
      });
      const attachment = record as unknown as AttachmentModel;
      const { stream } = await plugin.getFileStream(attachment);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      expect(Buffer.concat(chunks)).toEqual(source);
      expect(created).toHaveLength(1);
      expect(storage.baseUrl).not.toContain('/storage/uploads');

      const [deleted] = await new LocalStorage(storage).delete([attachment]);
      expect(deleted).toBe(1);
      await expect(fs.stat(path.join(documentRoot, attachment.path || '', attachment.filename))).rejects.toMatchObject({
        code: 'ENOENT',
      });
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});

function createPlugin(storage: StorageModel, created: AttachmentModel[]) {
  const plugin = Object.create(PluginFileManagerServer.prototype) as PluginFileManagerServer;
  Object.assign(plugin, {
    app: {
      db: {
        getCollection: () => ({ options: { storage: INTERNAL_STORAGE_NAME } }),
        getRepository: () => ({
          create: async ({ values }: { values: AttachmentModel }) => {
            created.push(values);
            return values;
          },
        }),
      },
    },
    storagesCache: new Map([[storage.id, storage]]),
    storageTypes: {
      get: () => LocalStorage as unknown as typeof StorageType,
    },
  });
  return plugin;
}
