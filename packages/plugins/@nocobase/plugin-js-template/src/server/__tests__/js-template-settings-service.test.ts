/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';

import { buildJsTemplateSettingsHashes } from '../services/JsTemplateService';
import { JsTemplateSettingsService } from '../services/JsTemplateSettingsService';

describe('JsTemplateSettingsService', () => {
  const service = new JsTemplateSettingsService();

  it('deeply merges defaults and preserves optional or hidden values', () => {
    const source = createSource({
      type: 'object',
      properties: {
        mode: { type: 'string', default: 'advanced' },
        displayOptions: {
          type: 'object',
          properties: {
            enableColor: { type: 'boolean', default: false },
            advancedColor: {
              type: 'string',
              default: '#1677ff',
              'x-visible-when': { path: 'displayOptions.enableColor', operator: '$eq', value: true },
            },
            optionalLabel: {
              type: 'string',
              'x-visible-when': { path: 'displayOptions.enableColor', operator: '$eq', value: true },
            },
          },
        },
      },
    });

    expect(
      service.resolveRuntimeSettings(source, {
        displayOptions: {
          advancedColor: '#00ff00',
          optionalLabel: 'preserved while hidden',
        },
      }),
    ).toEqual({
      mode: 'advanced',
      displayOptions: {
        enableColor: false,
        advancedColor: '#00ff00',
        optionalLabel: 'preserved while hidden',
      },
    });
  });

  it('reports nested validation failures at the field level', () => {
    const source = createSource({
      type: 'object',
      properties: {
        displayOptions: {
          type: 'object',
          properties: {
            enableColor: { type: 'boolean', default: false },
            pageSize: {
              type: 'integer',
              minimum: 1,
              'x-visible-when': { path: 'displayOptions.enableColor', operator: '$eq', value: true },
            },
          },
        },
      },
    });

    expect(() =>
      service.resolveRuntimeSettings(source, {
        displayOptions: { enableColor: false, pageSize: 0, unknown: true },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: 'JS_TEMPLATE_SETTINGS_INVALID',
        status: 422,
        details: {
          reasonCode: 'settings_invalid',
          templateId: 'jtt_1',
          settingsDefaultsHash: 'defaults_1',
          issues: expect.arrayContaining([
            expect.objectContaining({ path: '$.displayOptions.pageSize', code: 'settings_minimum' }),
            expect.objectContaining({ path: '$.displayOptions.unknown', code: 'settings_unknown_property' }),
          ]),
        },
      }),
    );
  });

  it.each([
    ['a missing schema', null],
    ['an empty schema', {}],
    ['an object schema without properties', { type: 'object' }],
  ])('rejects unknown settings with %s', (_label, settingsSchema) => {
    expect(() => service.resolveRuntimeSettings(createSource(settingsSchema), { unexpected: true })).toThrowError(
      expect.objectContaining({
        code: 'JS_TEMPLATE_SETTINGS_INVALID',
        details: {
          reasonCode: 'settings_invalid',
          templateId: 'jtt_1',
          settingsDefaultsHash: 'defaults_1',
          issues: [expect.objectContaining({ path: '$.unexpected', code: 'settings_unknown_property' })],
        },
      }),
    );
  });

  it('rejects unsafe keys at every object depth without polluting prototypes', () => {
    const settings = JSON.parse(
      '{"__proto__":{"serverSettingsPolluted":true},"constructor":{"prototype":{"serverSettingsPolluted":true}},"prototype":{"serverSettingsPolluted":true},"safe":{"__proto__":{"serverSettingsPolluted":true},"constructor":{"prototype":{"serverSettingsPolluted":true}},"prototype":{"serverSettingsPolluted":true}}}',
    ) as Record<string, unknown>;

    expect(() =>
      service.resolveRuntimeSettings(
        createSource({
          type: 'object',
          properties: {
            safe: { type: 'object', properties: {} },
          },
        }),
        settings,
      ),
    ).toThrowError(
      expect.objectContaining({
        details: expect.objectContaining({
          issues: expect.arrayContaining(
            [
              '$.__proto__',
              '$.constructor',
              '$.prototype',
              '$.safe.__proto__',
              '$.safe.constructor',
              '$.safe.prototype',
            ].map((path) => expect.objectContaining({ path, code: 'settings_unknown_property' })),
          ),
        }),
      }),
    );
    expect(({} as { serverSettingsPolluted?: unknown }).serverSettingsPolluted).toBeUndefined();
  });

  it('maps shared validation codes and paths to the existing server API issue contract', () => {
    const cases: Array<{
      label: string;
      schema: Record<string, unknown>;
      settings: Record<string, unknown>;
      issue: Record<string, unknown>;
    }> = [
      {
        label: 'required',
        schema: { type: 'object', required: ['title'], properties: { title: { type: 'string' } } },
        settings: {},
        issue: { path: '$.title', code: 'settings_required', message: 'Settings field "title" is required' },
      },
      {
        label: 'type',
        schema: { type: 'object', properties: { count: { type: 'integer' } } },
        settings: { count: 1.5 },
        issue: {
          path: '$.count',
          code: 'settings_type_mismatch',
          message: 'Expected integer settings value',
          details: { expectedType: 'integer', actualType: 'number' },
        },
      },
      {
        label: 'enum',
        schema: { type: 'object', properties: { region: { type: 'string', enum: ['APAC', 'EMEA'] } } },
        settings: { region: 'NA' },
        issue: {
          path: '$.region',
          code: 'settings_enum_mismatch',
          message: 'Settings value is not in the allowed enum',
        },
      },
      {
        label: 'format',
        schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } },
        settings: { email: 'invalid' },
        issue: {
          path: '$.email',
          code: 'settings_format',
          message: 'Settings value must match email format',
          details: { format: 'email' },
        },
      },
      {
        label: 'minimum length',
        schema: { type: 'object', properties: { title: { type: 'string', minLength: 3 } } },
        settings: { title: 'ab' },
        issue: {
          path: '$.title',
          code: 'settings_min_length',
          message: 'Settings value must contain at least 3 characters',
        },
      },
      {
        label: 'maximum length',
        schema: { type: 'object', properties: { title: { type: 'string', maxLength: 3 } } },
        settings: { title: 'abcd' },
        issue: {
          path: '$.title',
          code: 'settings_max_length',
          message: 'Settings value must contain at most 3 characters',
        },
      },
      {
        label: 'minimum',
        schema: { type: 'object', properties: { count: { type: 'number', minimum: 0 } } },
        settings: { count: -1 },
        issue: {
          path: '$.count',
          code: 'settings_minimum',
          message: 'Settings value must be greater than or equal to 0',
        },
      },
      {
        label: 'maximum',
        schema: { type: 'object', properties: { count: { type: 'number', maximum: 10 } } },
        settings: { count: 11 },
        issue: {
          path: '$.count',
          code: 'settings_maximum',
          message: 'Settings value must be less than or equal to 10',
        },
      },
      {
        label: 'unknown property',
        schema: { type: 'object', properties: {} },
        settings: { extra: true },
        issue: {
          path: '$.extra',
          code: 'settings_unknown_property',
          message: 'Settings field "extra" is not defined by the runtime settings schema',
        },
      },
      {
        label: 'array item type',
        schema: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: { type: 'object', properties: { count: { type: 'integer' } } },
            },
          },
        },
        settings: { rows: [{ count: '1' }] },
        issue: {
          path: '$.rows[0].count',
          code: 'settings_type_mismatch',
          message: 'Expected integer settings value',
          details: { expectedType: 'integer', actualType: 'string' },
        },
      },
    ];

    for (const testCase of cases) {
      expect(
        () => service.resolveRuntimeSettings(createSource(testCase.schema), testCase.settings),
        testCase.label,
      ).toThrowError(
        expect.objectContaining({
          code: 'JS_TEMPLATE_SETTINGS_INVALID',
          status: 422,
          message: 'JS Template runtime settings are invalid',
          details: {
            reasonCode: 'settings_invalid',
            templateId: 'jtt_1',
            settingsDefaultsHash: 'defaults_1',
            issues: [testCase.issue],
          },
        }),
      );
    }
  });

  it('prunes unknown stored reference settings while retaining schema fields', () => {
    const source = createSource({
      type: 'object',
      properties: {
        label: { type: 'string' },
        nested: {
          type: 'object',
          properties: { enabled: { type: 'boolean' } },
        },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: { code: { type: 'string' } },
          },
        },
      },
    });

    expect(
      service.pruneUnknownSettings(source, {
        label: 'Revenue',
        removed: true,
        nested: { enabled: true, removed: true },
        rows: [{ code: 'A', removed: true }],
      }),
    ).toEqual({
      label: 'Revenue',
      nested: { enabled: true },
      rows: [{ code: 'A' }],
    });
  });
});

