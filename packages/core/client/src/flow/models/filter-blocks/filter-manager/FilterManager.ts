/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterGroup, FilterItem, FlowModel } from '@nocobase/flow-engine';
import _ from 'lodash';
import { getDefaultOperator, isFilterValueEmpty } from './utils';

type FilterConfig = {
  /** 筛选器的 model uid */
  filterId: string;
  /** 数据区块或者图表区块的 model uid */
  targetId: string;
  /** 被筛选区块的数据表字段路径 */
  filterPaths: string[];
  /** 筛选操作符，每个条件的操作符可以不一样 */
  operator?: string;
};

export type ConnectFieldsConfig = {
  targets: {
    /** 数据区块或者图表区块的 model uid */
    targetId: string;
    /** 被筛选区块的数据表字段路径 */
    filterPaths: string[];
  }[];
};

export const FILTER_CONFIGS_STEP_KEY = 'filterConfigs';
export const FILTER_MANAGER_FLOW_KEY = 'filterManagerSettings';

export class FilterManager {
  private filterConfigs: FilterConfig[];
  private readonly gridModel: FlowModel;

  constructor(gridModel: FlowModel) {
    this.gridModel = gridModel;
    const stepValue = this.gridModel.getStepParams(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY);
    this.filterConfigs = _.isPlainObject(stepValue) ? Object.values(stepValue) : stepValue || [];
  }

  async saveFilterConfigs() {
    this.gridModel.setStepParams(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY, this.filterConfigs);
    await this.gridModel.save();
  }

  getConnectFieldsConfig(filterModelUid: string): ConnectFieldsConfig | undefined {
    // 1. 从 filterConfigs 中获取连接字段的配置
    const relatedConfigs = this.filterConfigs.filter((config) => config.filterId === filterModelUid);

    if (relatedConfigs.length === 0) {
      return undefined;
    }

    return {
      targets: relatedConfigs.map((config) => ({
        targetId: config.targetId,
        filterPaths: config.filterPaths,
      })),
    };
  }

  async saveConnectFieldsConfig(filterModelUid: string, config: ConnectFieldsConfig) {
    // 1. 把参数 FilterModelUid 和 config 转换成一个 filterConfigs
    const newFilterConfigs: FilterConfig[] = config.targets.map((target) => ({
      filterId: filterModelUid,
      targetId: target.targetId,
      filterPaths: target.filterPaths,
    }));

    // 2. 先删除 filterConfigs 中的旧配置，再把新的配置添加进去
    const filteredConfigs = this.filterConfigs.filter((config) => config.filterId !== filterModelUid);
    this.filterConfigs = [];
    this.filterConfigs.push(...filteredConfigs, ...newFilterConfigs);

    // 3. 保存 this.filterConfigs 的值
    await this.saveFilterConfigs();
  }

  /**
   * 添加筛选配置
   *
   * 将新的筛选配置添加到管理器中。如果相同的筛选器和目标组合已存在，则会更新配置。
   *
   * @param filterConfig - 要添加的筛选配置
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await filterManager.addFilterConfig({
   *   filterId: 'filter-1',
   *   targetId: 'target-1',
   *   filterPaths: ['name'],
   *   operator: '$eq'
   * });
   * ```
   */
  async addFilterConfig(filterConfig: FilterConfig) {
    // 1. 验证必填字段
    if (!filterConfig.filterId || !filterConfig.targetId) {
      throw new Error('FilterConfig must have filterId, targetId, and operator');
    }

    if (!Array.isArray(filterConfig.filterPaths) || filterConfig.filterPaths.length === 0) {
      throw new Error('FilterConfig must have non-empty filterPaths array');
    }

    // 2. 检查是否已存在相同的配置（相同的 filterId 和 targetId 组合）
    const existingIndex = this.filterConfigs.findIndex(
      (config) => config.filterId === filterConfig.filterId && config.targetId === filterConfig.targetId,
    );

    // 3. 如果存在则更新，否则添加新配置
    if (existingIndex >= 0) {
      this.filterConfigs[existingIndex] = { ...filterConfig };
    } else {
      this.filterConfigs.push({ ...filterConfig });
    }

    // 4. 保存配置
    await this.saveFilterConfigs();
  }

