/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { CollectionFieldsToInitializerItems } from './CollectionFieldsToInitializerItems';
import { findTableColumn, removeGridFormItem, removeTableColumn } from '../../schema-initializer/utils';

const quickEditField = [
  'attachment',
  'textarea',
  'markdown',
  'json',
  'richText',
  'polygon',
  'circle',
  'point',
  'lineString',
];

export const CollectionFieldsToTableInitializerItems: FC = (props) => {
  function isReadPretty({ fieldSchema, form }) {
    const isSubTable = fieldSchema['x-component'] === 'AssociationField.SubTable';
    const isReadPretty = isSubTable ? form.readPretty : true;

    return isReadPretty;
  }
  return (
    <CollectionFieldsToInitializerItems
      block={'Table'}
      selfField={{
        isReadPretty,
        filter: (field) => field.interface !== 'subTable' && !field.treeChildren,
        getSchema: (field, { targetCollection, fieldSchema, form }) => {
          const isFileCollection = targetCollection?.template === 'file';
          const isPreviewComponent = field.uiSchema?.['x-component'] === 'Preview';
          const isSubTable = fieldSchema['x-component'] === 'AssociationField.SubTable';
          const readPretty = isReadPretty({ fieldSchema, form });

          return {
            'x-component-props': isFileCollection
              ? {
                  fieldNames: {
                    label: 'preview',
                    value: 'id',
                  },
                }
              : isPreviewComponent
                ? { size: 'small' }
                : {},
            'x-read-pretty': readPretty || field.uiSchema?.['x-read-pretty'],
            'x-decorator': isSubTable
              ? quickEditField.includes(field.interface) || isFileCollection
                ? 'QuickEdit'
                : 'FormItem'
              : null,
            'x-decorator-props': {
              labelStyle: {
                display: 'none',
              },
            },
          };
        },
        getInitializerItem: () => {
          return {
            find: findTableColumn,
            remove: removeTableColumn,
          };
        },
      }}
      parentField={{
        isReadPretty,
        getSchema(field, { targetCollection, fieldSchema, form }) {
          const isFileCollection = targetCollection?.template === 'file';
          const isSubTable = fieldSchema['x-component'] === 'AssociationField.SubTable';
          const readPretty = isReadPretty({ fieldSchema, form });

          return {
            'x-component-props': isFileCollection
              ? {
                  fieldNames: {
                    label: 'preview',
                    value: 'id',
                  },
                }
              : {},
            'x-read-pretty': readPretty || field.uiSchema?.['x-read-pretty'],
            'x-decorator': isSubTable
              ? quickEditField.includes(field.interface) || isFileCollection
                ? 'QuickEdit'
                : 'FormItem'
              : null,
            'x-decorator-props': {
              labelStyle: {
                display: 'none',
              },
            },
          };
        },
        getInitializerItem() {
          return {
            remove: removeGridFormItem,
          };
        },
      }}
      associationField={{
        filterAssociationField(collectionField) {
          return !['subTable'].includes(collectionField.interface) && !collectionField.treeChildren;
        },
        getSchema() {
          return {};
        },
        getInitializerItem() {
          return {
            find: findTableColumn,
            remove: removeTableColumn,
          };
        },
      }}
    />
  );
};
