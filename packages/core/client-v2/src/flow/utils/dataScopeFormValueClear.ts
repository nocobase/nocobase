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

type NamePath = Array<string | number>;

type DataScopeClearDeps = {
  wildcard: boolean;
  valuePaths: NamePath[];
  structuralPaths: NamePath[];
};

type DataScopeClearBinding = {
  signature: string;
  snapshot: DataScopeClearSnapshot | null;
  dispose: () => void;
};

type DataScopeClearSnapshot = {
  complete: boolean;
  values: Map<string, unknown>;
  structures: Map<string, unknown>;
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
};

function dedupeNamePaths(paths: NamePath[]) {
  const byKey = new Map<string, NamePath>();
  for (const path of paths) {
    if (!path?.length) continue;
    byKey.set(namePathToPathKey(path), path);
  }
  return Array.from(byKey.values());
}

function isNamePathPrefix(prefix: NamePath, path: NamePath) {
  if (prefix.length > path.length) return false;
  return prefix.every((seg, index) => seg === path[index]);
}

function minimizeValueNamePaths(paths: NamePath[]) {
  const deduped = dedupeNamePaths(paths);
  return deduped.filter((path, index) => {
    return !deduped.some((other, otherIndex) => otherIndex !== index && isNamePathPrefix(path, other));
  });
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
  return { wildcard: false, valuePaths: [], structuralPaths: [] };
}

function wildcardDeps(): DataScopeClearDeps {
  return { wildcard: true, valuePaths: [], structuralPaths: [] };
}

function resolveRootItemDependencyPath(cursor: NamePath): DataScopeClearDeps {
  const head = cursor[0];
  if (head === 'value') {
    const rootValuePath = cursor.slice(1);
    return rootValuePath.length
      ? { wildcard: false, valuePaths: [rootValuePath], structuralPaths: [] }
      : wildcardDeps();
  }

  if (head === '__is_new__' || head === '__is_stored__') {
    return { wildcard: false, valuePaths: [[head]], structuralPaths: [] };
  }

  return emptyDeps();
}

function resolveItemDependencyPath(ctx: FlowContext, depPath: NamePath): DataScopeClearDeps {
  const entries = parseFieldIndexEntries((ctx.model as any)?.context?.fieldIndex ?? (ctx as any)?.fieldIndex);
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
    return {
      wildcard: false,
      valuePaths: [[...rowPath, ...cursor.slice(1)]],
      structuralPaths: listRootPath ? [listRootPath] : [],
    };
  }

  if (head === 'index' || head === 'length') {
    const listRootPath = buildItemListRootPath(entries, parentDepth);
    if (!listRootPath) return wildcardDeps();
    return {
      wildcard: false,
      valuePaths: [],
      structuralPaths: [listRootPath],
    };
  }

  if (head === '__is_new__' || head === '__is_stored__') {
    const rowPath = buildItemRowPath(entries, parentDepth);
    if (!rowPath) return wildcardDeps();
    return {
      wildcard: false,
      valuePaths: [[...rowPath, head]],
      structuralPaths: [],
    };
  }

  return wildcardDeps();
}

function collectDataScopeClearDeps(ctx: FlowContext, params: any): DataScopeClearDeps {
  const collector: DepCollector = { deps: new Set(), wildcard: false };
  collectStaticDepsFromTemplateValue(params, collector);

  const valuePaths: NamePath[] = [];
  const structuralPaths: NamePath[] = [];
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
      }
      continue;
    }
    const inner = depKey.slice('fv:'.length);
    if (!inner) {
      wildcard = true;
      continue;
    }
    valuePaths.push(pathKeyToNamePath(inner));
  }

  return {
    wildcard,
    valuePaths: minimizeValueNamePaths(valuePaths),
    structuralPaths: dedupeNamePaths(structuralPaths),
  };
}

function hasDeps(deps: DataScopeClearDeps) {
  return deps.wildcard || deps.valuePaths.length > 0 || deps.structuralPaths.length > 0;
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

function getStructuralValue(value: unknown) {
  return Array.isArray(value) ? value.length : value;
}

function buildDepsSnapshot(deps: DataScopeClearDeps, formBlock: any, payload?: any): DataScopeClearSnapshot | null {
  if (deps.wildcard) return null;

  const snapshot: DataScopeClearSnapshot = {
    complete: true,
    values: new Map(),
    structures: new Map(),
  };

  for (const path of deps.valuePaths) {
    const result = getPathValue(formBlock, payload, path);
    if (!result.found) {
      snapshot.complete = false;
      continue;
    }
    snapshot.values.set(namePathToPathKey(path), cloneDeep(result.value));
  }

  for (const path of deps.structuralPaths) {
    const result = getPathValue(formBlock, payload, path);
    if (!result.found) {
      snapshot.complete = false;
      continue;
    }
    snapshot.structures.set(namePathToPathKey(path), cloneDeep(getStructuralValue(result.value)));
  }

  return snapshot;
}

function snapshotValuesEqual(prev: Map<string, unknown>, next: Map<string, unknown>) {
  if (prev.size !== next.size) return false;
  for (const [key, value] of prev.entries()) {
    if (!next.has(key) || !isEqual(value, next.get(key))) {
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

  const nextSnapshot = buildDepsSnapshot(deps, formBlock, payload);
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
      if (isNamePathPrefix(depPath, changedPath) || isNamePathPrefix(changedPath, depPath)) {
        return true;
      }
    }

    for (const depPath of deps.structuralPaths) {
      if (depPath.length === changedPath.length && depPath.every((seg, index) => seg === changedPath[index])) {
        return true;
      }
      if (isNamePathPrefix(changedPath, depPath)) {
        return true;
      }
    }
  }
  return false;
}

function getDepsSignature(deps: DataScopeClearDeps, formBlock: any) {
  const toKeys = (paths: NamePath[]) => paths.map((path) => namePathToPathKey(path)).sort();
  return JSON.stringify({
    formBlockUid: formBlock?.uid,
    wildcard: deps.wildcard,
    valuePaths: toKeys(deps.valuePaths),
    structuralPaths: toKeys(deps.structuralPaths),
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