describe('runtime settings defaults persistence', () => {
  it('hashes and resolves explicit empty, array, and null defaults without treating them as absent', () => {
    const settingsSchema = {
      type: 'object',
      properties: {
        emptyObject: { type: 'object', default: {} },
        emptyArray: { type: 'array', default: [] },
        nullable: { type: 'string', default: null },
        absent: { type: 'string' },
      },
    };
    const hashes = buildJsTemplateSettingsHashes(settingsSchema);
    const withoutExplicitDefaults = buildJsTemplateSettingsHashes({
      type: 'object',
      properties: {
        emptyObject: { type: 'object' },
        emptyArray: { type: 'array' },
        nullable: { type: 'string' },
        absent: { type: 'string' },
      },
    });
    const expectedDefaultsHash = createHash('sha256')
      .update('{"emptyArray":[],"emptyObject":{},"nullable":null}')
      .digest('hex');

    expect(hashes.settingsDefaultsHash).toBe(expectedDefaultsHash);
    expect(hashes.settingsDefaultsHash).not.toBe(withoutExplicitDefaults.settingsDefaultsHash);
    expect(new JsTemplateSettingsService().getRuntimeDefaults({ id: 'jtt_1', settingsSchema })).toEqual({
      emptyObject: {},
      emptyArray: [],
      nullable: null,
    });
  });

  it('deeply merges object-level defaults with property defaults for runtime and hash parity', () => {
    const settingsSchema = {
      type: 'object',
      default: {
        displayOptions: { color: 'red' },
        explicitNull: null,
      },
      properties: {
        displayOptions: {
          type: 'object',
          default: { pageSize: 20 },
          properties: {
            density: { type: 'string', default: 'compact' },
            color: { type: 'string', default: 'blue' },
          },
        },
        emptyObject: { type: 'object', default: {} },
        explicitNull: { type: ['string', 'null'], default: 'fallback' },
      },
    };
    const defaults = {
      displayOptions: { density: 'compact', color: 'red', pageSize: 20 },
      emptyObject: {},
      explicitNull: null,
    };

    expect(new JsTemplateSettingsService().getRuntimeDefaults({ id: 'jtt_1', settingsSchema })).toEqual(defaults);
    expect(buildJsTemplateSettingsHashes(settingsSchema).settingsDefaultsHash).toBe(
      createHash('sha256')
        .update(
          '{"displayOptions":{"color":"red","density":"compact","pageSize":20},"emptyObject":{},"explicitNull":null}',
        )
        .digest('hex'),
    );
  });

  it('normalizes explicit array default items before resolving and hashing defaults', () => {
    const settingsSchema = {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          default: [{}],
          items: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean', default: true },
              label: { type: 'string', default: 'Untitled' },
            },
          },
        },
      },
    };
    const defaults = { rows: [{ enabled: true, label: 'Untitled' }] };

    expect(new JsTemplateSettingsService().getRuntimeDefaults({ id: 'jtt_1', settingsSchema })).toEqual(defaults);
    expect(new JsTemplateSettingsService().resolveRuntimeSettings(createSource(settingsSchema), {})).toEqual(defaults);
    expect(buildJsTemplateSettingsHashes(settingsSchema).settingsDefaultsHash).toBe(
      createHash('sha256').update('{"rows":[{"enabled":true,"label":"Untitled"}]}').digest('hex'),
    );
  });
});

function createSource(settingsSchema: Record<string, unknown> | null) {
  return {
    id: 'jtt_1',
    settingsSchema,
    settingsDefaultsHash: 'defaults_1',
  };
}
