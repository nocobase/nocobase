/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { Schema } from '@formily/json-schema';
import { CollectionFieldsToInitializerItems } from './CollectionFieldsToInitializerItems';
import { removeGridFormItem, findSchema } from '../../schema-initializer/utils';

export const findKanbanFormItem = (schema: Schema, key: string, action: string) => {
  const s = findSchema(schema, 'x-component', 'Kanban');
  return findSchema(s, key, action);
};

export const CollectionFieldsToFormInitializerItems: FC<{ block?: string }> = (props) => {
  const block = props?.block || 'Form';
  const fieldItemSchema = {
    'x-toolbar': 'FormItemSchemaToolbar',
    'x-settings': 'fieldSettings:FormItem',
    'x-decorator': 'FormItem',
  };

  const initializerItem = {
    remove: removeGridFormItem,
  };
  return (
    <CollectionFieldsToInitializerItems
      block={block}
      selfField={{
        filter: (field) => !field.treeChildren,
        getSchema: (field, { targetCollection }) => {
          const isFileCollection = targetCollection?.template === 'file';
          const isAssociationField = targetCollection;
          const fieldNames = field?.uiSchema?.['x-component-props']?.['fieldNames'];

          return {
            ...fieldItemSchema,
            'x-component-props': isFileCollection
              ? { fieldNames: { label: 'preview', value: 'id' } }
              : isAssociationField && fieldNames
                ? { fieldNames: { ...fieldNames, label: targetCollection?.titleField || fieldNames.label } }
                : {},
          };
        },
        getInitializerItem: () => {
          return {
            ...initializerItem,
            find: props?.block === 'Kanban' ? findKanbanFormItem : undefined,
          };
        },
      }}
      parentField={{
        getSchema: () => fieldItemSchema,
        getInitializerItem: () => initializerItem,
      }}
      associationField={{
        filterSelfField: (field) => {
          if (block !== 'Form') return true;
          return field?.interface === 'm2o';
        },
        filterAssociationField(collectionField) {
          return (
            collectionField?.interface &&
            !['subTable'].includes(collectionField?.interface) &&
            !collectionField.treeChildren
          );
        },
        getSchema: () => fieldItemSchema,
        getInitializerItem: () => initializerItem,
      }}
    />
  );
};
