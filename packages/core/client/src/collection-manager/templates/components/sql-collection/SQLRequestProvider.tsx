import { useAPIClient, useRequest } from '../../../../api-client';
import { AsyncDataProvider } from '../../../../async-data-provider';
import React from 'react';
import { useForm } from '@formily/react';

export const SQLRequestProvider = (props) => {
  const api = useAPIClient();
  const form = useForm();
  const result = useRequest(
    () =>
      api
        .resource('sql')
        .execute({
          values: {
            sql: form.values.sql,
          },
        })
        .then((res) => res?.data?.data || []),
    {
      manual: true,
    },
  );

  return <AsyncDataProvider value={result}>{props.children}</AsyncDataProvider>;
};
