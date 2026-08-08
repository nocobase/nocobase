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
});
