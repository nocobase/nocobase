import React, { useContext, useEffect, useMemo } from 'react';
import { Schema, ISchemaFieldProps } from '@formily/react';
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
  const { schema: defaultSchema, ...others } = props;
  const { reset, SchemaField } = useContext(SchemaComponentContext);
  const schema = useMemo(() => toSchema(defaultSchema), []);
  // @ts-ignore
  // console.log('defaultSchema', JSON.stringify(schema.toJSON()));
  // TODO
  useEffect(() => {
    reset();
  }, [JSON.stringify(defaultSchema)]);
  return <SchemaField {...others} schema={schema} />;
}
