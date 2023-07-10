import { RecursionField } from '@formily/react';
import React from 'react';
import { useCollectionManager } from '../../../../collection-manager';
import { useRecord } from '../../../../record-provider';
export const InheritedFieldProvider = (props) => {
  const { schema, basePath } = props;
  const record = useRecord();
  const { getCollectionJoinField } = useCollectionManager();
  const fieldSchema = schema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'CollectionField') {
      return s;
    }
    return buf;
  }, null);
  if (fieldSchema && record?.__collection) {
    const fieldName = `${record.__collection}.${fieldSchema.name}`;
    const collectionField = getCollectionJoinField(fieldName);
    const newSchema = {
      ...schema.toJSON(),
      properties: {
        [fieldSchema.name]: {
          ...fieldSchema.toJSON(),
          'x-collection-field': fieldName,
          'x-component-props': {
            ...fieldSchema['x-component-props'],
          },
        },
      },
    };
    return <RecursionField basePath={basePath} schema={newSchema} onlyRenderProperties />;
  }
  return props.children;
};
