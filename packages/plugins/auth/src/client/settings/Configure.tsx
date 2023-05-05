import {
  SchemaComponent,
  useAPIClient,
  useRequest,
  useRecord,
  useActionContext,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import React, { useState, useEffect } from 'react';
import { useForm } from '@formily/react';

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
  const [schema, setSchema] = useState({});
  const api = useAPIClient();
  const record = useRecord();

  useRequest(
    () =>
      api
        .resource('authenticators')
        .getConfig({
          authType: record.authType,
        })
        .then((res) => res?.data?.data?.optionsSchema || {}),
    {
      onSuccess: (schema) => {
        setSchema(schema);
      },
    },
  );

  return <SchemaComponent schema={schema} />;
};
