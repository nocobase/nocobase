/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingsResolverService } from '../services/SettingsResolverService';

describe('SettingsResolverService', () => {
  const service = new SettingsResolverService();

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
        code: 'LIGHT_EXTENSION_SETTINGS_INVALID',
        status: 422,
        details: {
          reasonCode: 'settings_invalid',
          entryId: 'entry_1',
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
        code: 'LIGHT_EXTENSION_SETTINGS_INVALID',
        details: {
          reasonCode: 'settings_invalid',
          entryId: 'entry_1',
          settingsDefaultsHash: 'defaults_1',
          issues: [expect.objectContaining({ path: '$.unexpected', code: 'settings_unknown_property' })],
        },
      }),
    );
  });

  it('rejects unsafe keys without polluting the object prototype', () => {
    const settings = JSON.parse('{"__proto__":{"inheritedSetting":"attacker"}}') as Record<string, unknown>;

    expect(() =>
      service.resolveRuntimeSettings(createSource({ type: 'object', properties: {} }), settings),
    ).toThrowError(
      expect.objectContaining({
        details: expect.objectContaining({
          issues: [expect.objectContaining({ path: '$.__proto__', code: 'settings_unknown_property' })],
        }),
      }),
    );
    expect(({} as { inheritedSetting?: unknown }).inheritedSetting).toBeUndefined();
  });

  it.each([
    ['minimum', { count: -1 }, '$.count', 'settings_minimum'],
    ['maximum', { count: 11 }, '$.count', 'settings_maximum'],
    ['enum', { region: 'NA' }, '$.region', 'settings_enum_mismatch'],
    ['format', { email: 'invalid' }, '$.email', 'settings_format'],
    ['unknown property', { extra: true }, '$.extra', 'settings_unknown_property'],
  ])('validates %s constraints', (_label, settings, path, code) => {
    const source = createSource({
      type: 'object',
      properties: {
        count: { type: 'number', minimum: 0, maximum: 10 },
        region: { type: 'string', enum: ['APAC', 'EMEA'] },
        email: { type: 'string', format: 'email' },
      },
    });

    expect(() => service.resolveRuntimeSettings(source, settings)).toThrowError(
      expect.objectContaining({
        status: 422,
        details: expect.objectContaining({
          issues: expect.arrayContaining([expect.objectContaining({ path, code })]),
        }),
      }),
    );
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

function createSource(settingsSchema: Record<string, unknown> | null) {
  return {
    id: 'entry_1',
    settingsSchema,
    settingsDefaultsHash: 'defaults_1',
  };
}
