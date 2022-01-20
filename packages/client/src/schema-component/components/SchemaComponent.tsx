import { ISchemaFieldProps, Schema } from '@formily/react';
import React, { useContext, useEffect, useMemo, useRef } from 'react';
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
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
   } else {
    reset();
   }
  }, [JSON.stringify(defaultSchema)]);
  return <SchemaField {...others} schema={schema} />;
}
