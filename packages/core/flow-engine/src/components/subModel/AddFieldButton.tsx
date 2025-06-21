/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { AddSubModelButton, SubModelItemsType, mergeSubModelItems } from './AddSubModelButton';
import { Collection } from '../../data-source';
import { FlowModel } from '../../models';
import { ModelConstructor } from '../../types';
import { Button } from 'antd';

export interface AddFieldButtonProps {
  /**
   * 父模型实例
   */
  model: FlowModel;
  /**
   * 子模型基类，用于确定支持的字段类型
   */
  subModelBaseClass?: string | ModelConstructor;
  subModelKey?: string;
  subModelType?: 'object' | 'array';
  collection: Collection;
  /**
   * 自定义 createModelOptions 构建函数
   */
  buildCreateModelOptions?: (field: any, fieldClass: any) => { use: string; stepParams?: Record<string, any> };
  /**
   * 追加的固定 items，会添加到字段 items 之后
   */
  appendItems?: SubModelItemsType;
  /**
   * 添加后的回调函数
   */
  onModelAdded?: (subModel: FlowModel) => Promise<void>;
  /**
   * 显示的UI组件
   */
  children?: React.ReactNode;
}

/**
 * 专门用于添加字段模型的按钮组件
 *
 * @example
 * ```tsx
 * <AddFieldButton
 *   model={parentModel}
 *   subModelBaseClass={'TableColumnModel'}
 * />
 * ```
 */
export const AddFieldButton: React.FC<AddFieldButtonProps> = ({
  model,
  subModelBaseClass = 'FieldFlowModel',
  subModelKey = 'fields',
  children = <Button>Configure fields</Button>,
  subModelType = 'array',
  collection,
  buildCreateModelOptions,
  appendItems,
  onModelAdded,
}) => {
  const fields = collection.getFields();

  // 构建字段 items 的函数
  const buildFieldItems = useMemo<SubModelItemsType>(() => {
    return () => {
      const fieldClasses = Array.from(model.flowEngine.filterModelClassByParent(subModelBaseClass).values())?.sort(
        (a, b) => (a.meta?.sort || 0) - (b.meta?.sort || 0),
      );

      if (fieldClasses.length === 0) {
        return [];
      }

      const allFields = [];
      const defaultFieldClasses = fieldClasses.find((fieldClass) => fieldClass.supportedFieldInterfaces === '*');

      for (const field of fields) {
        const fieldInterfaceName = field.options?.interface;
        const fieldClass =
          fieldClasses.find((fieldClass) => {
            return fieldClass.supportedFieldInterfaces?.includes(fieldInterfaceName);
          }) || defaultFieldClasses;
        if (fieldClass) {
          const fieldItem = {
            key: field.name,
            label: field.title,
            icon: fieldClass.meta?.icon,
            createModelOptions: buildCreateModelOptions
              ? buildCreateModelOptions(field, fieldClass)
              : {
                  ...fieldClass.meta?.defaultOptions,
                  use: fieldClass.name,
                },
          };
          allFields.push(fieldItem);
        }
      }

      return [
        {
          key: 'addField',
          label: 'Collection fields',
          type: 'group' as const,
          searchable: true,
          searchPlaceholder: 'Search fields',
          children: allFields,
        },
      ];
    };
  }, [model, subModelBaseClass, fields, buildCreateModelOptions]);

  const items = useMemo(() => {
    return mergeSubModelItems([buildFieldItems, appendItems], { addDividers: true });
  }, [buildFieldItems, appendItems]);

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

AddFieldButton.displayName = 'AddFieldButton';
