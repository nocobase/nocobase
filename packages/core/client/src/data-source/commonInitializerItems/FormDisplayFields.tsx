import React, { FC } from 'react';
import { Schema } from '@formily/json-schema';
import { CollectionFields } from './CollectionFields';

const findSchema = (schema: Schema, key: string, action: string) => {
  if (!Schema.isSchemaInstance(schema)) return null;
  return schema.reduceProperties((buf, s) => {
    if (s[key] === action) {
      return s;
    }
    if (s['x-component'] !== 'Action.Container' && !s['x-component'].includes('AssociationField')) {
      const c = findSchema(s, key, action);
      if (c) {
        return c;
      }
    }

    return buf;
  });
};

export const removeGridFormItem = (schema, cb) => {
  cb(schema, {
    removeParentsIfNoChildren: true,
    breakRemoveOn: {
      'x-component': 'Grid',
    },
  });
};

export const findKanbanFormItem = (schema: Schema, key: string, action: string) => {
  const s = findSchema(schema, 'x-component', 'Kanban');
  return findSchema(s, key, action);
}

interface GetFormDisplayFieldsInitializerItem {
  block?: string;
}

export const FormCollectionFields: FC<GetFormDisplayFieldsInitializerItem> = (props) => {
  return <CollectionFields
    block={props?.block || 'form'}
    filter={(field) => field?.interface && !field?.treeChildren}
    getSchema={(field, { targetCollection }) => {
      const isFileCollection = targetCollection?.template === 'file';
      const isAssociationField = targetCollection;
      const fieldNames = field?.uiSchema?.['x-component-props']?.['fieldNames'];

      return {
        'x-toolbar': 'FormItemSchemaToolbar',
        'x-settings': 'fieldSettings:FormItem',
        'x-decorator': 'FormItem',
        'x-component-props': isFileCollection
          ? {
            fieldNames: {
              label: 'preview',
              value: 'id',
            },
          }
          : isAssociationField && fieldNames
            ? {
              fieldNames: { ...fieldNames, label: targetCollection?.titleField || fieldNames.label },
            }
            : {},
      }
    }}
    getInitializerItem={() => {
      return {
        remove: removeGridFormItem,
        find: props?.block === 'Kanban' ? findKanbanFormItem : undefined
      }
    }}
  />
}
