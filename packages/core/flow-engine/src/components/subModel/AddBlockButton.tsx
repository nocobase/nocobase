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
import { resolveCreateModelOptions } from '../../utils/params-resolvers';
import { withFlowDesignMode } from '../common/withFlowDesignMode';
import { AddSubModelButton, SubModelItem, SubModelItemsType, mergeSubModelItems } from './AddSubModelButton';

export interface AddBlockButtonProps {
  /**
   * 父模型实例
   */
  model: FlowModel;
  /**
   * 子模型基类，用于动态获取额外的菜单项
   */
  subModelBaseClass?: string | ModelConstructor;
  subModelKey?: string;
  subModelType?: 'object' | 'array';
  /**
   * 过滤模型菜单的函数
   */
  filter?: (modelClass: ModelConstructor, className: string) => boolean;
  /**
   * 创建后的回调函数
   */
  onModelCreated?: (subModel: FlowModel) => Promise<void>;
  /**
   * 添加到父模型后的回调函数
   */
  onSubModelAdded?: (subModel: FlowModel) => Promise<void>;
  /**
   * 显示的UI组件
   */
  children?: React.ReactNode;
  /**
   * 菜单项
   */
  items: SubModelItemsType;
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
  subModelBaseClass,
  subModelKey = 'blocks',
  children,
  subModelType = 'array',
  items,
  filter,
  onModelCreated,
  onSubModelAdded,
}) => {
  const defaultChildren = useMemo(() => {
    return <FlowSettingsButton icon={<PlusOutlined />}>{model.translate('Add block')}</FlowSettingsButton>;
  }, [model]);

  // 动态获取基于 subModelBaseClass 的额外菜单项
  const appendItems = useMemo(() => {
    if (!subModelBaseClass) {
      return [];
    }

    const modelClasses = model.flowEngine.filterModelClassByParent(subModelBaseClass);
    const registeredItems = [];

    for (const [className, ModelClass] of modelClasses) {
      if (filter && !filter(ModelClass, className)) {
        continue;
      }
      if (ModelClass.meta?.hide) {
        continue;
      }

      const item: SubModelItem = {
        key: className,
        label: ModelClass.meta?.label || className,
        icon: ModelClass.meta?.icon,
        createModelOptions: async () => {
          const opts = await resolveCreateModelOptions(ModelClass.meta?.createModelOptions, model.context);
          return { ...opts, use: className };
        },
      };

      registeredItems.push(item);
    }
    return registeredItems;
  }, [model, subModelBaseClass, filter]);

  const finalItems = useMemo(() => {
    return mergeSubModelItems([items, appendItems], { addDividers: true });
  }, [items, appendItems]);

  return (
    <AddSubModelButton
      model={model}
      subModelKey={subModelKey}
      subModelType={subModelType}
      items={finalItems}
      onModelCreated={onModelCreated}
      onSubModelAdded={onSubModelAdded}
    >
      {children || defaultChildren}
    </AddSubModelButton>
  );
};

// 使用高阶组件包装，优化性能
export const AddBlockButton = withFlowDesignMode(AddBlockButtonCore);

AddBlockButton.displayName = 'AddBlockButton';
