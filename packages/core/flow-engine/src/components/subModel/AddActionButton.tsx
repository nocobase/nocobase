/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import React, { useMemo } from 'react';
import { AddSubModelButton, AddSubModelButtonProps } from './AddSubModelButton';
import { FlowModel } from '../../models/flowModel';

interface AddActionButtonProps extends Omit<AddSubModelButtonProps, 'subModelType' | 'subModelKey' | 'items'> {
  subModelKey?: string;
  subModelType?: 'object' | 'array';
}

/**
 * 专门用于添加动作模型的按钮组件
 * 
 * @example
 * ```tsx
 * <AddActionButton 
 *   model={parentModel}
 *   ParentModelClass={'ActionFlowModel'}
 * />
 * ```
 */
export const AddActionButton: React.FC<AddActionButtonProps> = observer(({
  ParentModelClass='ActionFlowModel',
  subModelKey = 'actions',
  children = 'Add action',
  subModelType = 'array',
  ...props
}) => {
  const items = useMemo<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    item: typeof FlowModel;
    unique?: boolean;
    use: string;
  }[]>(() => {
    const blockClasses = props.model.flowEngine.filterModelClassByParent(ParentModelClass);
    const registeredBlocks = [];
    for (const [className, ModelClass] of blockClasses) {
      if (ModelClass.meta) {
        const item = {
          key: className,
          label: ModelClass.meta?.title,
          icon: ModelClass.meta?.icon,
          item: ModelClass,
          use: className,
          // unique: ModelClass.meta?.uniqueSub,
          // added: null,
        };
        registeredBlocks.push(item);
      }
    }
    return registeredBlocks;
  }, [props.model, ParentModelClass]);
  
  return (
    <AddSubModelButton
      {...props}
      subModelKey={subModelKey}
      ParentModelClass={ParentModelClass}
      subModelType={subModelType}
      items={items}
    >
      {children}
    </AddSubModelButton>
  );
});

AddActionButton.displayName = 'AddActionButton';
