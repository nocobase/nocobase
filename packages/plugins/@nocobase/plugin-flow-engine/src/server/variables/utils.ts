/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import type { JSONValue } from '../template/resolver';
import { variables, inferSelectsFromUsage } from './registry';

/**
 * 预取：构建“同记录”的字段/关联并集，一次查询写入 ctx.state.__varResolveBatchCache，供后续解析复用
 */
export async function prefetchRecordsForResolve(
  koaCtx: ResourcerContext,
  items: Array<{ template: JSONValue; contextParams?: Record<string, unknown> }>,
) {
  try {
    const log = koaCtx.app?.logger?.child({ module: 'plugin-flow-engine', submodule: 'variables.prefetch' });
    const groupMap = new Map<
      string,
      { dataSourceKey: string; collection: string; filterByTk: unknown; fields: Set<string>; appends: Set<string> }
    >();

    const ensureGroup = (dataSourceKey: string, collection: string, filterByTk: unknown) => {
      const groupKey = JSON.stringify({ ds: dataSourceKey, collection, tk: filterByTk });
      let group = groupMap.get(groupKey);
      if (!group) {
        group = { dataSourceKey, collection, filterByTk, fields: new Set<string>(), appends: new Set<string>() };
        groupMap.set(groupKey, group);
      }
      return group;
    };

    const normalizeNestedSeg = (segment: string): string => (/^\d+$/.test(segment) ? `[${segment}]` : segment);

    for (const it of items) {
      const template = it?.template ?? {};
      const contextParams = (it?.contextParams || {}) as Record<string, any>;
      const usage = variables.extractUsage(template);
      for (const [cpKey, recordParams] of Object.entries(contextParams)) {
        const parts = String(cpKey).split('.');
        const varName = parts[0];
        const nestedSeg = parts.slice(1).join('.');
        const paths = usage?.[varName] || [];
        if (!paths.length) continue;
        const segNorm = nestedSeg ? normalizeNestedSeg(nestedSeg) : '';
        const remainders: string[] = [];
        for (const p of paths) {
          if (!segNorm) remainders.push(p);
          else if (p === segNorm) remainders.push('');
          else if (p.startsWith(`${segNorm}.`) || p.startsWith(`${segNorm}[`))
            remainders.push(p.slice(segNorm.length + 1));
        }
        if (!remainders.length) continue;
        const dataSourceKey = (recordParams as any)?.dataSourceKey || 'main';
        const collection = (recordParams as any)?.collection;
        const filterByTk = (recordParams as any)?.filterByTk;
        if (!collection || typeof filterByTk === 'undefined') continue;
        const group = ensureGroup(dataSourceKey, collection, filterByTk);
        const { generatedAppends, generatedFields } = inferSelectsFromUsage(remainders);
        if (generatedFields?.length) generatedFields.forEach((f) => group.fields.add(f));
        if (generatedAppends?.length) generatedAppends.forEach((a) => group.appends.add(a));
      }
    }

    if (!groupMap.size) return;

    // 确保请求级缓存存在
    const stateObj = (koaCtx as any).state as Record<string, any>;
    if (stateObj && !stateObj['__varResolveBatchCache']) {
      stateObj['__varResolveBatchCache'] = new Map<string, unknown>();
    }
    const cache: Map<string, unknown> | undefined = (koaCtx as any).state?.['__varResolveBatchCache'];

    for (const { dataSourceKey, collection, filterByTk, fields, appends } of groupMap.values()) {
      try {
        const ds = koaCtx.app.dataSourceManager.get(dataSourceKey);
        const cm = ds.collectionManager as SequelizeCollectionManager;
        if (!cm?.db) continue;
        const repo = cm.db.getRepository(collection);
        const fld = fields.size ? Array.from(fields).sort() : undefined;
        const app = appends.size ? Array.from(appends).sort() : undefined;
        const rec = await repo.findOne({ filterByTk: filterByTk as any, fields: fld, appends: app });
        const json = rec ? rec.toJSON() : undefined;
        if (cache) {
          const key = JSON.stringify({ ds: dataSourceKey, c: collection, tk: filterByTk, f: fld, a: app });
          cache.set(key, json);
        }
      } catch (e: any) {
        // 忽略预取失败，但记录为 debug
        log?.debug('[variables.resolve] prefetch query error', {
          ds: dataSourceKey,
          collection,
          tk: filterByTk,
          error: e?.message || String(e),
        });
      }
    }
  } catch (e: any) {
    // 忽略预取失败，但记录为 debug
    koaCtx.app?.logger
      ?.child({ module: 'plugin-flow-engine', submodule: 'variables.prefetch' })
      ?.debug('[variables.resolve] prefetch fatal error', { error: e?.message || String(e) });
  }
}
