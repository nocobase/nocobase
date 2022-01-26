import { createForm, GeneralField } from '@formily/core';
import { FieldContext, FormContext, observer, Schema, useField, useFieldSchema } from '@formily/react';
import { TablePaginationConfig, TableProps } from 'antd';
import React, { useMemo } from 'react';
import { AsyncDataProvider, useAsyncData } from '../../../';
import { useAttach } from '../../hooks';
import { ArrayTable } from '../array-table';

type VoidTableType = React.FC<TableProps<any> & { request?: any }> & {
  Column?: React.FC<any>;
  mixin?: (T: any) => void;
};

interface ArrayFieldProviderProps {
  request?: any;
  initialValue?: any;
  field?: GeneralField;
  schema?: Schema;
  onSuccess?: (data?: any, params?: any) => void;
}

const ArrayFieldProvider: React.FC<ArrayFieldProviderProps> = (props) => {
  const { field, schema, request, initialValue, children, onSuccess } = props;
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          [schema.name]: initialValue || [],
        },
      }),
    [],
  );
  const f = useAttach(form.createArrayField({ ...field.props, basePath: '' }));
  return (
    <AsyncDataProvider
      uid={schema['x-uid']}
      request={request}
      onSuccess={(data, params) => {
        onSuccess && onSuccess(data, params);
        form.setValues({
          [schema.name]: data?.data,
        });
      }}
    >
      <FormContext.Provider value={form}>
        <FieldContext.Provider value={f}>{children}</FieldContext.Provider>
      </FormContext.Provider>
    </AsyncDataProvider>
  );
};

const usePaginationProps = (props: TableProps<any> & { request?: any }): TablePaginationConfig | false => {
  const result = useAsyncData();
  if (props.pagination === false) {
    return false;
  }
  const pagination: TablePaginationConfig = props.pagination || { total: 100 };
  if (props?.request?.params?.pageSize) {
    pagination.defaultPageSize = props?.request?.params?.pageSize;
  }
  return {
    ...pagination,
    onChange(page, pageSize) {
      result.run({ ...result?.params?.[0], page, pageSize });
    },
  };
};

const InternalTable = (props) => {
  const result = useAsyncData();
  return <ArrayTable {...props} loading={result?.loading} pagination={usePaginationProps(props)} />;
};

export const VoidTable: VoidTableType = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  return (
    <ArrayFieldProvider
      field={field}
      schema={fieldSchema}
      request={props.request}
      initialValue={props.dataSource}
      onSuccess={(data) => {
        field.componentProps.pagination = field.componentProps.pagination || {};
        if (data?.meta?.count) {
          field.componentProps.pagination.total = data?.meta?.count;
        }
        field.componentProps.pagination.current = data?.meta?.page || 1;
        field.componentProps.pagination.pageSize = data?.meta?.pageSize || 10;
      }}
    >
      <InternalTable {...props} />
    </ArrayFieldProvider>
  );
});

VoidTable.mixin = ArrayTable.mixin;

ArrayTable.mixin(VoidTable);
