/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import _ from 'lodash';

type FilterConfig = {
  /** 筛选器的 model uid */
  filterModelUid: string;
  /** 数据区块或者图表区块的 model uid */
  targetModelUid: string;
  /** 被筛选区块的数据表字段路径 */
  targetFieldPaths: string[];
  /** 默认操作符，每个条件的默认操作符都一样 */
  defaultOperator: string;
  /** 筛选操作符，每个条件的操作符可以不一样 */
  operator?: string;
};

export type ConnectFieldsConfig = {
  operator: string;
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

    // 2. 把 filterConfigs 中的配置转换成 ConnectFieldsConfig 格式并返回
    const firstConfig = relatedConfigs[0];
    return {
      operator: firstConfig.defaultOperator,
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
      defaultOperator: config.operator,
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
    if (!filterConfig.filterModelUid || !filterConfig.targetModelUid || !filterConfig.defaultOperator) {
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

  removeFilterConfig({ filterModelUid, targetModelUid }: { filterModelUid?: string; targetModelUid?: string }) {}

  bindToTarget(targetModelUid: string) {}

  unbindFromTarget(targetModelUid: string) {}

  refreshTargetsByFilter(filterModelUid: string | string[]) {}
}
