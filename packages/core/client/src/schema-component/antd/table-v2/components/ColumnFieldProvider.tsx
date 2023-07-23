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
      schema.properties[fieldSchema.name]['x-collection-field'] = fieldName;
      return <RecursionField basePath={basePath} schema={schema} onlyRenderProperties />;
    }
    return props.children;
  },
  { displayName: 'ColumnFieldProvider' },
);
