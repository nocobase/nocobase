/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext, FlowModel } from '@nocobase/flow-engine';
import _ from 'lodash';
import { namePathToPathKey, pathKeyToNamePath } from '../models/blocks/form/value-runtime/path';
import { collectStaticDepsFromTemplateValue, type DepCollector } from '../models/blocks/form/value-runtime/deps';

type NamePath = Array<string | number>;

type DataScopeClearDeps = {
  wildcard: boolean;
  valuePaths: NamePath[];
};

type DataScopeClearBinding = {
  signature: string;
  dispose: () => void;
};

const FORM_VALUES_CHANGE_EVENT = 'formValuesChange';
const DATA_SCOPE_CLEAR_BINDINGS_KEY = '__formValueDrivenDataScopeClearBindings';

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

function collectDataScopeClearDeps(params: any): DataScopeClearDeps {
  const collector: DepCollector = { deps: new Set(), wildcard: false };
  collectStaticDepsFromTemplateValue(params, collector);

  const valuePaths: NamePath[] = [];
  let wildcard = collector.wildcard;

  for (const depKey of collector.deps) {
    if (depKey === 'fv:*') {
      wildcard = true;
      continue;
    }
    if (!depKey.startsWith('fv:')) {
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
  };
}

function hasDeps(deps: DataScopeClearDeps) {
  return deps.wildcard || deps.valuePaths.length > 0;
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
  }
  return false;
}

function getDepsSignature(deps: DataScopeClearDeps, formBlock: any) {
  const toKeys = (paths: NamePath[]) => paths.map((path) => namePathToPathKey(path)).sort();
  return JSON.stringify({
    formBlockUid: formBlock?.uid,
    wildcard: deps.wildcard,
    valuePaths: toKeys(deps.valuePaths),
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
  const deps = collectDataScopeClearDeps(params);
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

    if (!hasModelValue(model) || !depsMatchPayload(deps, payload)) {
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
