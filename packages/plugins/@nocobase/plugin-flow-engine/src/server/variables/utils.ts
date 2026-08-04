/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import type { AuthorizedRecordBinding } from './record-bindings';
import { inferSelectsFromUsage, isSafeRecordBinding } from './registry';
import {
  fetchRecordOrRecordsJson,
  findRecordRequestCacheValue,
  getRecordRequestCache,
  prepareRecordQuery,
  resolveRecordTarget,
  setRecordRequestCache,
  type RecordTarget,
} from './records';

type PrefetchGroup = {
  appends: Set<string>;
  fields: Set<string>;
  filterByTk: unknown;
  preferFullRecord: boolean;
  strictSelects: boolean;
  target: RecordTarget;
};

/**
 * Merge record selects for one resolve request and populate the request cache once per target.
 */
export async function prefetchRecordsForResolve(
  koaCtx: ResourcerContext,
  bindings: readonly AuthorizedRecordBinding[],
) {
  const log = koaCtx.app?.logger?.child({ module: 'plugin-flow-engine', submodule: 'variables.prefetch' });
  try {
    const groups = new Map<string, PrefetchGroup>();
    for (const binding of bindings) {
      if (!isSafeRecordBinding(binding)) continue;
      const target = resolveRecordTarget(koaCtx, binding.params);
      if (!target) continue;
      const strictSelects = Array.isArray(binding.params.fields) || Array.isArray(binding.params.appends);
      const key = JSON.stringify({
        ...target.cacheIdentity,
        tk: binding.params.filterByTk,
        strict: strictSelects,
        f: strictSelects && binding.params.fields ? binding.params.fields.slice().sort() : undefined,
        a: strictSelects && binding.params.appends ? binding.params.appends.slice().sort() : undefined,
      });
      let group = groups.get(key);
      if (!group) {
        group = {
          appends: new Set(),
          fields: new Set(),
          filterByTk: binding.params.filterByTk,
          preferFullRecord: false,
          strictSelects,
          target,
        };
        groups.set(key, group);
      }
      const activeGroup = group;
      activeGroup.preferFullRecord ||=
        binding.preferFullRecord ||
        binding.relativePaths.some(
          (path) => path.length === 0 || path.some((segment) => typeof segment === 'string' && segment.includes('.')),
        );
      const selects = strictSelects
        ? { generatedFields: binding.params.fields, generatedAppends: binding.params.appends }
        : inferSelectsFromUsage(binding.relativePaths);
      selects.generatedFields?.forEach((field) => activeGroup.fields.add(field));
      selects.generatedAppends?.forEach((append) => activeGroup.appends.add(append));
    }

    const cache = getRecordRequestCache(koaCtx);
    for (const group of groups.values()) {
      try {
        const query = prepareRecordQuery(
          koaCtx,
          group.target,
          group.filterByTk,
          group.fields.size ? [...group.fields] : undefined,
          group.appends.size ? [...group.appends] : undefined,
          group.strictSelects,
          group.preferFullRecord,
        );
        if (findRecordRequestCacheValue(cache, query).hit) continue;
        setRecordRequestCache(cache, query, await fetchRecordOrRecordsJson(query.repository, query));
      } catch (error) {
        log?.debug('[variables.resolve] prefetch query error', {
          ...group.target.cacheIdentity,
          tk: group.filterByTk,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } catch (error) {
    log?.debug('[variables.resolve] prefetch fatal error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
