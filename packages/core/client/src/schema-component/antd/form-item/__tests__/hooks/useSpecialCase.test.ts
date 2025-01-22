/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import { isSpecialCaseField, isSubset, transformValue } from '../../hooks/useSpecialCase';

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
      default: '{{ $context }}',
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
      default: '{{ $context }}',
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
      default: '{{ $context }}',
      parent: parentFieldSchema,
    };
    const getCollectionField = vi.fn().mockReturnValue({
      type: 'belongsToMany',
    });

    const result = isSpecialCaseField({ collectionField, fieldSchema, getCollectionField });

    expect(result).toBe(true);
  });
});

describe('isSubset', () => {
  it('should return true when two arrays are identical', () => {
    const arr1 = [
      { a: 1, b: 2 },
      { c: 3, d: 4 },
    ];
    const arr2 = [
      { a: 1, b: 2 },
      { c: 3, d: 4 },
    ];
    expect(isSubset(arr1, arr2)).toBe(true);
  });

  it('should return false when array lengths are different', () => {
    const arr1 = [{ a: 1 }];
    const arr2 = [{ a: 1 }, { b: 2 }];
    expect(isSubset(arr1, arr2)).toBe(false);
  });

  it('should ignore null values and return true', () => {
    const arr1 = [
      { a: 1, b: null },
      { c: 3, d: null },
    ];
    const arr2 = [{ a: 1 }, { c: 3 }];
    expect(isSubset(arr1, arr2)).toBe(true);
  });

  it('should return false when objects do not match', () => {
    const arr1 = [
      { a: 1, b: 2 },
      { c: 3, d: 4 },
    ];
    const arr2 = [
      { a: 1, b: 2 },
      { c: 3, d: 5 },
    ];
    expect(isSubset(arr1, arr2)).toBe(false);
  });
});
