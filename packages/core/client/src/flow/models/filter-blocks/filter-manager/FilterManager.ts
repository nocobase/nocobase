/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';

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
  private readonly filterConfigs: FilterConfig[];
  private readonly gridModel: FlowModel;

  constructor(gridModel: FlowModel) {
    this.gridModel = gridModel;
    const stepValue = this.gridModel.getStepParams(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY);
    this.filterConfigs = stepValue || [];
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
    this.filterConfigs.length = 0;
    this.filterConfigs.push(...filteredConfigs, ...newFilterConfigs);

    // 3. 保存 this.filterConfigs 的值
    this.saveFilterConfigs();
  }

  deleteFilterModelConfig(filterModelUid: string) {
    // 1. 找到 filterConfigs 中包含 filterModelUid 的配置并删除
    const filteredConfigs = this.filterConfigs.filter((config) => config.filterModelUid !== filterModelUid);
    this.filterConfigs.length = 0;
    this.filterConfigs.push(...filteredConfigs);

    // 2. 保存 this.filterConfigs 的值
    this.saveFilterConfigs();
  }

  deleteTargetModelConfig(targetModelUid: string) {
    // 1. 找到 filterConfigs 中 包含 targetModelUid 的配置并删除
    const filteredConfigs = this.filterConfigs.filter((config) => config.targetModelUid !== targetModelUid);
    this.filterConfigs.length = 0;
    this.filterConfigs.push(...filteredConfigs);

    // 2. 保存 this.filterConfigs 的值
    this.saveFilterConfigs();
  }
}
