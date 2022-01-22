import { ISchemaFieldProps, Schema } from '@formily/react';
import React, { useContext, useMemo } from 'react';
import { SchemaComponentContext } from '../context';

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
  const { schema, ...others } = props;
  const { SchemaField } = useContext(SchemaComponentContext);
  const s = useMemo(() => toSchema(schema), []);
  return <SchemaField {...others} schema={s} />;
}
