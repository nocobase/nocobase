/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { removeNullCondition } from './common';

/**
 * 过滤器条件项接口
 */
export interface FilterCondition {
  /** 字段名 */
  path: string;
  /** 值 */
  value: any;
  /** 操作符 */
  operator: string;
}

/**
 * 过滤器分组接口
 */
export interface FilterGroupType {
  /** 逻辑操作符 */
  logic: '$and' | '$or';
  /** 条件项数组 */
  items: (FilterCondition | FilterGroupType)[];
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
function isFilterCondition(item: FilterCondition | FilterGroupType): item is FilterCondition {
  return 'path' in item && 'operator' in item;
}

/**
 * 判断是否为过滤器分组
 *
 * @param item - 待判断的项
 * @returns 是否为分组
 */
function isFilterGroup(item: FilterCondition | FilterGroupType): item is FilterGroupType {
  return 'logic' in item && 'items' in item;
}

/**
 * 转换单个过滤器条件项
 *
 * @param condition - 过滤器条件项
 * @returns 查询条件对象
 */
function transformCondition(condition: FilterCondition): QueryCondition {
  const { path, operator, value } = condition;

  return {
    [path]: {
      [operator]: value,
    },
  };
}

/**
 * 转换过滤器分组
 *
 * @param group - 过滤器分组
 * @returns 查询对象
 */
function transformGroup(group: FilterGroupType): QueryObject {
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
 *       "path": "name",
 *       "operator": "$eq",
 *       "value": "test"
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
 *       "path": "isAdmin",
 *       "operator": "$eq",
 *       "value": true
 *     },
 *     {
 *       "logic": "$and",
 *       "items": [
 *         {
 *           "path": "name",
 *           "operator": "$includes",
 *           "value": "NocoBase"
 *         },
 *         {
 *           "path": "age",
 *           "operator": "$gt",
 *           "value": 18
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
export function transformFilter(filter: FilterGroupType): QueryObject {
  if (!filter || typeof filter !== 'object') {
    throw new Error('Invalid filter: filter must be an object');
  }

  if (!isFilterGroup(filter)) {
    throw new Error('Invalid filter: filter must have logic and items properties');
  }

  if (!Array.isArray(filter.items)) {
    throw new Error('Invalid filter: items must be an array');
  }

  return removeNullCondition(transformGroup(filter));
}

export function removeInvalidFilterItems(filter: FilterGroupType): FilterGroupType {
  if (!filter || typeof filter !== 'object') {
    throw new Error('Invalid filter: filter must be an object');
  }

  if (!isFilterGroup(filter)) {
    throw new Error('Invalid filter: filter must have logic and items properties');
  }

  if (!Array.isArray(filter.items)) {
    throw new Error('Invalid filter: items must be an array');
  }

  // 过滤掉无效的条件项
  filter.items = filter.items.filter((item) => {
    if (isFilterCondition(item)) {
      return !!item.operator;
    } else if (isFilterGroup(item)) {
      return removeInvalidFilterItems(item);
    }
    return false;
  });

  return { ...filter };
}

/**
 * 条件评估器函数类型
 *
 * @param path - 左值（字段名）
 * @param operator - 操作符
 * @param value - 右值
 * @returns 条件评估结果
 */
export type ConditionEvaluator = (path: string, operator: string, value: any) => boolean;

/**
 * 评估单个过滤器条件
 *
 * @param condition - 过滤器条件项
 * @param evaluator - 条件评估器函数
 * @returns 条件评估结果
 */
function evaluateCondition(condition: FilterCondition, evaluator: ConditionEvaluator): boolean {
  const { path: path, operator, value: value } = condition;
  return evaluator(path, operator, value);
}

/**
 * 评估过滤器分组
 *
 * @param group - 过滤器分组
 * @param evaluator - 条件评估器函数
 * @returns 分组评估结果
 */
function evaluateGroup(group: FilterGroupType, evaluator: ConditionEvaluator): boolean {
  const { logic, items } = group;

  if (!items || items.length === 0) {
    return true; // 空条件组默认为 true
  }

  const results = items.map((item) => {
    if (isFilterCondition(item)) {
      return evaluateCondition(item, evaluator);
    } else if (isFilterGroup(item)) {
      return evaluateGroup(item, evaluator);
    } else {
      throw new Error('Invalid filter item type');
    }
  });

  // 根据逻辑操作符组合结果
  if (logic === '$and') {
    return results.every((result) => result === true);
  } else if (logic === '$or') {
    return results.some((result) => result === true);
  } else {
    throw new Error(`Unsupported logic operator: ${logic}`);
  }
}

/**
 * 评估过滤器条件
 *
 * 解析 FilterGroupType 类型的条件，根据提供的评估器函数计算每个条件的值，
 * 然后按照逻辑操作符组合得出最终的布尔值结果。
 *
 * @param conditions - 过滤器条件配置对象
 * @param evaluator - 条件评估器函数，用于计算 path、operator、value 的结果
 * @returns 最终的布尔值结果
 *
 * @throws {Error} 当条件格式无效时抛出错误
 *
 * @example
 * ```typescript
 * // 定义条件评估器
 * const evaluator: ConditionEvaluator = (path, operator, value) => {
 *   // 这里实现具体的条件计算逻辑
 *   // 例如从上下文中获取字段值并与 value 比较
 *   const fieldValue = getFieldValue(path);
 *   return compareValues(fieldValue, operator, value);
 * };
 *
 * // 评估条件
 * const conditions = {
 *   logic: '$and',
 *   items: [
 *     {
 *       path: 'name',
 *       operator: '$eq',
 *       value: 'test'
 *     },
 *     {
 *       path: 'age',
 *       operator: '$gt',
 *       value: 18
 *     }
 *   ]
 * };
 *
 * const result = evaluateConditions(conditions, evaluator);
 * // 返回: boolean (根据评估器的具体实现)
 * ```
 */
export function evaluateConditions(conditions: FilterGroupType, evaluator: ConditionEvaluator): boolean {
  if (!conditions || typeof conditions !== 'object') {
    throw new Error('Invalid conditions: conditions must be an object');
  }

  if (!isFilterGroup(conditions)) {
    throw new Error('Invalid conditions: conditions must have logic and items properties');
  }

  if (!Array.isArray(conditions.items)) {
    throw new Error('Invalid conditions: items must be an array');
  }

  if (typeof evaluator !== 'function') {
    throw new Error('Invalid evaluator: evaluator must be a function');
  }

  return evaluateGroup(conditions, evaluator);
}
