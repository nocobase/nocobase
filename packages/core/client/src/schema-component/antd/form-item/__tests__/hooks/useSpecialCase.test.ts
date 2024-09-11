/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import { isSpecialCaseField, transformValue } from '../../hooks/useSpecialCase';

describe('transformValue', () => {
  it('value is an array', () => {
    const value = [{ a: 3 }, { a: 4 }];
    const deps = {
      field: {
        value: [{ a: 1, b: 11 }],
      },
      subFieldSchema: {
        name: 'a',
      },
    };

    expect(transformValue(value, deps as any)).toMatchInlineSnapshot(`
      [
        {
          "a": {
            "a": 3,
          },
          "b": 11,
        },
        {
          "__notFromDatabase": true,
          "a": {
            "a": 4,
          },
          "b": 11,
        },
      ]
    `);
  });
});

describe('isSpecialCaseField', () => {
  it('should return false for field with default value including "$iteration"', () => {
    const collectionField = {
      type: 'hasOne',
    };
    const parentFieldSchema = {
      'x-collection-field': 'parentField',
      'x-component-props': {
        mode: 'SubTable',
      },
    };
    const fieldSchema: any = {
      default: '{{ $iteration.name }}',
      parent: parentFieldSchema,
    };

    const getCollectionField = vi.fn().mockReturnValue({
      type: 'hasMany',
    });

    const result = isSpecialCaseField({ collectionField, fieldSchema, getCollectionField });

    expect(result).toBe(false);
  });

  it('should return false for field with collectionField type "hasOne" or "belongsTo" and no parent field with type "hasMany" or "belongsToMany"', () => {
    const collectionField = {
      type: 'hasOne',
    };
    const fieldSchema: any = {
      default: '',
    };
    const getCollectionField = vi.fn().mockReturnValue(null);

    const result = isSpecialCaseField({ collectionField, fieldSchema, getCollectionField });

    expect(result).toBe(false);
  });

  it('should return true for field with collectionField type "hasOne" or "belongsTo" and parent field with type "hasMany"', () => {
    const collectionField = {
      type: 'hasOne',
    };
    const parentFieldSchema = {
      'x-collection-field': 'parentField',
      'x-component-props': {
        mode: 'SubTable',
      },
    };
    const fieldSchema: any = {
      default: '',
      parent: parentFieldSchema,
    };

    const getCollectionField = vi.fn().mockReturnValue({
      type: 'hasMany',
    });

    const result = isSpecialCaseField({ collectionField, fieldSchema, getCollectionField });

    expect(result).toBe(true);
  });

  it('should return true for field with collectionField type "hasOne" or "belongsTo" and parent field with type "belongsToMany"', () => {
    const collectionField = {
      type: 'hasOne',
    };
    const parentFieldSchema = {
      'x-collection-field': 'parentField',
      'x-component-props': {
        mode: 'SubTable',
      },
    };
    const fieldSchema: any = {
      default: '',
      parent: parentFieldSchema,
    };
    const getCollectionField = vi.fn().mockReturnValue({
      type: 'belongsToMany',
    });

    const result = isSpecialCaseField({ collectionField, fieldSchema, getCollectionField });

    expect(result).toBe(true);
  });
});
