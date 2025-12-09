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
import {
  FilterGroupType,
  transformFilter,
  evaluateConditions,
  ConditionEvaluator,
  removeInvalidFilterItems,
} from '../transformFilter';

describe('transformFilter', () => {
  it('should correctly transform simple single-condition filter', () => {
    const input: FilterGroupType = {
      logic: '$and',
      items: [
        {
          path: 'name',
          operator: '$eq',
          value: 'test',
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
    const input: FilterGroupType = {
      logic: '$or',
      items: [
        {
          path: 'isAdmin',
          operator: '$eq',
          value: true,
        },
        {
          path: 'nickname',
          operator: '$includes',
          value: '11',
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
    const input: FilterGroupType = {
      logic: '$or',
      items: [
        {
          path: 'nickname',
          operator: '$includes',
          value: '11',
        },
        {
          logic: '$and',
          items: [
            {
              path: 'username',
              operator: '$includes',
              value: '222',
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
    const input: FilterGroupType = {
      logic: '$or',
      items: [
        {
          path: 'isAdmin',
          operator: '$eq',
          value: true,
        },
        {
          logic: '$and',
          items: [
            {
              path: 'name',
              operator: '$eq',
              value: 'NocoBase',
            },
            {
              path: 'age',
              operator: '$gt',
              value: 18,
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
    const input: FilterGroupType = {
      logic: '$and',
      items: [
        {
          path: 'status',
          operator: '$eq',
          value: 'active',
        },
        {
          logic: '$or',
          items: [
            {
              path: 'role',
              operator: '$eq',
              value: 'admin',
            },
            {
              logic: '$and',
              items: [
                {
                  path: 'department',
                  operator: '$eq',
                  value: 'IT',
                },
                {
                  path: 'level',
                  operator: '$gte',
                  value: 3,
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
    const input: FilterGroupType = {
      logic: '$and',
      items: [
        {
          path: 'stringField',
          operator: '$eq',
          value: 'text',
        },
        {
          path: 'numberField',
          operator: '$gt',
          value: 100,
        },
        {
          path: 'booleanField',
          operator: '$eq',
          value: false,
        },
        {
          path: 'arrayField',
          operator: '$in',
          value: [1, 2, 3],
        },
        {
          path: 'nullField',
          operator: '$null',
          value: null,
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

describe('removeInvalidFilterItems', () => {
  it('should remove invalid conditions while keeping valid ones', () => {
    const filter: FilterGroupType = {
      logic: '$and',
      items: [
        {
          path: 'name',
          operator: '$eq',
          value: 'Alice',
        },
        {
          path: '',
          operator: '$eq',
          value: 'missingPath',
        },
        {
          path: 'age',
          operator: '',
          value: 20,
        },
        {
          logic: '$or',
          items: [
            {
              path: 'status',
              operator: '$eq',
              value: 'active',
            },
            {
              path: '',
              operator: '$eq',
              value: 'invalidNestedPath',
            },
          ],
        },
        {
          logic: '$and',
          items: [
            {
              path: '',
              operator: '$eq',
              value: 'deepInvalid',
            },
          ],
        },
      ],
    };

    const result = removeInvalidFilterItems(filter);

    expect(result).toMatchInlineSnapshot(`
      {
        "items": [
          {
            "operator": "$eq",
            "path": "name",
            "value": "Alice",
          },
          {
            "operator": "$eq",
            "path": "",
            "value": "missingPath",
          },
          {
            "items": [
              {
                "operator": "$eq",
                "path": "status",
                "value": "active",
              },
              {
                "operator": "$eq",
                "path": "",
                "value": "invalidNestedPath",
              },
            ],
            "logic": "$or",
          },
          {
            "items": [
              {
                "operator": "$eq",
                "path": "",
                "value": "deepInvalid",
              },
            ],
            "logic": "$and",
          },
        ],
        "logic": "$and",
      }
    `);
  });
});

describe('evaluateConditions', () => {
  // 创建一个简单的条件评估器用于测试
  const createMockEvaluator = (mockData: Record<string, any>): ConditionEvaluator => {
    return (path: string, operator: string, value: any): boolean => {
      const fieldValue = mockData[path];

      switch (operator) {
        case '$eq':
          return fieldValue === value;
        case '$ne':
          return fieldValue !== value;
        case '$gt':
          return fieldValue > value;
        case '$gte':
          return fieldValue >= value;
        case '$lt':
          return fieldValue < value;
        case '$lte':
          return fieldValue <= value;
        case '$includes':
          return typeof fieldValue === 'string' && fieldValue.includes(value);
        case '$in':
          return Array.isArray(value) && value.includes(fieldValue);
        case '$null':
          return fieldValue === null || fieldValue === undefined;
        default:
          return false;
      }
    };
  };

  it('should correctly evaluate simple single-condition with $and logic', () => {
    const mockData = { name: 'test', age: 25 };
    const evaluator = createMockEvaluator(mockData);

    const conditions: FilterGroupType = {
      logic: '$and',
      items: [
        {
          path: 'name',
          operator: '$eq',
          value: 'test',
        },
      ],
    };

    const result = evaluateConditions(conditions, evaluator);
    expect(result).toBe(true);
  });

  it('should correctly evaluate simple single-condition with false result', () => {
    const mockData = { name: 'test', age: 25 };
    const evaluator = createMockEvaluator(mockData);

    const conditions: FilterGroupType = {
      logic: '$and',
      items: [
        {
          path: 'name',
          operator: '$eq',
          value: 'different',
        },
      ],
    };

    const result = evaluateConditions(conditions, evaluator);
    expect(result).toBe(false);
  });

  it('should correctly evaluate multi-condition $and logic (all true)', () => {
    const mockData = { name: 'test', age: 25, isActive: true };
    const evaluator = createMockEvaluator(mockData);

    const conditions: FilterGroupType = {
      logic: '$and',
      items: [
        {
          path: 'name',
          operator: '$eq',
          value: 'test',
        },
        {
          path: 'age',
          operator: '$gt',
          value: 20,
        },
        {
          path: 'isActive',
          operator: '$eq',
          value: true,
        },
      ],
    };

    const result = evaluateConditions(conditions, evaluator);
    expect(result).toBe(true);
  });

  it('should correctly evaluate multi-condition $and logic (one false)', () => {
    const mockData = { name: 'test', age: 15, isActive: true };
    const evaluator = createMockEvaluator(mockData);

    const conditions: FilterGroupType = {
      logic: '$and',
      items: [
        {
          path: 'name',
          operator: '$eq',
          value: 'test',
        },
        {
          path: 'age',
          operator: '$gt',
          value: 20,
        },
        {
          path: 'isActive',
          operator: '$eq',
          value: true,
        },
      ],
    };

    const result = evaluateConditions(conditions, evaluator);
    expect(result).toBe(false);
  });

  it('should correctly evaluate multi-condition $or logic (one true)', () => {
    const mockData = { name: 'test', age: 15, isActive: false };
    const evaluator = createMockEvaluator(mockData);

    const conditions: FilterGroupType = {
      logic: '$or',
      items: [
        {
          path: 'name',
          operator: '$eq',
          value: 'test',
        },
        {
          path: 'age',
          operator: '$gt',
          value: 20,
        },
        {
          path: 'isActive',
          operator: '$eq',
          value: true,
        },
      ],
    };

    const result = evaluateConditions(conditions, evaluator);
    expect(result).toBe(true);
  });

  it('should correctly evaluate multi-condition $or logic (all false)', () => {
    const mockData = { name: 'different', age: 15, isActive: false };
    const evaluator = createMockEvaluator(mockData);

    const conditions: FilterGroupType = {
      logic: '$or',
      items: [
        {
          path: 'name',
          operator: '$eq',
          value: 'test',
        },
        {
          path: 'age',
          operator: '$gt',
          value: 20,
        },
        {
          path: 'isActive',
          operator: '$eq',
          value: true,
        },
      ],
    };

    const result = evaluateConditions(conditions, evaluator);
    expect(result).toBe(false);
  });

  it('should correctly evaluate nested conditions', () => {
    const mockData = { name: 'test', age: 25, department: 'IT', level: 3 };
    const evaluator = createMockEvaluator(mockData);

    const conditions: FilterGroupType = {
      logic: '$or',
      items: [
        {
          path: 'name',
          operator: '$eq',
          value: 'admin',
        },
        {
          logic: '$and',
          items: [
            {
              path: 'department',
              operator: '$eq',
              value: 'IT',
            },
            {
              path: 'level',
              operator: '$gte',
              value: 3,
            },
          ],
        },
      ],
    };

    const result = evaluateConditions(conditions, evaluator);
    expect(result).toBe(true);
  });

  it('should correctly evaluate complex nested conditions', () => {
    const mockData = {
      status: 'active',
      role: 'user',
      department: 'HR',
      level: 2,
      experience: 5,
    };
    const evaluator = createMockEvaluator(mockData);

    const conditions: FilterGroupType = {
      logic: '$and',
      items: [
        {
          path: 'status',
          operator: '$eq',
          value: 'active',
        },
        {
          logic: '$or',
          items: [
            {
              path: 'role',
              operator: '$eq',
              value: 'admin',
            },
            {
              logic: '$and',
              items: [
                {
                  path: 'department',
                  operator: '$eq',
                  value: 'IT',
                },
                {
                  path: 'level',
                  operator: '$gte',
                  value: 3,
                },
              ],
            },
            {
              path: 'experience',
              operator: '$gt',
              value: 4,
            },
          ],
        },
      ],
    };

    const result = evaluateConditions(conditions, evaluator);
    expect(result).toBe(true); // status is active AND experience > 4
  });

  it('should handle empty conditions array', () => {
    const mockData = {};
    const evaluator = createMockEvaluator(mockData);

    const conditions: FilterGroupType = {
      logic: '$and',
      items: [],
    };

    const result = evaluateConditions(conditions, evaluator);
    expect(result).toBe(true); // Empty conditions should return true
  });

  it('should handle different operators correctly', () => {
    const mockData = {
      name: 'John Doe',
      age: 30,
      status: null,
      tags: ['admin', 'user'],
    };
    const evaluator = createMockEvaluator(mockData);

    // Test $includes
    let conditions: FilterGroupType = {
      logic: '$and',
      items: [{ path: 'name', operator: '$includes', value: 'John' }],
    };
    expect(evaluateConditions(conditions, evaluator)).toBe(true);

    // Test $ne
    conditions = {
      logic: '$and',
      items: [{ path: 'age', operator: '$ne', value: 25 }],
    };
    expect(evaluateConditions(conditions, evaluator)).toBe(true);

    // Test $null
    conditions = {
      logic: '$and',
      items: [{ path: 'status', operator: '$null', value: null }],
    };
    expect(evaluateConditions(conditions, evaluator)).toBe(true);

    // Test $in
    conditions = {
      logic: '$and',
      items: [{ path: 'name', operator: '$in', value: ['John Doe', 'Jane Doe'] }],
    };
    expect(evaluateConditions(conditions, evaluator)).toBe(true);
  });

  describe('Error handling', () => {
    const mockEvaluator = createMockEvaluator({});

    it('should throw error when null conditions are passed', () => {
      expect(() => evaluateConditions(null as any, mockEvaluator)).toThrow(
        'Invalid conditions: conditions must be an object',
      );
    });

    it('should throw error when undefined conditions are passed', () => {
      expect(() => evaluateConditions(undefined as any, mockEvaluator)).toThrow(
        'Invalid conditions: conditions must be an object',
      );
    });

    it('should throw error when non-object conditions are passed', () => {
      expect(() => evaluateConditions('invalid' as any, mockEvaluator)).toThrow(
        'Invalid conditions: conditions must be an object',
      );
    });

    it('should throw error when logic property is missing', () => {
      const conditions = { items: [] } as any;
      expect(() => evaluateConditions(conditions, mockEvaluator)).toThrow(
        'Invalid conditions: conditions must have logic and items properties',
      );
    });

    it('should throw error when items property is missing', () => {
      const conditions = { logic: '$and' } as any;
      expect(() => evaluateConditions(conditions, mockEvaluator)).toThrow(
        'Invalid conditions: conditions must have logic and items properties',
      );
    });

    it('should throw error when items is not an array', () => {
      const conditions = { logic: '$and', items: 'not-array' } as any;
      expect(() => evaluateConditions(conditions, mockEvaluator)).toThrow('Invalid conditions: items must be an array');
    });

    it('should throw error when evaluator is not a function', () => {
      const conditions: FilterGroupType = { logic: '$and', items: [] };
      expect(() => evaluateConditions(conditions, 'not-function' as any)).toThrow(
        'Invalid evaluator: evaluator must be a function',
      );
    });

    it('should throw error when unsupported logic operator is used', () => {
      const mockData = { name: 'test' };
      const evaluator = createMockEvaluator(mockData);

      const conditions = {
        logic: '$invalid',
        items: [{ path: 'name', operator: '$eq', value: 'test' }],
      } as any;

      expect(() => evaluateConditions(conditions, evaluator)).toThrow('Unsupported logic operator: $invalid');
    });

    it('should throw error when invalid filter item type is encountered', () => {
      const mockData = { name: 'test' };
      const evaluator = createMockEvaluator(mockData);

      const conditions = {
        logic: '$and',
        items: [{ invalidProperty: 'test' }],
      } as any;

      expect(() => evaluateConditions(conditions, evaluator)).toThrow('Invalid filter item type');
    });
  });
});
