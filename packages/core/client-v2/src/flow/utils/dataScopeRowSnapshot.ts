/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext } from '@nocobase/flow-engine';
import { cloneDeep, isEqual } from 'lodash';
import { namePathToPathKey } from '../models/blocks/form/value-runtime/path';
import { getSubTableRowIdentity } from '../models/fields/AssociationFieldModel/SubTableFieldModel/rowIdentity';
import { getChangedPathsFromPayload, isNamePathPrefix, type FieldIndexEntry, type NamePath } from './formValueDeps';

export type FilterTargetKey = string | string[] | null | undefined;

export type RowIdentity = string;

export type RowScopedFieldIndexEntry = FieldIndexEntry & {
  filterTargetKey?: FilterTargetKey;
};

export type RowScope = {
  entries: RowScopedFieldIndexEntry[];
  tailPath: NamePath;
  identityTailPaths: NamePath[];
};

export type DataScopeValuePath = {
  path: NamePath;
  rowScope?: RowScope;
};

export type DataScopeStructuralPath = {
  path: NamePath;
  kind: 'index' | 'length';
  rowScope?: RowScope;
};

export type DataScopeTriggerPath = {
  path: NamePath;
  includeChildren: boolean;
};

export type DataScopeClearDeps = {
  wildcard: boolean;
  valuePaths: DataScopeValuePath[];
  structuralPaths: DataScopeStructuralPath[];
  triggerPaths: DataScopeTriggerPath[];
};

export type DataScopeSnapshotValue = {
  value: unknown;
  rowIdentities?: Array<RowIdentity | null>;
  rowDetached?: boolean;
};

export type DataScopeClearSnapshot = {
  complete: boolean;
  rowDetached: boolean;
  rowMissing: boolean;
  values: Map<string, DataScopeSnapshotValue>;
  structures: Map<string, DataScopeSnapshotValue>;
};

export type DataScopeClearChangeStatus = {
  status: 'changed' | 'unchanged' | 'unknown';
  snapshot: DataScopeClearSnapshot | null;
};

function normalizeFilterTargetKey(raw: unknown): FilterTargetKey {
  if (Array.isArray(raw)) {
    const keys = raw.filter((key): key is string => typeof key === 'string' && !!key);
    return keys.length ? keys : 'id';
  }
  return typeof raw === 'string' && raw ? raw : 'id';
}

function getAssociationTargetKey(field: any): FilterTargetKey {
  return normalizeFilterTargetKey(
    field?.targetCollection?.filterTargetKey ?? field?.targetCollection?.filterByTk ?? field?.targetKey,
  );
}

function getRootCollection(ctx: FlowContext) {
  const model: any = ctx.model;
  return (
    model?.context?.blockModel?.context?.collection ??
    model?.context?.formBlock?.context?.collection ??
    model?.context?.rootCollection ??
    (ctx as any)?.rootCollection ??
    (ctx as any)?.collection ??
    model?.context?.collectionField?.collection ??
    model?.context?.collection
  );
}

function getFallbackTargetKey(ctx: FlowContext): FilterTargetKey {
  const model: any = ctx.model;
  return normalizeFilterTargetKey(
    model?.context?.collection?.filterTargetKey ??
      model?.context?.collection?.filterByTk ??
      model?.context?.collectionField?.targetCollection?.filterTargetKey ??
      model?.context?.collectionField?.targetCollection?.filterByTk ??
      model?.context?.collectionField?.targetKey,
  );
}

export function applyDataScopeFieldIndexTargetKeys(
  ctx: FlowContext,
  entries: FieldIndexEntry[],
): RowScopedFieldIndexEntry[] {
  let collection = getRootCollection(ctx);
  const fallbackTargetKey = getFallbackTargetKey(ctx);
  return entries.map((entry) => {
    let filterTargetKey: FilterTargetKey = fallbackTargetKey;
    if (collection?.getField) {
      const field = collection.getField(entry.name);
      if (field?.isAssociationField?.() || field?.targetCollection || field?.targetKey) {
        filterTargetKey = getAssociationTargetKey(field);
        collection = field?.targetCollection;
      }
    }
    return { ...entry, filterTargetKey };
  });
}

