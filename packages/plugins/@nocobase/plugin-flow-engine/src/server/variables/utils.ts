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
import { adjustSelectsForCollection } from './selects';
import { fetchRecordOrRecordsJson, getExtraKeyFieldsForSelect } from './records';

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
        // 空数组不应退化为“无条件查询”，直接跳过预取
        if (Array.isArray(filterByTk) && filterByTk.length === 0) continue;
        const group = ensureGroup(dataSourceKey, collection, filterByTk);
        let { generatedAppends, generatedFields } = inferSelectsFromUsage(remainders);
        const fixed = adjustSelectsForCollection(koaCtx, dataSourceKey, collection, generatedFields, generatedAppends);
        generatedFields = fixed.fields;
        generatedAppends = fixed.appends;
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
        // 确保预取字段包含主键，仅当模型声明了主键并存在于 rawAttributes 中时才注入
        const modelInfo = (
          repo as unknown as {
            collection?: { model?: { primaryKeyAttribute?: string; rawAttributes?: Record<string, unknown> } };
          }
        ).collection?.model;
        const pkAttr = modelInfo?.primaryKeyAttribute;
        const pkIsValid =
          pkAttr && modelInfo?.rawAttributes && Object.prototype.hasOwnProperty.call(modelInfo.rawAttributes, pkAttr);
        const filterTargetKey = (repo as any)?.collection?.filterTargetKey as string | string[] | undefined;
        const extraKeyFields = getExtraKeyFieldsForSelect(filterByTk, {
          filterTargetKey,
          pkAttr: pkAttr as string | undefined,
          pkIsValid,
          rawAttributes: modelInfo?.rawAttributes,
        });
        // 仅在启用 fields 选择时追加 key 字段；否则 fields=undefined 会默认返回全字段，无需补齐
        if (fields.size && extraKeyFields.length) {
          extraKeyFields.forEach((f) => fields.add(f));
        }
        const fld = fields.size ? Array.from(fields).sort() : undefined;
        const app = appends.size ? Array.from(appends).sort() : undefined;
        const json = await fetchRecordOrRecordsJson(repo as any, {
          filterByTk,
          preferFullRecord: false,
          fields: fld,
          appends: app,
          filterTargetKey,
          pkAttr: pkAttr as string | undefined,
          pkIsValid,
        });
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
    koaCtx.app?.logger
      ?.child({ module: 'plugin-flow-engine', submodule: 'variables.prefetch' })
      ?.debug('[variables.resolve] prefetch fatal error', { error: e?.message || String(e) });
  }
}
