/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection, RelationRepository, Repository, TargetKey } from '@nocobase/database';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import type { ResourcerContext } from '@nocobase/resourcer';
import _ from 'lodash';
import { adjustSelectsForCollection } from './selects';

type FilterTargetKey = string | string[] | undefined;
type RecordRepository = Repository | RelationRepository;

export type RecordParams = {
  associationName?: string;
  collection: string;
  dataSourceKey?: string;
  filterByTk: unknown;
  sourceId?: unknown;
  fields?: string[];
  appends?: string[];
};

export type RecordTarget = {
  repository: RecordRepository;
  dataSourceKey: string;
  collection: Collection;
  collectionName: string;
  filterTargetKey: FilterTargetKey;
  pkAttr?: string;
  pkIsValid: boolean;
  rawAttributes?: Record<string, unknown>;
  cacheIdentity: Readonly<{
    ds: string;
    c: string;
    assoc?: string;
    sid?: unknown;
  }>;
};

export type RecordQuery = RecordTarget & {
  filterByTk: unknown;
  fields?: string[];
  appends?: string[];
  preferFullRecord: boolean;
  strictSelects: boolean;
  cacheKey: string;
};

type RequestCacheContext = ResourcerContext & {
  state?: Record<string, unknown> & {
    __varResolveBatchCache?: Map<string, unknown>;
    __varResolveRecordTargets?: Map<string, RecordTarget | undefined>;
  };
};

type RecordCacheMetadata = {
  appends?: ReadonlySet<string>;
  baseIdentityKey: string;
  cacheIdentity: Readonly<{
    assoc?: string;
    c?: string;
    ds?: string;
    sid?: unknown;
    tk?: unknown;
  }>;
  fields?: ReadonlySet<string>;
  full: boolean;
};

type SerializedRecordQuery = {
  a?: string[];
  assoc?: string;
  c?: string;
  ds?: string;
  f?: string[];
  full?: boolean;
  sid?: unknown;
  tk?: unknown;
};

function sortIdentityValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortIdentityValue);
  if (!_.isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortIdentityValue(child)]),
  );
}

function getBaseIdentityKey(identity: { assoc?: string; c?: string; ds?: string; sid?: unknown; tk?: unknown }) {
  return JSON.stringify(sortIdentityValue(identity));
}

function createCacheMetadata(query: SerializedRecordQuery): RecordCacheMetadata {
  const cacheIdentity = {
    ds: query.ds,
    c: query.c,
    assoc: query.assoc,
    sid: query.sid,
    tk: query.tk,
  };
  return {
    appends: query.a ? new Set(query.a) : undefined,
    baseIdentityKey: getBaseIdentityKey(cacheIdentity),
    cacheIdentity,
    fields: query.f ? new Set(query.f) : undefined,
    full: query.full === true,
  };
}

class RecordRequestCache extends Map<string, unknown> {
  private readonly keysByBaseIdentity = new Map<string, Set<string>>();
  private readonly metadataByKey = new Map<string, RecordCacheMetadata>();

  constructor(entries?: Map<string, unknown>) {
    super();
    entries?.forEach((value, key) => this.set(key, value));
  }

  set(cacheKey: string, value: unknown): this {
    let metadata: RecordCacheMetadata | undefined;
    try {
      metadata = createCacheMetadata(JSON.parse(cacheKey) as SerializedRecordQuery);
    } catch (_) {
      // Preserve Map compatibility for legacy or non-record entries without indexing them.
    }
    return this.setWithMetadata(cacheKey, value, metadata);
  }

  setQuery(query: RecordQuery, value: unknown): this {
    return this.setWithMetadata(
      query.cacheKey,
      value,
      createCacheMetadata({
        ...query.cacheIdentity,
        tk: query.filterByTk,
        f: query.fields,
        a: query.appends,
        full: query.preferFullRecord,
      }),
    );
  }

  delete(cacheKey: string): boolean {
    this.removeFromIndex(cacheKey);
    return super.delete(cacheKey);
  }

  clear(): void {
    super.clear();
    this.keysByBaseIdentity.clear();
    this.metadataByKey.clear();
  }

  *candidates(query: RecordQuery): IterableIterator<[RecordCacheMetadata, unknown]> {
    const baseIdentityKey = getBaseIdentityKey({
      ...query.cacheIdentity,
      tk: query.filterByTk,
    });
    for (const cacheKey of this.keysByBaseIdentity.get(baseIdentityKey) || []) {
      const metadata = this.metadataByKey.get(cacheKey);
      if (metadata && super.has(cacheKey)) yield [metadata, super.get(cacheKey)];
    }
  }

  private setWithMetadata(cacheKey: string, value: unknown, metadata?: RecordCacheMetadata): this {
    this.removeFromIndex(cacheKey);
    super.set(cacheKey, value);
    if (!metadata) return this;

    this.metadataByKey.set(cacheKey, metadata);
    let keys = this.keysByBaseIdentity.get(metadata.baseIdentityKey);
    if (!keys) {
      keys = new Set();
      this.keysByBaseIdentity.set(metadata.baseIdentityKey, keys);
    }
    keys.add(cacheKey);
    return this;
  }

