/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext } from '../flowContext';
import type { ActionDefinition } from '../types';
import type { PropertyOptions } from '../flowContext';

/**
 * Create a scoped context that delegates to parent context.
 * Optionally bridge direct fields (non-defineProperty) via getters.
 */
/**
 * 创建一个“临时上下文”：
 * - 读取：优先从当前临时上下文获取定义（props/methods），否则回退到父级原始上下文的“直接字段/原型方法”；
 * - 写入：一律写入父级原始上下文（保持原上下文为唯一真实数据源，不污染临时作用域）；
 * - 用途：在执行单步/临时动作前，注入仅对该次执行生效的属性与方法，避免污染全局或模型级上下文。
 */
type ContextDefsLike<TCtx extends FlowContext> =
  | Partial<Pick<ActionDefinition<any, TCtx>, 'defineProperties' | 'defineMethods'>>
  | Array<Partial<Pick<ActionDefinition<any, TCtx>, 'defineProperties' | 'defineMethods'>> | null | undefined>
  | null
  | undefined;

export async function createEphemeralContext<TCtx extends FlowContext>(
  parent: TCtx,
  contextDefs?: ContextDefsLike<TCtx>,
): Promise<TCtx> {
  // 1) 创建一个新的 FlowContext，专门承载“临时定义”（defineProperty/defineMethod）
  const scoped = new FlowContext();
  // 2) 读取优先：先从 scoped 自身取（_props/_methods），否则委托到 parent（仅 _props/_methods）
  scoped.addDelegate(parent);

  // 3) 返回一个“外层代理”，其 get 优先从 scoped 读取，否则兜底读 parent 的“直接字段/原型方法”；
  //    set 一律写入 parent，避免污染 scoped，确保 ctx.xxx = yyy 修改的是原始上下文。
  const scopedProxy = scoped.createProxy();
  const outerProxy = new Proxy(scopedProxy as TCtx, {
    get(_t, key: PropertyKey, receiver) {
      if (typeof key === 'string') {
        // 将后续的 defineProperty/defineMethod 调用重定向到父级原始上下文，避免污染临时作用域
        if (key === 'defineProperty') {
          return (propKey: string, options: any) => (parent as FlowContext).defineProperty(propKey, options);
        }
        if (key === 'defineMethod') {
          return (name: string, fn: any, des?: string) => (parent as FlowContext).defineMethod(name, fn, des);
        }
        // 先查 scoped（包含 _props/_methods 与委托链上的 props/methods）
        if (Reflect.has(scopedProxy, key)) {
          return Reflect.get(scopedProxy, key, receiver);
        }
        // 兜底：父级的直接字段或原型方法
        const val = Reflect.get(parent as unknown as object, key, parent as unknown as object);
        if (typeof val === 'function') {
          // 绑定父级，保证原型方法（如 exit/exitAll）中的 this 正确
          return (val as Function).bind(parent);
        }
        return val;
      }
      return Reflect.get(scopedProxy as unknown as object, key, receiver);
    },
    set(_t, key: PropertyKey, value: unknown, _receiver) {
      // 直接写入父级，避免污染 scoped 的临时上下文
      return Reflect.set(parent as unknown as object, key, value);
    },
    has(_t, key: PropertyKey) {
      return Reflect.has(scopedProxy as unknown as object, key) || Reflect.has(parent as unknown as object, key);
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
        const raw = typeof dp === 'function' ? await dp(outerProxy as TCtx) : dp;
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
        const raw = typeof dm === 'function' ? await dm(outerProxy as TCtx) : dm;
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

  return outerProxy as TCtx;
}