export function createDataScopeRowScope(
  entries: RowScopedFieldIndexEntry[],
  parentDepth: number,
  tailPath: NamePath,
): RowScope | undefined {
  const targetIndex = entries.length - 1 - parentDepth;
  if (targetIndex < 0) return undefined;
  const targetEntry = entries[targetIndex];
  const targetKey = targetEntry?.filterTargetKey;
  const identityTailPaths = Array.isArray(targetKey)
    ? targetKey.map((key) => [key])
    : typeof targetKey === 'string' && targetKey
      ? [[targetKey]]
      : [];
  return {
    entries: entries.slice(0, targetIndex + 1).map((entry) => ({ ...entry })),
    tailPath,
    identityTailPaths,
  };
}

function hasOwnValue(source: unknown, key: string | number) {
  if (source == null) return false;
  if (Array.isArray(source) && typeof key === 'number') {
    return key >= 0 && key < source.length;
  }
  if (typeof source !== 'object') return false;
  return Object.prototype.hasOwnProperty.call(source, key);
}

function getValueAtPath(source: unknown, path: NamePath): { found: boolean; value?: unknown } {
  let cursor = source;
  for (const seg of path) {
    if (!hasOwnValue(cursor, seg)) {
      return { found: false };
    }
    cursor = (cursor as Record<string | number, unknown>)[seg];
  }
  return { found: true, value: cursor };
}

function getSnapshotSourceFromPayload(payload: unknown) {
  const payloadObj = payload as { allValuesSnapshot?: unknown; allValues?: unknown } | undefined;
  return payloadObj?.allValuesSnapshot ?? payloadObj?.allValues;
}

function getRowIdentity(row: unknown, filterTargetKey: FilterTargetKey): RowIdentity | null {
  if (!row || typeof row !== 'object') return null;
  return getSubTableRowIdentity(row as Record<string, unknown>, filterTargetKey);
}

function getRowScopePath(rowScope: RowScope): NamePath {
  const path: NamePath = [];
  for (const entry of rowScope.entries) {
    path.push(entry.name, entry.index);
  }
  return path;
}

function shouldRefreshRowIdentityFromPayload(
  payload: unknown,
  rowScope: RowScope,
  previousValue?: DataScopeSnapshotValue,
  changedPaths?: NamePath[],
) {
  if (previousValue?.rowDetached) return false;
  const rowPath = getRowScopePath(rowScope);
  if (!rowPath.length || !rowScope.identityTailPaths.length) return false;
  const identityPaths = rowScope.identityTailPaths.map((path) => [...rowPath, ...path]);
  return (changedPaths ?? getChangedPathsFromPayload(payload)).some((changedPath) =>
    identityPaths.some((identityPath) => isNamePathPrefix(identityPath, changedPath)),
  );
}

function findRowIndexByIdentity(
  rows: unknown,
  identity: RowIdentity | null | undefined,
  filterTargetKey: FilterTargetKey,
) {
  if (!Array.isArray(rows) || !identity) return -1;
  return rows.findIndex((row) => getRowIdentity(row, filterTargetKey) === identity);
}

function getRowScopedPathFromSource(
  source: unknown,
  rowScope: RowScope,
  previousRowIdentities?: Array<RowIdentity | null>,
  allowIndexFallbackOnIdentityMiss?: boolean,
): {
  found: boolean;
  rowMissing?: boolean;
  path?: NamePath;
  rowIndex?: number;
  rowIdentities?: Array<RowIdentity | null>;
} {
  let currentPath: NamePath = [];
  let currentRowIndex = -1;
  const rowIdentities: Array<RowIdentity | null> = [];

  for (let index = 0; index < rowScope.entries.length; index++) {
    const entry = rowScope.entries[index];
    const listPath = [...currentPath, entry.name];
    const listResult = getValueAtPath(source, listPath);
    if (!listResult.found) {
      return { found: false };
    }
    if (!Array.isArray(listResult.value)) {
      return { found: false };
    }

    const previousIdentity = previousRowIdentities?.[index];
    const matchedIndex = findRowIndexByIdentity(listResult.value, previousIdentity, entry.filterTargetKey);
    const rowIndex = matchedIndex >= 0 ? matchedIndex : entry.index;
    if (rowIndex < 0 || rowIndex >= listResult.value.length) {
      return previousIdentity ? { found: false, rowMissing: true } : { found: false };
    }

    const row = listResult.value[rowIndex];
    if (previousIdentity && matchedIndex < 0 && !allowIndexFallbackOnIdentityMiss) {
      return { found: false, rowMissing: true };
    }

    rowIdentities.push(getRowIdentity(row, entry.filterTargetKey));
    currentRowIndex = rowIndex;
    currentPath = [...listPath, rowIndex];
  }

  return {
    found: true,
    path: [...currentPath, ...rowScope.tailPath],
    rowIndex: currentRowIndex,
    rowIdentities,
  };
}

