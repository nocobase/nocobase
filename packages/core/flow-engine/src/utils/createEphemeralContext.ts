/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext } from '../flowContext';

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
export function createEphemeralContext<TCtx extends FlowContext>(parent: TCtx): TCtx {
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

  return outerProxy as TCtx;
}
