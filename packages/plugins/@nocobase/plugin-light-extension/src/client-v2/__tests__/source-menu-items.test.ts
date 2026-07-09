/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { createLightExtensionRunJSResolver } from '../resolvers/LightExtensionRunJSResolver';

const activePublication = {
  id: 'pub_order_total',
  repoId: 'repo_orders',
  entryId: 'entry_order_total',
  commitId: 'commit_latest',
  entryPath: 'src/client/js-blocks/order-total/index.tsx',
  target: 'client',
  kind: 'js-block',
  surfaceStyle: 'render',
  runtimeVersion: 'v2',
  artifact: {
    version: 'v2',
    entryPath: 'src/client/js-blocks/order-total/index.tsx',
  },
  settingsSchemaSnapshot: {
    type: 'object',
    properties: {
      currency: {
        type: 'string',
      },
    },
  },
  settingsDefaultsSnapshot: {
    currency: 'USD',
  },
  settingsSchemaHash: 'schema_hash',
  settingsDefaultsHash: 'defaults_hash',
  filesHash: 'files_hash',
  runtimeCodeHash: 'runtime_hash',
  diagnostics: [],
};

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
  activePublicationId: 'pub_order_total',
  activePublication,
  healthStatus: 'ready',
  diagnostics: [],
};

const chartPublication = {
  ...activePublication,
  id: 'pub_order_chart',
  entryId: 'entry_order_chart',
  entryPath: 'src/client/js-blocks/order-chart/index.tsx',
  artifact: {
    ...activePublication.artifact,
    entryPath: 'src/client/js-blocks/order-chart/index.tsx',
  },
  settingsDefaultsSnapshot: {},
  settingsDefaultsHash: 'defaults_hash_chart',
  filesHash: 'files_hash_chart',
  runtimeCodeHash: 'runtime_hash_chart',
};

const chartSelectableEntry = {
  ...selectableEntry,
  id: 'entry_order_chart',
  entryName: 'order-chart',
  entryPath: 'src/client/js-blocks/order-chart/index.tsx',
  title: 'Order chart block',
  activePublicationId: 'pub_order_chart',
  activePublication: chartPublication,
};

const selectableRepo = {
  id: 'repo_orders',
  name: 'orders',
  normalizedName: 'orders',
  title: 'Orders',
  description: null,
  version: 1,
  lifecycleStatus: 'enabled',
  healthStatus: 'ready',
  headCommitId: 'commit_latest',
};

describe('light extension source menu items', () => {
  it('shows single-entry repositories directly and writes the active publication binding', async () => {
    const api = {
      request: vi.fn(async (options: { url: string }) => {
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
      }),
    };
    const resolver = createLightExtensionRunJSResolver(api);

    const items = await resolver.listSourceMenuItems?.({
      kind: 'js-block',
      sourceMode: 'inline',
      defaultVersionPolicy: 'follow-active',
      settings: {
        stale: true,
      },
      t: (key) => key,
    });
    const lightExtensionItem = items?.[0];
    const entryItem = items?.[1];

    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'lightExtensionEntries:listSelectable',
        method: 'post',
        data: {
          kind: 'js-block',
        },
      }),
    );
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'lightExtensionRepos:list',
        method: 'post',
      }),
    );
    expect(lightExtensionItem?.label).toBe('Light extensions');
    expect(lightExtensionItem?.disabled).toBe(true);
    expect(lightExtensionItem?.children).toBeUndefined();
    expect(entryItem?.label).toBe('Orders');
    expect(entryItem?.children).toBeUndefined();
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
        publicationId: 'pub_order_total',
        versionPolicy: 'follow-active',
      },
      settings: {
        currency: 'EUR',
      },
      version: 'v2',
    });
    expect(selectedParams).not.toHaveProperty('settings.stale');
  });

  it('keeps a repository submenu when a repository has multiple entries', async () => {
    const api = {
      request: vi.fn(async (options: { url: string }) => {
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
      }),
    };
    const resolver = createLightExtensionRunJSResolver(api);

    const items = await resolver.listSourceMenuItems?.({
      kind: 'js-block',
      sourceMode: 'inline',
      defaultVersionPolicy: 'follow-active',
      t: (key) => key,
    });
    const repoItem = items?.[1];

    expect(items?.[0]?.label).toBe('Light extensions');
    expect(repoItem?.label).toBe('Orders');
    expect(repoItem?.children?.map((item) => item.label)).toEqual(['Order total calculator', 'Order chart block']);
    expect(repoItem?.searchText).toContain('Order chart block');
  });
});
