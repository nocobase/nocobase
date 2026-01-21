/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, type FlowContextMethodInfoInput, type PropertyOptions } from '../flowContext';
import type { ActionDefinition } from '../types';

// 临时上下文：
// - 读：优先从 scoped（临时定义）读取，兜底 parent；
// - 写：统一写入 parent（不污染 scoped）；
// - 注入：create 阶段 define* 写入 scoped；运行阶段 define* 写入 parent。
type ContextDefsLike<TCtx extends FlowContext> =
  | Partial<Pick<ActionDefinition<any, TCtx>, 'defineProperties' | 'defineMethods'>>
  | null
  | undefined;

export async function createEphemeralContext<TCtx extends FlowContext>(
  parent: TCtx,
  contextDefs?: ContextDefsLike<TCtx>,
): Promise<TCtx> {
  // 若未提供任何上下文定义，直接复用父级上下文，避免不必要的代理包装
  if (contextDefs == null || (!contextDefs.defineProperties && !contextDefs.defineMethods)) {
    return parent;
  }
  // 1) 创建一个新的 FlowContext，专门承载“临时定义”（defineProperty/defineMethod）
  const scoped = new FlowContext();
  // 2) 读取优先：先从 scoped 自身取（_props/_methods），否则委托到 parent（仅 _props/_methods）
  scoped.addDelegate(parent);

  // 3) 先创建 scoped 的代理，用于注入阶段（define* 直达 scoped；读写行为与最终代理一致）
  const scopedProxy = scoped.createProxy();
  const scopedObj = scopedProxy as unknown as object;
  const parentObj = parent as unknown as object;
  const getFromParent = (key: PropertyKey) => {
    const val = Reflect.get(parentObj, key, parentObj);
    return typeof val === 'function' ? (val as Function).bind(parent) : val;
  };
  const hasInScopedOrParent = (key: PropertyKey) =>
    key === 'defineProperty' || key === 'defineMethod' || Reflect.has(scopedObj, key) || Reflect.has(parentObj, key);
  const injectionProxy = new Proxy(scopedProxy as TCtx, {
    get(_t, key: PropertyKey, receiver) {
      if (typeof key === 'string') {
        // 注入阶段：允许在 defLike 的函数体中调用 ctx.defineProperty/defineMethod 写入 scoped
        if (key === 'defineProperty') {
          return (propKey: string, options: any) => (scoped as FlowContext).defineProperty(propKey, options);
        }
        if (key === 'defineMethod') {
          return (name: string, fn: any, info?: string | FlowContextMethodInfoInput) =>
            (scoped as FlowContext).defineMethod(name, fn, info);
        }
        if (Reflect.has(scopedObj, key)) {
          return Reflect.get(scopedObj, key, receiver);
        }
        return getFromParent(key);
      }
      return Reflect.get(scopedObj, key, receiver);
    },
    set(_t, key: PropertyKey, value: unknown) {
      return Reflect.set(parentObj, key, value);
    },
    has(_t, key: PropertyKey) {
      return hasInScopedOrParent(key);
    },
    getOwnPropertyDescriptor(_t, key: PropertyKey) {
      return Object.getOwnPropertyDescriptor(scopedObj, key) || Object.getOwnPropertyDescriptor(parentObj, key);
    },
  });

  // 如果提供了 contextDefs，则在创建时即注入定义，便于外部更简洁地使用
  if (contextDefs) {
    const defs = Array.isArray(contextDefs) ? contextDefs : [contextDefs];
    for (const defLike of defs) {
      if (!defLike) continue;
      // 1) defineProperties -> 写入到 scoped（避免污染父级）
      const dp = (defLike as any).defineProperties;
      if (dp) {
        const raw = typeof dp === 'function' ? await dp(injectionProxy as TCtx) : dp;
        if (!raw || typeof raw !== 'object') {
          throw new TypeError('defineProperties must return an object of PropertyOptions');
        }
        const propsDef = raw as Record<string, PropertyOptions>;
        for (const [key, options] of Object.entries(propsDef)) {
          if (!options || typeof options !== 'object') {
            throw new TypeError(`defineProperties['${key}'] must be a PropertyOptions object`);
          }
          // 直接在 scoped 上定义，确保仅限本次临时作用域
          (scoped as FlowContext).defineProperty(key, options);
        }
      }
      // 2) defineMethods -> 写入到 scoped（避免污染父级）
      const dm = (defLike as any).defineMethods;
      if (dm) {
        const raw = typeof dm === 'function' ? await dm(injectionProxy as TCtx) : dm;
        if (!raw || typeof raw !== 'object') {
          throw new TypeError('defineMethods must return an object of functions');
        }
        const methodsDef = raw as Record<string, (this: TCtx, ...args: any[]) => any>;
        for (const [key, fn] of Object.entries(methodsDef)) {
          if (typeof fn !== 'function') {
            throw new TypeError(`defineMethods['${key}'] must be a function`);
          }
          (scoped as FlowContext).defineMethod(key, fn as any);
        }
      }
    }
  }

  // 4) 创建最终对外代理：读取优先 scoped，兜底父级，且后续 define* 写入父级
  const outerProxy = new Proxy(scopedProxy as TCtx, {
    get(_t, key: PropertyKey, receiver) {
      if (typeof key === 'string') {
        if (key === 'defineProperty') {
          return (propKey: string, options: any) => (parent as FlowContext).defineProperty(propKey, options);
        }
        if (key === 'defineMethod') {
          return (name: string, fn: any, info?: string | FlowContextMethodInfoInput) =>
            (parent as FlowContext).defineMethod(name, fn, info);
        }
        if (Reflect.has(scopedObj, key)) {
          return Reflect.get(scopedObj, key, receiver);
        }
        return getFromParent(key);
      }
      return Reflect.get(scopedObj, key, receiver);
    },
    set(_t, key: PropertyKey, value: unknown) {
      return Reflect.set(parentObj, key, value);
    },
    has(_t, key: PropertyKey) {
      return hasInScopedOrParent(key);
    },
    getOwnPropertyDescriptor(_t, key: PropertyKey) {
      return Object.getOwnPropertyDescriptor(scopedObj, key) || Object.getOwnPropertyDescriptor(parentObj, key);
    },
  });

  return outerProxy as TCtx;
}
