/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// Flow Engine 命名空间常量
export const FLOW_ENGINE_NAMESPACE = 'flow-engine';

// 区块类型常量
export const BLOCK_TYPES = {
  DATA: 'dataBlocks',
  FILTER: 'filterBlocks',
  OTHER: 'otherBlocks',
} as const;

// 区块组配置类型
export interface BlockBuilderConfig {
  key: string;
  label: string;
  type: 'group';
  hasCurrentFlowContext?: boolean;
}

// 区块组配置
export const BLOCK_GROUP_CONFIGS: Record<string, BlockBuilderConfig> = {
  data: {
    key: BLOCK_TYPES.DATA,
    label: 'Data blocks',
    type: 'group',
    hasCurrentFlowContext: true,
  },
  filter: {
    key: BLOCK_TYPES.FILTER,
    label: 'Filter blocks',
    type: 'group',
    hasCurrentFlowContext: false,
  },
  other: {
    key: BLOCK_TYPES.OTHER,
    label: 'Other blocks',
    type: 'group',
    hasCurrentFlowContext: false,
  },
};

// 流程上下文条件
export const SHOW_CURRENT_MODELS = ['EditFormModel', 'DetailsModel'];

// 菜单键值常量
export const MENU_KEYS = {
  CURRENT_RECORD: 'currentRecord',
  ASSOCIATION_RECORDS: 'associationRecords',
  OTHER_RECORDS: 'otherRecords',
  OTHER_COLLECTIONS: 'otherCollections',
  CURRENT_COLLECTIONS: 'currentCollections',
} as const;
