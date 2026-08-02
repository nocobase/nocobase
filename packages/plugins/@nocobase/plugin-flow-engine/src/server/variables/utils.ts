/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import type { PathSegment } from '../template/variable-expression';
import { inferSelectsFromUsage, type VarUsage } from './registry';
import {
  fetchRecordOrRecordsJson,
  getRecordRequestCache,
  isRecordParams,
  prepareRecordQuery,
  resolveRecordTarget,
  type RecordParams,
  type RecordTarget,
} from './records';

type RecordUsageEntry = {
  params: RecordParams;
  prefix: readonly PathSegment[];
  varName: string;
};

type PrefetchGroup = {
  appends: Set<string>;
  fields: Set<string>;
  filterByTk: unknown;
  preferFullRecord: boolean;
  strictSelects: boolean;
  target: RecordTarget;
};

function collectRecordUsageEntries(contextParams: Record<string, unknown>) {
  const entries: RecordUsageEntry[] = [];
  const normalizeSegment = (segment: string): PathSegment => (/^\d+$/.test(segment) ? Number(segment) : segment);
  const visit = (varName: string, value: unknown, prefix: readonly PathSegment[]) => {
    if (isRecordParams(value)) {
      entries.push({ params: value, prefix, varName });
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      visit(varName, child, [...prefix, Array.isArray(value) ? normalizeSegment(key) : key]);
    }
  };

  for (const [key, value] of Object.entries(contextParams)) {
    const [varName, ...nested] = key.split('.');
    visit(varName, value, nested.map(normalizeSegment));
  }
  return entries;
}

function startsWithSegments(path: readonly PathSegment[], prefix: readonly PathSegment[]) {
  return prefix.every((segment, index) => path[index] === segment);
}

/**
 * Merge record selects for one resolve request and populate the request cache once per target.
 */
export async function prefetchRecordsForResolve(
  koaCtx: ResourcerContext,
  items: Array<{ usage: VarUsage; contextParams?: Record<string, unknown> }>,
) {
  const log = koaCtx.app?.logger?.child({ module: 'plugin-flow-engine', submodule: 'variables.prefetch' });
  try {
    const groups = new Map<string, PrefetchGroup>();
    for (const item of items) {
      for (const entry of collectRecordUsageEntries(item.contextParams || {})) {
        const refs = item.usage[entry.varName] || [];
        const relativePaths = refs
          .map((ref) => ref.runtimeSegments)
          .filter((path) => startsWithSegments(path, entry.prefix))
          .map((path) => path.slice(entry.prefix.length));
        if (!relativePaths.length) continue;

        const target = resolveRecordTarget(koaCtx, entry.params);
        if (!target) continue;
        const strictSelects = Array.isArray(entry.params.fields) || Array.isArray(entry.params.appends);
        const key = JSON.stringify({
          ...target.cacheIdentity,
          tk: entry.params.filterByTk,
          strict: strictSelects,
          f: strictSelects && entry.params.fields ? entry.params.fields.slice().sort() : undefined,
          a: strictSelects && entry.params.appends ? entry.params.appends.slice().sort() : undefined,
        });
        let group = groups.get(key);
        if (!group) {
          group = {
            appends: new Set(),
            fields: new Set(),
            filterByTk: entry.params.filterByTk,
            preferFullRecord: false,
            strictSelects,
            target,
          };
          groups.set(key, group);
        }
        const activeGroup = group;
        activeGroup.preferFullRecord ||= relativePaths.some(
          (path) => path.length === 0 || path.some((segment) => typeof segment === 'string' && segment.includes('.')),
        );
        const selects = strictSelects
          ? { generatedFields: entry.params.fields, generatedAppends: entry.params.appends }
          : inferSelectsFromUsage(relativePaths);
        selects.generatedFields?.forEach((field) => activeGroup.fields.add(field));
        selects.generatedAppends?.forEach((append) => activeGroup.appends.add(append));
      }
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
        if (cache.has(query.cacheKey)) continue;
        cache.set(query.cacheKey, await fetchRecordOrRecordsJson(query.repository, query));
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
