import React, { createContext, useContext, useMemo } from 'react';
import { createSchemaField, FormProvider } from '@formily/react';
import { createForm } from '@formily/core';

const SchemaComponentContext = createContext<any>({});

export function SchemaComponentProvider(props) {
  const { components, scope, children } = props;
  const form = useMemo(() => props.form || createForm(), []);
  return (
    <SchemaComponentContext.Provider value={{ components, scope }}>
      <FormProvider form={form}>{children}</FormProvider>
    </SchemaComponentContext.Provider>
  );
}

function toSchema(schema) {
  if (schema.name) {
    return {
      type: 'object',
      properties: {
        [schema.name]: schema,
      },
    };
  }
  return schema;
}

export function SchemaComponent(props) {
  const { schema, ...others } = props;
  const { components, scope } = useContext(SchemaComponentContext);
  const SchemaField = createSchemaField({
    components,
    scope,
  });
  return <SchemaField {...others} schema={toSchema(schema)} />;
}
