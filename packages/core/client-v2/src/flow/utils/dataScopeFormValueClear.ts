/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext, FlowModel } from '@nocobase/flow-engine';
import { cloneDeep, isEqual } from 'lodash';
import { namePathToPathKey, pathKeyToNamePath } from '../models/blocks/form/value-runtime/path';
import { collectStaticDepsFromTemplateValue, type DepCollector } from '../models/blocks/form/value-runtime/deps';
import { getSubTableRowIdentity } from '../models/fields/AssociationFieldModel/SubTableFieldModel/rowIdentity';

type NamePath = Array<string | number>;

type DataScopeClearDeps = {
  wildcard: boolean;
  valuePaths: DataScopeValuePath[];
  structuralPaths: DataScopeStructuralPath[];
  triggerPaths: DataScopeTriggerPath[];
};

type DataScopeClearBinding = {
  signature: string;
  snapshot: DataScopeClearSnapshot | null;
  dispose: () => void;
};

type DataScopeClearSnapshot = {
  complete: boolean;
  rowDetached: boolean;
  rowMissing: boolean;
  values: Map<string, DataScopeSnapshotValue>;
  structures: Map<string, DataScopeSnapshotValue>;
};

type DataScopeClearChangeStatus = {
  status: 'changed' | 'unchanged' | 'unknown';
  snapshot: DataScopeClearSnapshot | null;
};

const FORM_VALUES_CHANGE_EVENT = 'formValuesChange';
const DATA_SCOPE_CLEAR_BINDINGS_KEY = '__formValueDrivenDataScopeClearBindings';

type FieldIndexEntry = {
  name: string;
  index: number;
  filterTargetKey?: FilterTargetKey;
};

type FilterTargetKey = string | string[] | null | undefined;

type RowIdentity = string;

type RowScope = {
  entries: FieldIndexEntry[];
  tailPath: NamePath;
  identityTailPaths: NamePath[];
};

type DataScopeValuePath = {
  path: NamePath;
  rowScope?: RowScope;
};

type DataScopeStructuralPath = {
  path: NamePath;
  kind: 'index' | 'length';
  rowScope?: RowScope;
};

type DataScopeTriggerPath = {
  path: NamePath;
  includeChildren: boolean;
};

type DataScopeSnapshotValue = {
  value: unknown;
  rowIdentities?: Array<RowIdentity | null>;
  rowDetached?: boolean;
};

function isNamePathPrefix(prefix: NamePath, path: NamePath) {
  if (prefix.length > path.length) return false;
  return prefix.every((seg, index) => seg === path[index]);
}

function dedupeValuePaths(paths: DataScopeValuePath[]) {
  const byKey = new Map<string, DataScopeValuePath>();
  for (const path of paths) {
    if (!path?.path?.length) continue;
    byKey.set(namePathToPathKey(path.path), path);
  }
  return Array.from(byKey.values());
}

function minimizeValuePaths(paths: DataScopeValuePath[]) {
  const deduped = dedupeValuePaths(paths);
  return deduped.filter((path, index) => {
    return !deduped.some((other, otherIndex) => otherIndex !== index && isNamePathPrefix(path.path, other.path));
  });
}

function dedupeStructuralPaths(paths: DataScopeStructuralPath[]) {
  const byKey = new Map<string, DataScopeStructuralPath>();
  for (const path of paths) {
    if (!path?.path?.length) continue;
    byKey.set(`${path.kind}:${namePathToPathKey(path.path)}`, path);
  }
  return Array.from(byKey.values());
}

function dedupeTriggerPaths(paths: DataScopeTriggerPath[]) {
  const byKey = new Map<string, DataScopeTriggerPath>();
  for (const path of paths) {
    if (!path?.path?.length) continue;
    byKey.set(`${path.includeChildren ? 'children' : 'exact'}:${namePathToPathKey(path.path)}`, path);
  }
  return Array.from(byKey.values());
}

function parseFieldIndexEntries(fieldIndex: unknown): FieldIndexEntry[] {
  const arr = Array.isArray(fieldIndex) ? fieldIndex : [];
  const entries: FieldIndexEntry[] = [];
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    const [name, indexStr] = item.split(':');
    const index = Number(indexStr);
    if (!name || Number.isNaN(index)) continue;
    entries.push({ name, index });
  }
  return entries;
}

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

