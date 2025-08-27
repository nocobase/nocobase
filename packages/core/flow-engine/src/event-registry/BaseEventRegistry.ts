/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 通用的 Event 注册表基类（abstract）。
 * 抽取共享的注册逻辑，具体查询由子类实现。
 */
import type { FlowModel } from '../models';
import type { EventDefinition } from '../types';

export abstract class BaseEventRegistry<TModel extends FlowModel = FlowModel> {
  protected events: Map<string, EventDefinition<TModel>> = new Map();

  // 子类可覆盖：当事件被注册（含覆盖）时触发，可用于缓存失效等
  protected onEventRegistered(): void {}

  registerEvents(defs: Record<string, EventDefinition<TModel>>): void {
    for (const [, def] of Object.entries(defs || {})) {
      this.registerEvent(def);
    }
  }

  registerEvent(def: EventDefinition<TModel>): void {
    if (!def?.name) throw new Error('Event must have a name.');
    if (this.events.has(def.name)) {
      console.warn(`Event '${def.name}' is already registered. It will be overwritten.`);
    }
    this.events.set(def.name, def);
    this.onEventRegistered();
  }

  abstract getEvent<T extends FlowModel = FlowModel>(name: string): EventDefinition<T> | undefined;
  abstract getEvents<T extends FlowModel = FlowModel>(): Map<string, EventDefinition<T>>;
}
