import { observer, RecursionField } from '@formily/react';
import React from 'react';
import { useRecord } from '../../../../record-provider';
export const ColumnFieldProvider = observer(
  (props: { schema: any; basePath: any; children: any }) => {
    const { schema, basePath } = props;
    const record = useRecord();
    const fieldSchema = schema.reduceProperties((buf, s) => {
      if (s['x-component'] === 'CollectionField') {
        return s;
      }
      return buf;
    }, null);
    if (fieldSchema && record?.__collection) {
      const fieldName = `${record.__collection}.${fieldSchema.name}`;
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
  },
  { displayName: 'ColumnFieldProvider' },
);
