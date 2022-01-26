import { createForm } from '@formily/core';
import { FieldContext, FormContext, observer, SchemaContext, useField, useFieldSchema } from '@formily/react';
import { TablePaginationConfig, TableProps } from 'antd';
import React, { createContext, useContext, useMemo } from 'react';
import { useRequest } from '../../../api-client';
import { useAttach } from '../../hooks';
import { ArrayTable } from '../array-table';

type VoidTableType = React.FC<TableProps<any> & { request?: any }> & {
  Column?: React.FC<any>;
  mixin?: (T: any) => void;
};

interface ArrayFieldProviderProps {
  request?: any;
  initialValue?: any;
}

const RequestContext = createContext(null);

const ArrayFieldProvider: React.FC<ArrayFieldProviderProps> = (props) => {
  const { request, initialValue, children } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          [fieldSchema.name]: initialValue || [],
        },
      }),
    [],
  );
  const f = useAttach(form.createArrayField({ ...field.props, basePath: '' }));
  const result = useRequest(request, {
    uid: fieldSchema['x-uid'],
    onSuccess(data) {
      if (data?.meta?.count) {
        field.componentProps.pagination = field.componentProps.pagination || {};
        field.componentProps.pagination.total = data?.meta?.count;
      }
      form.setValues({
        [fieldSchema.name]: data?.data,
      });
    },
  });
  return (
    <RequestContext.Provider value={{ ...result, field }}>
      <FormContext.Provider value={form}>
        <SchemaContext.Provider value={fieldSchema}>
          <FieldContext.Provider value={f}>{children}</FieldContext.Provider>
        </SchemaContext.Provider>
      </FormContext.Provider>
    </RequestContext.Provider>
  );
};

const usePaginationProps = (props: TableProps<any> & { request?: any }): TablePaginationConfig | false => {
  const result = useContext(RequestContext);
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
      result.run({ ...result.params[0], page, pageSize });
    },
  };
};

const InternalTable = (props) => {
  const result = useContext(RequestContext);
  return <ArrayTable {...props} loading={result.loading} pagination={usePaginationProps(props)} />;
};

export const VoidTable: VoidTableType = observer((props) => {
  console.log('props.request', props.request);
  return (
    <ArrayFieldProvider request={props.request} initialValue={props.dataSource}>
      <InternalTable {...props} />
    </ArrayFieldProvider>
  );
});

VoidTable.mixin = ArrayTable.mixin;

ArrayTable.mixin(VoidTable);
