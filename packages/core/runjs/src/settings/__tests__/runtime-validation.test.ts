/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  formatRunJSSettingsDotPath,
  formatRunJSSettingsJsonPath,
  normalizeRunJSSettingsSchemaType,
  normalizeRunJSSettingsValue,
  validateRunJSSettings,
  validateRunJSSettingsValue,
} from '../runtime-validation';

describe('RunJS runtime settings validation', () => {
  it('deeply applies and merges defaults without mutating the schema or submitted value', () => {
    const schema = {
      type: 'object',
      default: {
        display: { color: 'red' },
      },
      properties: {
        display: {
          type: 'object',
          default: { density: 'compact' },
          properties: {
            color: { type: 'string', default: 'blue' },
            density: { type: 'string' },
            pageSize: { type: 'integer', default: 20 },
          },
        },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean', default: true },
              title: { type: 'string' },
            },
          },
        },
      },
    };
    const settings = {
      display: { density: 'comfortable' },
      rows: [{ title: 'Revenue' }],
    };

    const normalized = normalizeRunJSSettingsValue(schema, settings);

    expect(normalized).toEqual({
      display: { color: 'red', density: 'comfortable', pageSize: 20 },
      rows: [{ enabled: true, title: 'Revenue' }],
    });
    expect(settings).toEqual({ display: { density: 'comfortable' }, rows: [{ title: 'Revenue' }] });
    expect(schema.default).toEqual({ display: { color: 'red' } });
  });

  it('applies array item property defaults to an explicit array default', () => {
    const schema = {
      type: 'array',
      default: [{}],
      items: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', default: true },
        },
      },
    };

    expect(normalizeRunJSSettingsValue(schema, undefined)).toEqual([{ enabled: true }]);
  });

  it('keeps binding required fields pending and rejects them only in runtime mode', () => {
    const schema = {
      type: 'object',
      required: ['title', 'options'],
      properties: {
        title: { type: 'string' },
        options: {
          type: 'object',
          required: ['limit', 'density'],
          properties: {
            limit: { type: 'integer' },
            density: { type: 'string', default: 'compact' },
          },
        },
      },
    };

    const binding = validateRunJSSettings({ mode: 'binding', schema, settings: { options: {} } });
    const runtime = validateRunJSSettings({ mode: 'runtime', schema, settings: { options: {} } });

    expect(binding.issues).toEqual([]);
    expect(binding.missingRequiredPaths).toEqual([['title'], ['options', 'limit']]);
    expect(binding.normalizedValue).toEqual({ options: { density: 'compact' } });
    expect(runtime.issues).toEqual([
      { code: 'required', path: ['title'] },
      { code: 'required', path: ['options', 'limit'] },
    ]);
    expect(runtime.missingRequiredPaths).toEqual(binding.missingRequiredPaths);
  });

  it.each([
    ['string', 'value', 1],
    ['number', 1.5, '1.5'],
    ['integer', 2, 2.5],
    ['boolean', false, 0],
    ['object', {}, []],
    ['array', [1], { 0: 1 }],
  ])('validates the %s type', (type, validValue, invalidValue) => {
    const valid = validateRunJSSettingsValue({ mode: 'runtime', required: true, schema: { type }, value: validValue });
    const invalid = validateRunJSSettingsValue({
      mode: 'runtime',
      path: ['value'],
      required: true,
      schema: { type },
      value: invalidValue,
    });

    expect(valid.issues).toEqual([]);
    expect(invalid.issues).toEqual([
      expect.objectContaining({
        code: 'type',
        path: ['value'],
        details: expect.objectContaining({ expectedType: type }),
      }),
    ]);
  });

  it('rejects non-finite numbers and accepts explicit nullable schema types', () => {
    expect(validateRunJSSettingsValue({ mode: 'runtime', schema: { type: 'number' }, value: Infinity }).issues).toEqual(
      [expect.objectContaining({ code: 'type', details: { actualType: 'number', expectedType: 'number' } })],
    );
    expect(
      validateRunJSSettingsValue({ mode: 'runtime', schema: { type: ['string', 'null'] }, value: null }).issues,
    ).toEqual([]);
    expect(normalizeRunJSSettingsSchemaType({ type: ['null', 'string'] })).toBe('string');
    expect(normalizeRunJSSettingsSchemaType({ properties: {} })).toBe('object');
    expect(normalizeRunJSSettingsSchemaType({ items: {} })).toBe('array');
  });

  it.each([
    [{ type: 'string', enum: ['APAC', 'EMEA'] }, 'NA', 'enum', undefined],
    [{ type: 'string', minLength: 3 }, 'ab', 'minLength', 3],
    [{ type: 'string', maxLength: 3 }, 'abcd', 'maxLength', 3],
    [{ type: 'number', minimum: 1 }, 0, 'minimum', 1],
    [{ type: 'number', maximum: 10 }, 11, 'maximum', 10],
  ])('returns a granular constraint issue for %j', (schema, value, code, limit) => {
    const result = validateRunJSSettingsValue({ mode: 'runtime', path: ['field'], schema, value });

    expect(result.issues).toEqual([
      {
        code,
        path: ['field'],
        ...(typeof limit === 'number' ? { details: { limit } } : {}),
      },
    ]);
  });

  it.each([
    ['date', '2026-08-09', '09/08/2026'],
    ['date-time', '2026-08-09T12:30:00.000Z', 'not-a-date-time'],
    ['email', 'team@nocobase.com', 'team-at-nocobase'],
    ['time', '23:59:59.123', '24:00'],
    ['uri', 'https://www.nocobase.com/docs', 'not a uri'],
    ['url', 'https://www.nocobase.com/docs', '/relative-only'],
  ])('validates the %s format', (format, validValue, invalidValue) => {
    const schema = { type: 'string', format };

    expect(validateRunJSSettingsValue({ mode: 'runtime', schema, value: validValue }).issues).toEqual([]);
    expect(
      validateRunJSSettingsValue({ mode: 'runtime', path: ['field'], schema, value: invalidValue }).issues,
    ).toEqual([{ code: 'format', details: { format }, path: ['field'] }]);
  });

  it('validates enum objects independently of object key order', () => {
    const schema = {
      type: 'object',
      enum: [{ alpha: 1, nested: { beta: true } }],
      properties: {
        alpha: { type: 'number' },
        nested: { type: 'object', properties: { beta: { type: 'boolean' } } },
      },
    };

    expect(
      validateRunJSSettingsValue({
        mode: 'runtime',
        schema,
        value: { nested: { beta: true }, alpha: 1 },
      }).issues,
    ).toEqual([]);
  });

  it('uses neutral nested path segments and preserves legacy dot and JSON path formatting', () => {
    const schema = {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: { count: { type: 'integer', minimum: 1 } },
          },
        },
      },
    };
    const result = validateRunJSSettings({ mode: 'runtime', schema, settings: { rows: [{ count: 0, extra: true }] } });

    expect(result.issues).toEqual([
      { code: 'unknownProperty', path: ['rows', 0, 'extra'] },
      { code: 'minimum', details: { limit: 1 }, path: ['rows', 0, 'count'] },
    ]);
    expect(formatRunJSSettingsDotPath(result.issues[0].path)).toBe('rows.0.extra');
    expect(formatRunJSSettingsJsonPath(result.issues[0].path)).toBe('$.rows[0].extra');
    expect(formatRunJSSettingsDotPath([])).toBe('');
    expect(formatRunJSSettingsJsonPath([])).toBe('$');
  });

  it('reports unknown fields before child validation issues and stops after the first scalar issue', () => {
    const result = validateRunJSSettings({
      mode: 'runtime',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 3 },
        },
      },
      settings: { extra: true, title: 2 },
    });

    expect(result.issues).toEqual([
      { code: 'unknownProperty', path: ['extra'] },
      expect.objectContaining({ code: 'type', path: ['title'] }),
    ]);
  });

  it.each([
    ['a missing schema', null],
    ['an empty schema', {}],
    ['an object schema without properties', { type: 'object' }],
  ])('keeps root settings closed with %s', (_label, schema) => {
    expect(validateRunJSSettings({ mode: 'runtime', schema, settings: { extra: true } }).issues).toEqual([
      { code: 'unknownProperty', path: ['extra'] },
    ]);
  });

  it('handles prototype-sensitive properties as own data without changing any prototype', () => {
    const schema = JSON.parse(`{
      "type":"object",
      "required":["__proto__","constructor","prototype"],
      "properties":{
        "__proto__":{"type":"object","default":{"polluted":false},"properties":{"polluted":{"type":"boolean"}}},
        "constructor":{"type":"string","default":"safe"},
        "prototype":{"type":"boolean","default":false}
      }
    }`) as Record<string, unknown>;
    const normalized = normalizeRunJSSettingsValue(schema, undefined) as Record<string, unknown>;
    const result = validateRunJSSettings({ mode: 'runtime', schema, settings: normalized });

    expect(result.issues).toEqual([]);
    expect(Object.keys(normalized)).toEqual(['__proto__', 'constructor', 'prototype']);
    expect(Object.prototype.hasOwnProperty.call(normalized, '__proto__')).toBe(true);
    expect(normalized.__proto__).toEqual({ polluted: false });
    expect(normalized.constructor).toBe('safe');
    expect(normalized.prototype).toBe(false);
    expect(Object.getPrototypeOf(normalized)).toBe(Object.prototype);
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
  });

  it('rejects unknown prototype-sensitive properties without prototype pollution', () => {
    const settings = JSON.parse(
      '{"__proto__":{"polluted":true},"constructor":{"polluted":true},"prototype":{"polluted":true}}',
    ) as Record<string, unknown>;
    const result = validateRunJSSettings({
      mode: 'runtime',
      schema: { type: 'object', properties: {} },
      settings,
    });

    expect(result.issues).toEqual([
      { code: 'unknownProperty', path: ['__proto__'] },
      { code: 'unknownProperty', path: ['constructor'] },
      { code: 'unknownProperty', path: ['prototype'] },
    ]);
    expect(Object.getPrototypeOf(result.normalizedValue as object)).toBe(Object.prototype);
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
  });
});
