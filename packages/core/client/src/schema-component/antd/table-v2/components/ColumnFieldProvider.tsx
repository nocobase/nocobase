import { observer, RecursionField } from '@formily/react';
import React from 'react';
import { useCollectionManager_deprecated } from '../../../../collection-manager';
import { useRecord } from '../../../../record-provider';
export const ColumnFieldProvider = observer(
  (props: { schema: any; basePath: any; children: any }) => {
    const { schema, basePath } = props;
    const record = useRecord();
    const { getCollectionJoinField } = useCollectionManager_deprecated();
    const fieldSchema = schema.reduceProperties((buf, s) => {
      if (s['x-component'] === 'CollectionField') {
        return s;
      }
      return buf;
    }, null);
    const collectionField = fieldSchema && getCollectionJoinField(fieldSchema['x-collection-field']);
    if (
      fieldSchema &&
      record?.__collection &&
      collectionField &&
      ['select', 'multipleSelect'].includes(collectionField.interface)
    ) {
      const fieldName = `${record.__collection}.${fieldSchema.name}`;
      const newSchema = {
        ...schema.toJSON(),
        properties: {
          [fieldSchema.name]: {
            ...fieldSchema.toJSON(),
            'x-collection-field': fieldName,
          },
        },
      };
      return <RecursionField basePath={basePath} schema={newSchema} onlyRenderProperties />;
    }
    return props.children;
  },
  { displayName: 'ColumnFieldProvider' },
);
