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

  it('preserves default and schema key order before submitted-only keys', () => {
    const schema = {
      type: 'object',
      default: { explicitDefault: true },
      properties: {
        schemaDefault: { type: 'string', default: 'schema' },
        display: {
          type: 'object',
          properties: {
            density: { type: 'string', default: 'compact' },
          },
        },
        submitted: { type: 'string' },
      },
    };

    const normalized = normalizeRunJSSettingsValue(schema, {
      unknown: true,
      submitted: 'value',
      schemaDefault: 'override',
      display: { unknownNested: true, density: 'comfortable' },
    }) as Record<string, unknown>;

    expect(Object.keys(normalized)).toEqual(['schemaDefault', 'display', 'explicitDefault', 'unknown', 'submitted']);
    expect(Object.keys(normalized.display as Record<string, unknown>)).toEqual(['density', 'unknownNested']);
    expect(normalized).toEqual({
      schemaDefault: 'override',
      display: { density: 'comfortable', unknownNested: true },
      explicitDefault: true,
      unknown: true,
      submitted: 'value',
    });
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

    const explicitUndefined = validateRunJSSettings({
      mode: 'binding',
      schema,
      settings: { title: undefined, options: { limit: undefined } },
    });
    expect(explicitUndefined.issues).toEqual([]);
    expect(explicitUndefined.missingRequiredPaths).toEqual([['title'], ['options', 'limit']]);
  });

  it('keeps object-level defaults effective for binding and runtime required fields', () => {
    const schema = {
      type: 'object',
      default: { options: { title: 'Default title' } },
      required: ['options'],
      properties: {
        options: {
          type: 'object',
          required: ['title'],
          properties: { title: { type: 'string' } },
        },
      },
    };

    for (const mode of ['binding', 'runtime'] as const) {
      expect(validateRunJSSettings({ mode, schema, settings: { options: {} } })).toEqual({
        issues: [],
        missingRequiredPaths: [],
        normalizedValue: { options: { title: 'Default title' } },
      });
    }
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

  it('uses stable JSON number equality for enum values, including nested signed zero', () => {
    expect(
      validateRunJSSettingsValue({ mode: 'runtime', schema: { type: 'number', enum: [0] }, value: -0 }).issues,
    ).toEqual([]);
    expect(
      validateRunJSSettingsValue({
        mode: 'runtime',
        schema: {
          type: 'object',
          enum: [{ payload: { count: 0 } }],
          properties: {
            payload: {
              type: 'object',
              properties: { count: { type: 'number' } },
            },
          },
        },
        value: { payload: { count: -0 } },
      }).issues,
    ).toEqual([]);
  });

  it('collects every applicable enum, string, and number issue', () => {
    expect(
      validateRunJSSettingsValue({
        mode: 'runtime',
        path: ['label'],
        schema: { type: 'string', enum: ['allowed@example.com'], minLength: 3, maxLength: 0, format: 'email' },
        value: 'x',
      }).issues,
    ).toEqual([
      { code: 'enum', path: ['label'] },
      { code: 'minLength', details: { limit: 3 }, path: ['label'] },
      { code: 'maxLength', details: { limit: 0 }, path: ['label'] },
      { code: 'format', details: { format: 'email' }, path: ['label'] },
    ]);
    expect(
      validateRunJSSettingsValue({
        mode: 'runtime',
        path: ['count'],
        schema: { type: 'number', enum: [1], minimum: 10, maximum: -1 },
        value: 0,
      }).issues,
    ).toEqual([
      { code: 'enum', path: ['count'] },
      { code: 'minimum', details: { limit: 10 }, path: ['count'] },
      { code: 'maximum', details: { limit: -1 }, path: ['count'] },
    ]);
  });

  it('can preserve the client first-issue short circuit without changing server collection', () => {
    expect(
      validateRunJSSettingsValue({
        mode: 'runtime',
        path: ['label'],
        scalarIssueMode: 'first',
        schema: { type: 'string', enum: ['allowed@example.com'], minLength: 3, format: 'email' },
        value: 'x',
      }).issues,
    ).toEqual([{ code: 'enum', path: ['label'] }]);
    expect(
      validateRunJSSettingsValue({
        mode: 'runtime',
        path: ['options'],
        scalarIssueMode: 'first',
        schema: {
          type: 'object',
          enum: [{ enabled: true }],
          properties: { enabled: { type: 'boolean' } },
        },
        value: { enabled: 'invalid' },
      }).issues,
    ).toEqual([{ code: 'enum', path: ['options'] }]);
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

  it('preserves the existing server and client object issue traversal orders', () => {
    const schema = {
      type: 'object',
      required: ['requiredTitle'],
      properties: {
        requiredTitle: { type: 'string' },
        title: { type: 'string', enum: ['valid@example.com'], minLength: 3, format: 'email' },
      },
    };
    const settings = { extra: true, title: 'x' };
    const server = validateRunJSSettings({ mode: 'runtime', schema, settings });

    expect(server.issues).toEqual([
      { code: 'required', path: ['requiredTitle'] },
      { code: 'unknownProperty', path: ['extra'] },
      { code: 'enum', path: ['title'] },
      { code: 'minLength', details: { limit: 3 }, path: ['title'] },
      { code: 'format', details: { format: 'email' }, path: ['title'] },
    ]);
    expect(server.missingRequiredPaths).toEqual([['requiredTitle']]);

    const client = validateRunJSSettings({ mode: 'runtime', objectIssueOrder: 'client', schema, settings });
    expect(client.issues).toEqual([
      { code: 'unknownProperty', path: ['extra'] },
      { code: 'required', path: ['requiredTitle'] },
      { code: 'enum', path: ['title'] },
      { code: 'minLength', details: { limit: 3 }, path: ['title'] },
      { code: 'format', details: { format: 'email' }, path: ['title'] },
    ]);
    expect(client.missingRequiredPaths).toEqual([['requiredTitle']]);
  });

  it('treats untyped structured enums as opaque JSON values', () => {
    const schema = { enum: [{ size: 'small', columns: [1, 2] }] };
    expect(
      validateRunJSSettingsValue({ mode: 'runtime', schema, value: { columns: [1, 2], size: 'small' } }).issues,
    ).toEqual([]);
    expect(
      validateRunJSSettingsValue({ mode: 'runtime', schema, value: { columns: [2, 1], size: 'small' } }).issues,
    ).toEqual([{ code: 'enum', path: [] }]);
  });

  it('traverses untyped nested object values as closed object schemas', () => {
    expect(
      validateRunJSSettings({
        mode: 'runtime',
        schema: { properties: { payload: {} } },
        settings: { payload: { extra: true } },
      }).issues,
    ).toEqual([{ code: 'unknownProperty', path: ['payload', 'extra'] }]);
  });

  it('does not treat non-record property schemas as known properties', () => {
    expect(
      validateRunJSSettings({
        mode: 'runtime',
        schema: { type: 'object', properties: { payload: null } },
        settings: { payload: { extra: true } },
      }).issues,
    ).toEqual([{ code: 'unknownProperty', path: ['payload'] }]);
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

  it('keeps the settings facade object-rooted while value validation remains generic', () => {
    expect(validateRunJSSettingsValue({ mode: 'runtime', schema: { type: 'string' }, value: 'valid' }).issues).toEqual(
      [],
    );
    expect(validateRunJSSettings({ mode: 'runtime', schema: { type: 'string' }, settings: 'valid' })).toEqual({
      issues: [
        {
          code: 'type',
          path: [],
          details: { actualType: 'string', expectedType: 'object' },
        },
      ],
      missingRequiredPaths: [],
      normalizedValue: 'valid',
    });
    expect(
      validateRunJSSettings({ mode: 'runtime', schema: { type: 'array', items: {} }, settings: [] }).issues,
    ).toEqual([
      expect.objectContaining({ code: 'type', path: [], details: { actualType: 'array', expectedType: 'object' } }),
    ]);
    expect(
      validateRunJSSettings({ mode: 'runtime', schema: { type: ['object', 'null'] }, settings: null }).issues,
    ).toEqual([
      expect.objectContaining({ code: 'type', path: [], details: { actualType: 'null', expectedType: 'object' } }),
    ]);

    const binding = validateRunJSSettings({ mode: 'binding', schema: { type: 'object' }, settings: undefined });
    const runtime = validateRunJSSettings({ mode: 'runtime', schema: { type: 'object' }, settings: undefined });
    expect(binding).toEqual({ issues: [], missingRequiredPaths: [[]], normalizedValue: undefined });
    expect(runtime).toEqual({
      issues: [{ code: 'required', path: [] }],
      missingRequiredPaths: [[]],
      normalizedValue: undefined,
    });
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
