import React, { createContext, useContext, useMemo, useState } from 'react';
import { uid } from '@formily/shared';
import { createForm } from '@formily/core';
import {
  createSchemaField,
  FormProvider,
  RecursionField,
  Schema,
  SchemaExpressionScopeContext,
  SchemaOptionsContext,
} from '@formily/react';

export const SchemaComponentContext = createContext<any>({});

export function SchemaComponentProvider(props) {
  const { components, scope, children } = props;
  const [, setUid] = useState(uid());
  const form = props.form || useMemo(() => createForm(), []);
  const SchemaField = useMemo(
    () =>
      createSchemaField({
        scope,
        components,
      }),
    [],
  );
  return (
    <SchemaComponentContext.Provider
      value={{
        SchemaField,
        components,
        scope,
        refresh: () => setUid(uid()),
      }}
    >
      <FormProvider form={form}>{children}</FormProvider>
    </SchemaComponentContext.Provider>
  );
}

export function RecursionComponent(props) {
  const { components, scope } = useContext(SchemaComponentContext);
  return (
    <SchemaOptionsContext.Provider
      value={{
        components: { ...props.components, ...components },
        scope: { ...props.scope, ...scope },
      }}
    >
      <SchemaExpressionScopeContext.Provider value={{ scope }}>
        <RecursionField {...props} />
      </SchemaExpressionScopeContext.Provider>
    </SchemaOptionsContext.Provider>
  );
}

function toSchema(schema) {
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

// TODO
export function useDesignable() {
  const { refresh } = useContext(SchemaComponentContext);
  return { refresh };
}

export function SchemaComponent(props) {
  const { schema: defaultSchema, ...others } = props;
  const { SchemaField } = useContext(SchemaComponentContext);
  const schema = useMemo(() => toSchema(defaultSchema), []);
  return <SchemaField {...others} schema={schema} />;
}