function getPathValue(formBlock: any, payload: unknown, path: NamePath): { found: boolean; value?: unknown } {
  const payloadSource = getSnapshotSourceFromPayload(payload);
  const payloadValue = getValueAtPath(payloadSource, path);
  if (payloadValue.found) {
    return payloadValue;
  }

  const form = formBlock?.context?.form;
  if (typeof form?.getFieldValue === 'function') {
    return { found: true, value: form.getFieldValue(path) };
  }

  return getValueAtPath(formBlock?.context?.formValues, path);
}

function getRowScopedPathValue(
  formBlock: any,
  payload: unknown,
  valuePath: DataScopeValuePath,
  previousValue?: DataScopeSnapshotValue,
  changedPaths?: NamePath[],
): { found: boolean; rowMissing?: boolean; value?: unknown; rowIdentities?: Array<RowIdentity | null> } {
  const rowScope = valuePath.rowScope;
  if (!rowScope) {
    return getPathValue(formBlock, payload, valuePath.path);
  }
  if (previousValue?.rowDetached) {
    return { found: false, rowMissing: true };
  }

  const allowIndexFallbackOnIdentityMiss = shouldRefreshRowIdentityFromPayload(
    payload,
    rowScope,
    previousValue,
    changedPaths,
  );
  const sourceCandidates = [getSnapshotSourceFromPayload(payload), formBlock?.context?.formValues];
  for (const source of sourceCandidates) {
    const scopedPath = getRowScopedPathFromSource(
      source,
      rowScope,
      previousValue?.rowIdentities,
      allowIndexFallbackOnIdentityMiss,
    );
    if (scopedPath.rowMissing) {
      return { found: false, rowMissing: true };
    }
    if (!scopedPath.found || !scopedPath.path) {
      continue;
    }
    const result = getValueAtPath(source, scopedPath.path);
    if (result.found) {
      return {
        found: true,
        value: result.value,
        rowIdentities: scopedPath.rowIdentities,
      };
    }
  }

  const form = formBlock?.context?.form;
  if (typeof form?.getFieldValue === 'function') {
    return {
      found: true,
      value: form.getFieldValue(valuePath.path),
      rowIdentities: previousValue?.rowIdentities,
    };
  }

  return { found: false };
}

function getStructuralLengthValue(value: unknown) {
  return Array.isArray(value) ? value.length : value;
}

function getStructuralIndexValueFromList(
  value: unknown,
  structuralPath: DataScopeStructuralPath,
  previousValue?: DataScopeSnapshotValue,
): { found: boolean; rowMissing?: boolean; value?: unknown; rowIdentities?: Array<RowIdentity | null> } {
  if (!Array.isArray(value)) {
    return { found: true, value };
  }

  const previousRowIdentity = previousValue?.rowIdentities?.[previousValue.rowIdentities.length - 1];
  const entry = structuralPath.rowScope?.entries[structuralPath.rowScope.entries.length - 1];
  const matchedIndex = findRowIndexByIdentity(value, previousRowIdentity, entry?.filterTargetKey);
  if (matchedIndex >= 0) {
    return {
      found: true,
      value: matchedIndex,
      rowIdentities: previousValue?.rowIdentities,
    };
  }

  if (previousRowIdentity) {
    return { found: false, rowMissing: true };
  }

  if (!entry || entry.index < 0 || entry.index >= value.length) {
    return { found: false };
  }

  return {
    found: true,
    value: entry.index,
    rowIdentities: [getRowIdentity(value[entry.index], entry.filterTargetKey)],
  };
}

