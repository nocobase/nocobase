/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const VIEW_ACTIVATED_VERSION = Symbol.for('__NOCOBASE_VIEW_ACTIVATED_VERSION__');
const ENGINE_SCOPE_KEY = '__NOCOBASE_ENGINE_SCOPE__';

function getViewActivatedVersion(emitter: unknown): number {
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

function isViewEngine(engine: unknown): boolean {
  if (!engine || (typeof engine !== 'object' && typeof engine !== 'function')) return false;
  return Reflect.get(engine as object, ENGINE_SCOPE_KEY) === 'view';
}

function findNearestViewEngine(engine) {
  let cur = engine;
  let guard = 0;
  while (cur && guard++ < 50) {
    if (isViewEngine(cur)) return cur;
    cur = cur.previousEngine;
  }
}

export function resolveOpenerEngine(parentEngine, scopedEngine) {
  if (!parentEngine) return undefined;
  return findNearestViewEngine(scopedEngine?.previousEngine) || parentEngine;
}
