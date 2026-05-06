/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  extractUsedVariablePaths,
  extractUsedVariablePathsFromRunJS,
  isRunJSValue,
} from '@nocobase/flow-engine';
import { namePathToPathKey, parsePathString, pathKeyToNamePath } from '../models/blocks/form/value-runtime/path';
import type { NamePath } from '../models/blocks/form/value-runtime/types';

export type FormValuesChangeLikePayload = {
  changedPaths?: unknown[];
  changedValues?: Record<string, any>;
};

export type LinkageRuleDeps = {
  formValuesPaths: string[];
  itemPaths: string[];
  formValuesWildcard: boolean;
  itemWildcard: boolean;
  hasDeps: boolean;
};

type FieldIndexEntry = {
  name: string;
  index: number;
};

function normalizePathKey(raw: string): string {
  if (!raw) return '';
  const namePath = parsePathString(String(raw)).filter((seg) => typeof seg !== 'object') as NamePath;
  return namePath.length ? namePathToPathKey(namePath) : '';
}

function addUsage(
  usage: Record<string, string[]> | undefined,
  formValuesPaths: Set<string>,
  itemPaths: Set<string>,
  wildcard: { formValues: boolean; item: boolean },
) {
  if (!usage || typeof usage !== 'object') return;

  const addPaths = (varName: 'formValues' | 'item', rawPaths: unknown) => {
    const paths = Array.isArray(rawPaths) ? rawPaths : [];
    const normalizedPaths = paths.length ? paths : [''];

    for (const rawPath of normalizedPaths) {
      const subPath = typeof rawPath === 'string' ? rawPath : '';
      if (!subPath) {
        wildcard[varName] = true;
        continue;
      }
      const pathKey = normalizePathKey(subPath);
      if (!pathKey) {
        wildcard[varName] = true;
        continue;
      }
      if (varName === 'formValues') {
        formValuesPaths.add(pathKey);
      } else {
        itemPaths.add(pathKey);
      }
    }
  };

  addPaths('formValues', usage.formValues);
  addPaths('item', usage.item);
}

function hasPossibleRunJSContextUsage(value: string) {
  return (
    value.includes('ctx.formValues') ||
    value.includes('ctx.item') ||
    value.includes("ctx['formValues']") ||
    value.includes('ctx["formValues"]') ||
    value.includes("ctx['item']") ||
    value.includes('ctx["item"]') ||
    value.includes('ctx.getVar')
  );
}

function collectRunJSStringUsages(
  value: any,
  formValuesPaths: Set<string>,
  itemPaths: Set<string>,
  wildcard: { formValues: boolean; item: boolean },
  seen = new WeakSet<object>(),
) {
  if (value == null) return;

  if (typeof value === 'string') {
    if (hasPossibleRunJSContextUsage(value)) {
      addUsage(extractUsedVariablePathsFromRunJS(value), formValuesPaths, itemPaths, wildcard);
    }
    return;
  }

  if (typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);

  if (isRunJSValue(value)) {
    addUsage(extractUsedVariablePathsFromRunJS(value.code), formValuesPaths, itemPaths, wildcard);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectRunJSStringUsages(item, formValuesPaths, itemPaths, wildcard, seen);
    }
    return;
  }

  for (const item of Object.values(value)) {
    collectRunJSStringUsages(item, formValuesPaths, itemPaths, wildcard, seen);
  }
}

function getEnabledRulesParams(params: any) {
  const rules = params?.value;
  if (!Array.isArray(rules)) {
    return params;
  }
  return {
    ...params,
    value: rules.filter((rule) => rule?.enable !== false),
  };
}

export function collectLinkageRuleDeps(params: any): LinkageRuleDeps {
  const formValuesPaths = new Set<string>();
  const itemPaths = new Set<string>();
  const wildcard = { formValues: false, item: false };
  const scanTarget = getEnabledRulesParams(params);

  try {
    addUsage(extractUsedVariablePaths(scanTarget as any), formValuesPaths, itemPaths, wildcard);
  } catch {
    // ignore best-effort dependency extraction failures
  }

  collectRunJSStringUsages(scanTarget, formValuesPaths, itemPaths, wildcard);

  const deps = {
    formValuesPaths: Array.from(formValuesPaths),
    itemPaths: Array.from(itemPaths),
    formValuesWildcard: wildcard.formValues,
    itemWildcard: wildcard.item,
    hasDeps: false,
  };
  deps.hasDeps =
    deps.formValuesWildcard || deps.itemWildcard || deps.formValuesPaths.length > 0 || deps.itemPaths.length > 0;
  return deps;
}

