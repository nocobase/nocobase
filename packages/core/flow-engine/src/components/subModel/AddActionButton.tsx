/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { AddSubModelButton, SubModelItemsType } from './AddSubModelButton';
import { FlowModel } from '../../models/flowModel';
import { ModelConstructor } from '../../types';
import { Button } from 'antd';

interface AddActionButtonProps {
  /**
   * 父模型实例
   */
  model: FlowModel;
  /**
   * 子模型基类，用于确定支持的 Actions 类型
   */
  subModelBaseClass?: string | ModelConstructor;
  subModelKey?: string;
  subModelType?: 'object' | 'array';
  /**
   * 点击后的回调函数
   */
  onModelAdded?: (subModel: FlowModel) => Promise<void>;
  /**
   * 按钮文本
   */
  children?: React.ReactNode;
  /**
   * 过滤Model菜单的函数
   */
  filter?: (blockClass: ModelConstructor, className: string) => boolean;
  /**
   * 自定义 items（如果提供，将覆盖默认的action菜单）
   */
  items?: SubModelItemsType;
}

/**
 * 专门用于添加动作模型的按钮组件
 *
 * @example
 * ```tsx
 * <AddActionButton
 *   model={parentModel}
 *   subModelBaseClass={'ActionFlowModel'}
 * />
 * ```
 */
export const AddActionButton: React.FC<AddActionButtonProps> = ({
  model,
  subModelBaseClass = 'ActionFlowModel',
  subModelKey = 'actions',
  children = <Button>Configure actions</Button>,
  subModelType = 'array',
  items,
  filter,
  onModelAdded,
}) => {
  const allActionsItems = useMemo(() => {
    const actionClasses = model.flowEngine.filterModelClassByParent(subModelBaseClass);
    const registeredBlocks = [];
    for (const [className, ModelClass] of actionClasses) {
      if (filter && !filter(ModelClass, className)) {
        continue;
      }
      const item = {
        key: className,
        label: ModelClass.meta?.title || className,
        icon: ModelClass.meta?.icon,
        createModelOptions: {
          ...ModelClass.meta?.defaultOptions,
          use: className,
        },
      };
      registeredBlocks.push(item);
    }
    return registeredBlocks;
  }, [model, subModelBaseClass]);

  return (
    <AddSubModelButton
      model={model}
      subModelKey={subModelKey}
      subModelType={subModelType}
      items={items ?? allActionsItems}
      onModelAdded={onModelAdded}
    >
      {children}
    </AddSubModelButton>
  );
};

AddActionButton.displayName = 'AddActionButton';
