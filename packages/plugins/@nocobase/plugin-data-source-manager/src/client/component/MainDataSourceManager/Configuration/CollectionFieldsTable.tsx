import { createForm, Field } from '@formily/core';
import { FieldContext, FormContext, observer, useField, useFieldSchema } from '@formily/react';
import { useAttach } from '@formily/react/esm/hooks/useAttach';
import { Options, Result } from 'ahooks/es/useRequest/src/types';
import { TableProps } from 'antd';
import React, { useMemo } from 'react';
import { AsyncDataProvider, useAsyncData, useRequest } from '@nocobase/client';
import { CollectionFieldsTableArray } from './CollectionFieldsTableArray';

type TableVoidProps = TableProps<any> & {
  request?: any;
  useSelectedRowKeys?: any;
  useDataSource?: (
    options?: Options<any, any> & { uid?: string },
    props?: any,
  ) => Result<any, any> & { state?: any; setState?: any };
};

const useDefSelectedRowKeys = () => {
  const result = useAsyncData();
  return [result?.state?.selectedRowKeys, (selectedRowKeys) => result?.setState?.({ selectedRowKeys })];
};
const useDef = (options, props) => {
  const { request, dataSource } = props;
  const result = useRequest(request(props), { ...options, manual: true });

  if (request) {
    result.run();
    return result;
  } else {
    return Promise.resolve({
      data: dataSource,
    });
  }
};

export const CollectionFieldsTable: React.FC<TableVoidProps> = observer(
  (props) => {
    const { rowKey = 'id', useDataSource = useDef, useSelectedRowKeys = useDefSelectedRowKeys } = props;
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const form = useMemo(() => createForm(), []);
    const f = useAttach(form.createArrayField({ ...field.props, basePath: '' }));
    const result = useDataSource(
      {
        uid: fieldSchema['x-uid'],
        onSuccess(data) {
          form.setValues({
            [fieldSchema.name]: data?.data,
          });
        },
      },
      props,
    );
    return (
      <AsyncDataProvider value={result}>
        <FormContext.Provider value={form}>
          <FieldContext.Provider value={f}>
            <CollectionFieldsTableArray
              {...props}
              rowKey={rowKey}
              loading={result?.['loading']}
              useSelectedRowKeys={useSelectedRowKeys}
              pagination={false}
            />
          </FieldContext.Provider>
        </FormContext.Provider>
      </AsyncDataProvider>
    );
  },
  { displayName: 'CollectionFieldsTable' },
);
