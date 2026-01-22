/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const VIEW_ACTIVATED_VERSION = Symbol.for('__NOCOBASE_VIEW_ACTIVATED_VERSION__');

export const VIEW_ACTIVATED_EVENT = 'view:activated' as const;
export const DATA_SOURCE_DIRTY_EVENT = 'dataSource:dirty' as const;

export const ENGINE_SCOPE_KEY = '__NOCOBASE_ENGINE_SCOPE__' as const;
export const VIEW_ENGINE_SCOPE = 'view' as const;

export function getEmitterViewActivatedVersion(emitter: unknown): number {
  if (!emitter || (typeof emitter !== 'object' && typeof emitter !== 'function')) return 0;
  const raw = Reflect.get(emitter as object, VIEW_ACTIVATED_VERSION);
  const num = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

export function bumpViewActivatedVersion(emitter: unknown): number {
  if (!emitter || (typeof emitter !== 'object' && typeof emitter !== 'function')) return 0;
  const current = getEmitterViewActivatedVersion(emitter);
  if (!Object.isExtensible(emitter)) return current;
  const next = current + 1;
  Reflect.set(emitter as object, VIEW_ACTIVATED_VERSION, next);
  return next;
}

function isViewEngine(engine: unknown): boolean {
  if (!engine || (typeof engine !== 'object' && typeof engine !== 'function')) return false;
  return Reflect.get(engine as object, ENGINE_SCOPE_KEY) === VIEW_ENGINE_SCOPE;
}

function findNearestViewEngine(engine: unknown) {
  let cur: unknown = engine;
  let guard = 0;
  while (cur && guard++ < 50) {
    if (isViewEngine(cur)) return cur;
    cur = (cur as { previousEngine?: unknown }).previousEngine;
  }
}

export function resolveOpenerEngine(parentEngine: unknown, scopedEngine: unknown) {
  if (!parentEngine) return undefined;
  const previousEngine = (scopedEngine as { previousEngine?: unknown } | undefined)?.previousEngine;
  return findNearestViewEngine(previousEngine) || parentEngine;
}
