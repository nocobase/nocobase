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

const SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_sales',
  entryId: 'entry_sales',
  kind: 'js-block',
};

describe('LightExtensionRunJSResolver error state', () => {
  it('uses selectable entry metadata as the binding title', async () => {
    const api = {
      request: vi.fn(async (options: { url: string }) => ({
        data: {
          data:
            options.url === 'lightExtensionRepos:list'
              ? [{ id: 'repo_sales', name: 'sales-tools', title: 'Sales tools' }]
              : [
                  {
                    id: 'entry_sales',
                    repoId: 'repo_sales',
                    kind: 'js-block',
                    entryName: 'sales-kpi',
                    title: 'Sales KPI',
                  },
                ],
        },
      })),
    };
    const resolver = createLightExtensionRunJSResolver(api);

    await expect(
      resolver.getBindingTitle?.({
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
      }),
    ).resolves.toBe('Sales tools / sales-kpi');
    expect(api.request).toHaveBeenCalledWith({
      url: 'lightExtensionEntries:listSelectable',
      method: 'post',
      data: {
        repoId: 'repo_sales',
        kind: 'js-block',
      },
    });
  });

  it('does not revive title metadata for bindings with invalid kind values', async () => {
    const api = {
      request: vi.fn(),
    };
    const resolver = createLightExtensionRunJSResolver(api);

    await expect(
      resolver.getBindingTitle?.({
        sourceMode: 'light-extension',
        sourceBinding: {
          ...SOURCE_BINDING,
          kind: 'js-block ',
          entryTitle: 'Stale title',
          entryName: 'stale-entry',
        },
      }),
    ).resolves.toBeUndefined();
    expect(api.request).not.toHaveBeenCalled();
  });

  it('uses the documented runtime resolve route and lets request errors surface to the block runtime', async () => {
    const requestError = {
      response: {
        status: 409,
        data: {
          errors: [
            {
              code: 'LIGHT_EXTENSION_BINDING_OUTDATED',
              message: 'Binding is outdated',
            },
          ],
        },
      },
    };
    const api = {
      request: vi.fn().mockRejectedValue(requestError),
    };
    const resolver = createLightExtensionRunJSResolver(api);

    await expect(
      resolver.resolve({
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
        settings: {
          title: 'Sales',
        },
      }),
    ).rejects.toBe(requestError);
    expect(api.request).toHaveBeenCalledWith({
      url: '/light-extension-runtime/resolve',
      method: 'post',
      data: {
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
        settings: {
          title: 'Sales',
        },
      },
    });
  });

  it('returns the current entry settings descriptor for dynamic JS block settings', async () => {
    const api = {
      request: vi.fn().mockResolvedValue({
        data: {
          data: [
            {
              id: 'entry_sales',
              repoId: 'repo_sales',
              kind: 'js-block',
              entryName: 'sales-kpi',
              title: 'Sales KPI',
              settingsSchema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    title: 'Message',
                    default: 'Hello',
                  },
                },
              },
              settingsSchemaHash: 'schema_hash',
              settingsDefaultsHash: 'defaults_hash',
            },
          ],
        },
      }),
    };
    const resolver = createLightExtensionRunJSResolver(api);

    await expect(
      resolver.getSettingsDescriptor?.({
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
      }),
    ).resolves.toEqual({
      entryId: 'entry_sales',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            title: 'Message',
            default: 'Hello',
          },
        },
      },
      defaults: {
        message: 'Hello',
      },
      settingsSchemaHash: 'schema_hash',
    });
  });

  it('does not revive settings metadata for bindings with invalid kind values', async () => {
    const api = {
      request: vi.fn(),
    };
    const resolver = createLightExtensionRunJSResolver(api);

    await expect(
      resolver.getSettingsDescriptor?.({
        sourceMode: 'light-extension',
        sourceBinding: {
          ...SOURCE_BINDING,
          kind: 'js-block ',
        },
      }),
    ).resolves.toBeUndefined();
    expect(api.request).not.toHaveBeenCalled();
  });
});
