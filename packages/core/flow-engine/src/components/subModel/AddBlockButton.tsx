/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import React, { useMemo } from 'react';
import { FlowModel } from '../../models/flowModel';
import { ModelConstructor } from '../../types';
import { FlowSettingsButton } from '../common/FlowSettingsButton';
import { withFlowDesignMode } from '../common/withFlowDesignMode';
import { AddSubModelButton, SubModelItemsType, mergeSubModelItems } from './AddSubModelButton';
import { createBlockItems } from './blockItems';

interface AddBlockButtonProps {
  /**
   * 父模型实例
   */
  model: FlowModel;
  /**
   * 子模型基类，用于确定支持的区块类型
   */
  subModelBaseClass?: string | ModelConstructor;
  subModelKey?: string;
  subModelType?: 'object' | 'array';
  /**
   * 创建后的回调函数
   */
  onModelCreated?: (subModel: FlowModel) => Promise<void>;
  /**
   * 添加到父模型后的回调函数
   */
  onSubModelAdded?: (subModel: FlowModel) => Promise<void>;
  /**
   * 按钮文本
   */
  children?: React.ReactNode;
  /**
   * 自定义 items（如果提供，将覆盖默认的区块菜单）
   */
  items?: SubModelItemsType;
  /**
   * 过滤Model菜单的函数
   */
  filter?: (blockClass: ModelConstructor, className: string) => boolean;
  /**
   * 追加额外的菜单项到默认菜单中
   */
  appendItems?: SubModelItemsType;
}

/**
 * 专门用于添加块模型的按钮组件
 *
 * 提供类似 page:addBlock 的区块类型 -> 数据源 -> 数据表的层级结构
 *
 * @example
 * ```tsx
 * // 基本用法
 * <AddBlockButton
 *   model={parentModel}
 *   subModelBaseClass={'BlockFlowModel'}
 * />
 *
 * // 追加自定义菜单项
 * <AddBlockButton
 *   model={parentModel}
 *   appendItems={[
 *     {
 *       key: 'customBlock',
 *       label: 'Custom Block',
 *       createModelOptions: { use: 'CustomBlock' }
 *     }
 *   ]}
 * />
 * ```
 */
const AddBlockButtonCore: React.FC<AddBlockButtonProps> = ({
  model,
  subModelBaseClass = 'BlockModel',
  subModelKey = 'blocks',
  children = <FlowSettingsButton icon={<PlusOutlined />}>{'Add block'}</FlowSettingsButton>,
  subModelType = 'array',
  items,
  filter: filterBlocks,
  appendItems,
  onModelCreated,
  onSubModelAdded,
}) => {
  // 确定最终使用的 items
  const finalItems = useMemo(() => {
    if (items) {
      // 如果明确提供了 items，直接使用
      return items;
    }

    // 创建区块菜单项，并合并追加的 items
    const blockItems = createBlockItems(model, {
      subModelBaseClass,
      filterBlocks,
    });

    return mergeSubModelItems([blockItems, appendItems]);
  }, [items, model, subModelBaseClass, filterBlocks, appendItems]);

  return (
    <AddSubModelButton
      model={model}
      subModelKey={subModelKey}
      subModelType={subModelType}
      items={finalItems}
      onModelCreated={onModelCreated}
      onSubModelAdded={onSubModelAdded}
    >
      {children}
    </AddSubModelButton>
  );
};

// 使用高阶组件包装，优化性能
export const AddBlockButton = withFlowDesignMode(AddBlockButtonCore);

AddBlockButton.displayName = 'AddBlockButton';
