/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { extractRunJSSettingsDefault, extractRunJSSettingsDefaults } from '../defaults';

describe('RunJS settings defaults', () => {
  it('deeply merges property defaults with object-level defaults', () => {
    const schema = {
      type: 'object',
      default: {
        options: { color: 'red' },
        nullable: null,
      },
      properties: {
        options: {
          type: 'object',
          default: { pageSize: 20 },
          properties: {
            color: { type: 'string', default: 'blue' },
            density: { type: 'string', default: 'compact' },
          },
        },
        emptyObject: { type: 'object', default: {} },
        nullable: { type: ['string', 'null'], default: 'fallback' },
      },
    };

    expect(extractRunJSSettingsDefaults(schema)).toEqual({
      options: {
        color: 'red',
        density: 'compact',
        pageSize: 20,
      },
      emptyObject: {},
      nullable: null,
    });
  });

  it('distinguishes absent defaults from explicit empty, null, and array defaults', () => {
    expect(extractRunJSSettingsDefault({ type: 'string' })).toEqual({ hasDefault: false, value: {} });
    expect(extractRunJSSettingsDefault({ type: 'object', default: {} })).toEqual({ hasDefault: true, value: {} });
    expect(extractRunJSSettingsDefault({ type: ['string', 'null'], default: null })).toEqual({
      hasDefault: true,
      value: null,
    });
    expect(extractRunJSSettingsDefault({ type: 'array', default: [] })).toEqual({ hasDefault: true, value: [] });
  });

  it('normalizes item property defaults inside explicit array defaults', () => {
    const schema = {
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

    expect(extractRunJSSettingsDefaults(schema)).toEqual({
      rows: [{ enabled: true, label: 'Untitled' }],
    });
  });

  it('returns prototype-sensitive defaults as own data without changing object prototypes', () => {
    const schema = JSON.parse(`{
      "type":"object",
      "properties":{
        "__proto__":{"type":"object","default":{"safe":true},"properties":{"safe":{"type":"boolean"}}},
        "constructor":{"type":"object","default":{"prototype":"safe"},"properties":{"prototype":{"type":"string"}}},
        "prototype":{"type":"string","default":"safe"}
      }
    }`) as Record<string, unknown>;
    const defaults = extractRunJSSettingsDefaults(schema);
    const constructorDefault = defaults.constructor as Record<string, unknown>;

    expect(Object.keys(defaults)).toEqual(['__proto__', 'constructor', 'prototype']);
    expect(Object.prototype.hasOwnProperty.call(defaults, '__proto__')).toBe(true);
    expect(defaults.__proto__).toEqual({ safe: true });
    expect(constructorDefault.prototype).toBe('safe');
    expect(defaults.prototype).toBe('safe');
    expect(Object.getPrototypeOf(defaults)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(defaults.__proto__ as object)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(constructorDefault)).toBe(Object.prototype);
    expect(({} as { safe?: unknown }).safe).toBeUndefined();
  });
});