function getStructuralPathValue(
  formBlock: any,
  payload: unknown,
  structuralPath: DataScopeStructuralPath,
  previousValue?: DataScopeSnapshotValue,
  changedPaths?: NamePath[],
): { found: boolean; rowMissing?: boolean; value?: unknown; rowIdentities?: Array<RowIdentity | null> } {
  if (structuralPath.kind === 'length') {
    if (previousValue?.rowDetached) {
      return { found: false, rowMissing: true };
    }
    let rowIdentities = previousValue?.rowIdentities;
    const rowScope = structuralPath.rowScope;
    if (rowScope) {
      const allowIndexFallbackOnIdentityMiss = shouldRefreshRowIdentityFromPayload(
        payload,
        rowScope,
        previousValue,
        changedPaths,
      );
      const sourceCandidates = [getSnapshotSourceFromPayload(payload), formBlock?.context?.formValues];
      for (const source of sourceCandidates) {
        const scopedPath = getRowScopedPathFromSource(
          source,
          rowScope,
          previousValue?.rowIdentities,
          allowIndexFallbackOnIdentityMiss,
        );
        if (scopedPath.rowMissing) {
          return { found: false, rowMissing: true };
        }
        if (scopedPath.found) {
          rowIdentities = scopedPath.rowIdentities;
          break;
        }
      }
    }
    const result = getPathValue(formBlock, payload, structuralPath.path);
    return result.found ? { found: true, value: getStructuralLengthValue(result.value), rowIdentities } : result;
  }
  if (previousValue?.rowDetached) {
    return { found: false, rowMissing: true };
  }

  const rowScope = structuralPath.rowScope;
  if (rowScope) {
    const allowIndexFallbackOnIdentityMiss = shouldRefreshRowIdentityFromPayload(
      payload,
      rowScope,
      previousValue,
      changedPaths,
    );
    const sourceCandidates = [getSnapshotSourceFromPayload(payload), formBlock?.context?.formValues];
    for (const source of sourceCandidates) {
      const scopedPath = getRowScopedPathFromSource(
        source,
        rowScope,
        previousValue?.rowIdentities,
        allowIndexFallbackOnIdentityMiss,
      );
      if (scopedPath.rowMissing) {
        return { found: false, rowMissing: true };
      }
      if (scopedPath.found && typeof scopedPath.rowIndex === 'number') {
        return {
          found: true,
          value: scopedPath.rowIndex,
          rowIdentities: scopedPath.rowIdentities,
        };
      }
    }
  }

  const result = getPathValue(formBlock, payload, structuralPath.path);
  if (!result.found) {
    return result;
  }
  return getStructuralIndexValueFromList(result.value, structuralPath, previousValue);
}

export function buildDepsSnapshot(
  deps: DataScopeClearDeps,
  formBlock: any,
  payload?: unknown,
): DataScopeClearSnapshot | null {
  if (deps.wildcard) return null;

  const snapshot: DataScopeClearSnapshot = {
    complete: true,
    rowDetached: false,
    rowMissing: false,
    values: new Map(),
    structures: new Map(),
  };

  for (const valuePath of deps.valuePaths) {
    const key = namePathToPathKey(valuePath.path);
    const result = getRowScopedPathValue(formBlock, payload, valuePath);
    if (result.rowMissing) {
      snapshot.rowMissing = true;
      snapshot.complete = false;
      continue;
    }
    if (!result.found) {
      snapshot.complete = false;
      continue;
    }
    snapshot.values.set(key, {
      value: cloneDeep(result.value),
      rowIdentities: result.rowIdentities,
      rowDetached: false,
    });
  }

  for (const structuralPath of deps.structuralPaths) {
    const result = getStructuralPathValue(formBlock, payload, structuralPath);
    if (result.rowMissing) {
      snapshot.rowMissing = true;
      snapshot.complete = false;
      continue;
    }
    if (!result.found) {
      snapshot.complete = false;
      continue;
    }
    snapshot.structures.set(`${structuralPath.kind}:${namePathToPathKey(structuralPath.path)}`, {
      value: cloneDeep(result.value),
      rowIdentities: result.rowIdentities,
      rowDetached: false,
    });
  }

  return snapshot;
}

