/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  type ApiClientLike,
  type ApiRequestOptions,
  listSelectableLightExtensionEntries,
} from '../api/lightExtensionEntriesRequests';
import {
  invalidateLightExtensionRuntimeCache,
  registerLightExtensionRuntimeIdentity,
} from '../resolvers/LightExtensionRuntimeCacheRegistry';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Consolidated from selectable-catalog-cache.test.ts.
function registerSelectableCatalogCacheTests() {
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
}
registerSelectableCatalogCacheTests();

// Consolidated from selectable-entry-summary.test.ts.
function registerSelectableEntrySummaryTests() {
  describe('light extension selectable entry summary', () => {
    it('uses the runtimeAvailable summary contract without runtime artifact payloads', async () => {
      const summary = {
        id: 'entry_1',
        repoId: 'repo_1',
        repoName: 'repo-one',
        repoTitle: 'Repository One',
        kind: 'js-block',
        entryName: 'example',
        entryPath: 'src/client/js-blocks/example/index.tsx',
        title: 'Example',
        category: 'examples',
        settingsSchema: { type: 'object', properties: { message: { type: 'string' } } },
        settingsSchemaHash: 'settings_hash',
        settingsDefaultsHash: null,
        runtimeCodeHash: 'runtime_hash',
        runtimeAvailable: true as const,
      };
      const request = vi.fn().mockResolvedValue({ data: { data: [summary] } });
      const api: ApiClientLike = {
        request: async <TResponse>(options) => (await request(options)) as TResponse,
      };

      const entries = await listSelectableLightExtensionEntries(api, { kind: 'js-block' });

      expect(entries).toEqual([summary]);
      expect(request).toHaveBeenCalledWith({
        url: 'lightExtensionEntries:listSelectable',
        method: 'post',
      });
      expect(entries[0].runtimeAvailable).toBe(true);
      expect(entries[0]).not.toHaveProperty('runtimeArtifact');
      expect(entries[0]).not.toHaveProperty('code');
      expect(entries[0]).not.toHaveProperty('sourceMap');
      expect(entries[0]).not.toHaveProperty('headCommitId');
      expect(entries[0]).not.toHaveProperty('diagnostics');
      expect(entries[0]).not.toHaveProperty('statistics');
    });
  });
}
registerSelectableEntrySummaryTests();
