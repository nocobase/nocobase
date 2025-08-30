/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 全局事件注册表（EngineEventRegistry）。
 * 负责全局（FlowEngine 维度）事件的注册与查询。
 */
import type { FlowModel } from '../models';
import type { EventDefinition } from '../types';
import { BaseEventRegistry } from './BaseEventRegistry';

export class EngineEventRegistry extends BaseEventRegistry {
  getEvent<TModel extends FlowModel = FlowModel>(name: string): EventDefinition<TModel> | undefined {
    return this.events.get(name) as EventDefinition<TModel> | undefined;
  }

  getEvents<TModel extends FlowModel = FlowModel>(): Map<string, EventDefinition<TModel>> {
    return new Map(this.events);
  }
}
