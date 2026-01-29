/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/** Single string field max length */
export const MAX_STRING_LENGTH = 500;

/**
 * Truncate long strings recursively while keeping JSON structure intact.
 */
export function truncateLongStrings(obj: any, maxLen = MAX_STRING_LENGTH): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'string') {
    return obj.length > maxLen ? `${obj.slice(0, maxLen)}...[truncated]` : obj;
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
