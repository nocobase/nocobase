/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/** 单个字符串字段最大长度 */
export const MAX_STRING_LENGTH = 500;
/** 单次查询最大记录数 */
export const MAX_QUERY_LIMIT = 100;

/**
 * 递归截断对象中的长字符串，保持 JSON 结构完整
 */
export function truncateLongStrings(obj: any, maxLen = MAX_STRING_LENGTH): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'string') {
    return obj.length > maxLen ? obj.slice(0, maxLen) + '...[truncated]' : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => truncateLongStrings(item, maxLen));
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = truncateLongStrings(obj[key], maxLen);
    }
    return result;
  }
  return obj;
}
