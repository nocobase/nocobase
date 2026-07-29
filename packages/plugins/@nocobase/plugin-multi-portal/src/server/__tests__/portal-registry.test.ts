/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application, ExposedPortalRegistryItem } from '@nocobase/server';
import type { ResourcerActionContext } from '@nocobase/resourcer';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createPortalRegistryActionHandlers } from '../portal-registry';

describe('Portal Registry actions', () => {
  let root: string;
  let item: ExposedPortalRegistryItem;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'nocobase-multi-portal-registry-'));
    const filePath = path.join(root, 'example.json');
    await writeFile(filePath, JSON.stringify({ name: 'example', type: 'registry:block', files: [] }), 'utf8');
    item = {
      name: 'example',
      type: 'registry:block',
      title: 'Example',
      file: 'example.json',
      digest: `sha256:${'a'.repeat(64)}`,
      packageName: '@nocobase/plugin-example',
      packageVersion: '2.2.0-test.1',
      filePath,
      targets: [],
    };
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  function createContext(name?: string, ifNoneMatch = '') {
    return {
      action: { params: { name } },
      body: undefined,
      get: vi.fn((header: string) => (header === 'If-None-Match' ? ifNoneMatch : '')),
      set: vi.fn(),
      throw: vi.fn((status: number, message: string) => {
        throw Object.assign(new Error(message), { status });
      }),
    } as unknown as ResourcerActionContext;
  }

  it('serves raw Registry documents with cache validation', async () => {
    const collectItems = vi.fn(async () => new Map([[item.name, item]]));
    const handlers = createPortalRegistryActionHandlers({} as Application, collectItems);
    const listContext = createContext();
    const listNext = vi.fn();

    await handlers.list(listContext, listNext);

    expect(listContext.withoutDataWrapping).toBe(true);
    expect(listContext.type).toBe('application/json');
    expect(listContext.body).toMatchObject({
      name: 'nocobase',
      items: [
        {
          name: 'example',
          packageName: '@nocobase/plugin-example',
          packageVersion: '2.2.0-test.1',
          targets: [],
        },
      ],
    });
    expect(listContext.body.items[0]).not.toHaveProperty('filePath');
    expect(listNext).toHaveBeenCalledOnce();

    const itemContext = createContext('example');
    const itemNext = vi.fn();
    await handlers.get(itemContext, itemNext);

    expect(itemContext.withoutDataWrapping).toBe(true);
    expect(itemContext.body).toEqual({ name: 'example', type: 'registry:block', files: [] });
    expect(itemContext.set).toHaveBeenCalledWith('ETag', `"${item.digest}"`);
    expect(itemNext).toHaveBeenCalledOnce();

    const etag = `"${item.digest}"`;
    const cachedContext = createContext('example', etag);

    await handlers.get(cachedContext, vi.fn());

    expect(cachedContext.status).toBe(304);
    expect(cachedContext.body).toBeUndefined();
    expect(collectItems).toHaveBeenCalledOnce();
  });

  it('rejects invalid and missing Registry item names', async () => {
    const invalidContext = createContext('../example');
    const missingContext = createContext('missing');

    const handlers = createPortalRegistryActionHandlers({} as Application, async () => new Map([[item.name, item]]));
    await expect(handlers.get(invalidContext, vi.fn())).rejects.toMatchObject({ status: 400 });
    await expect(handlers.get(missingContext, vi.fn())).rejects.toMatchObject({ status: 404 });
  });

  it('serves a virtual all item for every enabled Registry item', async () => {
    const second = { ...item, name: 'second', digest: `sha256:${'b'.repeat(64)}` };
    const handlers = createPortalRegistryActionHandlers(
      {} as Application,
      async () =>
        new Map([
          [second.name, second],
          [item.name, item],
        ]),
    );
    const context = createContext('all');

    await handlers.get(context, vi.fn());

    expect(context.body).toEqual({
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      name: 'all',
      type: 'registry:lib',
      title: 'All enabled NocoBase Portal Registries',
      registryDependencies: ['@nocobase/example', '@nocobase/second'],
      files: [],
    });
    expect(context.set).toHaveBeenCalledWith('ETag', expect.stringMatching(/^"sha256:[a-f0-9]{64}"$/));
  });
});
