/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NAMESPACE } from '../locale';

export const TEMPLATE_LIST_PAGE_SIZE = 20;

export function normalizeStr(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const v = value.trim();
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

export function parseResourceListResponse<T = any>(res: any): { rows: T[]; count?: number } {
  let cur = res;
  if (cur && typeof cur === 'object' && 'data' in cur) {
    cur = (cur as any).data;
  }

  // unwrap nested `data` layers (axios/rc-request differences)
  for (let i = 0; i < 4; i++) {
    if (Array.isArray(cur)) break;
    if (cur && typeof cur === 'object' && Array.isArray((cur as any).rows)) break;
    if (cur && typeof cur === 'object' && 'data' in cur) {
      cur = (cur as any).data;
      continue;
    }
    break;
  }

  const rows = Array.isArray(cur?.rows) ? cur.rows : Array.isArray(cur) ? cur : [];
  const count = toFiniteNumber((cur as any)?.count ?? (cur as any)?.total ?? (cur as any)?.totalCount);
  return { rows, count };
}

export function calcHasMore(args: { page: number; pageSize: number; rowsLength: number; count?: number }): boolean {
  const count = args.count;
  if (typeof count === 'number') {
    return args.page * args.pageSize < count;
  }
  return args.rowsLength >= args.pageSize;
}

export function tWithNs(ctx: any, key: string, options?: Record<string, any>): string {
  const opt = { ns: [NAMESPACE, 'client'], nsMode: 'fallback', ...(options || {}) };
  return typeof ctx?.t === 'function' ? ctx.t(key, opt) : key;
}

function getDataSourceManager(ctx: any, override?: any) {
  return (
    override ||
    ctx?.dataSourceManager ||
    ctx?.model?.context?.dataSourceManager ||
    ctx?.engine?.context?.dataSourceManager
  );
}

export function resolveTargetResourceByAssociation(
  ctx: any,
  init: { dataSourceKey?: unknown; collectionName?: unknown; associationName?: unknown },
  options?: { dataSourceManager?: any },
): { dataSourceKey: string; collectionName: string } | undefined {
  const dataSourceKey = normalizeStr(init?.dataSourceKey);
  const collectionName = normalizeStr(init?.collectionName);
  const associationName = normalizeStr(init?.associationName);
  if (!dataSourceKey || !associationName) return undefined;

  const parts = associationName.split('.').filter(Boolean);
  const inferredBaseCollectionName = parts.length > 1 ? parts[0] : '';
  const baseCollectionName = inferredBaseCollectionName || collectionName;
  const fieldPath = parts.length > 1 ? parts.slice(1).join('.') : associationName;
  if (!baseCollectionName || !fieldPath) return undefined;

  const dsManager = getDataSourceManager(ctx, options?.dataSourceManager);
  const baseCollection = dsManager?.getCollection?.(dataSourceKey, baseCollectionName);
  const field = baseCollection?.getFieldByPath?.(fieldPath) || baseCollection?.getField?.(fieldPath);
  const targetCollection = field?.targetCollection;
  const targetDataSourceKey = normalizeStr(targetCollection?.dataSourceKey);
  const targetCollectionName = normalizeStr(targetCollection?.name);
  if (!targetDataSourceKey || !targetCollectionName) return undefined;
  return { dataSourceKey: targetDataSourceKey, collectionName: targetCollectionName };
}

export function resolveBaseResourceByAssociation(init: {
  dataSourceKey?: unknown;
  collectionName?: unknown;
  associationName?: unknown;
}): { dataSourceKey: string; collectionName: string } | undefined {
  const dataSourceKey = normalizeStr(init?.dataSourceKey);
  const collectionName = normalizeStr(init?.collectionName);
  const associationName = normalizeStr(init?.associationName);
  if (!dataSourceKey || !associationName) return undefined;

  const parts = associationName.split('.').filter(Boolean);
  const inferredBaseCollectionName = parts.length > 1 ? parts[0] : '';
  const baseCollectionName = inferredBaseCollectionName || collectionName;
  if (!baseCollectionName) return undefined;
  return { dataSourceKey, collectionName: baseCollectionName };
}

export function resolveExpectedResourceInfoByModelChain(
  ctx: any,
  startModel?: any,
  options?: {
    maxDepth?: number;
    dataSourceManager?: any;
    fallbackCollectionFromCtx?: boolean;
    includeAssociationName?: boolean;
  },
): { dataSourceKey?: string; collectionName?: string; associationName?: string } {
  const maxDepth = options?.maxDepth ?? 8;
  const includeAssociationName = !!options?.includeAssociationName;
  const fallbackCollectionFromCtx = !!options?.fallbackCollectionFromCtx;

  let cur: any = startModel;
  let depth = 0;
  while (cur && depth < maxDepth) {
    const init = cur?.getStepParams?.('resourceSettings', 'init') || {};
    const expectedAssociationName = normalizeStr(init?.associationName);

    const assocResolved = resolveTargetResourceByAssociation(ctx, init, {
      dataSourceManager: options?.dataSourceManager,
    });
    if (assocResolved) {
      return {
        ...assocResolved,
        ...(includeAssociationName && expectedAssociationName ? { associationName: expectedAssociationName } : {}),
      };
    }

    try {
      const c = (cur as any)?.collection || (fallbackCollectionFromCtx ? (ctx as any)?.collection : undefined);
      const dataSourceKey = normalizeStr(c?.dataSourceKey);
      const collectionName = normalizeStr(c?.name);
      if (dataSourceKey && collectionName) {
        return {
          dataSourceKey,
          collectionName,
          ...(includeAssociationName && expectedAssociationName ? { associationName: expectedAssociationName } : {}),
        };
      }
    } catch {
      // ignore
    }

    const dataSourceKey = normalizeStr(init?.dataSourceKey);
    const collectionName = normalizeStr(init?.collectionName);
    if (dataSourceKey && collectionName) {
      return {
        dataSourceKey,
        collectionName,
        ...(includeAssociationName && expectedAssociationName ? { associationName: expectedAssociationName } : {}),
      };
    }

    cur = cur?.parent;
    depth++;
  }
  return {};
}

export type TemplateAssociationMatchStrategy = 'none' | 'exactIfTemplateHasAssociationName' | 'associationResourceOnly';

/**
 * 推断弹窗模板是否需要 record/source 上下文。
 * 用于避免 Collection 模板被误判为 Record 模板（尤其是默认值里带 `{{ ctx.record.* }}` 的情况）。
 */
export type PopupTemplateContextFlags = {
  hasFilterByTk: boolean;
  hasSourceId: boolean;
  /** 是否有足够信息确定 hasFilterByTk（用于运行时决定是否覆盖） */
  confidentFilterByTk: boolean;
  /** 是否有足够信息确定 hasSourceId */
  confidentSourceId: boolean;
};

export type ActionSceneType = 'record' | 'collection' | 'both' | undefined;

/**
 * 根据 Model 类的 _isScene 方法推断 action 场景类型
 */
export function resolveActionScene(
  getModelClass: ((use: string) => any) | undefined,
  useModel?: unknown,
): ActionSceneType {
  const useKey = normalizeStr(useModel);
  if (!useKey || !getModelClass) return undefined;
  const ModelClass = getModelClass(useKey);
  if (!ModelClass) return undefined;
  const isScene = ModelClass?._isScene;
  if (typeof isScene !== 'function') return undefined;
  const isRecord = !!isScene.call(ModelClass, 'record');
  const isCollection = !!isScene.call(ModelClass, 'collection');
  if (isRecord && isCollection) return 'both';
  if (isRecord) return 'record';
  if (isCollection) return 'collection';
  return undefined;
}

const includesRecordVar = (expr: string): boolean => expr.includes('ctx.record');
const includesResourceVar = (expr: string): boolean => expr.includes('ctx.resource');

/**
 * 推断弹窗模板的 filterByTk/sourceId 上下文需求
 */
export function inferPopupTemplateContextFlags(
  scene: ActionSceneType,
  filterByTkExpr?: string,
  sourceIdExpr?: string,
): PopupTemplateContextFlags {
  const filterByTkStr = normalizeStr(filterByTkExpr);
  const sourceIdStr = normalizeStr(sourceIdExpr);

  const isCollectionOnly = scene === 'collection';
  const isRecordOnly = scene === 'record';

  let hasFilterByTk = false;
  let confidentFilterByTk = false;

  if (filterByTkStr) {
    // Collection-only 模板里出现 `{{ ctx.record.* }}` 通常来自默认值，不应视为"模板需要 record 场景"
    if (isCollectionOnly && includesRecordVar(filterByTkStr)) {
      hasFilterByTk = false;
      confidentFilterByTk = true;
    } else {
      hasFilterByTk = true;
      confidentFilterByTk = true;
    }
  } else if (isRecordOnly) {
    // record 场景模板未配置 filterByTk 时，仍按 record 场景处理
    hasFilterByTk = true;
    confidentFilterByTk = true;
  } else if (isCollectionOnly) {
    hasFilterByTk = false;
    confidentFilterByTk = true;
  } else {
    hasFilterByTk = false;
    confidentFilterByTk = false;
  }

  let hasSourceId = false;
  let confidentSourceId = false;

  if (sourceIdStr) {
    // Collection-only 模板里出现 `{{ ctx.resource.* }}` 大多无意义，避免把 Record/关联上下文的 sourceId 透传到纯 collection 模板
    if (isCollectionOnly && includesResourceVar(sourceIdStr)) {
      hasSourceId = false;
      confidentSourceId = true;
    } else {
      hasSourceId = true;
      confidentSourceId = true;
    }
  } else {
    hasSourceId = false;
    // sourceId 没有强推断规则：仅在显式存在时才认为模板需要
    confidentSourceId = false;
  }

  return { hasFilterByTk, hasSourceId, confidentFilterByTk, confidentSourceId };
}

/**
 * 从已保存的 openView params 中提取 PopupTemplateContextFlags（用于 copy 模式或无法获取模板记录时的兜底）
 */
export function extractPopupTemplateContextFlagsFromParams(params: {
  popupTemplateHasFilterByTk?: boolean;
  popupTemplateHasSourceId?: boolean;
}): PopupTemplateContextFlags {
  return {
    hasFilterByTk: typeof params?.popupTemplateHasFilterByTk === 'boolean' ? params.popupTemplateHasFilterByTk : false,
    hasSourceId: typeof params?.popupTemplateHasSourceId === 'boolean' ? params.popupTemplateHasSourceId : false,
    confidentFilterByTk: false,
    confidentSourceId: false,
  };
}

export function getTemplateAvailabilityDisabledReason(
  ctx: any,
  tpl: { dataSourceKey?: unknown; collectionName?: unknown; associationName?: unknown },
  expected: { dataSourceKey?: unknown; collectionName?: unknown; associationName?: unknown },
  options?: { dataSourceManager?: any; checkResource?: boolean; associationMatch?: TemplateAssociationMatchStrategy },
): string | undefined {
  const checkResource = options?.checkResource !== false;
  const associationMatch = options?.associationMatch ?? 'none';

  const expectedDataSourceKey = normalizeStr(expected?.dataSourceKey);
  const expectedCollectionName = normalizeStr(expected?.collectionName);
  const expectedAssociationName = normalizeStr(expected?.associationName);

  const tplAssociationName = normalizeStr(tpl?.associationName);

  const getAssociationMismatchReason = (): string | undefined => {
    if (associationMatch === 'none') return undefined;
    if (associationMatch === 'exactIfTemplateHasAssociationName') {
      if (!tplAssociationName) return undefined;
      if (expectedAssociationName === tplAssociationName) return undefined;
      const none = tWithNs(ctx, 'No association');
      return tWithNs(ctx, 'Template association mismatch', {
        expected: expectedAssociationName || none,
        actual: tplAssociationName || none,
      });
    }

    const isAssociationResource = (v: string) => !!v && v.includes('.');
    const tplAssociationResource = isAssociationResource(tplAssociationName) ? tplAssociationName : '';
    if (!tplAssociationResource) return undefined;
    const expectedAssociationResource = isAssociationResource(expectedAssociationName) ? expectedAssociationName : '';
    if (tplAssociationResource === expectedAssociationResource) return undefined;
    const none = tWithNs(ctx, 'No association');
    return tWithNs(ctx, 'Template association mismatch', {
      expected: expectedAssociationResource || none,
      actual: tplAssociationResource || none,
    });
  };

  if (!checkResource) {
    return getAssociationMismatchReason();
  }

  if (!expectedDataSourceKey || !expectedCollectionName) return undefined;

  const baseTplDataSourceKey = normalizeStr(tpl?.dataSourceKey);
  const baseTplCollectionName = normalizeStr(tpl?.collectionName);
  const tplResolved = tplAssociationName
    ? resolveTargetResourceByAssociation(
        ctx,
        {
          dataSourceKey: baseTplDataSourceKey,
          collectionName: baseTplCollectionName,
          associationName: tplAssociationName,
        },
        { dataSourceManager: options?.dataSourceManager },
      )
    : undefined;
  const tplDataSourceKey = tplResolved?.dataSourceKey || baseTplDataSourceKey;
  const tplCollectionName = tplResolved?.collectionName || baseTplCollectionName;

  if (!tplDataSourceKey || !tplCollectionName) {
    return tWithNs(ctx, 'Template missing data source/collection info');
  }

  if (tplDataSourceKey === expectedDataSourceKey && tplCollectionName === expectedCollectionName) {
    return getAssociationMismatchReason();
  }

  const isSameDataSource = tplDataSourceKey === expectedDataSourceKey;
  if (isSameDataSource) {
    return tWithNs(ctx, 'Template collection mismatch', {
      expected: expectedCollectionName,
      actual: tplCollectionName,
    });
  }
  return tWithNs(ctx, 'Template data source mismatch', {
    expected: `${expectedDataSourceKey}/${expectedCollectionName}`,
    actual: `${tplDataSourceKey}/${tplCollectionName}`,
  });
}
