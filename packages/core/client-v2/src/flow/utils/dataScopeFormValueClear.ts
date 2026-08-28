/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext, FlowModel } from '@nocobase/flow-engine';
import { namePathToPathKey } from '../models/blocks/form/value-runtime/path';
import { collectStaticDepsFromTemplateValue, type DepCollector } from '../models/blocks/form/value-runtime/deps';
import {
  buildItemListRootPath,
  buildItemRowPath,
  findFormValueChangeSource,
  getChangedPathsFromPayload,
  isNamePathPrefix,
  isSameNamePath,
  parseFieldIndexEntries,
  parsePathKey,
  type NamePath,
} from './formValueDeps';
import {
  applyDataScopeFieldIndexTargetKeys,
  buildDepsSnapshot,
  createDataScopeRowScope,
  getDepsChangeStatus,
  type DataScopeClearDeps,
  type DataScopeClearSnapshot,
  type DataScopeStructuralPath,
  type DataScopeTriggerPath,
  type DataScopeValuePath,
} from './dataScopeRowSnapshot';

type DataScopeClearBinding = {
  signature: string;
  snapshot: DataScopeClearSnapshot | null;
  dispose: () => void;
};

const FORM_VALUES_CHANGE_EVENT = 'formValuesChange';
const DATA_SCOPE_CLEAR_BINDINGS_KEY = '__formValueDrivenDataScopeClearBindings';

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

function emptyDeps(): DataScopeClearDeps {
  return { wildcard: false, valuePaths: [], structuralPaths: [], triggerPaths: [] };
}

function wildcardDeps(): DataScopeClearDeps {
  return { wildcard: true, valuePaths: [], structuralPaths: [], triggerPaths: [] };
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
  const entries = applyDataScopeFieldIndexTargetKeys(
    ctx,
    parseFieldIndexEntries((ctx.model as any)?.context?.fieldIndex ?? (ctx as any)?.fieldIndex),
  );

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

  if (!entries.length) {
    return parentDepth === 0 ? resolveRootItemDependencyPath(cursor) : emptyDeps();
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
          rowScope: createDataScopeRowScope(entries, parentDepth, tailPath),
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
      structuralPaths: [
        { path: listRootPath, kind: head, rowScope: createDataScopeRowScope(entries, parentDepth, []) },
      ],
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
          rowScope: createDataScopeRowScope(entries, parentDepth, [head]),
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
        const depPath = subPath ? parsePathKey(subPath) : [];
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
    valuePaths.push({ path: parsePathKey(inner) });
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
      if (isSameNamePath(depPath.path, changedPath)) {
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
      if (!depPath.includeChildren && isSameNamePath(depPath.path, changedPath)) {
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

function findFormBlock(ctx: FlowContext): any | null {
  return findFormValueChangeSource(ctx) as any;
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
