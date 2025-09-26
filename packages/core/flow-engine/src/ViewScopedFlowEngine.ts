/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from './flowEngine';

/**
 * ViewScopedFlowEngine（视图作用域引擎）
 *
 * 设计目标：
 * - 仅在视图（dialog/drawer/embed）作用域内隔离“模型实例表”和“自动流缓存”；
 * - 其余能力（动作/事件/模型类/资源/仓库/设置/日志/翻译等）全部直接代理到父引擎；
 * - 使用 Proxy 实现“最小代理”，保持与父引擎的全局一致性。
 *
 * 注意：
 * - 本地化的字段仅有：`_modelInstances`、`_applyFlowCache`、`executor`、`context`；
 * - 其它字段/方法均通过 Proxy 转发到父引擎；
 * - 这满足“同一 uid 在不同视图中互不污染（实例/缓存隔离）”与“共享全局注册/仓库”的诉求。
 */
export function createViewScopedEngine(parent: FlowEngine): FlowEngine {
  const local = new FlowEngine();
  if (parent.modelRepository) {
    local.setModelRepository(parent.modelRepository);
  }
  local.context.addDelegate(parent.context);

  // 默认全部代理到父引擎，只有少数字段（实例/缓存/执行器/上下文/链表指针）使用本地值
  const localOnly = new Set<keyof FlowEngine | string>([
    '_modelInstances',
    '_applyFlowCache',
    'executor',
    'context',
    'previousEngine',
    'nextEngine',
    // 栈指针维护方法需要在本地执行，而非代理到父引擎
    'unlinkFromStack',
    'linkAfter',
    '_previousEngine',
    '_nextEngine',
  ]);

  const handler: ProxyHandler<FlowEngine> = {
    get(target, prop: string, receiver) {
      // 本地化字段（实例/缓存/执行器/上下文）
      if (localOnly.has(prop)) {
        return Reflect.get(target, prop, receiver);
      }
      // 其它一律代理到父引擎
      const value = Reflect.get(parent, prop, receiver);
      // 某些依赖 this 的方法需要绑定到父引擎实例
      if (prop === 'registerModels' && typeof value === 'function') {
        return value.bind(parent);
      }
      return value;
    },
    set(target, prop: string, value: unknown) {
      if (localOnly.has(prop)) {
        return Reflect.set(target, prop, value);
      }
      return Reflect.set(parent, prop, value);
    },
    has(target, prop: string) {
      return prop in target || prop in parent;
    },
  };

  // 建立 previous/next 链表指针，表示视图栈关系
  local.linkAfter(parent);
  return new Proxy(local, handler) as FlowEngine;
}
