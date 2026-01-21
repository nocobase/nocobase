/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from './flowEngine';

const ENGINE_SCOPE_KEY = '__NOCOBASE_ENGINE_SCOPE__';

/**
 * BlockScopedFlowEngine（区块作用域引擎）
 *
 * 设计目标：
 * - 仅在“区块”作用域内隔离“模型实例表”和“事件缓存”；
 * - 其余能力（动作/事件/模型类/资源/仓库/设置/日志/翻译等）全部直接代理到父引擎；
 * - 使用 Proxy 实现“最小代理”，保持与父引擎的全局一致性。
 *
 * 注意：
 * - 本地化的字段仅有：`_modelInstances`、`_applyFlowCache`、`executor`、`context`、栈指针；
 * - 其它字段/方法均通过 Proxy 转发到父引擎；
 * - 这样可满足“同一 uid 的模型可在不同区块隔离出现（实例/缓存隔离）”与“共享全局注册/仓库”的诉求。
 */
export function createBlockScopedEngine(parent: FlowEngine): FlowEngine {
  const local = new FlowEngine();
  // Mark for view-stack traversal (used by view activation events).
  Object.defineProperty(local, ENGINE_SCOPE_KEY, { value: 'block', configurable: true });
  if (parent.modelRepository) {
    local.setModelRepository(parent.modelRepository);
  }
  // 继承父级上下文能力
  local.context.addDelegate(parent.context);

  // 默认全部代理到父引擎，只有少数字段（实例/缓存/执行器/上下文/链表指针）使用本地值
  const localOnly = new Set<keyof FlowEngine | string>([
    '_modelInstances',
    '_applyFlowCache',
    'executor',
    'context',
    ENGINE_SCOPE_KEY,
    'previousEngine',
    'nextEngine',
    // 栈指针维护方法需要在本地执行，而非代理到父引擎
    'unlinkFromStack',
    'linkAfter',
    '_previousEngine',
    '_nextEngine',
    // getModel 需要在本地执行以确保全局查找时正确遍历整个引擎栈
    'getModel',
  ]);

  const handler: ProxyHandler<FlowEngine> = {
    get(target, prop: string, receiver) {
      if (localOnly.has(prop)) {
        return Reflect.get(target, prop, receiver);
      }
      const value = Reflect.get(parent, prop, receiver);
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

  // 与父引擎形成栈式关系，便于在多层作用域间进行全局查找
  local.linkAfter(parent);
  return new Proxy(local, handler) as FlowEngine;
}
