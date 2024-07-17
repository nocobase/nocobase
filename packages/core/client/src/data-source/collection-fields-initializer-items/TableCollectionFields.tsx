import React, { FC } from 'react';
import { Schema } from '@formily/json-schema';
import { CollectionFields } from './CollectionFields';
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


export const TableCollectionFields: FC = (props) => {
  function isReadPretty({ fieldSchema, form }) {
    const isSubTable = fieldSchema['x-component'] === 'AssociationField.SubTable';
    const isReadPretty = isSubTable ? form.readPretty : true;

    return isReadPretty;
  };
  return <CollectionFields
    block={'Table'}
    selfField={{
      isReadPretty,
      filter: (field) => field?.interface && field?.interface !== 'subTable' && !field?.treeChildren,
      getSchema: (field, { targetCollection, fieldSchema, form }) => {
        const isFileCollection = targetCollection?.template === 'file';
        const isPreviewComponent = field?.uiSchema?.['x-component'] === 'Preview';
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
        }
      },
      getInitializerItem: () => {
        return {
          find: findTableColumn,
          remove: removeTableColumn,
        }
      }
    }}
    parentField={{
      isReadPretty,
      filter: (field) => field?.interface,
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
        }
      },
      getInitializerItem() {
        return {
          remove: removeGridFormItem,
        }
      },
    }}
    associationField={{
      filterAssociationField(collectionField) {
        return collectionField?.interface && !['subTable'].includes(collectionField?.interface) && !collectionField.treeChildren
      },
      getSchema() {
        return {}
      },
      getInitializerItem() {
        return {
          find: findTableColumn,
          remove: removeTableColumn,
        }
      },
    }}
  />
}
