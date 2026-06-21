/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourcerContext } from '@nocobase/resourcer';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';

/**
 * 针对给定集合，修正 selects：
 * - 若 fields 中包含单段且为关联名（如 'roles'），则将其从 fields 移到 appends。
 * - 若 fields 中包含多段且首段为关联名（如 'roles.name'），确保 appends 包含该关联名，并将首段替换为模型真实关联名。
 * - 非关联字段：仅当模型存在该属性（或其 snake/camel 变体）时才保留，否则丢弃以避免数据库错误。
 */
export function adjustSelectsForCollection(
  koaCtx: ResourcerContext,
  dataSourceKey: string,
  collection: string,
  fields?: string[],
  appends?: string[],
): { fields?: string[]; appends?: string[] } {
  const ds = koaCtx.app.dataSourceManager.get(dataSourceKey || 'main');
  const cm = ds.collectionManager as SequelizeCollectionManager;
  const coll = cm?.db?.getCollection?.(collection);

  const assocKeys: string[] = Object.keys(coll?.model?.associations || {});
  const rawAttrs: Record<string, unknown> = (coll?.model?.rawAttributes as Record<string, unknown>) || {};
  const toCamel = (s: string) => s.replace(/_([a-zA-Z0-9])/g, (_m, c) => String(c).toUpperCase());
  const toSnake = (s: string) =>
    s
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');

  // 映射：任意大小写/下划线变体 -> 模型实际关联名
  const assocMap = new Map<string, string>();
  for (const k of assocKeys) {
    assocMap.set(k, k);
    assocMap.set(toSnake(k), k);
    assocMap.set(toCamel(k), k);
  }

  const outFields: string[] = [];
  const outAppends: Set<string> = new Set(appends || []);

  for (const f of fields || []) {
    const segs = String(f).split('.').filter(Boolean);
    if (!segs.length) continue;
    const first = segs[0];

    const assocCanonical = assocMap.get(first) || assocMap.get(toCamel(first)) || assocMap.get(toSnake(first));
    if (assocCanonical) {
      outAppends.add(assocCanonical);
      if (segs.length === 1) {
        // 单段关联名作为字段无意义，移除
        continue;
      }
      // 多段：将首段替换为模型真实关联名，保证 OptionsParser 能识别
      outFields.push([assocCanonical, ...segs.slice(1)].join('.'));
      continue;
    }

    // 非关联：仅当模型存在该属性（或其 snake/camel 变体）时才纳入 fields；否则忽略，避免数据库报错
    if (rawAttrs[first]) {
      outFields.push(f);
    } else if (rawAttrs[toSnake(first)]) {
      outFields.push([toSnake(first), ...segs.slice(1)].join('.'));
    } else if (rawAttrs[toCamel(first)]) {
      outFields.push([toCamel(first), ...segs.slice(1)].join('.'));
    } else {
      // 丢弃未知属性，以避免 SQL 报错并尽早暴露为“字段不存在”问题（通过后续解析/校验观察得到）
      continue;
    }
  }

  return {
    fields: outFields.length ? outFields : undefined,
    appends: outAppends.size ? Array.from(outAppends) : undefined,
  };
}
