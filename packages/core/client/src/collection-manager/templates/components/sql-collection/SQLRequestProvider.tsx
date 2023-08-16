import { useAPIClient, useRequest } from '../../../../api-client';
import { AsyncDataProvider } from '../../../../async-data-provider';
import React, { useEffect } from 'react';
import { useForm } from '@formily/react';
import { useRecord } from '../../../../record-provider';

export const SQLRequestProvider: React.FC<{
  manual?: boolean;
}> = (props) => {
  const api = useAPIClient();
  const form = useForm();
  const record = useRecord();
  let { manual } = props;
  manual = manual === undefined ? true : manual;

  const result = useRequest(
    (sql: string) =>
      api
        .resource('sql')
        .execute({
          values: {
            sql,
          },
        })
        .then((res) => res?.data?.data || []),
    {
      manual: true,
    },
  );

  const { run } = result;
  const sql = form.values.sql || record.sql;
  useEffect(() => {
    if (sql) {
      run(sql);
    }
  }, [manual, run, sql]);

  return <AsyncDataProvider value={result}>{props.children}</AsyncDataProvider>;
};
