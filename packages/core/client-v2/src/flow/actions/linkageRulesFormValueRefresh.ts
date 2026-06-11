/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  extractUsedVariablePathsFromRunJS,
  FlowContext,
  FlowModel,
  FlowRuntimeContext,
  isRunJSValue,
} from '@nocobase/flow-engine';
import _ from 'lodash';
import { namePathToPathKey, parsePathString, pathKeyToNamePath } from '../models/blocks/form/value-runtime/path';
import {
  collectStaticDepsFromRunJSValue,
  collectStaticDepsFromTemplateValue,
  recordDep,
  type DepCollector,
} from '../models/blocks/form/value-runtime/deps';
import { linkageRulesRefresh } from './linkageRulesRefresh';

type NamePath = Array<string | number>;

type LinkageRefreshDeps = {
  wildcard: boolean;
  valuePaths: NamePath[];
  structuralPaths: NamePath[];
};

type LinkageRefreshBinding = {
  signature: string;
  running: boolean;
  linkageTxIds: Set<string>;
  pendingPayload: any;
  dispose: () => void;
};

type FieldIndexEntry = {
  name: string;
  index: number;
};

const FORM_VALUES_CHANGE_EVENT = 'formValuesChange';
const LINKAGE_REFRESH_BINDINGS_KEY = '__formValueDrivenLinkageRefreshBindings';

function isSameNamePath(a: NamePath, b: NamePath) {
  return a.length === b.length && a.every((seg, index) => seg === b[index]);
}

function isNamePathPrefix(prefix: NamePath, path: NamePath) {
  if (prefix.length > path.length) return false;
  return prefix.every((seg, index) => seg === path[index]);
}

function dedupeNamePaths(paths: NamePath[]) {
  const byKey = new Map<string, NamePath>();
  for (const path of paths) {
    if (!path?.length) continue;
    byKey.set(namePathToPathKey(path), path);
  }
  return Array.from(byKey.values());
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
  for (const it of arr) {
    if (typeof it !== 'string') continue;
    const [name, indexStr] = it.split(':');
    const index = Number(indexStr);
    if (!name || Number.isNaN(index)) continue;
    entries.push({ name, index });
  }
  return entries;
}

function getFieldIndexEntriesFromContext(ctx: any): FieldIndexEntry[] {
  return parseFieldIndexEntries(ctx?.model?.context?.fieldIndex ?? ctx?.fieldIndex);
}

function buildItemRowPath(entries: FieldIndexEntry[], parentDepth: number): NamePath | null {
  const targetIndex = entries.length - 1 - parentDepth;
  if (targetIndex < 0) return null;

  const out: NamePath = [];
  for (let i = 0; i <= targetIndex; i++) {
    out.push(entries[i].name, entries[i].index);
  }
  return out;
}

function buildItemListRootPath(entries: FieldIndexEntry[], parentDepth: number): NamePath | null {
  const rowPath = buildItemRowPath(entries, parentDepth);
  if (!rowPath?.length) return null;
  return rowPath.slice(0, -1);
}

function resolveItemDependencyPath(ctx: FlowContext, depPath: NamePath): LinkageRefreshDeps {
  const entries = getFieldIndexEntriesFromContext(ctx as any);
  if (!entries.length) {
    return { wildcard: true, valuePaths: [], structuralPaths: [] };
  }

  let parentDepth = 0;
  let cursor = [...depPath];
  while (cursor[0] === 'parentItem') {
    parentDepth += 1;
    cursor = cursor.slice(1);
  }

  const head = cursor[0];
  if (!head) {
    return { wildcard: true, valuePaths: [], structuralPaths: [] };
  }

  if (head === 'value') {
    const rowPath = buildItemRowPath(entries, parentDepth);
    if (!rowPath) return { wildcard: true, valuePaths: [], structuralPaths: [] };
    const listRootPath = buildItemListRootPath(entries, parentDepth);
    return {
      wildcard: false,
      valuePaths: [[...rowPath, ...cursor.slice(1)]],
      structuralPaths: listRootPath ? [listRootPath] : [],
    };
  }

  if (head === 'index' || head === 'length') {
    const listRootPath = buildItemListRootPath(entries, parentDepth);
    if (!listRootPath) return { wildcard: true, valuePaths: [], structuralPaths: [] };
    return {
      wildcard: false,
      valuePaths: [],
      structuralPaths: [listRootPath],
    };
  }

  if (head === '__is_new__' || head === '__is_stored__') {
    const rowPath = buildItemRowPath(entries, parentDepth);
    if (!rowPath) return { wildcard: true, valuePaths: [], structuralPaths: [] };
    return {
      wildcard: false,
      valuePaths: [[...rowPath, head]],
      structuralPaths: [],
    };
  }

  return { wildcard: true, valuePaths: [], structuralPaths: [] };
}

