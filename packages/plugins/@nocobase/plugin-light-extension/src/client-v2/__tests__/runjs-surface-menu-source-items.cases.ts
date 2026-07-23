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
  kind: 'js-block',
  entryName: 'order-total',
  entryPath: 'src/client/js-blocks/order-total/index.tsx',
  title: 'Order total calculator',
  category: null,
  settingsSchema: {
    type: 'object',
    properties: {
      currency: {
        type: 'string',
        default: 'USD',
      },
    },
  },
  settingsSchemaHash: 'schema_hash',
  runtimeCodeHash: 'runtime_hash',
  settingsDefaultsHash: 'defaults_hash',
  runtimeAvailable: true,
};

const chartSelectableEntry = {
  ...selectableEntry,
  id: 'entry_order_chart',
  entryName: 'order-chart',
  entryPath: 'src/client/js-blocks/order-chart/index.tsx',
  title: 'Order chart block',
  settingsSchema: null,
  settingsSchemaHash: null,
  settingsDefaultsHash: null,
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
    expect(entryItem?.label).toBe('order-total');
    expect(entryItem?.searchText).toContain('Orders');
    expect(entryItem?.searchText).toContain('order-total');

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
        entryTitle: 'order-total',
        entryName: 'order-total',
        entryPath: 'src/client/js-blocks/order-total/index.tsx',
        kind: 'js-block',
      },
      settings: {},
      version: 'v2',
    });
    expect(selectedParams).not.toHaveProperty('settings.stale');
    await expect(
      resolver.getBindingTitle?.({
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'repo_orders',
          entryId: 'entry_order_total',
          kind: 'js-block',
        },
      }),
    ).resolves.toBe('Orders / order-total');
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
    expect(repoItem?.children?.map((item) => item.label)).toEqual(['order-total', 'order-chart']);
    expect(repoItem?.searchText).toContain('order-chart');
  });
});

function createMockApiClient(request: (options: ApiRequestOptions) => Promise<unknown>): ApiClientLike {
  return {
    request: async <TResponse>(options: ApiRequestOptions): Promise<TResponse> => {
      return (await request(options)) as TResponse;
    },
  };
}
