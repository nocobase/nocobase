/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import {
  getSchemaTitle,
  getSettingsSchemaProperties,
  getSettingsSchemaRequired,
  isSettingValueValid,
  normalizeSchemaType,
  validateRunJSSettings,
  validateRunJSSettingValue,
} from '../runtimeSettingsValidation';

describe('runtimeSettingsValidation client adapter', () => {
  it('preserves client issue categories, dotted paths, and traversal order', () => {
    const result = validateRunJSSettings({
      mode: 'runtime',
      schema: {
        type: 'object',
        required: ['title', 'options'],
        properties: {
          title: { type: 'string' },
          count: { type: 'integer', minimum: 1 },
          integerValue: { type: 'integer' },
          mode: { type: 'string', enum: ['compact'] },
          email: { type: 'string', format: 'email' },
          options: {
            type: 'object',
            required: ['enabled'],
            properties: {
              enabled: { type: 'boolean' },
              rows: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string', maxLength: 3 },
                  },
                },
              },
            },
          },
        },
      },
      settings: {
        count: 0,
        integerValue: 1.5,
        mode: 'wide',
        email: 'not-an-email',
        options: {
          rows: [{ label: 'long', extra: true }],
          extraOption: true,
        },
        extraRoot: true,
      },
    });

    expect(result).toEqual({
      errors: [
        { code: 'unknown', path: 'extraRoot' },
        { code: 'required', path: 'title' },
        { code: 'constraint', path: 'count' },
        { code: 'type', path: 'integerValue' },
        { code: 'enum', path: 'mode' },
        { code: 'constraint', path: 'email' },
        { code: 'unknown', path: 'options.extraOption' },
        { code: 'required', path: 'options.enabled' },
        { code: 'unknown', path: 'options.rows.0.extra' },
        { code: 'constraint', path: 'options.rows.0.label' },
      ],
      missingRequiredPaths: ['title', 'options.enabled'],
    });
  });

  it('keeps binding and runtime required/default semantics distinct', () => {
    const schema = {
      type: 'object',
      required: ['title', 'options'],
      properties: {
        title: { type: 'string', default: 'Default title' },
        options: {
          type: 'object',
          required: ['limit'],
          properties: { limit: { type: 'integer' } },
        },
      },
    };

    expect(validateRunJSSettings({ schema, settings: {}, mode: 'binding' })).toEqual({
      errors: [],
      missingRequiredPaths: ['options'],
    });
    expect(validateRunJSSettings({ schema, settings: {}, mode: 'runtime' })).toEqual({
      errors: [{ code: 'required', path: 'options' }],
      missingRequiredPaths: ['options'],
    });
    expect(validateRunJSSettings({ schema, settings: { options: {} }, mode: 'binding' })).toEqual({
      errors: [],
      missingRequiredPaths: ['options.limit'],
    });
  });

  it('maps value validation to the existing client shape', () => {
    const schema = { type: 'string', format: 'email' };

    expect(
      validateRunJSSettingValue({
        schema,
        value: 'invalid',
        required: true,
        mode: 'runtime',
        path: 'contact.email',
      }),
    ).toEqual({
      errors: [{ code: 'constraint', path: 'contact.email' }],
      missingRequiredPaths: [],
    });
    expect(isSettingValueValid(schema, 'invalid', true)).toBe(false);
    expect(isSettingValueValid(schema, 'valid@example.com', true)).toBe(true);

    expect(
      validateRunJSSettingValue({
        schema: { type: 'string', enum: ['valid@example.com'], minLength: 3, format: 'email' },
        value: 'x',
        required: true,
        mode: 'runtime',
        path: 'contact.email',
      }),
    ).toEqual({
      errors: [{ code: 'enum', path: 'contact.email' }],
      missingRequiredPaths: [],
    });
  });

  it('rejects non-object root settings with the existing root path', () => {
    expect(validateRunJSSettings({ schema: { type: 'object' }, settings: [], mode: 'runtime' })).toEqual({
      errors: [{ code: 'type', path: '' }],
      missingRequiredPaths: [],
    });
  });

  it('handles prototype-sensitive own properties without mutating object prototypes', () => {
    const settings = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(settings, '__proto__', { enumerable: true, value: { polluted: true } });
    Object.defineProperty(settings, 'constructor', { enumerable: true, value: { prototype: { polluted: true } } });
    Object.defineProperty(settings, 'prototype', { enumerable: true, value: { polluted: true } });

    expect(validateRunJSSettings({ schema: { type: 'object', properties: {} }, settings, mode: 'runtime' })).toEqual({
      errors: [
        { code: 'unknown', path: '__proto__' },
        { code: 'unknown', path: 'constructor' },
        { code: 'unknown', path: 'prototype' },
      ],
      missingRequiredPaths: [],
    });
    expect(Object.getPrototypeOf(settings)).toBeNull();
    expect(Object.prototype).not.toHaveProperty('polluted');

    const declaredSchema = JSON.parse(
      '{"type":"object","properties":{"__proto__":{"type":"string"},"constructor":{"type":"string"},"prototype":{"type":"string"}}}',
    ) as Record<string, unknown>;
    const declaredSettings = JSON.parse('{"__proto__":"safe","constructor":"safe","prototype":"safe"}') as Record<
      string,
      unknown
    >;

    expect(validateRunJSSettings({ schema: declaredSchema, settings: declaredSettings, mode: 'runtime' })).toEqual({
      errors: [],
      missingRequiredPaths: [],
    });
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  it('keeps schema helpers compatible with current callers', () => {
    const titleSchema = { type: ['null', 'string'], title: '  Display title  ' };
    const objectSchema = {
      required: ['title', 1],
      properties: { title: titleSchema, ignored: null },
    };

    expect(normalizeSchemaType(titleSchema)).toBe('string');
    expect(normalizeSchemaType(objectSchema)).toBe('object');
    expect(normalizeSchemaType({ items: {} })).toBe('array');
    expect(getSettingsSchemaProperties(objectSchema)).toEqual({ title: titleSchema });
    expect(getSettingsSchemaRequired(objectSchema)).toEqual(new Set(['title']));
    expect(getSchemaTitle(titleSchema, 'title')).toBe('Display title');
    expect(getSchemaTitle({}, 'fallback')).toBe('fallback');
  });
});
