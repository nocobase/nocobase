/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Filter data structure transformation tool tests
 */

import { describe, expect, it } from 'vitest';
import { transformFilter, FilterGroup } from '../utils';

describe('transformFilter', () => {
  it('should correctly transform simple single-condition filter', () => {
    const input: FilterGroup = {
      logic: '$and',
      items: [
        {
          leftValue: 'name',
          operator: '$eq',
          rightValue: 'test',
        },
      ],
    };

    const expected = {
      $and: [
        {
          name: {
            $eq: 'test',
          },
        },
      ],
    };

    const result = transformFilter(input);
    expect(result).toEqual(expected);
  });

  it('should correctly transform multi-condition $or filter', () => {
    const input: FilterGroup = {
      logic: '$or',
      items: [
        {
          leftValue: 'isAdmin',
          operator: '$eq',
          rightValue: true,
        },
        {
          leftValue: 'nickname',
          operator: '$includes',
          rightValue: '11',
        },
      ],
    };

    const expected = {
      $or: [
        {
          isAdmin: {
            $eq: true,
          },
        },
        {
          nickname: {
            $includes: '11',
          },
        },
      ],
    };

    const result = transformFilter(input);
    expect(result).toEqual(expected);
  });

  it('should correctly transform nested filter structure', () => {
    const input: FilterGroup = {
      logic: '$or',
      items: [
        {
          leftValue: 'nickname',
          operator: '$includes',
          rightValue: '11',
        },
        {
          logic: '$and',
          items: [
            {
              leftValue: 'username',
              operator: '$includes',
              rightValue: '222',
            },
          ],
        },
      ],
    };

    const expected = {
      $or: [
        {
          nickname: {
            $includes: '11',
          },
        },
        {
          $and: [
            {
              username: {
                $includes: '222',
              },
            },
          ],
        },
      ],
    };

    const result = transformFilter(input);
    expect(result).toEqual(expected);
  });

  it('should correctly transform complex nested filter structure', () => {
    const input: FilterGroup = {
      logic: '$or',
      items: [
        {
          leftValue: 'isAdmin',
          operator: '$eq',
          rightValue: true,
        },
        {
          logic: '$and',
          items: [
            {
              leftValue: 'name',
              operator: '$eq',
              rightValue: 'NocoBase',
            },
            {
              leftValue: 'age',
              operator: '$gt',
              rightValue: 18,
            },
          ],
        },
      ],
    };

    const expected = {
      $or: [
        {
          isAdmin: {
            $eq: true,
          },
        },
        {
          $and: [
            {
              name: {
                $eq: 'NocoBase',
              },
            },
            {
              age: {
                $gt: 18,
              },
            },
          ],
        },
      ],
    };

    const result = transformFilter(input);
    expect(result).toEqual(expected);
  });

  it('should support multi-level nested filter structure', () => {
    const input: FilterGroup = {
      logic: '$and',
      items: [
        {
          leftValue: 'status',
          operator: '$eq',
          rightValue: 'active',
        },
        {
          logic: '$or',
          items: [
            {
              leftValue: 'role',
              operator: '$eq',
              rightValue: 'admin',
            },
            {
              logic: '$and',
              items: [
                {
                  leftValue: 'department',
                  operator: '$eq',
                  rightValue: 'IT',
                },
                {
                  leftValue: 'level',
                  operator: '$gte',
                  rightValue: 3,
                },
              ],
            },
          ],
        },
      ],
    };

    const expected = {
      $and: [
        {
          status: {
            $eq: 'active',
          },
        },
        {
          $or: [
            {
              role: {
                $eq: 'admin',
              },
            },
            {
              $and: [
                {
                  department: {
                    $eq: 'IT',
                  },
                },
                {
                  level: {
                    $gte: 3,
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const result = transformFilter(input);
    expect(result).toEqual(expected);
  });

  it('should handle different types of values', () => {
    const input: FilterGroup = {
      logic: '$and',
      items: [
        {
          leftValue: 'stringField',
          operator: '$eq',
          rightValue: 'text',
        },
        {
          leftValue: 'numberField',
          operator: '$gt',
          rightValue: 100,
        },
        {
          leftValue: 'booleanField',
          operator: '$eq',
          rightValue: false,
        },
        {
          leftValue: 'arrayField',
          operator: '$in',
          rightValue: [1, 2, 3],
        },
        {
          leftValue: 'nullField',
          operator: '$null',
          rightValue: null,
        },
      ],
    };

    const expected = {
      $and: [
        {
          stringField: {
            $eq: 'text',
          },
        },
        {
          numberField: {
            $gt: 100,
          },
        },
        {
          booleanField: {
            $eq: false,
          },
        },
        {
          arrayField: {
            $in: [1, 2, 3],
          },
        },
        {
          nullField: {
            $null: null,
          },
        },
      ],
    };

    const result = transformFilter(input);
    expect(result).toEqual(expected);
  });

  describe('Error handling', () => {
    it('should throw error when null is passed', () => {
      expect(() => transformFilter(null as any)).toThrow('Invalid filter: filter must be an object');
    });

    it('should throw error when undefined is passed', () => {
      expect(() => transformFilter(undefined as any)).toThrow('Invalid filter: filter must be an object');
    });

    it('should throw error when non-object type is passed', () => {
      expect(() => transformFilter('invalid' as any)).toThrow('Invalid filter: filter must be an object');
    });

    it('should throw error when logic property is missing', () => {
      const input = {
        items: [],
      } as any;

      expect(() => transformFilter(input)).toThrow('Invalid filter: filter must have logic and items properties');
    });

    it('should throw error when items property is missing', () => {
      const input = {
        logic: '$and',
      } as any;

      expect(() => transformFilter(input)).toThrow('Invalid filter: filter must have logic and items properties');
    });

    it('should throw error when items is not an array', () => {
      const input = {
        logic: '$and',
        items: 'not-array',
      } as any;

      expect(() => transformFilter(input)).toThrow('Invalid filter: items must be an array');
    });

    it('should throw error when encountering invalid item type', () => {
      const input = {
        logic: '$and',
        items: [
          {
            invalidProperty: 'test',
          },
        ],
      } as any;

      expect(() => transformFilter(input)).toThrow('Invalid filter item type');
    });
  });
});