  private removeFromIndex(cacheKey: string) {
    const metadata = this.metadataByKey.get(cacheKey);
    if (!metadata) return;
    const keys = this.keysByBaseIdentity.get(metadata.baseIdentityKey);
    keys?.delete(cacheKey);
    if (!keys?.size) this.keysByBaseIdentity.delete(metadata.baseIdentityKey);
    this.metadataByKey.delete(cacheKey);
  }
}

export function isRecordParams(value: unknown): value is RecordParams {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as { collection?: unknown }).collection === 'string' &&
    Object.prototype.hasOwnProperty.call(value, 'filterByTk')
  );
}

export function resolveRecordTarget(koaCtx: ResourcerContext, params: RecordParams): RecordTarget | undefined {
  const dataSourceKey = params.dataSourceKey || 'main';
  const usesAssociation = !!(params.associationName && typeof params.sourceId !== 'undefined');
  const context = koaCtx as RequestCacheContext;
  if (!context.state) context.state = {};
  const targets = (context.state.__varResolveRecordTargets ??= new Map());
  const requestKey = JSON.stringify({
    ds: dataSourceKey,
    c: params.collection,
    assoc: usesAssociation ? params.associationName : undefined,
    sid: usesAssociation ? params.sourceId : undefined,
  });
  if (targets.has(requestKey)) return targets.get(requestKey);

  const ds = koaCtx.app.dataSourceManager.get(dataSourceKey);
  const cm = ds.collectionManager as SequelizeCollectionManager;
  if (!cm?.db) {
    targets.set(requestKey, undefined);
    return undefined;
  }

  const repository = usesAssociation
    ? cm.db.getRepository<RelationRepository>(params.associationName, params.sourceId as TargetKey)
    : cm.db.getRepository<Repository>(params.collection);
  if (!repository) {
    targets.set(requestKey, undefined);
    return undefined;
  }

  const collection =
    ('targetCollection' in repository && repository.targetCollection) ||
    repository.collection ||
    cm.db.getCollection(params.associationName || params.collection);
  if (!collection) {
    targets.set(requestKey, undefined);
    return undefined;
  }

  if (usesAssociation && collection.name !== params.collection) {
    targets.set(requestKey, undefined);
    return undefined;
  }

  const rawAttributes = collection.model?.rawAttributes as Record<string, unknown> | undefined;
  const pkAttr = collection.model?.primaryKeyAttribute;
  const pkIsValid = !!(pkAttr && rawAttributes && Object.prototype.hasOwnProperty.call(rawAttributes, pkAttr));
  const collectionName = collection.name || params.associationName || params.collection;

  const target: RecordTarget = {
    repository,
    dataSourceKey,
    collection,
    collectionName,
    filterTargetKey: collection.filterTargetKey,
    pkAttr,
    pkIsValid,
    rawAttributes,
    cacheIdentity: {
      ds: dataSourceKey,
      c: collectionName,
      assoc: usesAssociation ? params.associationName : undefined,
      sid: usesAssociation ? params.sourceId : undefined,
    },
  };
  targets.set(requestKey, target);
  return target;
}

export function prepareRecordQuery(
  koaCtx: ResourcerContext,
  target: RecordTarget,
  filterByTk: unknown,
  fields?: string[],
  appends?: string[],
  strictSelects = false,
  preferFullRecord = false,
): RecordQuery {
  const adjusted = adjustSelectsForCollection(koaCtx, target.dataSourceKey, target.collectionName, fields, appends);
  const extraKeys = getExtraKeyFieldsForSelect(filterByTk, target);
  const selectedFields = mergeFieldsWithExtras(
    strictSelects && Array.isArray(fields) ? adjusted.fields || [] : adjusted.fields,
    extraKeys,
  );
  const queryFields = preferFullRecord ? undefined : selectedFields?.slice().sort();
  const queryAppends = preferFullRecord ? undefined : adjusted.appends?.slice().sort();
  const cacheKey = JSON.stringify({
    ...target.cacheIdentity,
    tk: filterByTk,
    f: queryFields,
    a: queryAppends,
    full: preferFullRecord || undefined,
    strict: strictSelects || undefined,
  });

  return {
    ...target,
    filterByTk,
    fields: queryFields,
    appends: queryAppends,
    preferFullRecord,
    strictSelects,
    cacheKey,
  };
}

export function getRecordRequestCache(koaCtx: ResourcerContext): Map<string, unknown> {
  const context = koaCtx as RequestCacheContext;
  if (!context.state) context.state = {};
  const existing = context.state.__varResolveBatchCache;
  if (existing instanceof RecordRequestCache) return existing;
  const cache = new RecordRequestCache(existing instanceof Map ? existing : undefined);
  context.state.__varResolveBatchCache = cache;
  return cache;
}

