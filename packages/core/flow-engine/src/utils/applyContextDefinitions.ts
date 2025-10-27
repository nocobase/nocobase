/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowContext, PropertyOptions } from '../flowContext';
import type { ActionDefinition } from '../types';

/**
 * 将 defineProperties/defineMethods 注入到 ctx。
 * - 直接将 defineProperties 的 value 作为 defineProperty 的 options 透传；
 * - defineMethods 的每个值需要是函数；
 */
export async function applyContextDefinitions<TCtx extends FlowContext>(
  ctx: TCtx,
  defLike?: Partial<Pick<ActionDefinition<any, TCtx>, 'defineProperties' | 'defineMethods'>> | null,
): Promise<void> {
  if (!defLike) return;

  // 处理 defineProperties
  if (defLike.defineProperties) {
    const raw =
      typeof defLike.defineProperties === 'function' ? await defLike.defineProperties(ctx) : defLike.defineProperties;
    if (!raw || typeof raw !== 'object') {
      throw new TypeError('defineProperties must return an object of PropertyOptions');
    }
    const propsDef = raw as Record<string, PropertyOptions>;
    for (const [key, options] of Object.entries(propsDef)) {
      if (!options || typeof options !== 'object') {
        throw new TypeError(`defineProperties['${key}'] must be a PropertyOptions object`);
      }
      ctx.defineProperty(key, options);
    }
  }

  // 处理 defineMethods
  if (defLike.defineMethods) {
    const raw = typeof defLike.defineMethods === 'function' ? await defLike.defineMethods(ctx) : defLike.defineMethods;
    if (!raw || typeof raw !== 'object') {
      throw new TypeError('defineMethods must return an object of functions');
    }
    const methodsDef = raw as Record<string, (this: TCtx, ...args: any[]) => any>;
    for (const [key, fn] of Object.entries(methodsDef)) {
      if (typeof fn !== 'function') {
        throw new TypeError(`defineMethods['${key}'] must be a function`);
      }
      // 绑定到当前 ctx
      ctx.defineMethod(key, fn as (this: FlowContext, ...args: any[]) => any);
    }
  }
}
