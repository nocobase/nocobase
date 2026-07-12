/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import type { ApiClientLike, ApiRequestOptions } from '../api/lightExtensionEntriesRequests';
import { createLightExtensionRunJSResolver } from '../resolvers/LightExtensionRunJSResolver';

const selectableEntry = {
  id: 'entry_order_total',
  repoId: 'repo_orders',
  target: 'client',
  kind: 'js-block',
  entryName: 'order-total',
  entryPath: 'src/client/js-blocks/order-total/index.tsx',
  metaPath: null,
  settingsPath: null,
  title: 'Order total calculator',
  description: null,
  category: null,
  icon: null,
  tags: null,
  sort: null,
  settingsSchema: {
    type: 'object',
    properties: {
      currency: {
        type: 'string',
        default: 'USD',
      },
    },
  },
  compiledCommitId: 'commit_latest',
  runtimeArtifact: {
    code: 'ctx.render("orders");',
    version: 'v2',
    entryPath: 'src/client/js-blocks/order-total/index.tsx',
  },
  runtimeVersion: 'v2',
  surfaceStyle: 'render',
  runtimeCodeHash: 'runtime_hash',
  filesHash: 'files_hash',
  settingsDefaultsHash: 'defaults_hash',
  compiledAt: '2026-07-09T00:00:00.000Z',
  healthStatus: 'ready',
  diagnostics: [],
};

const chartSelectableEntry = {
  ...selectableEntry,
  id: 'entry_order_chart',
  entryName: 'order-chart',
  entryPath: 'src/client/js-blocks/order-chart/index.tsx',
  title: 'Order chart block',
  runtimeArtifact: {
    ...selectableEntry.runtimeArtifact,
    entryPath: 'src/client/js-blocks/order-chart/index.tsx',
  },
  settingsSchema: null,
  settingsDefaultsHash: 'defaults_hash_chart',
  filesHash: 'files_hash_chart',
  runtimeCodeHash: 'runtime_hash_chart',
};

const selectableRepo = {
  id: 'repo_orders',
  name: 'orders',
  normalizedName: 'orders',
  title: 'Orders',
  description: null,
  lifecycleStatus: 'enabled',
  healthStatus: 'ready',
  headCommitId: 'commit_latest',
};

describe('light extension source menu items', () => {
  it('groups single-entry repositories before writing the current runtime binding', async () => {
    const request = vi.fn(async (options: ApiRequestOptions) => {
      if (options.url === 'lightExtensionRepos:list') {
        return {
          data: {
            data: [selectableRepo],
          },
        };
      }

      return {
        data: {
          data: [selectableEntry],
        },
      };
    });
    const api = createMockApiClient(request);
    const resolver = createLightExtensionRunJSResolver(api);

    const items = await resolver.listSourceMenuItems?.({
      kind: 'js-block',
      sourceMode: 'inline',
      settings: {
        stale: true,
      },
      t: (key) => key,
    });
    const lightExtensionItem = items?.[0];
    const repoItem = items?.[1];
    const entryItem = repoItem?.children?.[0];

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'lightExtensionEntries:listSelectable',
        method: 'post',
        data: {
          kind: 'js-block',
        },
      }),
    );
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'lightExtensionRepos:list',
        method: 'post',
      }),
    );
    expect(lightExtensionItem?.label).toBe('Light extensions');
    expect(lightExtensionItem?.disabled).toBe(true);
    expect(lightExtensionItem?.children).toBeUndefined();
    expect(repoItem?.label).toBe('Orders');
    expect(repoItem?.children).toHaveLength(1);
    expect(entryItem?.label).toBe('Order total calculator');
    expect(entryItem?.searchText).toContain('Orders');
    expect(entryItem?.searchText).toContain('Order total calculator');

    const selectedParams = await entryItem?.onSelect?.({
      kind: 'js-block',
      sourceMode: 'inline',
      params: {
        settings: {
          stale: true,
          currency: 'EUR',
        },
      },
      defaultParams: {
        version: 'v2',
      },
    });

    expect(selectedParams).toMatchObject({
      sourceMode: 'light-extension',
      sourceBinding: {
        repoId: 'repo_orders',
        repoTitle: 'Orders',
        entryId: 'entry_order_total',
        entryTitle: 'Order total calculator',
        entryName: 'order-total',
        entryPath: 'src/client/js-blocks/order-total/index.tsx',
        kind: 'js-block',
      },
      settings: {
        currency: 'EUR',
      },
      version: 'v2',
    });
    expect(selectedParams).not.toHaveProperty('settings.stale');
  });

  it('keeps a repository submenu when a repository has multiple entries', async () => {
    const request = vi.fn(async (options: ApiRequestOptions) => {
      if (options.url === 'lightExtensionRepos:list') {
        return {
          data: {
            data: [selectableRepo],
          },
        };
      }

      return {
        data: {
          data: [selectableEntry, chartSelectableEntry],
        },
      };
    });
    const api = createMockApiClient(request);
    const resolver = createLightExtensionRunJSResolver(api);

    const items = await resolver.listSourceMenuItems?.({
      kind: 'js-block',
      sourceMode: 'inline',
      t: (key) => key,
    });
    const repoItem = items?.[1];

    expect(items?.[0]?.label).toBe('Light extensions');
    expect(repoItem?.label).toBe('Orders');
    expect(repoItem?.children?.map((item) => item.label)).toEqual(['Order total calculator', 'Order chart block']);
    expect(repoItem?.searchText).toContain('Order chart block');
  });
});

function createMockApiClient(request: (options: ApiRequestOptions) => Promise<unknown>): ApiClientLike {
  return {
    request: async <TResponse>(options: ApiRequestOptions): Promise<TResponse> => {
      return (await request(options)) as TResponse;
    },
  };
}
