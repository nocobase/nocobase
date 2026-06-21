/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type FilterTargetKey = string | string[] | undefined;

function uniqStrings(list: string[]) {
  return Array.from(new Set(list));
}

function isPrimitiveTkArray(arr: unknown[]): arr is Array<string | number> {
  return arr.every((v) => typeof v === 'string' || typeof v === 'number');
}

function getOrderKey(options: {
  filterTargetKey?: FilterTargetKey;
  pkAttr?: string;
  pkIsValid?: boolean;
}): string | undefined {
  if (typeof options.filterTargetKey === 'string') return options.filterTargetKey;
  if (options.pkIsValid && options.pkAttr) return options.pkAttr;
  return undefined;
}

/**
 * 为了：
 * - 关联加载/缓存：fields 模式下确保包含主键
 * - filterByTk 为数组时：尽量包含 filterTargetKey，以便按输入顺序对齐结果
 *
 * 该函数只返回“建议追加”的 key 字段（不会决定是否追加，由调用方根据是否启用 fields 决定）。
 */
export function getExtraKeyFieldsForSelect(
  filterByTk: unknown,
  options: {
    filterTargetKey?: FilterTargetKey;
    pkAttr?: string;
    pkIsValid?: boolean;
    rawAttributes?: Record<string, unknown>;
  },
): string[] {
  const extra: string[] = [];

  // 主键字段：只有 pkIsValid 才追加（pkIsValid 已保证 rawAttributes 包含 pkAttr）
  if (options.pkIsValid && options.pkAttr) {
    extra.push(options.pkAttr);
  }

  // filterByTk 为数组时，为对齐顺序尽量追加 filterTargetKey
  if (Array.isArray(filterByTk) && filterByTk.length > 0) {
    const tkKeys =
      typeof options.filterTargetKey === 'string'
        ? [options.filterTargetKey]
        : Array.isArray(options.filterTargetKey)
          ? options.filterTargetKey
          : [];

    // 仅在模型声明了 rawAttributes 且字段存在时才追加，避免无效字段导致 SQL 报错
    if (options.rawAttributes) {
      for (const k of tkKeys) {
        if (k && Object.prototype.hasOwnProperty.call(options.rawAttributes, k)) {
          extra.push(k);
        }
      }
    }
  }

  return uniqStrings(extra);
}

export function mergeFieldsWithExtras(fields?: string[], extras: string[] = []): string[] | undefined {
  if (!Array.isArray(fields) || fields.length === 0 || extras.length === 0) return fields;
  return uniqStrings([...fields, ...extras]);
}

function toJsonArray(rows: unknown): any[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => (r?.toJSON ? r.toJSON() : r));
}

/**
 * best-effort: 保持 filterByTk 顺序（仅处理单字段 targetKey + 原始值数组）。
 */
function reorderRecordsByFilterByTk(
  records: any[],
  filterByTk: unknown,
  options: { filterTargetKey?: FilterTargetKey; pkAttr?: string; pkIsValid?: boolean },
): any[] {
  if (!Array.isArray(filterByTk) || filterByTk.length === 0) return records;
  if (!isPrimitiveTkArray(filterByTk)) return records;

  const orderKey = getOrderKey(options);
  if (!orderKey) return records;

  const map = new Map<string, any>();
  for (const rec of records || []) {
    const k = rec?.[orderKey];
    if (typeof k !== 'undefined' && k !== null) {
      map.set(String(k), rec);
    }
  }

  const ordered: any[] = [];
  const used = new Set<string>();
  for (const tk of filterByTk) {
    const k = String(tk);
    const rec = map.get(k);
    if (typeof rec !== 'undefined') {
      ordered.push(rec);
      used.add(k);
    }
  }

  // append any unmatched records (defensive)
  for (const rec of records || []) {
    const k = rec?.[orderKey];
    const ks = typeof k === 'undefined' || k === null ? undefined : String(k);
    if (!ks || used.has(ks)) continue;
    ordered.push(rec);
  }

  return ordered;
}

/**
 * 根据 filterByTk 类型（单值/数组）查询并返回 JSON 数据：
 * - 单值：返回 object | undefined
 * - 数组：返回 array（空数组时返回 []，不会退化为无条件查询）
 */
export async function fetchRecordOrRecordsJson(
  repo: any,
  params: {
    filterByTk: unknown;
    preferFullRecord?: boolean;
    fields?: string[];
    appends?: string[];
    filterTargetKey?: FilterTargetKey;
    pkAttr?: string;
    pkIsValid?: boolean;
  },
): Promise<unknown> {
  const { filterByTk, preferFullRecord, fields, appends } = params;

  if (Array.isArray(filterByTk)) {
    if (filterByTk.length === 0) return [];

    const rows = await repo.find(
      preferFullRecord ? { filterByTk: filterByTk as any } : { filterByTk: filterByTk as any, fields, appends },
    );
    const jsonArr = toJsonArray(rows);
    return reorderRecordsByFilterByTk(jsonArr, filterByTk, params);
  }

  const rec = await repo.findOne(
    preferFullRecord ? { filterByTk: filterByTk as any } : { filterByTk: filterByTk as any, fields, appends },
  );
  return rec ? rec.toJSON() : undefined;
}
