import React, { createContext, useContext, useMemo, useState } from 'react';
import { uid } from '@formily/shared';
import { createForm, Form } from '@formily/core';
import { useCookieState } from 'ahooks';
import { useTranslation } from 'react-i18next';
import {
  Schema,
  FormProvider,
  RecursionField,
  createSchemaField,
  IRecursionFieldProps,
  ISchemaFieldProps,
  SchemaOptionsContext,
  SchemaReactComponents,
  SchemaExpressionScopeContext,
} from '@formily/react';
import { IRecursionComponentProps, ISchemaComponentProvider } from './types';
import { SchemaComponentContext } from './context';

export const SchemaComponentProvider: React.FC<ISchemaComponentProvider> = (props) => {
  const { components, children } = props;
  const [, setUid] = useState(uid());
  const form = props.form || useMemo(() => createForm(), []);
  const { t } = useTranslation();
  const scope = { ...props.scope, t };
  const SchemaField = useMemo(
    () =>
      createSchemaField({
        scope,
        components,
      }),
    [],
  );
  const [active, setActive] = useCookieState('useCookieDesignable');
  return (
    <SchemaComponentContext.Provider
      value={{
        SchemaField,
        components,
        scope,
        refresh: () => setUid(uid()),
        designable: active === 'true',
        setDesignable(value) {
          setActive(value ? 'true' : 'false');
        },
      }}
    >
      <FormProvider form={form}>{children}</FormProvider>
    </SchemaComponentContext.Provider>
  );
};

export const SchemaOptionsExpressionScopeProvider: React.FC = (props) => {
  const { components, scope } = useContext(SchemaComponentContext);
  return (
    <SchemaOptionsContext.Provider
      value={{
        scope,
        components,
      }}
    >
      <SchemaExpressionScopeContext.Provider value={{ scope }}>{props.children}</SchemaExpressionScopeContext.Provider>
    </SchemaOptionsContext.Provider>
  );
};

export const RecursionComponent: React.FC<IRecursionComponentProps> = (props) => {
  const { components, scope } = useContext(SchemaComponentContext);
  return (
    <SchemaOptionsContext.Provider
      value={{
        scope: { ...props.scope, ...scope },
        components: { ...props.components, ...components },
      }}
    >
      <SchemaExpressionScopeContext.Provider value={{ scope }}>
        <RecursionField {...props} />
      </SchemaExpressionScopeContext.Provider>
    </SchemaOptionsContext.Provider>
  );
};

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
  const { SchemaField } = useContext(SchemaComponentContext);
  const schema = useMemo(() => toSchema(defaultSchema), []);
  return <SchemaField {...others} schema={schema} />;
}
