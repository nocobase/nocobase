import { useAPIClient, useRequest } from '../../../../api-client';
import { AsyncDataProvider } from '../../../../async-data-provider';
import React, { useEffect, useRef } from 'react';
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
        .resource('sqlCollection')
        .execute({
          values: {
            sql,
          },
        })
        .then((res) => res?.data?.data || { data: [], fields: [], sources: [] }),
    {
      manual: true,
      onSuccess: (data) => {
        const { sources } = data;
        const formSources = form.values.sources || [];
        form.setValuesIn('sources', Array.from(new Set([...formSources, ...sources])));
      },
    },
  );

  const { run } = result;
  const sql = form.values.sql || record.sql;
  const first = useRef(true);
  useEffect(() => {
    if (sql && first.current) {
      run(sql);
    }
    first.current = false;
  }, [manual, run, sql]);

  return <AsyncDataProvider value={result}>{props.children}</AsyncDataProvider>;
};