function addRunjsUsageToCollector(script: string, collector: DepCollector) {
  if (typeof script !== 'string' || !script.trim()) return;
  const usage = extractUsedVariablePathsFromRunJS(script) || {};
  for (const [varName, rawPaths] of Object.entries(usage)) {
    const paths = Array.isArray(rawPaths) ? rawPaths : [];
    const normalized = paths.length ? paths : [''];
    for (const subPath of normalized) {
      if (varName === 'formValues') {
        if (!subPath) {
          collector.wildcard = true;
          continue;
        }
        const segs = parsePathString(String(subPath)).filter((seg) => typeof seg !== 'object') as NamePath;
        recordDep(segs, collector);
        continue;
      }
      if (varName === 'item') {
        const key = subPath ? `ctx:item:${String(subPath)}` : 'ctx:item';
        collector.deps.add(key);
      }
    }
  }
}

function collectRunjsDepsFromLinkageRules(params: any, collector: DepCollector) {
  const seen = new WeakSet<object>();
  const visit = (value: any) => {
    if (!value || typeof value !== 'object') return;
    if (seen.has(value)) return;
    seen.add(value);

    if (isRunJSValue(value)) {
      collectStaticDepsFromRunJSValue(value, collector);
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const actionName = (value as any)?.name;
    if (actionName === 'linkageRunjs' || actionName === 'runjs') {
      addRunjsUsageToCollector(_.get(value, ['params', 'value', 'script']), collector);
      addRunjsUsageToCollector(_.get(value, ['params', 'code']), collector);
    }

    Object.values(value).forEach(visit);
  };

  visit(params);
}

function collectLinkageRefreshDeps(ctx: FlowContext, params: any): LinkageRefreshDeps {
  const collector: DepCollector = { deps: new Set(), wildcard: false };

  collectStaticDepsFromTemplateValue(params, collector);
  collectRunjsDepsFromLinkageRules(params, collector);

  const valuePaths: NamePath[] = [];
  const structuralPaths: NamePath[] = [];
  let wildcard = collector.wildcard;

  for (const depKey of collector.deps) {
    if (depKey === 'fv:*') {
      wildcard = true;
      continue;
    }

    if (depKey.startsWith('fv:')) {
      const inner = depKey.slice('fv:'.length);
      if (!inner) {
        wildcard = true;
        continue;
      }
      valuePaths.push(pathKeyToNamePath(inner));
      continue;
    }

    if (depKey === 'ctx:item' || depKey.startsWith('ctx:item:')) {
      const subPath = depKey === 'ctx:item' ? '' : depKey.slice('ctx:item:'.length);
      const depPath = subPath ? (parsePathString(subPath).filter((seg) => typeof seg !== 'object') as NamePath) : [];
      const resolved = resolveItemDependencyPath(ctx, depPath);
      wildcard ||= resolved.wildcard;
      valuePaths.push(...resolved.valuePaths);
      structuralPaths.push(...resolved.structuralPaths);
    }
  }

  return {
    wildcard,
    valuePaths: minimizeValueNamePaths(valuePaths),
    structuralPaths: dedupeNamePaths(structuralPaths),
  };
}

function hasLinkageRefreshDeps(deps: LinkageRefreshDeps) {
  return deps.wildcard || deps.valuePaths.length > 0 || deps.structuralPaths.length > 0;
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
  if (changedValues && typeof changedValues === 'object') {
    for (const key of Object.keys(changedValues)) {
      const namePath = pathKeyToNamePath(key);
      if (namePath.length) out.push(namePath);
    }
  }

  return out;
}

function linkageRefreshDepsMatchPayload(deps: LinkageRefreshDeps, payload: any) {
  if (!hasLinkageRefreshDeps(deps)) return false;
  const changedPaths = getChangedPathsFromPayload(payload);
  if (deps.wildcard) return true;
  if (!changedPaths.length) return true;

  for (const changedPath of changedPaths) {
    for (const depPath of deps.valuePaths) {
      if (isNamePathPrefix(depPath, changedPath) || isNamePathPrefix(changedPath, depPath)) {
        return true;
      }
    }

    for (const depPath of deps.structuralPaths) {
      if (isSameNamePath(depPath, changedPath) || isNamePathPrefix(changedPath, depPath)) {
        return true;
      }
    }
  }

  return false;
}

function getDepsSignature(deps: LinkageRefreshDeps, formBlock: any) {
  const toKeys = (paths: NamePath[]) => paths.map((path) => namePathToPathKey(path)).sort();
  return JSON.stringify({
    formBlockUid: formBlock?.uid,
    wildcard: deps.wildcard,
    valuePaths: toKeys(deps.valuePaths),
    structuralPaths: toKeys(deps.structuralPaths),
  });
}

function getLinkageRefreshBindings(model: any): Map<string, LinkageRefreshBinding> {
  return (model[LINKAGE_REFRESH_BINDINGS_KEY] ||= new Map<string, LinkageRefreshBinding>());
}

function isFormBlockForLinkageRefresh(model: any) {
  if (!model || typeof model !== 'object') return false;
  if (!model.emitter || typeof model.emitter.on !== 'function' || typeof model.emitter.off !== 'function') return false;
  return !!model.formValueRuntime || !!model.context?.form || typeof model.context?.setFormValues === 'function';
}

function findFormBlockForLinkageRefresh(ctx: FlowContext): any | null {
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

  return candidates.find(isFormBlockForLinkageRefresh) || null;
}

function disposeLinkageRefreshBinding(model: any, key: string) {
  const bindings = getLinkageRefreshBindings(model);
  const existing = bindings.get(key);
  if (existing) {
    existing.dispose();
  }
}

export function ensureFormValueDrivenLinkageRefresh(ctx: FlowContext, params: any, actionName: string) {
  const model: any = ctx.model;
  const flowKey = (ctx as any)?.flowKey;
  if (!model || !flowKey) return;

  const stepKey = 'linkageRules';
  const bindingKey = `${flowKey}:${stepKey}:${actionName}`;
  const bindings = getLinkageRefreshBindings(model);
  const deps = collectLinkageRefreshDeps(ctx, params);
  if (!hasLinkageRefreshDeps(deps)) {
    disposeLinkageRefreshBinding(model, bindingKey);
    return;
  }

  const formBlock = findFormBlockForLinkageRefresh(ctx);
  if (!formBlock) {
    disposeLinkageRefreshBinding(model, bindingKey);
    return;
  }

  const signature = getDepsSignature(deps, formBlock);
  const existing = bindings.get(bindingKey);
  if (existing?.signature === signature) {
    return;
  }
  if (existing) {
    existing.dispose();
  }

  const binding: LinkageRefreshBinding = {
    signature,
    running: false,
    linkageTxIds: new Set(),
    pendingPayload: null,
    dispose: () => {},
  };

  const engineEmitter = model?.flowEngine?.emitter || (ctx as any)?.engine?.emitter || model?.context?.engine?.emitter;

  const dispose = () => {
    formBlock.emitter?.off?.(FORM_VALUES_CHANGE_EVENT, listener);
    engineEmitter?.off?.('model:unmounted', cleanupOnUnmount);
    engineEmitter?.off?.('model:destroyed', cleanupOnDestroyed);
    if (bindings.get(bindingKey) === binding) {
      bindings.delete(bindingKey);
    }
  };

  const rememberLinkageTxId = (linkageTxId: unknown) => {
    if (typeof linkageTxId !== 'string' || !linkageTxId) return;
    binding.linkageTxIds.add(linkageTxId);
    if (binding.linkageTxIds.size <= 20) return;
    const oldest = binding.linkageTxIds.values().next().value;
    if (oldest) binding.linkageTxIds.delete(oldest);
  };

  const listener = (payload: any) => {
    const payloadLinkageTxId = typeof payload?.linkageTxId === 'string' ? payload.linkageTxId : undefined;
    if (payload?.source === 'linkage' && payloadLinkageTxId && binding.linkageTxIds.has(payloadLinkageTxId)) {
      return;
    }
    if (model.disposed || formBlock.disposed) {
      dispose();
      return;
    }
    const latestDeps = collectLinkageRefreshDeps(ctx, params);
    if (!linkageRefreshDepsMatchPayload(latestDeps, payload)) return;
    if (binding.running) {
      binding.pendingPayload = payload;
      return;
    }

    const refreshLinkageTxId = payloadLinkageTxId || (typeof payload?.txId === 'string' ? payload.txId : undefined);
    rememberLinkageTxId(refreshLinkageTxId);
    binding.running = true;
    const refreshCtx = new FlowRuntimeContext(model, flowKey);
    refreshCtx.defineProperty('inputArgs', {
      value: {
        ...(payload || {}),
        linkageTxId: refreshLinkageTxId,
      },
    });

    void linkageRulesRefresh
      .handler(refreshCtx, {
        actionName,
        flowKey,
        stepKey,
      })
      .catch((error) => {
        console.warn('[linkageRules] Failed to refresh form value driven linkage rules', error);
      })
      .finally(() => {
        binding.running = false;
        const pendingPayload = binding.pendingPayload;
        binding.pendingPayload = null;
        if (pendingPayload) {
          listener(pendingPayload);
        }
      });
  };

  const cleanupOnUnmount = ({ model: unmountedModel }: { model: FlowModel }) => {
    // Action linkage may hide the action itself, which unmounts its renderer.
    // Keep the watcher alive so later form changes can restore the action state.
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
