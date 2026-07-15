/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import axios from 'axios';
import type { Plugin } from '@nocobase/server';
import { describe, expect, it, vi } from 'vitest';
import { Files } from '../workflow/nodes/employee/files';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('workflow AI employee files', () => {
  it('preserves external data source metadata for attachment fields', async () => {
    const plugin = {} as Plugin;
    const attachmentPart: { attachments?: unknown[] } = {};

    await Files.resolvers(plugin, attachmentPart).resolveAttachments([
      {
        type: 'attachments',
        value: {
          id: 10,
          filename: 'remote.pdf',
          source: {
            dataSourceKey: 'external',
            collectionName: 'attachments',
            field: 'orders.files',
            documentCache: false,
          },
        } as unknown as string,
      },
    ]);

    expect(attachmentPart.attachments).toEqual([
      {
        id: 10,
        filename: 'remote.pdf',
        source: {
          dataSourceKey: 'external',
          collectionName: 'attachments',
          field: 'orders.files',
          documentCache: false,
          trustworthy: true,
        },
      },
    ]);
  });

  it('does not overwrite stored filenames when resolving file urls', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: Buffer.from('image'),
      headers: {
        'content-type': 'image/png',
      },
    });

    const createFileRecord = vi.fn(async () => ({
      toJSON: () => ({
        id: 1,
        filename: 'stored-file.png',
        storageId: 1,
      }),
    }));
    const plugin = {
      db: {
        getRepository: () => ({
          findOne: async () => ({
            options: {
              storage: 'local',
            },
          }),
        }),
      },
      pm: {
        get: () => ({
          createFileRecord,
        }),
      },
    } as unknown as Plugin;
    const attachmentPart: { attachments?: unknown[] } = {};

    await Files.resolvers(plugin, attachmentPart).resolveUrls([
      {
        type: 'file_url',
        value: 'https://minio.v2.test.nocobase.com/test/image-ab5wvq.png',
      },
    ]);

    expect(createFileRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionName: 'aiFiles',
        storageName: 'local',
        values: {
          title: 'image-ab5wvq',
          mimetype: 'image/png',
          meta: {
            sourceUrl: 'https://minio.v2.test.nocobase.com/test/image-ab5wvq.png',
            originalFilename: 'image-ab5wvq.png',
          },
        },
      }),
    );
    expect(attachmentPart.attachments).toEqual([
      {
        id: 1,
        filename: 'stored-file.png',
        storageId: 1,
        source: {
          dataSourceKey: 'main',
          collectionName: 'aiFiles',
          trustworthy: true,
        },
      },
    ]);
  });
});
