/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension settings validator', () => {
  it('accepts the supported JSON schema subset and exposes the same subset through capabilities', () => {
    const validator = new LightExtensionValidator();
    const schema = {
      type: 'object',
      required: ['threshold'],
      properties: {
        threshold: {
          type: 'number',
          title: 'Threshold',
          default: 10,
          minimum: 0,
          maximum: 100,
          'x-component': 'InputNumber',
        },
        enabled: {
          type: 'boolean',
          default: true,
          'x-component': 'Switch',
        },
      },
    };

    const result = validator.validateWorkspace({
      files: validEntryFiles({
        'settings.json': JSON.stringify(schema),
      }),
    });

    expect(result.accepted).toBe(true);
    expect(result.entries[0].settingsSchema).toMatchObject(schema);
    expect(result.capabilities.schemaSubset.allowedKeywords).toContain('x-component');
    expect(result.capabilities.xComponentWhitelist).toContain('InputNumber');
    expect(result.capabilities.writePolicy).toMatchObject({
      validateFinalWorkspaceOnPush: true,
      allowDeleteExistingInvalidPaths: true,
    });
  });

  it('rejects unsupported settings keywords, components, and expression strings', () => {
    const validator = new LightExtensionValidator();
    const result = validator.validateWorkspace({
      files: validEntryFiles({
        'settings.json': JSON.stringify({
          type: 'object',
          'x-reactions': '{{ dangerous }}',
          properties: {
            title: {
              type: 'string',
              'x-component': 'DangerWidget',
              default: {
                label: '{{ ctx.secrets }}',
              },
              enum: [
                'safe',
                {
                  label: '{{ enum.secrets }}',
                },
              ],
              'x-component-props': {
                addonBefore: '{{ props.secrets }}',
              },
            },
          },
        }),
      }),
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'settings_schema_keyword_not_allowed',
        'settings_x_component_not_allowed',
        'settings_expression_not_allowed',
      ]),
    );
    expect(new Set(result.diagnostics.map((item) => item.path))).toContain(
      'src/client/js-blocks/sales-kpi/settings.json',
    );
  });

  it('keeps expression diagnostics for each schema path', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: validEntryFiles({
        'settings.json': JSON.stringify({
          type: 'object',
          properties: {
            alpha: {
              type: 'string',
              default: '{{ alpha.secret }}',
            },
            beta: {
              type: 'string',
              default: '{{ beta.secret }}',
            },
          },
        }),
      }),
    });

    const expressionPaths = result.diagnostics
      .filter((item) => item.code === 'settings_expression_not_allowed')
      .map((item) => item.details?.schemaPath);

    expect(result.accepted).toBe(false);
    expect(expressionPaths).toEqual(
      expect.arrayContaining(['$.properties.alpha.default', '$.properties.beta.default']),
    );
  });

  it('does not add schema-shape noise after settings JSON parse failure', () => {
    const result = new LightExtensionValidator().validateWorkspace({
      files: validEntryFiles({
        'settings.json': '{',
      }),
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.filter((item) => item.code === 'settings_json_invalid')).toHaveLength(1);
    expect(result.diagnostics.filter((item) => item.code === 'settings_schema_invalid')).toHaveLength(0);
  });
});

function validEntryFiles(overrides: Record<string, string> = {}) {
  const root = 'src/client/js-blocks/sales-kpi';
  return [
    {
      path: `${root}/index.tsx`,
      content: overrides['index.tsx'] || 'export default function SalesKpi() { return null; }\n',
    },
    {
      path: `${root}/settings.json`,
      content:
        overrides['settings.json'] ||
        JSON.stringify({
          type: 'object',
          properties: {},
        }),
    },
  ];
}