export function setRecordRequestCache(cache: Map<string, unknown>, query: RecordQuery, value: unknown) {
  if (cache instanceof RecordRequestCache) return cache.setQuery(query, value);
  return cache.set(query.cacheKey, value);
}

function cachedQueryCovers(query: RecordQuery, cached: RecordCacheMetadata) {
  if (
    cached.cacheIdentity.ds !== query.cacheIdentity.ds ||
    cached.cacheIdentity.c !== query.cacheIdentity.c ||
    cached.cacheIdentity.assoc !== query.cacheIdentity.assoc ||
    !_.isEqual(cached.cacheIdentity.sid, query.cacheIdentity.sid) ||
    !_.isEqual(cached.cacheIdentity.tk, query.filterByTk)
  ) {
    return false;
  }
  if (cached.full) return true;
  if (query.preferFullRecord) return false;

  const cachedFields = cached.fields || new Set<string>();
  const cachedAppends = cached.appends || new Set<string>();
  const fieldCovered = (field: string) =>
    cachedFields.has(field) || [...cachedAppends].some((append) => field === append || field.startsWith(`${append}.`));
  return (
    (query.fields ? query.fields.every(fieldCovered) : cached.fields === undefined) &&
    (!query.appends || query.appends.every((append) => cachedAppends.has(append)))
  );
}

export function findRecordRequestCacheValue(cache: Map<string, unknown>, query: RecordQuery) {
  if (cache.has(query.cacheKey)) return { hit: true, value: cache.get(query.cacheKey) };
  if (cache instanceof RecordRequestCache) {
    for (const [metadata, value] of cache.candidates(query)) {
      if (cachedQueryCovers(query, metadata)) return { hit: true, value };
    }
  }
  return { hit: false, value: undefined };
}

export async function fetchRecordWithRequestCache(
  koaCtx: ResourcerContext,
  params: RecordParams,
  fields?: string[],
  appends?: string[],
  strictSelects = false,
  preferFullRecord = false,
): Promise<unknown> {
  try {
    const target = resolveRecordTarget(koaCtx, params);
    if (!target) return undefined;
    const query = prepareRecordQuery(
      koaCtx,
      target,
      params.filterByTk,
      fields,
      appends,
      strictSelects,
      preferFullRecord,
    );
    const cache = getRecordRequestCache(koaCtx);
    const cached = findRecordRequestCacheValue(cache, query);
    if (cached.hit) return cached.value;

    const value = await fetchRecordOrRecordsJson(query.repository, query);
    setRecordRequestCache(cache, query, value);
    return value;
  } catch (error) {
    koaCtx.app?.logger
      ?.child({ module: 'plugin-flow-engine', submodule: 'variables.resolve', method: 'fetchRecordWithRequestCache' })
      ?.warn('[variables.resolve] fetchRecordWithRequestCache error', {
        ds: params.dataSourceKey || 'main',
        collection: params.collection,
        tk: params.filterByTk,
        fields,
        appends,
        error: error instanceof Error ? error.message : String(error),
      });
    return undefined;
  }
}

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
  if (!Array.isArray(fields) || extras.length === 0) return fields;
  return uniqStrings([...fields, ...extras]);
}

function toJsonRecord(record: unknown): unknown {
  if (!record || typeof record !== 'object') return record;
  const toJSON = (record as { toJSON?: () => unknown }).toJSON;
  return typeof toJSON === 'function' ? toJSON.call(record) : record;
}

function toJsonArray(rows: unknown): unknown[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(toJsonRecord);
}

/**
 * best-effort: 保持 filterByTk 顺序（仅处理单字段 targetKey + 原始值数组）。
 */
function reorderRecordsByFilterByTk(
  records: unknown[],
  filterByTk: unknown,
  options: { filterTargetKey?: FilterTargetKey; pkAttr?: string; pkIsValid?: boolean },
): unknown[] {
  if (!Array.isArray(filterByTk) || filterByTk.length === 0) return records;
  if (!isPrimitiveTkArray(filterByTk)) return records;

  const orderKey = getOrderKey(options);
  if (!orderKey) return records;

  const map = new Map<string, unknown>();
  for (const rec of records || []) {
    const k = rec && typeof rec === 'object' ? (rec as Record<string, unknown>)[orderKey] : undefined;
    if (typeof k !== 'undefined' && k !== null) {
      map.set(String(k), rec);
    }
  }

  const ordered: unknown[] = [];
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
    const k = rec && typeof rec === 'object' ? (rec as Record<string, unknown>)[orderKey] : undefined;
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
  repo: RecordRepository,
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
      preferFullRecord
        ? { filterByTk: filterByTk as TargetKey }
        : { filterByTk: filterByTk as TargetKey, fields, appends },
    );
    const jsonArr = toJsonArray(rows);
    return reorderRecordsByFilterByTk(jsonArr, filterByTk, params);
  }

  const rec = await repo.findOne(
    preferFullRecord
      ? { filterByTk: filterByTk as TargetKey }
      : { filterByTk: filterByTk as TargetKey, fields, appends },
  );
  return rec ? toJsonRecord(rec) : undefined;
}
