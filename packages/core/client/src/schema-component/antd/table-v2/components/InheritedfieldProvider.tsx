import { RecursionField } from '@formily/react';
import React from 'react';
import { CollectionFieldContext, useCollectionManager } from '../../../../collection-manager';
export const InheritedFieldProvider = (props) => {
  const { record, schema, basePath } = props;
  const { getCollectionJoinField } = useCollectionManager();
  const fieldSchema = schema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'CollectionField') {
      return s;
    }
    return buf;
  }, null);
  if (fieldSchema && record?.__collection) {
    const fieldName = `${record.__collection}.${fieldSchema.name}`;
    const tw = getCollectionJoinField(fieldName);
    const nreSchema = {
      ...schema.toJSON(),
      properties: {
        [fieldSchema.name]: {
          ...fieldSchema.toJSON(),
          'x-collection-field': fieldName,
        },
      },
    };
    return (
      <CollectionFieldContext.Provider value={{ uiSchema: tw.uiSchema }}>
        <RecursionField basePath={basePath} schema={nreSchema} onlyRenderProperties />
      </CollectionFieldContext.Provider>
    );
  }
  return props.children;
};
