/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { AddSubModelButton } from './AddSubModelButton';
import { FlowModel } from '../../models/flowModel';
import { ModelConstructor } from '../../types';
import { Button } from 'antd';

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
   * 点击后的回调函数
   */
  onModelAdded?: (subModel: FlowModel) => Promise<void>;
  /**
   * 按钮文本
   */
  children?: React.ReactNode;
}

/**
 * 专门用于添加块模型的按钮组件
 *
 * @example
 * ```tsx
 * <AddBlockButton
 *   model={parentModel}
 *   subModelBaseClass={'FlowModel'}
 * />
 * ```
 */
export const AddBlockButton: React.FC<AddBlockButtonProps> = ({
  model,
  subModelBaseClass = 'BlockFlowModel',
  subModelKey = 'blocks',
  children = <Button>Add block</Button>,
  subModelType = 'array',
  onModelAdded,
}) => {
  const items = useMemo(() => {
    const blockClasses = model.flowEngine.filterModelClassByParent(subModelBaseClass);
    const registeredBlocks = [];
    for (const [className, ModelClass] of blockClasses) {
      registeredBlocks.push({
        key: className,
        label: ModelClass.meta?.title || className,
        icon: ModelClass.meta?.icon,
        createModelOptions: {
          ...ModelClass.meta?.defaultOptions,
          use: className,
        },
      });
    }
    return registeredBlocks;
  }, [model, subModelBaseClass]);

  return (
    <AddSubModelButton
      model={model}
      subModelKey={subModelKey}
      subModelType={subModelType}
      items={items}
      onModelAdded={onModelAdded}
    >
      {children}
    </AddSubModelButton>
  );
};

AddBlockButton.displayName = 'AddBlockButton';
