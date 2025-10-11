/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 模型类级事件注册表（每个 FlowModel 子类一个）。
 * - 仅维护“当前类自有”的事件；
 * - 通过父类注册表实现继承合并，并在本类内部做缓存；
 * - 内部有查询缓存，避免重复计算。
 */
import type { EventDefinition } from '../types';
import type { FlowModel } from '../models';
import { BaseEventRegistry } from './BaseEventRegistry';

export class ModelEventRegistry extends BaseEventRegistry {
  private readonly modelClass: typeof FlowModel;
  private readonly parentRegistry: ModelEventRegistry | null;
  // 本类变更标记（变更即更新引用，用于缓存命中判断）
  private changeMarker: object = {};
  // 合并缓存：父类合并快照引用 + 本类标记 + 合并后的 Map
  private mergedCache?: {
    parentSnapshot?: Map<string, EventDefinition>;
    localMarker: object;
    mergedMap: Map<string, EventDefinition>;
  };

  constructor(modelClass: typeof FlowModel, parentRegistry?: ModelEventRegistry | null) {
    super();
    this.modelClass = modelClass;
    this.parentRegistry = parentRegistry ?? null;
  }

  // 标记本类有变更（用于缓存命中判断）
  protected onEventRegistered() {
    this.changeMarker = {};
  }

  /**
   * 获取“包含继承”的合并事件（父 → 子），内部带缓存。
   */
  getEvents<TModel extends FlowModel = FlowModel>(): Map<string, EventDefinition<TModel>> {
    const parentMap = this.parentRegistry?.getEvents<TModel>();
    if (
      this.mergedCache &&
      this.mergedCache.parentSnapshot === parentMap &&
      this.mergedCache.localMarker === this.changeMarker
    ) {
      return this.mergedCache.mergedMap as Map<string, EventDefinition<TModel>>;
    }
    const mergedMap = new Map<string, EventDefinition>(parentMap ?? []);
    for (const [k, v] of this.events) mergedMap.set(k, v);
    this.mergedCache = { parentSnapshot: parentMap, localMarker: this.changeMarker, mergedMap };
    return mergedMap as Map<string, EventDefinition<TModel>>;
  }

  /**
   * 解析指定名称的事件（优先本类，未命中递归父类）。
   */
  getEvent<TModel extends FlowModel = FlowModel>(name: string): EventDefinition<TModel> | undefined {
    const own = this.events.get(name) as EventDefinition<TModel> | undefined;
    if (own) return own;
    return this.parentRegistry?.getEvent(name);
  }
}
