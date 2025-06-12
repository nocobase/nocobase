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
import { AddSubModelButton, AddSubModelButtonProps, AddSubModelItem } from './AddSubModelButton';
import { Collection } from '../../data-source';


interface AddFieldButtonProps extends Omit<AddSubModelButtonProps, 'subModelType' | 'subModelKey' | 'items'> {
  subModelKey?: string;
  subModelType?: 'object' | 'array';
  collection: Collection;
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
  ParentModelClass = 'TableColumnModel',
  subModelKey = 'fields',
  children = 'Add field',
  subModelType = 'array',
  ...props
}) => {
  const fields = props.collection.getFields();
  const items = useMemo<AddSubModelItem[]>(() => {
    const fieldClasses = Array.from(props.model.flowEngine.filterModelClassByParent(ParentModelClass).values()).filter(c => !!c.meta)
    ?.sort((a, b) => (a.meta?.sort || 0) - (b.meta?.sort || 0));
    const allFields = [];

    const defaultFieldClasses = fieldClasses.filter(
      fieldClass => !fieldClass.meta?.supportedInterfaces && !fieldClass.meta?.supportedInterfaceGroups
    );

    for (const field of fields) {
      const fieldInterfaceName = field.options?.interface;
      if (fieldInterfaceName) {
        const fieldClass = fieldClasses.find(fieldClass => fieldClass.meta?.supportedInterfaces?.includes(fieldInterfaceName));
        if (fieldClass) {
          allFields.push({
            key: field.name,
            label: field.title,
            item: fieldClass,
            use: fieldClass.name,
            field,
            props: {
              dataIndex: field.name,
              title: field.title
            },
          });
        } else if (defaultFieldClasses) {
          allFields.push({
            key: field.name,
            label: field.title,
            item: defaultFieldClasses[0],
            use: defaultFieldClasses[0]?.name,
            field,
            props: {
              dataIndex: field.name,
              title: field.title
            },
          });
        }
      }
    }
    return allFields;
  }, [props.model, ParentModelClass, fields]);

  const afterAdd = (subModel, item) => {
    const field = item.field;
    subModel.field = field;
    subModel.fieldPath = `${field.collection.dataSource.name}.${field.collection.name}.${field.name}`;
  };

  return (
    <AddSubModelButton
      {...props}
      subModelKey={subModelKey}
      ParentModelClass={ParentModelClass}
      subModelType={subModelType}
      items={items}
      onAfterAdd={afterAdd}
    >
      {children}
    </AddSubModelButton>
  );
});

AddFieldButton.displayName = 'AddFieldButton';
