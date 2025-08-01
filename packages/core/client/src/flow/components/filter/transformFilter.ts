/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 过滤器数据结构转换工具
 *
 * 将结构化的过滤器配置转换为查询对象格式
 *
 * @example
 * ```typescript
 * const input = {
 *   "logic": "$or",
 *   "items": [
 *     {
 *       "leftValue": "isAdmin",
 *       "operator": "$eq",
 *       "rightValue": true
 *     },
 *     {
 *       "logic": "$and",
 *       "items": [
 *         {
 *           "leftValue": "name",
 *           "operator": "$eq",
 *           "rightValue": "NocoBase"
 *         }
 *       ]
 *     }
 *   ]
 * };
 *
 * const result = transformFilter(input);
 * // 输出: {"$or":[{"isAdmin":{"$eq":true}},{"$and":[{"name":{"$eq":"NocoBase"}}]}]}
 * ```
 */

/**
 * 过滤器条件项接口
 */
export interface FilterCondition {
  /** 字段名 */
  leftValue: string;
  /** 操作符 */
  operator: string;
  /** 值 */
  rightValue: any;
}

/**
 * 过滤器分组接口
 */
export interface FilterGroup {
  /** 逻辑操作符 */
  logic: '$and' | '$or';
  /** 条件项数组 */
  items: (FilterCondition | FilterGroup)[];
}

/**
 * 查询条件对象类型
 */
export type QueryCondition = {
  [field: string]: {
    [operator: string]: any;
  };
};

/**
 * 查询对象类型
 */
export type QueryObject =
  | {
      [logic: string]: (QueryCondition | QueryObject)[];
    }
  | QueryCondition;

/**
 * 判断是否为过滤器条件项
 *
 * @param item - 待判断的项
 * @returns 是否为条件项
 */
function isFilterCondition(item: FilterCondition | FilterGroup): item is FilterCondition {
  return 'leftValue' in item && 'operator' in item && 'rightValue' in item;
}

/**
 * 判断是否为过滤器分组
 *
 * @param item - 待判断的项
 * @returns 是否为分组
 */
function isFilterGroup(item: FilterCondition | FilterGroup): item is FilterGroup {
  return 'logic' in item && 'items' in item;
}

/**
 * 转换单个过滤器条件项
 *
 * @param condition - 过滤器条件项
 * @returns 查询条件对象
 */
function transformCondition(condition: FilterCondition): QueryCondition {
  const { leftValue, operator, rightValue } = condition;

  return {
    [leftValue]: {
      [operator]: rightValue,
    },
  };
}

/**
 * 转换过滤器分组
 *
 * @param group - 过滤器分组
 * @returns 查询对象
 */
function transformGroup(group: FilterGroup): QueryObject {
  const { logic, items } = group;

  const transformedItems = items.map((item) => {
    if (isFilterCondition(item)) {
      return transformCondition(item);
    } else if (isFilterGroup(item)) {
      return transformGroup(item);
    } else {
      throw new Error('Invalid filter item type');
    }
  });

  return {
    [logic]: transformedItems,
  };
}

/**
 * 转换过滤器数据结构
 *
 * 将结构化的过滤器配置转换为查询对象格式
 *
 * @param filter - 过滤器配置对象
 * @returns 转换后的查询对象
 *
 * @throws {Error} 当过滤器格式无效时抛出错误
 *
 * @example
 * ```typescript
 * // 简单条件
 * const simpleFilter = {
 *   "logic": "$and",
 *   "items": [
 *     {
 *       "leftValue": "name",
 *       "operator": "$eq",
 *       "rightValue": "test"
 *     }
 *   ]
 * };
 *
 * const result = transformFilter(simpleFilter);
 * // 输出: {"$and":[{"name":{"$eq":"test"}}]}
 *
 * // 嵌套条件
 * const nestedFilter = {
 *   "logic": "$or",
 *   "items": [
 *     {
 *       "leftValue": "isAdmin",
 *       "operator": "$eq",
 *       "rightValue": true
 *     },
 *     {
 *       "logic": "$and",
 *       "items": [
 *         {
 *           "leftValue": "name",
 *           "operator": "$includes",
 *           "rightValue": "NocoBase"
 *         },
 *         {
 *           "leftValue": "age",
 *           "operator": "$gt",
 *           "rightValue": 18
 *         }
 *       ]
 *     }
 *   ]
 * };
 *
 * const nestedResult = transformFilter(nestedFilter);
 * // 输出: {"$or":[{"isAdmin":{"$eq":true}},{"$and":[{"name":{"$includes":"NocoBase"}},{"age":{"$gt":18}}]}]}
 * ```
 */
export function transformFilter(filter: FilterGroup): QueryObject {
  if (!filter || typeof filter !== 'object') {
    throw new Error('Invalid filter: filter must be an object');
  }

  if (!isFilterGroup(filter)) {
    throw new Error('Invalid filter: filter must have logic and items properties');
  }

  if (!Array.isArray(filter.items)) {
    throw new Error('Invalid filter: items must be an array');
  }

  return transformGroup(filter);
}

/**
 * 默认导出转换函数
 */
export default transformFilter;
