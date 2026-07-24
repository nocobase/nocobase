/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  listSelectableLightExtensionEntries,
  type ApiClientLike,
  type ApiRequestOptions,
} from '../api/lightExtensionEntriesRequests';
import {
  invalidateLightExtensionRuntimeCache,
  registerLightExtensionRuntimeIdentity,
} from '../resolvers/LightExtensionRuntimeCacheRegistry';

describe('light extension selectable catalog cache', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('deduplicates concurrent full-catalog loads and filters the shared result locally', async () => {
    const request = vi
      .fn()
      .mockResolvedValue(resourceResponse([createEntry('entry-block'), createEntry('entry-page', 'js-page')]));
    const api = createApi(request);

    const [blocks, pages, repoEntries] = await Promise.all([
      listSelectableLightExtensionEntries(api, { kind: 'js-block' }),
      listSelectableLightExtensionEntries(api, { kind: 'js-page' }),
      listSelectableLightExtensionEntries(api, { repoId: 'repo-1' }),
    ]);

    expect(blocks.map((entry) => entry.id)).toEqual(['entry-block']);
    expect(pages.map((entry) => entry.id)).toEqual(['entry-page']);
    expect(repoEntries).toHaveLength(2);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({ url: 'lightExtensionEntries:listSelectable', method: 'post' });
  });

  it('reloads at 30 seconds when another session changes the catalog', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    let catalog = [createEntry('entry-old')];
    const request = vi.fn(async () => resourceResponse(catalog));
    const api = createApi(request);

    await expect(listSelectableLightExtensionEntries(api)).resolves.toMatchObject([{ id: 'entry-old' }]);
    catalog = [createEntry('entry-new')];
    vi.setSystemTime(29_999);
    await expect(listSelectableLightExtensionEntries(api)).resolves.toMatchObject([{ id: 'entry-old' }]);
    vi.setSystemTime(30_000);
    await expect(listSelectableLightExtensionEntries(api)).resolves.toMatchObject([{ id: 'entry-new' }]);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('reloads after identity changes and local mutations', async () => {
    const identity = { userId: 1, role: 'admin' };
    let catalog = [createEntry('entry-admin', 'js-block', { repoTitle: 'Admin repository' })];
    const request = vi.fn(async () => resourceResponse(catalog));
    const api = createApi(request);
    const dispose = registerLightExtensionRuntimeIdentity(api, () => identity);

    await expect(listSelectableLightExtensionEntries(api)).resolves.toMatchObject([{ id: 'entry-admin' }]);
    identity.role = 'member';
    catalog = [createEntry('entry-member')];
    await expect(listSelectableLightExtensionEntries(api)).resolves.toMatchObject([{ id: 'entry-member' }]);

    catalog = [createEntry('entry-created')];
    invalidateLightExtensionRuntimeCache(api, 'repo-1');
    await expect(listSelectableLightExtensionEntries(api)).resolves.toMatchObject([{ id: 'entry-created' }]);

    catalog = [];
    invalidateLightExtensionRuntimeCache(api);
    await expect(listSelectableLightExtensionEntries(api)).resolves.toEqual([]);
    expect(request).toHaveBeenCalledTimes(4);
    dispose();
  });
});

function createApi(request: (options: ApiRequestOptions) => Promise<unknown>): ApiClientLike {
  return {
    request: async <TResponse>(options: ApiRequestOptions) => (await request(options)) as TResponse,
  };
}

function createEntry(id: string, kind = 'js-block', labels: { repoName?: string; repoTitle?: string } = {}) {
  return {
    id,
    repoId: 'repo-1',
    ...labels,
    kind,
    entryName: id,
    entryPath: `src/client/${id}/index.tsx`,
    title: null,
    category: null,
    settingsSchema: null,
    settingsSchemaHash: null,
    settingsDefaultsHash: null,
    runtimeCodeHash: `runtime-${id}`,
    runtimeAvailable: true,
  };
}

function resourceResponse<T>(data: T) {
  return { data: { data } };
}
