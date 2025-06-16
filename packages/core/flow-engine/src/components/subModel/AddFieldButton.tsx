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
import { Collection, CollectionField } from '../../data-source';
import { FlowModel } from '../../models';
import { CreateModelOptions, ModelConstructor } from '../../types';


export interface AddFieldButtonProps extends Omit<AddSubModelButtonProps, 'subModelType' | 'subModelKey' | 'items' | 'buildSubModelParams'> {
  /**
   * 父模型类名，用于确定支持的字段类型
   */
  ParentModelClass?: string | ModelConstructor;
  subModelKey?: string;
  subModelType?: 'object' | 'array';
  collection: Collection;
  buildSubModelParams?: (item: AddFieldMenuItem) => CreateModelOptions | FlowModel;
  onModelAdded?: (subModel: FlowModel, item: AddFieldMenuItem) => Promise<void>;
}

export interface AddFieldMenuItem extends AddSubModelMenuItem {
  field: CollectionField;
}

/**
 * 专门用于添加字段模型的按钮组件
 * 
 * @example
 * ```tsx
 * <AddFieldButton 
 *   model={parentModel}
 *   ParentModelClass={'TableColumnModel'}
 * />
 * ```
 */
export const AddFieldButton: React.FC<AddFieldButtonProps> = observer(({
  ParentModelClass = 'FieldFlowModel',
  subModelKey = 'fields',
  children = 'Add field',
  subModelType = 'array',
  ...props
}) => {
  const fields = props.collection.getFields();
  const items = useMemo<AddFieldMenuItem[]>(() => {
    const fieldClasses = Array.from(props.model.flowEngine.filterModelClassByParent(ParentModelClass).values())
    ?.sort((a, b) => (a.meta?.sort || 0) - (b.meta?.sort || 0));

    if (fieldClasses.length === 0) {
      return [];
    }

    const allFields = [];
    const defaultFieldClasses = fieldClasses.find(fieldClass => fieldClass.supportedFieldInterfaces === '*');

    for (const field of fields) {
      const fieldInterfaceName = field.options?.interface;
      if (fieldInterfaceName) {
        const fieldClass = fieldClasses.find(fieldClass => {
          return fieldClass.supportedFieldInterfaces?.includes(fieldInterfaceName);
        }) || defaultFieldClasses;
        if (fieldClass) {
          allFields.push({
            key: field.name,
            label: field.title,
            item: fieldClass,
            use: fieldClass.name,
            field,
          });
        }
      }
    }
    return allFields;
  }, [props.model, ParentModelClass, fields]);

  return (
    <AddSubModelButton
      {...props}
      subModelKey={subModelKey}
      subModelType={subModelType}
      items={items}
    >
      {children}
    </AddSubModelButton>
  );
});

AddFieldButton.displayName = 'AddFieldButton';
