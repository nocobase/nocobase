import {
  SchemaComponent,
  useAPIClient,
  useRequest,
  useRecord,
  useActionContext,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { useForm, ISchema } from '@formily/react';

const OptionsSchemaContext = createContext<{
  [authType: string]: ISchema;
}>({});

export const OptionsSchemaProvider: React.FC<{ authType: string; schema: ISchema }> = (props) => {
  const schemas = useContext(OptionsSchemaContext);
  schemas[props.authType] = props.schema;
  return <OptionsSchemaContext.Provider value={schemas}>{props.children}</OptionsSchemaContext.Provider>;
};

export const useOptionsSchema = (authType: string) => {
  const schemas = useContext(OptionsSchemaContext);
  return schemas[authType] || {};
};

export const useUpdateOptionsAction = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await form.submit();
      await resource.update({
        filterByTk,
        values: {
          options: form.values,
        },
      });
      setVisible(false);
      await form.reset();
      refresh();
    },
  };
};

export const useValuesFromOptions = (options) => {
  const record = useRecord();
  const result = useRequest(
    () =>
      Promise.resolve({
        data: {
          ...record.options,
        },
      }),
    {
      ...options,
      manual: true,
    },
  );
  const { run } = result;
  const ctx = useActionContext();
  useEffect(() => {
    if (ctx.visible) {
      run();
    }
  }, [ctx.visible, run]);
  return result;
};

export const Configure = () => {
  const record = useRecord();
  const schema = useOptionsSchema(record.authType);

  return <SchemaComponent schema={schema} />;
};
