/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 模型类级动作注册表（每个 FlowModel 子类一个）。
 * - 仅维护“当前类自有”的动作；
 * - 通过父类注册表实现继承合并，并在本类内部做缓存；
 * - 内部有查询缓存，避免重复计算。
 */
import type { ActionDefinition } from '../types';
import type { FlowModel } from '../models';
import { BaseActionRegistry } from './BaseActionRegistry';

export class ModelActionRegistry extends BaseActionRegistry {
  private readonly modelClass: typeof FlowModel;
  private readonly parentRegistry: ModelActionRegistry | null;
  // 本类变更标记（变更即更新引用，用于缓存命中判断）
  private changeMarker: object = {};
  // 合并缓存：父类合并快照引用 + 本类标记 + 合并后的 Map
  private mergedCache?: {
    parentSnapshot?: Map<string, ActionDefinition>;
    localMarker: object;
    mergedMap: Map<string, ActionDefinition>;
  };

  constructor(modelClass: typeof FlowModel, parentRegistry?: ModelActionRegistry | null) {
    super();
    this.modelClass = modelClass;
    this.parentRegistry = parentRegistry ?? null;
  }

  // 标记本类有变更（用于缓存命中判断）
  onActionRegistered() {
    this.changeMarker = {};
  }

  /**
   * 获取“包含继承”的合并动作（父 → 子），内部带缓存。
   */
  getActions<TModel extends FlowModel = FlowModel>(): Map<string, ActionDefinition<TModel>> {
    const parentMap = this.parentRegistry?.getActions<TModel>();
    if (
      this.mergedCache &&
      this.mergedCache.parentSnapshot === parentMap &&
      this.mergedCache.localMarker === this.changeMarker
    ) {
      return this.mergedCache.mergedMap;
    }
    const mergedMap = new Map<string, ActionDefinition>(parentMap ?? []);
    for (const [k, v] of this.actions) mergedMap.set(k, v);
    this.mergedCache = { parentSnapshot: parentMap, localMarker: this.changeMarker, mergedMap };
    return mergedMap;
  }

  /**
   * 解析指定名称的动作（优先本类，未命中递归父类）。
   */
  getAction<TModel extends FlowModel = FlowModel>(name: string): ActionDefinition<TModel> {
    const own = this.actions.get(name);
    if (own) return own;
    return this.parentRegistry?.getAction(name);
  }
}