function normalizeChangedPath(raw: unknown): NamePath | null {
  if (Array.isArray(raw)) {
    const parts = raw.filter((seg) => typeof seg === 'string' || typeof seg === 'number') as NamePath;
    if (!parts.length) return null;
    if (parts.length === 1 && typeof parts[0] === 'string') {
      return pathKeyToNamePath(parts[0]);
    }
    return parts;
  }
  if (typeof raw === 'string') {
    return pathKeyToNamePath(raw);
  }
  return null;
}

function getChangedPaths(payload: FormValuesChangeLikePayload | undefined): NamePath[] {
  const fromPayload = Array.isArray(payload?.changedPaths)
    ? payload.changedPaths.map(normalizeChangedPath).filter(Boolean)
    : [];
  if (fromPayload.length) return fromPayload as NamePath[];

  const changedValues = payload?.changedValues;
  if (changedValues && typeof changedValues === 'object') {
    return Object.keys(changedValues).map((key) => pathKeyToNamePath(key));
  }

  return [];
}

function isPrefixPath(prefix: NamePath, target: NamePath) {
  if (!prefix.length || prefix.length > target.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== target[i]) return false;
  }
  return true;
}

function pathsOverlap(a: NamePath, b: NamePath) {
  return isPrefixPath(a, b) || isPrefixPath(b, a);
}

function anyChangedPathMatches(target: NamePath, changedPaths: NamePath[]) {
  return changedPaths.some((changedPath) => pathsOverlap(target, changedPath));
}

function parseFieldIndex(fieldIndex: unknown): FieldIndexEntry[] {
  const arr = Array.isArray(fieldIndex) ? fieldIndex : [];
  return arr
    .map((raw): FieldIndexEntry | null => {
      if (typeof raw !== 'string') return null;
      const [name, indexStr] = raw.split(':');
      const index = Number(indexStr);
      if (!name || !Number.isFinite(index)) return null;
      return { name, index };
    })
    .filter(Boolean) as FieldIndexEntry[];
}

function entriesToNamePath(entries: FieldIndexEntry[]): NamePath {
  const out: NamePath = [];
  for (const entry of entries) {
    out.push(entry.name, entry.index);
  }
  return out;
}

function resolveItemPath(itemPathKey: string, context?: any): NamePath | null {
  const entries = parseFieldIndex(context?.fieldIndex);
  if (!entries.length) return null;

  const segments = pathKeyToNamePath(itemPathKey);
  let parentDepth = 0;
  while (segments[0] === 'parentItem') {
    parentDepth += 1;
    segments.shift();
  }

  if (parentDepth > entries.length) return null;

  const targetEntries = entries.slice(0, entries.length - parentDepth);
  const itemRoot = entriesToNamePath(targetEntries);
  if (!segments.length) return itemRoot.length ? itemRoot : null;

  const [head, ...rest] = segments;
  if (head === 'value') {
    const valuePath = [...itemRoot, ...rest];
    return valuePath.length ? valuePath : null;
  }

  if (head === 'index' || head === 'length') {
    return itemRoot.length ? itemRoot.slice(0, -1) : null;
  }

  if (head === '__is_new__' || head === '__is_stored__') {
    return itemRoot.length ? itemRoot : null;
  }

  return null;
}

export function linkageRuleDepsShouldRefresh(
  deps: LinkageRuleDeps,
  payload?: FormValuesChangeLikePayload,
  context?: any,
): boolean {
  if (!deps?.hasDeps) return false;

  const changedPaths = getChangedPaths(payload);
  if (!changedPaths.length) {
    return true;
  }

  if (deps.formValuesWildcard || deps.itemWildcard) {
    return true;
  }

  for (const pathKey of deps.formValuesPaths || []) {
    const depPath = pathKeyToNamePath(pathKey);
    if (anyChangedPathMatches(depPath, changedPaths)) {
      return true;
    }
  }

  for (const itemPathKey of deps.itemPaths || []) {
    const resolved = resolveItemPath(itemPathKey, context);
    if (!resolved) {
      return true;
    }
    if (anyChangedPathMatches(resolved, changedPaths)) {
      return true;
    }
  }

  return false;
}