  /**
   * 删除筛选配置
   *
   * 根据提供的参数删除对应的筛选配置。支持多种删除策略：
   * - 仅提供 filterId：删除该筛选器相关的所有配置
   * - 仅提供 targetId：删除该目标相关的所有配置
   * - 两个都提供：删除特定的筛选器-目标组合配置
   *
   * @param options - 删除选项
   * @param options.filterId - 筛选器模型 UID（可选）
   * @param options.targetId - 目标模型 UID（可选）
   * @returns Promise<number> 返回被删除的配置数量
   * @throws 当两个参数都未提供时抛出错误
   *
   * @example
   * ```typescript
   * // 删除筛选器的所有配置
   * const removedCount = await filterManager.removeFilterConfig({ filterId: 'filter-1' });
   *
   * // 删除目标的所有配置
   * const removedCount = await filterManager.removeFilterConfig({ targetId: 'target-1' });
   *
   * // 删除特定的筛选器-目标组合配置
   * const removedCount = await filterManager.removeFilterConfig({
   *   filterId: 'filter-1',
   *   targetId: 'target-1'
   * });
   * ```
   */
  async removeFilterConfig({ filterId, targetId }: { filterId?: string; targetId?: string }): Promise<number> {
    // 1. 验证参数：至少需要提供一个参数
    if (!filterId && !targetId) {
      throw new Error('At least one of filterId or targetId must be provided');
    }

    // 2. 记录删除前的配置数量
    const originalLength = this.filterConfigs.length;

    // 3. 根据提供的参数过滤配置
    this.filterConfigs = this.filterConfigs.filter((config) => {
      // 如果两个参数都提供，需要同时匹配
      if (filterId && targetId) {
        return !(config.filterId === filterId && config.targetId === targetId);
      }

      // 如果只提供 filterId，删除该筛选器的所有配置
      if (filterId) {
        return config.filterId !== filterId;
      }

      // 如果只提供 targetId，删除该目标的所有配置
      if (targetId) {
        return config.targetId !== targetId;
      }

      return true;
    });

    // 4. 计算被删除的配置数量
    const removedCount = originalLength - this.filterConfigs.length;

    // 5. 如果有配置被删除，则保存更改
    if (removedCount > 0) {
      await this.saveFilterConfigs();
    }

    return removedCount;
  }

  /**
   * 将筛选配置绑定到 TargetModel
   *
   * 根据提供的 targetId 查找与之关联的已存在的筛选配置，
   * 然后通过 targetModel.resource.addFilterGroup 方法将这些配置添加到目标模型中。
   *
   * @param targetId - 目标模型的唯一标识符
   * @throws 当 targetId 为空或目标模型不存在时抛出错误
   *
   * @example
   * ```typescript
   * filterManager.bindToTarget('target-model-uid');
   * ```
   */
  bindToTarget(targetId: string) {
    // 1. 参数验证
    if (!targetId || typeof targetId !== 'string') {
      throw new Error('targetId must be a non-empty string');
    }

    // 2. 通过 flowEngine 查找目标模型
    const targetModel = this.gridModel.flowEngine.getModel(targetId);

    // 3. 验证目标模型是否存在
    if (!targetModel) {
      throw new Error(`Target model with uid "${targetId}" not found`);
    }

    // 4. 验证目标模型是否具有 resource 属性
    if (!(targetModel as any).resource || typeof (targetModel as any).resource.addFilterGroup !== 'function') {
      throw new Error(`Target model with uid "${targetId}" does not have a valid resource with addFilterGroup method`);
    }

    // 验证目标模型是否具有 removeFilterGroup 方法
    if (typeof (targetModel as any).resource.removeFilterGroup !== 'function') {
      throw new Error(
        `Target model with uid "${targetId}" does not have a valid resource with removeFilterGroup method`,
      );
    }

    // 5. 获取与目标模型相关的筛选配置
    const relatedConfigs = this.filterConfigs.filter((config) => config.targetId === targetId);

    if (relatedConfigs.length === 0) {
      // 没有相关配置，但不抛出错误，只是没有筛选条件需要绑定
      return;
    }

    // 6. 将筛选配置应用到目标模型
    relatedConfigs.forEach((config) => {
      const filterModel: any = this.gridModel.flowEngine.getModel(config.filterId);

      if (!filterModel) {
        throw new Error(`Filter model with uid "${config.filterId}" not found`);
      }

      if (!filterModel.getFilterValue) {
        throw new Error(`Filter model with uid "${config.filterId}" does not have getFilterValue method`);
      }

      // 获取筛选值
      const filterValue = filterModel.getFilterValue();

      // 检查筛选值是否为空（null、undefined 或空字符串）
      if (isFilterValueEmpty(filterValue)) {
        // 移除现有的筛选组
        try {
          (targetModel as any).resource.removeFilterGroup(config.filterId);
        } catch (error) {
          throw new Error(`Failed to remove filter configuration from target model: ${error.message}`);
        }
        return; // 跳过当前配置的处理
      }

      // 构建筛选条件
      const filterConditions = config.filterPaths.map((fieldPath) => ({
        key: fieldPath,
        operator: config.operator || getDefaultOperator(filterModel),
        value: filterValue,
      }));

      // 添加筛选组到目标模型
      try {
        if (filterConditions.length === 1) {
          (targetModel as any).resource.addFilterGroup(
            config.filterId,
            new FilterItem({
              key: filterConditions[0].key,
              operator: filterConditions[0].operator,
              value: filterConditions[0].value,
            }),
          );
        } else if (filterConditions.length > 1) {
          const filterGroup = {
            logic: '$or' as '$and' | '$or',
            items: filterConditions,
          };
          (targetModel as any).resource.addFilterGroup(config.filterId, new FilterGroup(filterGroup));
        }
      } catch (error) {
        throw new Error(`Failed to bind filter configuration to target model: ${error.message}`);
      }
    });
  }

