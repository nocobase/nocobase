/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ENTRY_DESCRIPTOR_MAX_BYTES, LIGHT_EXTENSION_ENTRY_SCHEMA_URL } from '../../constants';
import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension entry descriptor validator', () => {
  it('projects metadata and normalizes direct settings fields from entry.json', () => {
    const settingsSchema = {
      type: 'object',
      required: ['threshold'],
      properties: {
        threshold: {
          type: 'number',
          default: 10,
          'x-component': 'InputNumber',
        },
      },
    };
    const result = new LightExtensionValidator().validateWorkspace({
      files: entryFiles({
        schemaVersion: 1,
        key: 'sales-overview',
        title: 'Sales KPI',
        description: 'Shows sales KPIs',
        category: 'sales',
        icon: 'BarChartOutlined',
        tags: ['sales', 'kpi'],
        sort: 10,
        settings: {
          threshold: {
            ...settingsSchema.properties.threshold,
            required: true,
          },
        },
      }),
    });

    expect(result.accepted).toBe(true);
    expect(result.entries[0]).toMatchObject({
      entryName: 'sales-overview',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      descriptorPath: 'src/client/js-blocks/sales-kpi/entry.json',
      title: 'Sales KPI',
      description: 'Shows sales KPIs',
      category: 'sales',
      icon: 'BarChartOutlined',
      tags: ['sales', 'kpi'],
      sort: 10,
      settingsSchema,
    });
  });

  it('accepts legacy schema fields for existing repositories', () => {
    const settingsSchema = { type: 'object', properties: { title: { type: 'string' } } };
    const result = new LightExtensionValidator().validateWorkspace({
      files: entryFiles({
        $schema: LIGHT_EXTENSION_ENTRY_SCHEMA_URL,
        schemaVersion: 1,
        key: 'sales-kpi',
        settingsSchema,
      }),
    });

    expect(result.accepted).toBe(true);
    expect(result.entries[0].settingsSchema).toEqual(settingsSchema);
    expect(result.diagnostics).toEqual([]);
  });

  it.each([
    [{ key: 'sales-kpi' }, 'entry_descriptor_schema_version_required'],
    [{ schemaVersion: 2, key: 'sales-kpi' }, 'entry_descriptor_schema_version_unsupported'],
    [{ schemaVersion: 1 }, 'entry_descriptor_key_required'],
    [{ schemaVersion: 1, key: 'Sales KPI' }, 'entry_descriptor_field_invalid'],
    [
      { schemaVersion: 1, key: 'sales-kpi', $schema: 'https://example.com/entry.json' },
      'entry_descriptor_schema_url_unsupported',
    ],
    [{ schemaVersion: 1, key: 'sales-kpi', settings: {}, settingsSchema: {} }, 'entry_descriptor_settings_conflict'],
    [{ schemaVersion: 1, key: 'sales-kpi', unknown: true }, 'entry_descriptor_unknown_field'],
  ])('rejects invalid descriptor contract %j', (descriptor, code) => {
    const result = new LightExtensionValidator().validateWorkspace({ files: entryFiles(descriptor) });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code,
        path: 'src/client/js-blocks/sales-kpi/entry.json',
      }),
    );
  });

  it('requires entry.json and rejects old descriptor paths through workspace policy', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: [
        { path: 'src/client/js-blocks/sales-kpi/index.tsx', content: 'ctx.render(<div />);\n' },
        { path: 'src/client/js-blocks/sales-kpi/meta.json', content: '{"key":"sales-kpi"}' },
        { path: 'src/client/js-blocks/sales-kpi/settings.json', content: '{"type":"object"}' },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining(['workspace_path_not_allowed', 'entry_descriptor_missing']),
    );
  });

  it('enforces the 128 KiB descriptor limit before JSON parsing', () => {
    const result = new LightExtensionValidator({ limits: { maxJsonBytes: 256 * 1024 } }).validateWorkspace({
      files: entryFiles({
        schemaVersion: 1,
        key: 'sales-kpi',
        description: 'x'.repeat(LIGHT_EXTENSION_ENTRY_DESCRIPTOR_MAX_BYTES),
      }),
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'entry_descriptor_too_large',
        path: 'src/client/js-blocks/sales-kpi/entry.json',
      }),
    );
  });

  it('rejects descriptor imports while preserving ordinary JSON module imports', () => {
    const rejected = new LightExtensionValidator().validateWorkspace({
      files: entryFiles(
        { schemaVersion: 1, key: 'sales-kpi' },
        'import descriptor from "./entry.json";\nctx.render(descriptor.key);\n',
      ),
    });
    const accepted = new LightExtensionValidator().validateWorkspace({
      files: [
        ...entryFiles(
          { schemaVersion: 1, key: 'sales-kpi' },
          'import data from "./data.json";\nctx.render(data.title);\n',
        ),
        { path: 'src/client/js-blocks/sales-kpi/data.json', content: '{"title":"Sales"}' },
      ],
    });

    expect(rejected.accepted).toBe(false);
    expect(rejected.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'entry_descriptor_import_not_allowed' }),
    );
    expect(accepted.accepted).toBe(true);
  });

  it('validates settings field definitions in entry.json', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: entryFiles({
        schemaVersion: 1,
        key: 'sales-kpi',
        settings: {
          title: {
            type: 'string',
            'x-reactions': '{{ dangerous }}',
            'x-component': 'DangerWidget',
          },
        },
      }),
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining(['settings_schema_keyword_not_allowed', 'settings_x_component_not_allowed']),
    );
  });
});

function entryFiles(descriptor: Record<string, unknown>, code = 'ctx.render(<div />);\n') {
  const root = 'src/client/js-blocks/sales-kpi';
  return [
    { path: `${root}/index.tsx`, content: code },
    { path: `${root}/entry.json`, content: JSON.stringify(descriptor) },
  ];
}
