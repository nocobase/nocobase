/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application, Plugin } from '@nocobase/server';
import { describe, expect, it, vi } from 'vitest';
import { getFileCollectionOptions, PluginFieldAttachmentUrlServer } from '../plugin';

function createCollectionRecord(name: string, title: string, storage?: string) {
  const options = { template: 'file', storage };
  const values: Record<string, unknown> = { name, title, options };
  return {
    name,
    title,
    options,
    get(key: string) {
      return values[key];
    },
  };
}

describe('getFileCollectionOptions', () => {
  it('returns all main data source file collections without applying storage visibility filters', async () => {
    const find = vi
      .fn()
      .mockResolvedValue([
        createCollectionRecord('attachments', 'Duplicate attachments'),
        createCollectionRecord('privateFiles', 'Private files'),
        createCollectionRecord('publicFiles', 'Public files'),
      ]);
    const db = {
      getCollection: vi.fn((name: string) =>
        name === 'attachments' ? { options: { storage: 'private' } } : undefined,
      ),
      getRepository: vi.fn(() => ({ find })),
    } as unknown as Plugin['db'];

    await expect(getFileCollectionOptions(db)).resolves.toEqual([
      { name: 'attachments', title: '{{t("Attachment", { ns: "file-manager" })}}' },
      { name: 'privateFiles', title: 'Private files' },
      { name: 'publicFiles', title: 'Public files' },
    ]);
    expect(find).toHaveBeenCalledWith({
      filter: {
        'options.template': 'file',
      },
    });
  });

  it('omits the default collection when it is unavailable', async () => {
    const db = {
      getCollection: vi.fn(() => undefined),
      getRepository: vi.fn(() => ({ find: vi.fn().mockResolvedValue([]) })),
    } as unknown as Plugin['db'];

    await expect(getFileCollectionOptions(db)).resolves.toEqual([]);
  });
});

describe('file collection list actions', () => {
  it('lists private file collections only through the v2 action', async () => {
    type ActionHandler = (ctx: { body?: unknown }, next: () => Promise<void>) => Promise<void>;

    const fileCollections = [
      createCollectionRecord('privateFiles', 'Private files', 'private-storage'),
      createCollectionRecord('publicFiles', 'Public files', 'public-storage'),
    ];
    const actionHandlers: Record<string, ActionHandler> = {};
    const app = {
      db: {
        getCollection: vi.fn(() => ({ options: { storage: 'private-storage' } })),
        getRepository: vi.fn(() => ({ find: vi.fn().mockResolvedValue(fileCollections) })),
      },
      pm: {
        get: vi.fn(() => ({
          isPublicAccessStorage: vi.fn((storage: string) => Promise.resolve(storage === 'public-storage')),
        })),
      },
      resourceManager: {
        registerActionHandlers: vi.fn((handlers: Record<string, ActionHandler>) =>
          Object.assign(actionHandlers, handlers),
        ),
      },
    } as unknown as Application;
    const plugin = new PluginFieldAttachmentUrlServer(app, { name: 'field-attachment-url' });
    await plugin.load();

    const v2Context: { body?: unknown } = {};
    const v1Context: { body?: unknown } = {};
    const next = vi.fn().mockResolvedValue(undefined);
    await actionHandlers['collections:listFileCollections'](v2Context, next);
    await actionHandlers['collections:listFileCollectionsWithPublicStorage'](v1Context, next);

    expect(v2Context.body).toEqual([
      { name: 'attachments', title: '{{t("Attachment", { ns: "file-manager" })}}' },
      { name: 'privateFiles', title: 'Private files' },
      { name: 'publicFiles', title: 'Public files' },
    ]);
    expect(v1Context.body).toEqual([{ name: 'publicFiles', title: 'Public files' }]);
  });
});
