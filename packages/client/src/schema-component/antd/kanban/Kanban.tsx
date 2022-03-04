import { VoidField } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useState } from 'react';
import { AsyncDataProvider, useRequest } from '../../../';
import { Board } from '../../../board';

const useRequestProps = (props) => {
  const { request, dataSource } = props;
  if (request) {
    return request;
  }
  return (params: any = {}) => {
    return Promise.resolve({
      data: dataSource,
    });
  };
};

const useDefDataSource = (options, props) => {
  return useRequest(useRequestProps(props), options);
};
export const Kanban = observer((props: any) => {
  const { useDataSource = useDefDataSource, ...restProps } = props;
  const field = useField<VoidField>();
  const fieldSchema = useFieldSchema();
  const [dataSource, setDataSource] = useState(props.dataSource || {});

  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
  const result = useDataSource(
    {
      uid: fieldSchema['x-uid'],
      refreshDeps: [props.dataSource],
      onSuccess({ data }) {
        setDataSource(data);
      },
    },
    props,
  );
  return (
    <AsyncDataProvider value={result}>
      <Board {...restProps}>{dataSource}</Board>
    </AsyncDataProvider>
  );
});
