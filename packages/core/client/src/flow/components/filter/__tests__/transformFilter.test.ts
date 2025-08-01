/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 过滤器数据结构转换工具测试
 */

import { describe, it, expect } from 'vitest';
import transformFilter, { FilterGroup } from '../transformFilter';

describe('transformFilter', () => {
  it('应该正确转换简单的单条件过滤器', () => {
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

  it('应该正确转换多条件的 $or 过滤器', () => {
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

  it('应该正确转换嵌套的过滤器结构', () => {
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

  it('应该正确转换复杂的嵌套过滤器结构', () => {
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

  it('应该支持多层嵌套的过滤器结构', () => {
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

  it('应该处理不同类型的值', () => {
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

  describe('错误处理', () => {
    it('应该在传入 null 时抛出错误', () => {
      expect(() => transformFilter(null as any)).toThrow('Invalid filter: filter must be an object');
    });

    it('应该在传入 undefined 时抛出错误', () => {
      expect(() => transformFilter(undefined as any)).toThrow('Invalid filter: filter must be an object');
    });

    it('应该在传入非对象类型时抛出错误', () => {
      expect(() => transformFilter('invalid' as any)).toThrow('Invalid filter: filter must be an object');
    });

    it('应该在缺少 logic 属性时抛出错误', () => {
      const input = {
        items: [],
      } as any;

      expect(() => transformFilter(input)).toThrow('Invalid filter: filter must have logic and items properties');
    });

    it('应该在缺少 items 属性时抛出错误', () => {
      const input = {
        logic: '$and',
      } as any;

      expect(() => transformFilter(input)).toThrow('Invalid filter: filter must have logic and items properties');
    });

    it('应该在 items 不是数组时抛出错误', () => {
      const input = {
        logic: '$and',
        items: 'not-array',
      } as any;

      expect(() => transformFilter(input)).toThrow('Invalid filter: items must be an array');
    });

    it('应该在 items 为空数组时抛出错误', () => {
      const input: FilterGroup = {
        logic: '$and',
        items: [],
      };

      expect(() => transformFilter(input)).toThrow('Invalid filter: items cannot be empty');
    });

    it('应该在遇到无效的 item 类型时抛出错误', () => {
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
