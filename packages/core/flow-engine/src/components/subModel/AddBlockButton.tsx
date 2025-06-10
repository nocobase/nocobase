/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import React from 'react';
import { AddSubModelButton, AddSubModelButtonProps } from './AddSubModelButton';

interface AddBlockButtonProps extends Omit<AddSubModelButtonProps, 'subModelType' | 'subModelKey'> {
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
    return (
      <AddSubModelButton
        {...props}
        subModelKey={subModelKey}
        ParentModelClass={ParentModelClass}
        subModelType={subModelType}
      >
        {children}
      </AddSubModelButton>
    );
  },
);

AddBlockButton.displayName = 'AddBlockButton';
