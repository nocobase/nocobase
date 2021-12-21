import React, { createContext, useContext, useMemo, useState } from 'react';
import { uid } from '@formily/shared';
import { createForm, Form } from '@formily/core';
import {
  createSchemaField,
  FormProvider,
  IRecursionFieldProps,
  ISchemaFieldProps,
  ISchemaFieldReactFactoryOptions,
  RecursionField,
  Schema,
  SchemaExpressionScopeContext,
  SchemaOptionsContext,
  SchemaReactComponents,
} from '@formily/react';
import { useCookieState } from 'ahooks';

export interface ISchemaComponentContext {
  scope?: any;
  components?: SchemaReactComponents;
  refresh?: () => void;
  designable?: boolean;
  setDesignable?: (value: boolean) => void;
  SchemaField?: React.FC<ISchemaFieldProps>;
}

export interface ISchemaComponentProvider {
  form?: Form;
  scope?: any;
  components?: SchemaReactComponents;
}

export const SchemaComponentContext = createContext<ISchemaComponentContext>({});

export const SchemaComponentProvider: React.FC<ISchemaComponentProvider> = (props) => {
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

interface IRecursionComponentProps extends IRecursionFieldProps {
  scope?: any;
  components?: SchemaReactComponents;
}

export const RecursionComponent: React.FC<IRecursionComponentProps> = (props) => {
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

// TODO
export function useDesignable() {
  const { designable, refresh } = useContext(SchemaComponentContext);
  return { designable, refresh };
}

export function SchemaComponent(props: ISchemaFieldProps) {
  const { schema: defaultSchema, ...others } = props;
  const { SchemaField } = useContext(SchemaComponentContext);
  const schema = useMemo(() => toSchema(defaultSchema), []);
  return <SchemaField {...others} schema={schema} />;
}
