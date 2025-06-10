/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import { CodeOutlined, FileMarkdownOutlined, CloudOutlined } from '@ant-design/icons';
import React, { useMemo } from 'react';
import { FlowModel } from '../../models';
import { AddSubModelButton, AddSubModelButtonProps } from './AddSubModelButton';
import _ from 'lodash';

export interface AddBlockButtonProps extends Omit<AddSubModelButtonProps, 'subModelType' | 'subModelKey' | 'buildSubModelParams'> {
  /**
   * 父模型类名，用于确定支持的块类型
   */
  ParentModelClass?: string | typeof FlowModel;
  
  /**
   * 自定义块类型列表，如果不提供则使用默认的块类型
   */
  blockTypes?: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    modelClass: string;
    [key: string]: any;
  }>;
  
  /**
   * 子模型在父模型中的键名，默认为 'blocks'
   */
  subModelKey?: string;
}

/**
 * 专门用于添加块模型的按钮组件
 * 
 * @example
 * ```tsx
 * <AddBlockButton 
 *   model={parentModel}
 *   ParentModelClass={'FlowModel'}
 * />
 * ```
 */
export const AddBlockButton: React.FC<AddBlockButtonProps> = observer(({
  model,
  ParentModelClass='BlockFlowModel',
  subModelKey = 'blocks',
  children = 'Add block',
  ...props
}) => {
  const blockTypes = useMemo<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    item: typeof FlowModel;
  }[]>(() => {
    const blockClasses = model.flowEngine.filterModelClassByParent(ParentModelClass);
    const registeredBlocks = [];
    for (const [className, ModelClass] of blockClasses) {
      if (ModelClass.meta) {
        registeredBlocks.push({
          key: className,
          label: ModelClass.meta?.title,
          icon: ModelClass.meta?.icon,
          item: ModelClass,
        });
      }
    }
    return registeredBlocks;
  }, [model, ParentModelClass]);
  
  const buildSubModelParams = React.useCallback((info: {
    key: string;
  }) => {
    const blockType = blockTypes.find(type => type.key === info.key);
    
    if (!blockType) {
      throw new Error(`Unknown block type: ${info.key}`);
    }

    if (blockType.item.meta?.defaultOptions) {
      return { ..._.cloneDeep(blockType.item.meta?.defaultOptions), use: blockType.key, parentId: model.uid };
    } else {
      return {
        use: blockType.key,
        parentId: model.uid,
      }
    }
  }, [blockTypes]);

  return (
    <AddSubModelButton
      {...props}
      model={model}
      subModelType="array"
      subModelKey={subModelKey}
      items={blockTypes}
      buildSubModelParams={buildSubModelParams}
    >
      {children}
    </AddSubModelButton>
  );
});

AddBlockButton.displayName = 'AddBlockButton';
