/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type EmitterLike = {
  on?: (event: string, callback: (...args: any[]) => void) => void;
  off?: (event: string, callback: (...args: any[]) => void) => void;
  emit?: (event: string, ...args: any[]) => void;
};

export type EngineLike = {
  emitter?: EmitterLike;
  previousEngine?: EngineLike;
};

export const VIEW_ACTIVATED_VERSION = Symbol.for('__NOCOBASE_VIEW_ACTIVATED_VERSION__');
export const ENGINE_SCOPE_KEY = '__NOCOBASE_ENGINE_SCOPE__';

export function getViewActivatedVersion(emitter: unknown): number {
  if (!emitter || (typeof emitter !== 'object' && typeof emitter !== 'function')) return 0;
  const raw = Reflect.get(emitter as object, VIEW_ACTIVATED_VERSION);
  const num = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

export function bumpViewActivatedVersion(emitter: unknown): number {
  if (!emitter || (typeof emitter !== 'object' && typeof emitter !== 'function')) return 0;
  const current = getViewActivatedVersion(emitter);
  if (!Object.isExtensible(emitter)) return current;
  const next = current + 1;
  Reflect.set(emitter as object, VIEW_ACTIVATED_VERSION, next);
  return next;
}

export function isViewEngine(engine: unknown): engine is EngineLike {
  if (!engine || (typeof engine !== 'object' && typeof engine !== 'function')) return false;
  return Reflect.get(engine as object, ENGINE_SCOPE_KEY) === 'view';
}

export function findNearestViewEngine(engine: EngineLike | undefined): EngineLike | undefined {
  let cur = engine;
  const seen = new Set<EngineLike>();
  let guard = 0;
  while (cur && guard++ < 50 && !seen.has(cur)) {
    seen.add(cur);
    if (isViewEngine(cur)) return cur;
    cur = cur.previousEngine;
  }
  return undefined;
}

export function resolveOpenerEngine(
  parentEngine: EngineLike | undefined,
  scopedEngine: EngineLike | undefined,
): EngineLike | undefined {
  if (!parentEngine) return undefined;
  if (isViewEngine(parentEngine)) return parentEngine;
  const byStack = findNearestViewEngine(scopedEngine?.previousEngine);
  return byStack || parentEngine;
}
