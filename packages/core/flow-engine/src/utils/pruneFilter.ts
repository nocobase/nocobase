/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 递归清理筛选对象中的“空值”。
 *
 * 规则：
 * - 移除：`null`、`undefined`、空字符串 `''`、空数组 `[]`、空对象 `{}`；
 * - 保留：`false`、`0` 等有意义的“假值”。
 *
 * 注意：当清理后整体变为空结构时，返回 `undefined`，用于表示无需下发该条件。
 *
 * @param input 任意筛选对象/数组/原始值
 * @returns 清理后的对象；若为空则返回 `undefined`
 */
export function pruneFilter<T = any>(input: T): T | undefined {
  // Arrays: prune items and drop empty arrays
  if (Array.isArray(input)) {
    const arr = (input as unknown[]).map((v) => pruneFilter(v)).filter((v) => v !== undefined);
    return (arr.length ? (arr as unknown as T) : undefined) as any;
  }

  // Objects: prune properties and drop empty objects
  if (input && typeof input === 'object') {
    const out: Record<string, any> = {};
    Object.keys(input as Record<string, any>).forEach((k) => {
      const v = pruneFilter((input as any)[k]);
      if (v !== undefined) out[k] = v;
    });
    return (Object.keys(out).length ? (out as unknown as T) : undefined) as any;
  }

  // Primitives: keep false/0; drop null/undefined/''
  return input === null || input === undefined || (typeof input === 'string' && input === '') ? undefined : input;
}
