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
import { AddSubModelButton, AddSubModelButtonProps, AddSubModelMenuItem } from './AddSubModelButton';
import { FlowModel } from '../../models/flowModel';

interface AddBlockButtonProps extends Omit<AddSubModelButtonProps, 'subModelType' | 'subModelKey' | 'items'> {
  subModelKey?: string;
  subModelType?: 'object' | 'array';
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
export const AddBlockButton: React.FC<AddBlockButtonProps> = observer(
  ({
    ParentModelClass = 'BlockFlowModel',
    subModelKey = 'blocks',
    children = 'Add block',
    subModelType = 'array',
    ...props
  }) => {
    const items = useMemo<
      {
        key: string;
        label: string;
        icon?: React.ReactNode;
        item: typeof FlowModel;
        use: string;
        unique?: boolean;
      }[]
    >(() => {
      const blockClasses = props.model.flowEngine.filterModelClassByParent(ParentModelClass);
      const registeredBlocks = [];
      for (const [className, ModelClass] of blockClasses) {
        registeredBlocks.push({
          key: className,
          label: ModelClass.meta?.title || className,
          icon: ModelClass.meta?.icon,
          item: ModelClass,
          use: className,
          // unique: ModelClass.meta?.uniqueSub,
          // added: null,
        });
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
  },
);

AddBlockButton.displayName = 'AddBlockButton';