function rebuildDepsSnapshot(
  deps: DataScopeClearDeps,
  formBlock: any,
  payload: unknown,
  previousSnapshot: DataScopeClearSnapshot,
  changedPaths: NamePath[],
): DataScopeClearSnapshot | null {
  if (deps.wildcard) return null;

  const snapshot: DataScopeClearSnapshot = {
    complete: true,
    rowDetached: false,
    rowMissing: false,
    values: new Map(),
    structures: new Map(),
  };

  for (const valuePath of deps.valuePaths) {
    const key = namePathToPathKey(valuePath.path);
    const previousValue = previousSnapshot.values.get(key);
    const result = getRowScopedPathValue(formBlock, payload, valuePath, previousValue, changedPaths);
    if (result.rowMissing) {
      snapshot.rowMissing = true;
      snapshot.rowDetached = true;
      if (previousValue) {
        snapshot.values.set(key, { ...previousValue, rowDetached: true });
      } else {
        snapshot.complete = false;
      }
      continue;
    }
    if (!result.found) {
      snapshot.complete = false;
      continue;
    }
    snapshot.values.set(key, {
      value: cloneDeep(result.value),
      rowIdentities: result.rowIdentities ?? previousValue?.rowIdentities,
      rowDetached: false,
    });
  }

  for (const structuralPath of deps.structuralPaths) {
    const key = `${structuralPath.kind}:${namePathToPathKey(structuralPath.path)}`;
    const previousValue = previousSnapshot.structures.get(key);
    const result = getStructuralPathValue(formBlock, payload, structuralPath, previousValue, changedPaths);
    if (result.rowMissing) {
      snapshot.rowMissing = true;
      snapshot.rowDetached = true;
      if (previousValue) {
        snapshot.structures.set(key, { ...previousValue, rowDetached: true });
      } else {
        snapshot.complete = false;
      }
      continue;
    }
    if (!result.found) {
      snapshot.complete = false;
      continue;
    }
    snapshot.structures.set(key, {
      value: cloneDeep(result.value),
      rowIdentities: result.rowIdentities ?? previousValue?.rowIdentities,
      rowDetached: false,
    });
  }

  return snapshot;
}

function snapshotValuesEqual(prev: Map<string, DataScopeSnapshotValue>, next: Map<string, DataScopeSnapshotValue>) {
  if (prev.size !== next.size) return false;
  for (const [key, value] of prev.entries()) {
    if (!next.has(key) || !isEqual(value.value, next.get(key)?.value)) {
      return false;
    }
  }
  return true;
}

export function getDepsChangeStatus(
  deps: DataScopeClearDeps,
  formBlock: any,
  payload: unknown,
  snapshot: DataScopeClearSnapshot | null,
): DataScopeClearChangeStatus {
  if (deps.wildcard || !snapshot?.complete) {
    return { status: 'unknown', snapshot: buildDepsSnapshot(deps, formBlock, payload) };
  }

  const nextSnapshot = rebuildDepsSnapshot(deps, formBlock, payload, snapshot, getChangedPathsFromPayload(payload));
  if (nextSnapshot?.rowMissing) {
    return { status: 'unchanged', snapshot: { ...nextSnapshot, rowMissing: false } };
  }
  if (!nextSnapshot?.complete) {
    return { status: 'unknown', snapshot: nextSnapshot };
  }

  const changed =
    !snapshotValuesEqual(snapshot.values, nextSnapshot.values) ||
    !snapshotValuesEqual(snapshot.structures, nextSnapshot.structures);

  return {
    status: changed ? 'changed' : 'unchanged',
    snapshot: nextSnapshot,
  };
}
