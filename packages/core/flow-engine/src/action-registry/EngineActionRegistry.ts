/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 全局 action 注册表（EngineActionRegistry）。
 * 负责全局（FlowEngine 维度）动作的注册与查询。
 */
import type { FlowModel } from '../models';
import type { ActionDefinition } from '../types';
import { BaseActionRegistry } from './BaseActionRegistry';

export class EngineActionRegistry extends BaseActionRegistry {
  getAction<TModel extends FlowModel = FlowModel>(name: string): ActionDefinition<TModel> {
    return this.actions.get(name) as ActionDefinition<TModel>;
  }

  getActions<TModel extends FlowModel = FlowModel>(): Map<string, ActionDefinition<TModel>> {
    return new Map(this.actions);
  }
}
