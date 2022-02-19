import { IRecursionFieldProps, ISchemaFieldProps, RecursionField, Schema } from '@formily/react';
import React, { useMemo } from 'react';
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

const useMemoizedSchema = (schema) => {
  return useMemo(() => toSchema(schema), []);
};

const RecursionSchemaComponent = (props: ISchemaFieldProps) => {
  const { components, scope, schema, ...others } = props;
  return (
    <SchemaComponentOptions inherit components={components} scope={scope}>
      <RecursionField {...others} schema={toSchema(schema)} />
    </SchemaComponentOptions>
  );
};

const MemoizedSchemaComponent = (props: ISchemaFieldProps) => {
  const { schema, ...others } = props;
  const s = useMemoizedSchema(schema);
  return <RecursionSchemaComponent {...others} schema={s} />;
};

export const SchemaComponent = (props: (ISchemaFieldProps | IRecursionFieldProps) & { memoized?: boolean }) => {
  const { memoized, ...others } = props;
  if (memoized) {
    return <MemoizedSchemaComponent {...others} />;
  }
  return <RecursionSchemaComponent {...others} />;
};
