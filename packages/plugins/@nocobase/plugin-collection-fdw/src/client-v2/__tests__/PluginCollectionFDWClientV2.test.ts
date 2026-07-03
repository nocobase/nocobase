/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  FdwFieldsConfigureItem,
  FdwPreviewConfigureItem,
  FdwRemoteServerConfigureItem,
  FdwRemoteTableConfigureItem,
  normalizeFdwCollectionSubmitValues,
} from '../FdwCollectionConfigure';
import PluginCollectionFDWClientV2, {
  PluginCollectionFDWClientV2 as NamedPluginCollectionFDWClientV2,
} from '../plugin';

describe('PluginCollectionFDWClientV2', () => {
  it('registers the foreign collection template with client-v2 configuration items', async () => {
    const registerCollectionTemplate = vi.fn();
    const app = {
      pm: {
        get: vi.fn((name: string) =>
          name === '@nocobase/plugin-data-source-manager' ? { registerCollectionTemplate } : undefined,
        ),
      },
    };

    await PluginCollectionFDWClientV2.prototype.load.call({ app });

    expect(registerCollectionTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'foreign',
        order: 70,
        color: 'yellow',
        collection: expect.objectContaining({
          options: expect.objectContaining({
            template: 'foreign',
            autoGenId: false,
            createdAt: false,
            updatedAt: false,
          }),
          fields: [],
        }),
        fieldInterfaces: {
          include: ['obo', 'oho', 'o2m', 'm2o', 'm2m'],
        },
        capabilities: {
          inherits: false,
        },
      }),
    );

    const template = registerCollectionTemplate.mock.calls[0][0];
    expect(template.configure.items).toEqual([
      { name: 'remoteServerName', Component: FdwRemoteServerConfigureItem, required: true },
      { name: 'remoteTableName', Component: FdwRemoteTableConfigureItem, required: true },
      { name: 'fields', Component: FdwFieldsConfigureItem, required: true },
      { name: 'preview', Component: FdwPreviewConfigureItem },
    ]);
    expect(template.configure.transformSubmitValues).toBe(normalizeFdwCollectionSubmitValues);
  });

  it('falls back to the short data source manager plugin name', async () => {
    const registerCollectionTemplate = vi.fn();
    const app = {
      pm: {
        get: vi.fn((name: string) => (name === 'data-source-manager' ? { registerCollectionTemplate } : undefined)),
      },
    };

    await PluginCollectionFDWClientV2.prototype.load.call({ app });

    expect(registerCollectionTemplate).toHaveBeenCalledTimes(1);
  });

  it('skips registration when the data source manager plugin is not loaded', async () => {
    const app = {
      pm: {
        get: vi.fn(() => undefined),
      },
    };

    await expect(PluginCollectionFDWClientV2.prototype.load.call({ app })).resolves.toBeUndefined();
  });

  it('exports the plugin class as the default client plugin', () => {
    expect(PluginCollectionFDWClientV2).toBe(NamedPluginCollectionFDWClientV2);
  });
});

describe('normalizeFdwCollectionSubmitValues', () => {
  it('removes internal unsupported fields and derives schema-qualified remote table info', () => {
    expect(
      normalizeFdwCollectionSubmitValues({
        name: 'orders',
        remoteTableName: 'public.orders',
        __fdwUnsupportedFields: [{ name: 'shape' }],
      }),
    ).toEqual({
      name: 'orders',
      remoteTableName: 'public.orders',
      remoteTableInfo: {
        schema: 'public',
        tableName: 'orders',
      },
    });
  });

  it('derives remote table info for table names without schema', () => {
    expect(
      normalizeFdwCollectionSubmitValues({
        remoteTableName: 'orders',
      }),
    ).toMatchObject({
      remoteTableInfo: {
        tableName: 'orders',
      },
    });
  });

  it('clears remote table info when the submitted table name is not a string', () => {
    expect(
      normalizeFdwCollectionSubmitValues({
        remoteTableName: null,
      }),
    ).toMatchObject({
      remoteTableInfo: undefined,
    });
  });
});
