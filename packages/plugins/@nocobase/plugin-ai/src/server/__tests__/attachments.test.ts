/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { describe, expect, it } from 'vitest';
import {
  appendAIFileAttachmentSource,
  findMessageAttachments,
  getAttachmentSource,
  getMessageAttachmentLookupKey,
} from '../attachments';

type FindCall = {
  collectionName: string;
  filter: Record<string, unknown>;
};

function createContext(records: Record<string, unknown>[], calls: FindCall[] = []) {
  const db = {
    getCollection: (collectionName: string) => ({
      options: {
        template: ['aiFiles', 'attachments'].includes(collectionName) ? 'file' : 'general',
      },
    }),
    getFieldByPath: (fieldPath: string) =>
      fieldPath === 'orders.files'
        ? {
            options: {
              target: 'attachments',
            },
          }
        : null,
    getRepository: (collectionName: string) => ({
      find: async ({ filter }: { filter: Record<string, unknown> }) => {
        calls.push({ collectionName, filter });
        return records.map((record) => ({
          toJSON: () => record,
        }));
      },
    }),
  };

  return {
    db,
    auth: {
      user: {
        id: 7,
      },
    },
    app: {
      dataSourceManager: {
        dataSources: new Map([['main', { collectionManager: { db } }]]),
      },
    },
  } as unknown as Context;
}

function expectLookupKey(attachment: unknown, expected: string) {
  const lookupKey = getMessageAttachmentLookupKey(attachment);
  expect(lookupKey).toBe(expected);
  if (!lookupKey) {
    throw new Error('lookup key is required');
  }
  return lookupKey;
}

describe('message attachment lookup', () => {
  it('stores aiFiles attachment source in meta', () => {
    const attachment = {
      id: 1,
      meta: {
        foo: 'bar',
      },
    };

    appendAIFileAttachmentSource(attachment);

    expect(attachment).toEqual({
      id: 1,
      meta: {
        foo: 'bar',
        source: {
          dataSourceKey: 'main',
          collectionName: 'aiFiles',
        },
      },
    });
  });

  it('skips attachments without source for historical compatibility', async () => {
    const calls: FindCall[] = [];
    const ctx = createContext([{ id: 1, filename: 'upload.png', storageId: 1 }], calls);
    const attachment = { id: 1, filename: 'upload.png' };

    const result = await findMessageAttachments(ctx, [attachment]);

    expect(getMessageAttachmentLookupKey(attachment)).toBeNull();
    expect(result.size).toBe(0);
    expect(calls).toEqual([]);
  });

  it('loads uploaded chat attachments from aiFiles owned by the current user', async () => {
    const calls: FindCall[] = [];
    const ctx = createContext([{ id: 1, filename: 'upload.png', storageId: 1 }], calls);
    const attachment = {
      id: 1,
      filename: 'upload.png',
      source: {
        dataSourceKey: 'main',
        collectionName: 'aiFiles',
      },
    };

    const result = await findMessageAttachments(ctx, [attachment]);
    const lookupKey = expectLookupKey(attachment, 'main:aiFiles:1');

    expect(result.get(lookupKey)).toMatchObject({
      id: 1,
      filename: 'upload.png',
    });
    expect(calls).toEqual([
      {
        collectionName: 'aiFiles',
        filter: {
          id: {
            $in: [1],
          },
          createdById: 7,
        },
      },
    ]);
  });

  it('loads block attachments from their source file collection', async () => {
    const calls: FindCall[] = [];
    const ctx = createContext([{ id: 2, filename: 'block.pdf', storageId: 1 }], calls);
    const attachment = {
      id: 2,
      filename: 'block.pdf',
      source: {
        dataSourceKey: 'main',
        collectionName: 'attachments',
        field: 'orders.files',
      },
    };

    const result = await findMessageAttachments(ctx, [attachment]);
    const lookupKey = expectLookupKey(attachment, 'main:attachments:2');

    expect(result.get(lookupKey)).toMatchObject({
      id: 2,
      filename: 'block.pdf',
    });
    expect(calls).toEqual([
      {
        collectionName: 'attachments',
        filter: {
          id: {
            $in: [2],
          },
        },
      },
    ]);
  });

  it('skips trustworthy attachments without source lookup', async () => {
    const calls: FindCall[] = [];
    const ctx = createContext([{ id: 3, filename: 'workflow.pdf', storageId: 1 }], calls);
    const attachment = {
      id: 3,
      filename: 'workflow.pdf',
      source: {
        trustworthy: true,
      },
    };

    const result = await findMessageAttachments(ctx, [attachment]);

    expect(getMessageAttachmentLookupKey(attachment)).toBeNull();
    expect(result.size).toBe(0);
    expect(calls).toEqual([]);
  });

  it('keeps normalized source fields on trustworthy attachments', () => {
    expect(
      getAttachmentSource({
        source: {
          dataSourceKey: 'main',
          collectionName: 'aiFiles',
          documentCache: false,
          trustworthy: true,
        },
      }),
    ).toEqual({
      dataSourceKey: 'main',
      collectionName: 'aiFiles',
      documentCache: false,
      trustworthy: true,
    });
  });
});
