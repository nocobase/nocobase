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
import { getDefaultOperator } from './utils';

type FilterConfig = {
  /** 筛选器的 model uid */
  filterModelUid: string;
  /** 数据区块或者图表区块的 model uid */
  targetModelUid: string;
  /** 被筛选区块的数据表字段路径 */
  targetFieldPaths: string[];
  /** 筛选操作符，每个条件的操作符可以不一样 */
  operator?: string;
};

export type ConnectFieldsConfig = {
  targets: {
    /** 数据区块或者图表区块的 model uid */
    targetModelUid: string;
    /** 被筛选区块的数据表字段路径 */
    targetFieldPaths: string[];
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

  saveFilterConfigs() {
    this.gridModel.setStepParams(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY, this.filterConfigs);
    this.gridModel.save();
  }

  getConnectFieldsConfig(filterModelUid: string): ConnectFieldsConfig | undefined {
    // 1. 从 filterConfigs 中获取连接字段的配置
    const relatedConfigs = this.filterConfigs.filter((config) => config.filterModelUid === filterModelUid);

    if (relatedConfigs.length === 0) {
      return undefined;
    }

    return {
      targets: relatedConfigs.map((config) => ({
        targetModelUid: config.targetModelUid,
        targetFieldPaths: config.targetFieldPaths,
      })),
    };
  }

  saveConnectFieldsConfig(filterModelUid: string, config: ConnectFieldsConfig) {
    // 1. 把参数 FilterModelUid 和 config 转换成一个 filterConfigs
    const newFilterConfigs: FilterConfig[] = config.targets.map((target) => ({
      filterModelUid,
      targetModelUid: target.targetModelUid,
      targetFieldPaths: target.targetFieldPaths,
    }));

    // 2. 先删除 filterConfigs 中的旧配置，再把新的配置添加进去
    const filteredConfigs = this.filterConfigs.filter((config) => config.filterModelUid !== filterModelUid);
    this.filterConfigs = [];
    this.filterConfigs.push(...filteredConfigs, ...newFilterConfigs);

    // 3. 保存 this.filterConfigs 的值
    this.saveFilterConfigs();
  }

  /**
   * 添加筛选配置
   *
   * 将新的筛选配置添加到管理器中。如果相同的筛选器和目标组合已存在，则会更新配置。
   *
   * @param filterConfig - 要添加的筛选配置
   *
   * @example
   * ```typescript
   * filterManager.addFilterConfig({
   *   filterModelUid: 'filter-1',
   *   targetModelUid: 'target-1',
   *   targetFieldPaths: ['name'],
   *   defaultOperator: '$eq'
   * });
   * ```
   */
  addFilterConfig(filterConfig: FilterConfig) {
    // 1. 验证必填字段
    if (!filterConfig.filterModelUid || !filterConfig.targetModelUid) {
      throw new Error('FilterConfig must have filterModelUid, targetModelUid, and defaultOperator');
    }

    if (!Array.isArray(filterConfig.targetFieldPaths) || filterConfig.targetFieldPaths.length === 0) {
      throw new Error('FilterConfig must have non-empty targetFieldPaths array');
    }

    // 2. 检查是否已存在相同的配置（相同的 filterModelUid 和 targetModelUid 组合）
    const existingIndex = this.filterConfigs.findIndex(
      (config) =>
        config.filterModelUid === filterConfig.filterModelUid && config.targetModelUid === filterConfig.targetModelUid,
    );

    // 3. 如果存在则更新，否则添加新配置
    if (existingIndex >= 0) {
      this.filterConfigs[existingIndex] = { ...filterConfig };
    } else {
      this.filterConfigs.push({ ...filterConfig });
    }

    // 4. 保存配置
    this.saveFilterConfigs();
  }

  /**
   * 删除筛选配置
   *
   * 根据提供的参数删除对应的筛选配置。支持多种删除策略：
   * - 仅提供 filterModelUid：删除该筛选器相关的所有配置
   * - 仅提供 targetModelUid：删除该目标相关的所有配置
   * - 两个都提供：删除特定的筛选器-目标组合配置
   *
   * @param options - 删除选项
   * @param options.filterModelUid - 筛选器模型 UID（可选）
   * @param options.targetModelUid - 目标模型 UID（可选）
   * @returns 返回被删除的配置数量
   * @throws 当两个参数都未提供时抛出错误
   *
   * @example
   * ```typescript
   * // 删除筛选器的所有配置
   * const removedCount = filterManager.removeFilterConfig({ filterModelUid: 'filter-1' });
   *
   * // 删除目标的所有配置
   * const removedCount = filterManager.removeFilterConfig({ targetModelUid: 'target-1' });
   *
   * // 删除特定的筛选器-目标组合配置
   * const removedCount = filterManager.removeFilterConfig({
   *   filterModelUid: 'filter-1',
   *   targetModelUid: 'target-1'
   * });
   * ```
   */
  removeFilterConfig({ filterModelUid, targetModelUid }: { filterModelUid?: string; targetModelUid?: string }): number {
    // 1. 验证参数：至少需要提供一个参数
    if (!filterModelUid && !targetModelUid) {
      throw new Error('At least one of filterModelUid or targetModelUid must be provided');
    }

    // 2. 记录删除前的配置数量
    const originalLength = this.filterConfigs.length;

    // 3. 根据提供的参数过滤配置
    this.filterConfigs = this.filterConfigs.filter((config) => {
      // 如果两个参数都提供，需要同时匹配
      if (filterModelUid && targetModelUid) {
        return !(config.filterModelUid === filterModelUid && config.targetModelUid === targetModelUid);
      }

      // 如果只提供 filterModelUid，删除该筛选器的所有配置
      if (filterModelUid) {
        return config.filterModelUid !== filterModelUid;
      }

      // 如果只提供 targetModelUid，删除该目标的所有配置
      if (targetModelUid) {
        return config.targetModelUid !== targetModelUid;
      }

      return true;
    });

    // 4. 计算被删除的配置数量
    const removedCount = originalLength - this.filterConfigs.length;

    // 5. 如果有配置被删除，则保存更改
    if (removedCount > 0) {
      this.saveFilterConfigs();
    }

    return removedCount;
  }

  /**
   * 将筛选配置绑定到 TargetModel
   *
   * 根据提供的 targetModelUid 查找与之关联的已存在的筛选配置，
   * 然后通过 targetModel.resource.addFilterGroup 方法将这些配置添加到目标模型中。
   *
   * @param targetModelUid - 目标模型的唯一标识符
   * @throws 当 targetModelUid 为空或目标模型不存在时抛出错误
   *
   * @example
   * ```typescript
   * filterManager.bindToTarget('target-model-uid');
   * ```
   */
  bindToTarget(targetModelUid: string) {
    // 1. 参数验证
    if (!targetModelUid || typeof targetModelUid !== 'string') {
      throw new Error('targetModelUid must be a non-empty string');
    }

    // 2. 通过 flowEngine 查找目标模型
    const targetModel = this.gridModel.flowEngine.getModel(targetModelUid);

    // 3. 验证目标模型是否存在
    if (!targetModel) {
      throw new Error(`Target model with uid "${targetModelUid}" not found`);
    }

    // 4. 验证目标模型是否具有 resource 属性
    if (!(targetModel as any).resource || typeof (targetModel as any).resource.addFilterGroup !== 'function') {
      throw new Error(
        `Target model with uid "${targetModelUid}" does not have a valid resource with addFilterGroup method`,
      );
    }

    // 验证目标模型是否具有 removeFilterGroup 方法
    if (typeof (targetModel as any).resource.removeFilterGroup !== 'function') {
      throw new Error(
        `Target model with uid "${targetModelUid}" does not have a valid resource with removeFilterGroup method`,
      );
    }

    // 5. 获取与目标模型相关的筛选配置
    const relatedConfigs = this.filterConfigs.filter((config) => config.targetModelUid === targetModelUid);

    if (relatedConfigs.length === 0) {
      // 没有相关配置，但不抛出错误，只是没有筛选条件需要绑定
      return;
    }

    // 6. 将筛选配置应用到目标模型
    relatedConfigs.forEach((config) => {
      const filterModel: any = this.gridModel.flowEngine.getModel(config.filterModelUid);

      if (!filterModel.getFilterValue) {
        throw new Error(`Filter model with uid "${config.filterModelUid}" does not have getFilterValue method`);
      }

      // 获取筛选值
      const filterValue = filterModel.getFilterValue();

      // 检查筛选值是否为空（null、undefined 或空字符串）
      if (filterValue === null || filterValue === undefined || filterValue === '') {
        // 移除现有的筛选组
        try {
          (targetModel as any).resource.removeFilterGroup(config.filterModelUid);
        } catch (error) {
          throw new Error(`Failed to remove filter configuration from target model: ${error.message}`);
        }
        return; // 跳过当前配置的处理
      }

      // 构建筛选条件
      const filterConditions = config.targetFieldPaths.map((fieldPath) => ({
        key: fieldPath,
        operator: config.operator || getDefaultOperator(filterModel),
        value: filterValue,
      }));

      // 添加筛选组到目标模型
      try {
        if (filterConditions.length === 1) {
          (targetModel as any).resource.addFilterGroup(
            config.filterModelUid,
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
          (targetModel as any).resource.addFilterGroup(config.filterModelUid, new FilterGroup(filterGroup));
        }
      } catch (error) {
        throw new Error(`Failed to bind filter configuration to target model: ${error.message}`);
      }
    });
  }

  /**
   * 将筛选配置从 TargetModel 解除绑定
   *
   * 根据提供的 targetModelUid 查找与之关联的已存在的筛选配置，
   * 然后通过 targetModel.resource.removeFilterGroup 方法将这些配置从目标模型中移除。
   *
   * @param targetModelUid - 目标模型的唯一标识符
   * @throws 当 targetModelUid 为空或目标模型不存在时抛出错误
   *
   * @example
   * ```typescript
   * filterManager.unbindFromTarget('target-model-uid');
   * ```
   */
  unbindFromTarget(targetModelUid: string) {
    // 1. 参数验证
    if (!targetModelUid || typeof targetModelUid !== 'string') {
      throw new Error('targetModelUid must be a non-empty string');
    }

    // 2. 通过 flowEngine 查找目标模型
    const targetModel = this.gridModel.flowEngine.getModel(targetModelUid);

    // 3. 验证目标模型是否存在
    if (!targetModel) {
      throw new Error(`Target model with uid "${targetModelUid}" not found`);
    }

    // 4. 验证目标模型是否具有 resource 属性
    if (!(targetModel as any).resource || typeof (targetModel as any).resource.removeFilterGroup !== 'function') {
      throw new Error(
        `Target model with uid "${targetModelUid}" does not have a valid resource with removeFilterGroup method`,
      );
    }

    // 5. 获取与目标模型相关的筛选配置
    const relatedConfigs = this.filterConfigs.filter((config) => config.targetModelUid === targetModelUid);

    if (relatedConfigs.length === 0) {
      // 没有相关配置，但不抛出错误，只是没有筛选条件需要解除绑定
      return;
    }

    // 6. 从目标模型中移除筛选配置
    relatedConfigs.forEach((config) => {
      try {
        // 通过筛选器模型 UID 移除对应的筛选组
        (targetModel as any).resource.removeFilterGroup(config.filterModelUid);
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
   * @param filterModelUid - 筛选器模型的 UID，可以是单个字符串或字符串数组
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
  async refreshTargetsByFilter(filterModelUid: string | string[]): Promise<void> {
    // 1. 参数验证和标准化
    if (!filterModelUid) {
      throw new Error('filterModelUid must be provided');
    }

    const filterModelUids = Array.isArray(filterModelUid) ? filterModelUid : [filterModelUid];

    if (filterModelUids.length === 0 || filterModelUids.some((uid) => !uid || typeof uid !== 'string')) {
      throw new Error('filterModelUid must be non-empty string(s)');
    }

    // 2. 查找相关的筛选配置
    const relatedConfigs = this.filterConfigs.filter((config) => filterModelUids.includes(config.filterModelUid));

    if (relatedConfigs.length === 0) {
      // 没有相关配置，直接返回
      return;
    }

    // 3. 提取所有相关的 targetModelUid 并去重
    const targetModelUids = [...new Set(relatedConfigs.map((config) => config.targetModelUid))];

    // 4. 并行处理所有目标模型
    const refreshPromises = targetModelUids.map(async (targetModelUid) => {
      try {
        // 4.1 重新绑定筛选配置
        this.bindToTarget(targetModelUid);

        // 4.2 获取目标模型
        const targetModel = this.gridModel.flowEngine.getModel(targetModelUid);

        if (!targetModel) {
          throw new Error(`Target model with uid "${targetModelUid}" not found`);
        }

        // 4.3 验证目标模型是否有 refresh 方法
        if (!(targetModel as any).resource || typeof (targetModel as any).resource.refresh !== 'function') {
          throw new Error(
            `Target model with uid "${targetModelUid}" does not have a valid resource with refresh method`,
          );
        }

        // 4.4 调用 refresh 方法
        await (targetModel as any).resource.refresh();
      } catch (error) {
        throw new Error(`Failed to refresh target model "${targetModelUid}": ${error.message}`);
      }
    });

    // 5. 等待所有 refresh 操作完成
    await Promise.all(refreshPromises);
  }
}