  /**
   * 将筛选配置从 TargetModel 解除绑定
   *
   * 根据提供的 targetId 查找与之关联的已存在的筛选配置，
   * 然后通过 targetModel.resource.removeFilterGroup 方法将这些配置从目标模型中移除。
   *
   * @param targetId - 目标模型的唯一标识符
   * @throws 当 targetId 为空或目标模型不存在时抛出错误
   *
   * @example
   * ```typescript
   * filterManager.unbindFromTarget('target-model-uid');
   * ```
   */
  unbindFromTarget(targetId: string) {
    // 1. 参数验证
    if (!targetId || typeof targetId !== 'string') {
      throw new Error('targetId must be a non-empty string');
    }

    // 2. 通过 flowEngine 查找目标模型
    const targetModel = this.gridModel.flowEngine.getModel(targetId);

    // 3. 验证目标模型是否存在
    if (!targetModel) {
      throw new Error(`Target model with uid "${targetId}" not found`);
    }

    // 4. 验证目标模型是否具有 resource 属性
    if (!(targetModel as any).resource || typeof (targetModel as any).resource.removeFilterGroup !== 'function') {
      throw new Error(
        `Target model with uid "${targetId}" does not have a valid resource with removeFilterGroup method`,
      );
    }

    // 5. 获取与目标模型相关的筛选配置
    const relatedConfigs = this.filterConfigs.filter((config) => config.targetId === targetId);

    if (relatedConfigs.length === 0) {
      // 没有相关配置，但不抛出错误，只是没有筛选条件需要解除绑定
      return;
    }

    // 6. 从目标模型中移除筛选配置
    relatedConfigs.forEach((config) => {
      try {
        // 通过筛选器模型 UID 移除对应的筛选组
        (targetModel as any).resource.removeFilterGroup(config.filterId);
      } catch (error) {
        throw new Error(`Failed to unbind filter configuration from target model: ${error.message}`);
      }
    });
  }

  /**
   * 根据筛选器刷新相关的目标模型
   *
   * 通过提供的筛选器模型 UID，找出所有相关的筛选配置，
   * 然后重新绑定筛选条件并刷新对应的目标模型数据。
   *
   * @param filterId - 筛选器模型的 UID，可以是单个字符串或字符串数组
   * @returns Promise，当所有目标模型都刷新完成后解决
   * @throws 当参数为空或目标模型不存在时抛出错误
   *
   * @example
   * ```typescript
   * // 刷新单个筛选器相关的目标
   * await filterManager.refreshTargetsByFilter('filter-1');
   *
   * // 刷新多个筛选器相关的目标
   * await filterManager.refreshTargetsByFilter(['filter-1', 'filter-2']);
   * ```
   */
  async refreshTargetsByFilter(filterId: string | string[]): Promise<void> {
    // 1. 参数验证和标准化
    if (!filterId) {
      throw new Error('filterId must be provided');
    }

    const filterIds = Array.isArray(filterId) ? filterId : [filterId];

    if (filterIds.length === 0 || filterIds.some((uid) => !uid || typeof uid !== 'string')) {
      throw new Error('filterId must be non-empty string(s)');
    }

    // 2. 查找相关的筛选配置
    const relatedConfigs = this.filterConfigs.filter((config) => filterIds.includes(config.filterId));

    if (relatedConfigs.length === 0) {
      // 没有相关配置，直接返回
      return;
    }

    // 3. 提取所有相关的 targetId 并去重
    const targetIds = [...new Set(relatedConfigs.map((config) => config.targetId))];

    // 4. 并行处理所有目标模型
    const refreshPromises = targetIds.map(async (targetId) => {
      try {
        // 4.1 重新绑定筛选配置
        this.bindToTarget(targetId);

        // 4.2 获取目标模型
        const targetModel = this.gridModel.flowEngine.getModel(targetId);

        if (!targetModel) {
          throw new Error(`Target model with uid "${targetId}" not found`);
        }

        // 4.3 验证目标模型是否有 refresh 方法
        if (!(targetModel as any).resource || typeof (targetModel as any).resource.refresh !== 'function') {
          throw new Error(`Target model with uid "${targetId}" does not have a valid resource with refresh method`);
        }

        // 4.4 调用 refresh 方法
        await (targetModel as any).resource.refresh();
      } catch (error) {
        throw new Error(`Failed to refresh target model "${targetId}": ${error.message}`);
      }
    });

    // 5. 等待所有 refresh 操作完成
    await Promise.all(refreshPromises);
  }
}
