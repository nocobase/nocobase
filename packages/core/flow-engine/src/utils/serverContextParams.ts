/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext } from '../flowContext';

export type RecordRef = {
  collection?: string;
  id?: any; // primary key value
  filterByTk?: any; // alias for id
  dataSourceKey?: string;
  fields?: string[];
  appends?: string[];
  record?: any; // full record object (try to infer pk from it)
};

// Arbitrary key input and flattened output (dot-joined keys)
export type BuildServerContextParamsInput = Record<string, any>;
export type ServerContextParams = Record<string, NormalizedRecordParams>;

export type NormalizedRecordParams = {
  collection: string;
  filterByTk: any;
  dataSourceKey?: string;
  fields?: string[];
  appends?: string[];
};

function pickDefined<T extends object>(obj: T): T {
  const out: any = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (typeof v !== 'undefined' && v !== null) out[k] = v;
  });
  return out as T;
}

function resolvePrimaryKey(ctx: FlowContext, dataSourceKey: string, collection: string): string | undefined {
  try {
    const ds = ctx.dataSourceManager?.getDataSource?.(dataSourceKey || 'main');
    const col = ds?.collectionManager?.getCollection?.(collection);
    const pk = col?.getPrimaryKey?.();
    return pk || 'id';
  } catch (e) {
    return 'id';
  }
}

function normalizeOne(ctx: FlowContext, ref?: RecordRef): NormalizedRecordParams | undefined {
  if (!ref) return undefined;
  const dataSourceKey = ref.dataSourceKey || 'main';
  const collection = ref.collection || ref.record?.__collectionName;
  if (!collection) return undefined;
  const pk = resolvePrimaryKey(ctx, dataSourceKey, collection) || 'id';
  const filterByTk =
    typeof ref.filterByTk !== 'undefined' ? ref.filterByTk : typeof ref.id !== 'undefined' ? ref.id : ref.record?.[pk];
  if (typeof filterByTk === 'undefined') return undefined;
  return pickDefined({
    collection,
    filterByTk,
    dataSourceKey,
    fields: ref.fields,
    appends: ref.appends,
  });
}

export function buildServerContextParams(
  ctx: FlowContext,
  input: BuildServerContextParamsInput = {},
): ServerContextParams | undefined {
  // Helper: detect a record-like object
  const isRecordRef = (val: any) => {
    if (!val || typeof val !== 'object') return false;
    return (
      typeof (val as any).collection === 'string' &&
      (typeof (val as any).filterByTk !== 'undefined' || typeof (val as any).id !== 'undefined' || (val as any).record)
    );
  };

  const out: Record<string, NormalizedRecordParams> = {};

  const visit = (src: any, path: string[]) => {
    if (isRecordRef(src)) {
      const norm = normalizeOne(ctx, src as RecordRef);
      if (norm) {
        const key = path.join('.');
        out[key] = norm;
      }
      return;
    }
    if (Array.isArray(src)) {
      for (let i = 0; i < src.length; i++) {
        visit(src[i], [...path, String(i)]);
      }
      return;
    }
    if (src && typeof src === 'object') {
      for (const [k, v] of Object.entries(src)) {
        visit(v, [...path, k]);
      }
      return;
    }
  };

  visit(input, []);
  return Object.keys(out).length ? out : undefined;
}
