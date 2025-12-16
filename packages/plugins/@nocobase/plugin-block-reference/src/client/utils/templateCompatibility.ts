/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NAMESPACE } from '../locale';

export function normalizeStr(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
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
