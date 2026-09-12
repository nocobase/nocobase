/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext } from '@nocobase/flow-engine';
import { namePathToPathKey, parsePathString, pathKeyToNamePath } from '../models/blocks/form/value-runtime/path';

export type NamePath = Array<string | number>;

export type FieldIndexEntry = {
  name: string;
  index: number;
};

export function isSameNamePath(a: NamePath, b: NamePath) {
  return a.length === b.length && a.every((seg, index) => seg === b[index]);
}

export function isNamePathPrefix(prefix: NamePath, path: NamePath) {
  if (prefix.length > path.length) return false;
  return prefix.every((seg, index) => seg === path[index]);
}

export function dedupeNamePaths(paths: NamePath[]) {
  const byKey = new Map<string, NamePath>();
  for (const path of paths) {
    if (!path?.length) continue;
    byKey.set(namePathToPathKey(path), path);
  }
  return Array.from(byKey.values());
}

export function minimizeNamePaths(paths: NamePath[]) {
  const deduped = dedupeNamePaths(paths);
  return deduped.filter((path, index) => {
    return !deduped.some((other, otherIndex) => otherIndex !== index && isNamePathPrefix(path, other));
  });
}

export function parseFieldIndexEntries(fieldIndex: unknown): FieldIndexEntry[] {
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

export function getFieldIndexEntriesFromContext(ctx: FlowContext | { model?: unknown; fieldIndex?: unknown }) {
  const model = ctx?.model as { context?: { fieldIndex?: unknown } } | undefined;
  return parseFieldIndexEntries(model?.context?.fieldIndex ?? (ctx as { fieldIndex?: unknown })?.fieldIndex);
}

export function buildItemRowPath(entries: FieldIndexEntry[], parentDepth: number): NamePath | null {
  const targetIndex = entries.length - 1 - parentDepth;
  if (targetIndex < 0) return null;

  const out: NamePath = [];
  for (let index = 0; index <= targetIndex; index++) {
    out.push(entries[index].name, entries[index].index);
  }
  return out;
}

export function buildItemListRootPath(entries: FieldIndexEntry[], parentDepth: number): NamePath | null {
  const rowPath = buildItemRowPath(entries, parentDepth);
  if (!rowPath?.length) return null;
  return rowPath.slice(0, -1);
}

export function parseDependencyPath(subPath: string): NamePath {
  return parsePathString(subPath).filter((seg) => typeof seg !== 'object') as NamePath;
}

export function parsePathKey(pathKey: string): NamePath {
  return pathKeyToNamePath(pathKey) as NamePath;
}

export function getChangedPathsFromPayload(
  payload: unknown,
  options: { includeArrayChangedValues?: boolean } = {},
): NamePath[] {
  const payloadObj = payload as
    | {
        changedPaths?: unknown;
        changedValues?: unknown;
      }
    | undefined;
  const rawChangedPaths = Array.isArray(payloadObj?.changedPaths) ? payloadObj.changedPaths : [];
  const out: NamePath[] = [];

  for (const path of rawChangedPaths) {
    if (Array.isArray(path)) {
      if (path.length === 1 && typeof path[0] === 'string') {
        const namePath = pathKeyToNamePath(path[0]);
        if (namePath.length) out.push(namePath as NamePath);
        continue;
      }
      const segs = path.filter((seg) => typeof seg === 'string' || typeof seg === 'number') as NamePath;
      if (segs.length) out.push(segs);
      continue;
    }
    if (typeof path === 'string' && path) {
      out.push(pathKeyToNamePath(path) as NamePath);
    }
  }

  if (out.length) {
    return out;
  }

  const changedValues = payloadObj?.changedValues;
  const canReadChangedValues =
    changedValues &&
    typeof changedValues === 'object' &&
    (options.includeArrayChangedValues || !Array.isArray(changedValues));
  if (canReadChangedValues) {
    for (const key of Object.keys(changedValues)) {
      const namePath = pathKeyToNamePath(key);
      if (namePath.length) out.push(namePath as NamePath);
    }
  }

  return out;
}

export function isFormValueChangeSource(model: unknown) {
  const candidate = model as
    | {
        emitter?: { on?: unknown; off?: unknown };
        formValueRuntime?: unknown;
        context?: { form?: unknown; setFormValues?: unknown };
      }
    | undefined;
  if (!candidate || typeof candidate !== 'object') return false;
  if (!candidate.emitter || typeof candidate.emitter.on !== 'function' || typeof candidate.emitter.off !== 'function') {
    return false;
  }
  return (
    !!candidate.formValueRuntime || !!candidate.context?.form || typeof candidate.context?.setFormValues === 'function'
  );
}

export function findFormValueChangeSource(ctx: FlowContext): unknown | null {
  const candidates: unknown[] = [];
  const push = (model: unknown) => {
    if (model && !candidates.includes(model)) candidates.push(model);
  };

  const model = ctx.model as { context?: { blockModel?: unknown }; parent?: unknown } | undefined;
  push(model?.context?.blockModel);
  push(ctx.model);

  let cursor = model?.parent as { parent?: unknown } | undefined;
  while (cursor) {
    push(cursor);
    cursor = cursor?.parent as { parent?: unknown } | undefined;
  }

  return candidates.find(isFormValueChangeSource) || null;
}
