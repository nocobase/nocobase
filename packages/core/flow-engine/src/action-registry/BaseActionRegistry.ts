/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 通用的 Action 注册表基类（abstract）。
 * 抽取共享的注册逻辑，具体查询由子类实现。
 */
import type { ActionDefinition } from '../types';
import type { FlowModel } from '../models';
import type { FlowContext, FlowRuntimeContext } from '../flowContext';

export abstract class BaseActionRegistry<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> {
  protected actions: Map<string, ActionDefinition<TModel, TCtx>> = new Map();

  // 子类可覆盖：当动作被注册（含覆盖）时触发，可用于缓存失效等
  protected onActionRegistered(): void {}

  registerActions(defs: Record<string, ActionDefinition<TModel, TCtx>>): void {
    for (const [, def] of Object.entries(defs || {})) {
      this.registerAction(def);
    }
  }

  registerAction(def: ActionDefinition<TModel, TCtx>): void {
    if (!def?.name) throw new Error('Action must have a name.');
    if (this.actions.has(def.name)) {
      console.warn(`Action '${def.name}' is already registered. It will be overwritten.`);
    }
    this.actions.set(def.name, def);
    this.onActionRegistered();
  }

  abstract getAction<T extends FlowModel = FlowModel, CTX extends FlowContext = FlowRuntimeContext<T>>(
    name: string,
  ): ActionDefinition<T, CTX> | undefined;
  abstract getActions<T extends FlowModel = FlowModel, CTX extends FlowContext = FlowRuntimeContext<T>>(): Map<
    string,
    ActionDefinition<T, CTX>
  >;
}
