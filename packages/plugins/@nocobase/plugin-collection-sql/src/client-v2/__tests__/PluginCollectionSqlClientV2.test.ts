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
  buildSqlFieldsFromPreview,
  getSqlPreviewInternalName,
  normalizeSqlCollectionSubmitValues,
  normalizeSqlPreviewResult,
  SqlFieldsConfigureItem,
  SqlPreviewConfigureItem,
  SqlSourceCollectionsConfigureItem,
  SqlStatementConfigureItem,
  SqlSyncFieldsDrawer,
} from '../SqlCollectionConfigure';
import PluginCollectionSqlClientV2 from '../plugin';

const manager = {
  getFieldInterface: vi.fn((name?: string) => {
    const defaults: Record<string, { type: string; uiSchema: Record<string, unknown> }> = {
      checkbox: { type: 'boolean', uiSchema: { 'x-component': 'Checkbox' } },
      datetime: { type: 'date', uiSchema: { 'x-component': 'DatePicker' } },
      id: { type: 'bigInt', uiSchema: { 'x-component': 'InputNumber' } },
      input: { type: 'string', uiSchema: { 'x-component': 'Input' } },
      integer: { type: 'integer', uiSchema: { 'x-component': 'InputNumber' } },
      number: { type: 'double', uiSchema: { 'x-component': 'InputNumber' } },
    };
    return defaults[name || ''] ? { name, default: defaults[name || ''] } : undefined;
  }),
};

describe('PluginCollectionSqlClientV2', () => {
  it('registers the SQL collection template with client-v2 configure items', async () => {
    const registerCollectionTemplate = vi.fn();
    const app = {
      pm: {
        get: vi.fn((name: string) =>
          name === '@nocobase/plugin-data-source-manager' ? { registerCollectionTemplate } : undefined,
        ),
      },
    };

    await PluginCollectionSqlClientV2.prototype.load.call({ app });

    expect(registerCollectionTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'sql',
        title: '{{t("SQL collection")}}',
        order: 40,
        color: 'yellow',
        collection: {
          options: {
            template: 'sql',
          },
          fields: [],
        },
        capabilities: {
          recordUniqueKey: true,
        },
      }),
    );

    const template = registerCollectionTemplate.mock.calls[0][0];
    expect(template.configure.items).toEqual([
      { name: 'sql', Component: SqlStatementConfigureItem, required: true },
      { name: 'sources', Component: SqlSourceCollectionsConfigureItem },
      { name: 'fields', Component: SqlFieldsConfigureItem, required: true },
      { name: 'preview', Component: SqlPreviewConfigureItem },
    ]);
    expect(template.configure.syncFields).toEqual({
      visible: true,
      Component: SqlSyncFieldsDrawer,
    });
    expect(template.configure.transformSubmitValues).toBe(normalizeSqlCollectionSubmitValues);
  });

  it('falls back to the short data source manager plugin name', async () => {
    const registerCollectionTemplate = vi.fn();
    const app = {
      pm: {
        get: vi.fn((name: string) => (name === 'data-source-manager' ? { registerCollectionTemplate } : undefined)),
      },
    };

    await PluginCollectionSqlClientV2.prototype.load.call({ app });

    expect(registerCollectionTemplate).toHaveBeenCalledTimes(1);
  });

  it('skips registration when the data source manager plugin is not loaded', async () => {
    const app = {
      pm: {
        get: vi.fn(() => undefined),
      },
    };

    await expect(PluginCollectionSqlClientV2.prototype.load.call({ app })).resolves.toBeUndefined();
  });
});

describe('normalizeSqlPreviewResult', () => {
  it('normalizes nested preview payloads and removes falsy sources', () => {
    expect(
      normalizeSqlPreviewResult({
        data: {
          data: {
            data: [{ title: 'Order' }],
            error: 'SQL failed',
            fields: {
              title: {
                type: 'string',
              },
            },
            sources: ['orders', '', 'users'],
          },
        },
      }),
    ).toEqual({
      data: [{ title: 'Order' }],
      error: 'SQL failed',
      fields: {
        title: {
          type: 'string',
        },
      },
      sources: ['orders', 'users'],
    });
  });

  it('returns empty preview values for unsupported payloads', () => {
    expect(normalizeSqlPreviewResult({ data: { data: { message: 'ignored' } } })).toEqual({
      data: [],
      fields: {},
      sources: [],
    });
  });
});

describe('buildSqlFieldsFromPreview', () => {
  it('infers interfaces from preview row values and preserves existing field configuration', () => {
    const fields = buildSqlFieldsFromPreview({
      manager,
      currentFields: [
        {
          name: 'title',
          interface: 'input',
          type: 'string',
          uiSchema: {
            title: 'Existing title',
          },
        },
      ],
      preview: {
        data: [
          {
            id: 1,
            total: 12.5,
            paid: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            title: 'Order title',
          },
        ],
        fields: {},
      },
    });

    expect(fields).toEqual([
      expect.objectContaining({ name: 'id', interface: 'id', type: 'bigInt' }),
      expect.objectContaining({ name: 'total', interface: 'number', type: 'double' }),
      expect.objectContaining({ name: 'paid', interface: 'checkbox', type: 'boolean' }),
      expect.objectContaining({ name: 'createdAt', interface: 'datetime', type: 'date' }),
      {
        name: 'title',
        interface: 'input',
        type: 'string',
        uiSchema: {
          title: 'Existing title',
        },
      },
    ]);
  });

  it('builds fields from preview field metadata when no preview rows are available', () => {
    expect(
      buildSqlFieldsFromPreview({
        preview: {
          fields: {
            title: {
              interface: 'input',
              source: ['orders', 'title'],
              type: 'string',
              uiSchema: {
                title: 'Title',
              },
            },
          },
        },
      }),
    ).toEqual([
      {
        name: 'title',
        interface: 'input',
        source: ['orders', 'title'],
        type: 'string',
        uiSchema: {
          title: 'Title',
        },
      },
    ]);
  });

  it('uses preview metadata to override inferred fields from preview rows', () => {
    expect(
      buildSqlFieldsFromPreview({
        manager,
        preview: {
          data: [
            {
              title: 'Order title',
            },
          ],
          fields: {
            title: {
              interface: 'input',
              source: 'orders.title',
              type: 'string',
              uiSchema: {
                title: 'Order title',
              },
            },
          },
        },
      }),
    ).toEqual([
      {
        name: 'title',
        interface: 'input',
        source: 'orders.title',
        type: 'string',
        uiSchema: {
          title: 'Order title',
        },
      },
    ]);
  });
});

describe('normalizeSqlCollectionSubmitValues', () => {
  it('removes the internal preview payload and normalizes field sources', () => {
    expect(
      normalizeSqlCollectionSubmitValues({
        name: 'orders_view',
        [getSqlPreviewInternalName()]: { data: [] },
        fields: [
          { name: 'title', source: ['orders', 'title'] },
          { name: 'status', source: ['orders', '', 'status'] },
          { name: 'total', source: [] },
        ],
      }),
    ).toEqual({
      name: 'orders_view',
      fields: [
        { name: 'title', source: 'orders.title' },
        { name: 'status', source: 'orders.status' },
        { name: 'total', source: null },
      ],
    });
  });
});
