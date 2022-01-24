import { ISchemaFieldProps, RecursionField, Schema } from '@formily/react';
import React, { useContext, useMemo } from 'react';
import { SchemaComponentContext } from '../context';
import { SchemaComponentOptions } from './SchemaComponentOptions';

function toSchema(schema?: any) {
  if (Schema.isSchemaInstance(schema)) {
    return schema;
  }
  if (schema.name) {
    return new Schema({
      type: 'object',
      properties: {
        [schema.name]: schema,
      },
    });
  }
  return new Schema(schema);
}

export function SchemaComponent(props: ISchemaFieldProps) {
  const { components, scope, schema, ...others } = props;
  const s = useMemo(() => toSchema(schema), []);
  console.log('SchemaComponent', { components, scope });
  return (
    <SchemaComponentOptions inherit components={components} scope={scope}>
      <RecursionField {...others} schema={s} />
    </SchemaComponentOptions>
  );
}