function applyFieldIndexTargetKeys(ctx: FlowContext, entries: FieldIndexEntry[]) {
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

function buildItemRowPath(entries: FieldIndexEntry[], parentDepth: number): NamePath | null {
  const targetIndex = entries.length - 1 - parentDepth;
  if (targetIndex < 0) return null;

  const out: NamePath = [];
  for (let index = 0; index <= targetIndex; index++) {
    out.push(entries[index].name, entries[index].index);
  }
  return out;
}

function buildItemListRootPath(entries: FieldIndexEntry[], parentDepth: number): NamePath | null {
  const rowPath = buildItemRowPath(entries, parentDepth);
  if (!rowPath?.length) return null;
  return rowPath.slice(0, -1);
}

function emptyDeps(): DataScopeClearDeps {
  return { wildcard: false, valuePaths: [], structuralPaths: [], triggerPaths: [] };
}

function wildcardDeps(): DataScopeClearDeps {
  return { wildcard: true, valuePaths: [], structuralPaths: [], triggerPaths: [] };
}

function createRowScope(entries: FieldIndexEntry[], parentDepth: number, tailPath: NamePath): RowScope | undefined {
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

function resolveRootItemDependencyPath(cursor: NamePath): DataScopeClearDeps {
  const head = cursor[0];
  if (head === 'value') {
    const rootValuePath = cursor.slice(1);
    return rootValuePath.length
      ? { wildcard: false, valuePaths: [{ path: rootValuePath }], structuralPaths: [], triggerPaths: [] }
      : wildcardDeps();
  }

  if (head === '__is_new__' || head === '__is_stored__') {
    return { wildcard: false, valuePaths: [{ path: [head] }], structuralPaths: [], triggerPaths: [] };
  }

  return emptyDeps();
}

function resolveItemDependencyPath(ctx: FlowContext, depPath: NamePath): DataScopeClearDeps {
  const entries = applyFieldIndexTargetKeys(
    ctx,
    parseFieldIndexEntries((ctx.model as any)?.context?.fieldIndex ?? (ctx as any)?.fieldIndex),
  );
  if (!entries.length) {
    return wildcardDeps();
  }

  let parentDepth = 0;
  let cursor = [...depPath];
  while (cursor[0] === 'parentItem') {
    parentDepth += 1;
    cursor = cursor.slice(1);
  }

  const head = cursor[0];
  if (!head) {
    return wildcardDeps();
  }

  if (parentDepth === entries.length) {
    return resolveRootItemDependencyPath(cursor);
  }

  if (parentDepth > entries.length) {
    return wildcardDeps();
  }

  if (head === 'value') {
    const rowPath = buildItemRowPath(entries, parentDepth);
    if (!rowPath) return wildcardDeps();
    const listRootPath = buildItemListRootPath(entries, parentDepth);
    const tailPath = cursor.slice(1);
    return {
      wildcard: false,
      valuePaths: [
        {
          path: [...rowPath, ...tailPath],
          rowScope: createRowScope(entries, parentDepth, tailPath),
        },
      ],
      structuralPaths: [],
      triggerPaths: [
        { path: rowPath, includeChildren: true },
        ...(listRootPath ? [{ path: listRootPath, includeChildren: false }] : []),
      ],
    };
  }

  if (head === 'index' || head === 'length') {
    const listRootPath = buildItemListRootPath(entries, parentDepth);
    if (!listRootPath) return wildcardDeps();
    return {
      wildcard: false,
      valuePaths: [],
      structuralPaths: [{ path: listRootPath, kind: head, rowScope: createRowScope(entries, parentDepth, []) }],
      triggerPaths: [{ path: listRootPath, includeChildren: false }],
    };
  }

  if (head === '__is_new__' || head === '__is_stored__') {
    const rowPath = buildItemRowPath(entries, parentDepth);
    if (!rowPath) return wildcardDeps();
    return {
      wildcard: false,
      valuePaths: [
        {
          path: [...rowPath, head],
          rowScope: createRowScope(entries, parentDepth, [head]),
        },
      ],
      structuralPaths: [],
      triggerPaths: [{ path: rowPath, includeChildren: true }],
    };
  }

  return wildcardDeps();
}

function collectDataScopeClearDeps(ctx: FlowContext, params: any): DataScopeClearDeps {
  const collector: DepCollector = { deps: new Set(), wildcard: false };
  collectStaticDepsFromTemplateValue(params, collector);

  const valuePaths: DataScopeValuePath[] = [];
  const structuralPaths: DataScopeStructuralPath[] = [];
  const triggerPaths: DataScopeTriggerPath[] = [];
  let wildcard = collector.wildcard;

  for (const depKey of collector.deps) {
    if (depKey === 'fv:*') {
      wildcard = true;
      continue;
    }
    if (!depKey.startsWith('fv:')) {
      if (depKey === 'ctx:item' || depKey.startsWith('ctx:item:')) {
        const subPath = depKey === 'ctx:item' ? '' : depKey.slice('ctx:item:'.length);
        const depPath = subPath ? (pathKeyToNamePath(subPath) as NamePath) : [];
        const resolved = resolveItemDependencyPath(ctx, depPath);
        wildcard ||= resolved.wildcard;
        valuePaths.push(...resolved.valuePaths);
        structuralPaths.push(...resolved.structuralPaths);
        triggerPaths.push(...resolved.triggerPaths);
      }
      continue;
    }
    const inner = depKey.slice('fv:'.length);
    if (!inner) {
      wildcard = true;
      continue;
    }
    valuePaths.push({ path: pathKeyToNamePath(inner) });
  }

  return {
    wildcard,
    valuePaths: minimizeValuePaths(valuePaths),
    structuralPaths: dedupeStructuralPaths(structuralPaths),
    triggerPaths: dedupeTriggerPaths(triggerPaths),
  };
}

function hasDeps(deps: DataScopeClearDeps) {
  return deps.wildcard || deps.valuePaths.length > 0 || deps.structuralPaths.length > 0 || deps.triggerPaths.length > 0;
}

function hasModelValue(model: any) {
  const current = model?.props?.value;
  if (current == null) return false;
  if (Array.isArray(current)) return current.length > 0;
  return true;
}

function getChangedPathsFromPayload(payload: any): NamePath[] {
  const rawChangedPaths = Array.isArray(payload?.changedPaths) ? payload.changedPaths : [];
  const out: NamePath[] = [];

  for (const path of rawChangedPaths) {
    if (Array.isArray(path)) {
      if (path.length === 1 && typeof path[0] === 'string') {
        const namePath = pathKeyToNamePath(path[0]);
        if (namePath.length) out.push(namePath);
        continue;
      }
      const segs = path.filter((seg) => typeof seg === 'string' || typeof seg === 'number') as NamePath;
      if (segs.length) out.push(segs);
      continue;
    }
    if (typeof path === 'string' && path) {
      out.push(pathKeyToNamePath(path));
    }
  }

  if (out.length) {
    return out;
  }

  const changedValues = payload?.changedValues;
  if (changedValues && typeof changedValues === 'object' && !Array.isArray(changedValues)) {
    for (const key of Object.keys(changedValues)) {
      const namePath = pathKeyToNamePath(key);
      if (namePath.length) out.push(namePath);
    }
  }

  return out;
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

function getSnapshotSourceFromPayload(payload: any) {
  return payload?.allValuesSnapshot ?? payload?.allValues;
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

function shouldRefreshRowIdentityFromPayload(payload: any, rowScope: RowScope, previousValue?: DataScopeSnapshotValue) {
  if (previousValue?.rowDetached) return false;
  const rowPath = getRowScopePath(rowScope);
  if (!rowPath.length || !rowScope.identityTailPaths.length) return false;
  const identityPaths = rowScope.identityTailPaths.map((path) => [...rowPath, ...path]);
  return getChangedPathsFromPayload(payload).some((changedPath) =>
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

function getPathValue(formBlock: any, payload: any, path: NamePath): { found: boolean; value?: unknown } {
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
  payload: any,
  valuePath: DataScopeValuePath,
  previousValue?: DataScopeSnapshotValue,
): { found: boolean; rowMissing?: boolean; value?: unknown; rowIdentities?: Array<RowIdentity | null> } {
  const rowScope = valuePath.rowScope;
  if (!rowScope) {
    return getPathValue(formBlock, payload, valuePath.path);
  }
  if (previousValue?.rowDetached) {
    return { found: false, rowMissing: true };
  }

  const allowIndexFallbackOnIdentityMiss = shouldRefreshRowIdentityFromPayload(payload, rowScope, previousValue);
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
  payload: any,
  structuralPath: DataScopeStructuralPath,
  previousValue?: DataScopeSnapshotValue,
): { found: boolean; rowMissing?: boolean; value?: unknown; rowIdentities?: Array<RowIdentity | null> } {
  if (structuralPath.kind === 'length') {
    if (previousValue?.rowDetached) {
      return { found: false, rowMissing: true };
    }
    let rowIdentities = previousValue?.rowIdentities;
    const rowScope = structuralPath.rowScope;
    if (rowScope) {
      const allowIndexFallbackOnIdentityMiss = shouldRefreshRowIdentityFromPayload(payload, rowScope, previousValue);
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
    const allowIndexFallbackOnIdentityMiss = shouldRefreshRowIdentityFromPayload(payload, rowScope, previousValue);
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

function buildDepsSnapshot(deps: DataScopeClearDeps, formBlock: any, payload?: any): DataScopeClearSnapshot | null {
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
  payload: any,
  previousSnapshot: DataScopeClearSnapshot,
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
    const result = getRowScopedPathValue(formBlock, payload, valuePath, previousValue);
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
    const result = getStructuralPathValue(formBlock, payload, structuralPath, previousValue);
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

function getDepsChangeStatus(
  deps: DataScopeClearDeps,
  formBlock: any,
  payload: any,
  snapshot: DataScopeClearSnapshot | null,
): DataScopeClearChangeStatus {
  if (deps.wildcard || !snapshot?.complete) {
    return { status: 'unknown', snapshot: buildDepsSnapshot(deps, formBlock, payload) };
  }

  const nextSnapshot = rebuildDepsSnapshot(deps, formBlock, payload, snapshot);
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

function depsMatchPayload(deps: DataScopeClearDeps, payload: any) {
  if (!hasDeps(deps)) return false;
  if (deps.wildcard) return true;

  const changedPaths = getChangedPathsFromPayload(payload);
  if (!changedPaths.length) return true;

  for (const changedPath of changedPaths) {
    for (const depPath of deps.valuePaths) {
      if (isNamePathPrefix(depPath.path, changedPath) || isNamePathPrefix(changedPath, depPath.path)) {
        return true;
      }
    }

    for (const depPath of deps.structuralPaths) {
      if (
        depPath.path.length === changedPath.length &&
        depPath.path.every((seg, index) => seg === changedPath[index])
      ) {
        return true;
      }
      if (isNamePathPrefix(changedPath, depPath.path)) {
        return true;
      }
    }

    for (const depPath of deps.triggerPaths) {
      if (
        depPath.includeChildren &&
        (isNamePathPrefix(depPath.path, changedPath) || isNamePathPrefix(changedPath, depPath.path))
      ) {
        return true;
      }
      if (
        !depPath.includeChildren &&
        depPath.path.length === changedPath.length &&
        depPath.path.every((seg, index) => seg === changedPath[index])
      ) {
        return true;
      }
    }
  }
  return false;
}

function getDepsSignature(deps: DataScopeClearDeps, formBlock: any) {
  const toKeys = (paths: DataScopeValuePath[]) => paths.map((path) => namePathToPathKey(path.path)).sort();
  const toStructuralKeys = (paths: DataScopeStructuralPath[]) =>
    paths.map((path) => `${path.kind}:${namePathToPathKey(path.path)}`).sort();
  return JSON.stringify({
    formBlockUid: formBlock?.uid,
    wildcard: deps.wildcard,
    valuePaths: toKeys(deps.valuePaths),
    structuralPaths: toStructuralKeys(deps.structuralPaths),
    triggerPaths: deps.triggerPaths
      .map((path) => `${path.includeChildren ? 'children' : 'exact'}:${namePathToPathKey(path.path)}`)
      .sort(),
  });
}

function getBindings(model: any): Map<string, DataScopeClearBinding> {
  return (model[DATA_SCOPE_CLEAR_BINDINGS_KEY] ||= new Map<string, DataScopeClearBinding>());
}

function isFormBlock(model: any) {
  if (!model || typeof model !== 'object') return false;
  if (!model.emitter || typeof model.emitter.on !== 'function' || typeof model.emitter.off !== 'function') return false;
  return !!model.formValueRuntime || !!model.context?.form || typeof model.context?.setFormValues === 'function';
}

function findFormBlock(ctx: FlowContext): any | null {
  const candidates: any[] = [];
  const push = (model: any) => {
    if (model && !candidates.includes(model)) candidates.push(model);
  };

  push((ctx.model as any)?.context?.blockModel);
  push(ctx.model);

  let cursor: any = (ctx.model as any)?.parent;
  while (cursor) {
    push(cursor);
    cursor = cursor?.parent;
  }

  return candidates.find(isFormBlock) || null;
}

function clearModelValue(model: any) {
  if (!hasModelValue(model)) return;
  const next = Array.isArray(model?.props?.value) ? [] : null;
  if (typeof model.change === 'function') {
    model.change(next);
    return;
  }
  if (typeof model?.props?.onChange === 'function') {
    model.props.onChange(next);
  }
}

function shouldBind(model: any) {
  return !!model && typeof model === 'object' && typeof model?.props?.onChange === 'function';
}

function disposeBinding(model: any, key: string) {
  const bindings = getBindings(model);
  const existing = bindings.get(key);
  if (existing) {
    existing.dispose();
  }
}

/**
 * When a field's dataScope filter references other form values (e.g. `{{ ctx.formValues.school.id }}`),
 * clear current field value after the dependency changes, so users don't keep an invalid stale selection.
 */
export function ensureFormValueDrivenDataScopeClear(ctx: FlowContext, params: any) {
  const model: any = ctx.model;
  const flowKey = (ctx as any)?.flowKey;
  if (!shouldBind(model) || !flowKey) return;

  const stepKey = 'dataScope';
  const bindingKey = `${flowKey}:${stepKey}`;
  const deps = collectDataScopeClearDeps(ctx, params);
  if (!hasDeps(deps)) {
    disposeBinding(model, bindingKey);
    return;
  }

  const formBlock = findFormBlock(ctx);
  if (!formBlock) {
    disposeBinding(model, bindingKey);
    return;
  }

  const signature = getDepsSignature(deps, formBlock);
  const bindings = getBindings(model);
  const existing = bindings.get(bindingKey);
  if (existing?.signature === signature) {
    return;
  }
  if (existing) {
    existing.dispose();
  }

  const engineEmitter = model?.flowEngine?.emitter || (ctx as any)?.engine?.emitter || model?.context?.engine?.emitter;

  const binding: DataScopeClearBinding = {
    signature,
    snapshot: buildDepsSnapshot(deps, formBlock),
    dispose: () => {},
  };

  const dispose = () => {
    formBlock.emitter?.off?.(FORM_VALUES_CHANGE_EVENT, listener);
    engineEmitter?.off?.('model:unmounted', cleanupOnUnmount);
    engineEmitter?.off?.('model:destroyed', cleanupOnDestroyed);
    if (bindings.get(bindingKey) === binding) {
      bindings.delete(bindingKey);
    }
  };

  const listener = (payload: any) => {
    if (model.disposed || formBlock.disposed) {
      dispose();
      return;
    }

    if (!depsMatchPayload(deps, payload)) {
      return;
    }

    const changeStatus = getDepsChangeStatus(deps, formBlock, payload, binding.snapshot);
    if (changeStatus.snapshot?.complete) {
      binding.snapshot = changeStatus.snapshot;
    }
    if (changeStatus.status === 'unchanged') {
      return;
    }

    if (!hasModelValue(model)) {
      return;
    }

    clearModelValue(model);
  };

  const cleanupOnUnmount = ({ model: unmountedModel }: { model: FlowModel }) => {
    if (unmountedModel === formBlock || (unmountedModel === model && model.disposed)) {
      dispose();
    }
  };

  const cleanupOnDestroyed = ({ model: destroyedModel }: { model: FlowModel }) => {
    if (destroyedModel === model || destroyedModel === formBlock) {
      dispose();
    }
  };

  binding.dispose = dispose;
  bindings.set(bindingKey, binding);
  formBlock.emitter.on(FORM_VALUES_CHANGE_EVENT, listener);
  engineEmitter?.on?.('model:unmounted', cleanupOnUnmount);
  engineEmitter?.on?.('model:destroyed', cleanupOnDestroyed);
}
