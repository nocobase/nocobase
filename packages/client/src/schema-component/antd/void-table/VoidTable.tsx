import { createForm } from '@formily/core';
import { FieldContext, FormContext, observer, useField, useFieldSchema } from '@formily/react';
import { Options, Result } from 'ahooks/lib/useRequest/src/types';
import { TablePaginationConfig, TableProps } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useMemo } from 'react';
import { AsyncDataProvider, useRequest } from '../../../';
import { useAttach } from '../../hooks';
import { ArrayTable } from '../array-table';

type VoidTableProps = TableProps<any> & {
  request?: any;
  useDataSource?: (data?: any, options?: Options<any, any> & { uid?: string }) => Result<any, any>;
};

type VoidTableType = React.FC<VoidTableProps> & {
  Column?: React.FC<any>;
  mixin?: (T: any) => void;
};

const usePaginationProps = (props: TableProps<any> & { request?: any }, service): TablePaginationConfig | false => {
  if (props.pagination === false) {
    return false;
  }
  const pagination: TablePaginationConfig = props.pagination || {};
  if (props?.request?.params?.pageSize) {
    pagination.defaultPageSize = props?.request?.params?.pageSize;
  }
  return {
    showSizeChanger: true,
    ...pagination,
    onChange(page, pageSize) {
      service?.run({ ...service?.params?.[0], page, pageSize });
    },
  };
};

const useRequestProps = (props) => {
  const { request, pagination, dataSource } = props;
  if (request) {
    if (pagination === false) {
      return request;
    }
    const params = cloneDeep(request.params || {});
    if (!params.page) {
      params.page = pagination?.current || pagination?.defaultCurrent || 1;
    }
    if (!params.pageSize) {
      params.pageSize = pagination?.pageSize || pagination?.defaultPageSize || 10;
    }
    request.params = params;
    return request;
  }
  return (params: any = {}) => {
    const { page = 1, pageSize = 10 } = params;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;
    return Promise.resolve({
      data: pagination === false ? dataSource : dataSource?.slice(startIndex, endIndex + 1),
      meta: {
        page,
        pageSize,
        count: dataSource?.length || 0,
      },
    });
  };
};

const useDefDataSource = (props, options) => {
  return useRequest(useRequestProps(props), options);
};

export const VoidTable: VoidTableType = observer((props) => {
  const { useDataSource = useDefDataSource } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  const form = useMemo(() => createForm(), []);
  const f = useAttach(form.createArrayField({ ...field.props, basePath: '' }));
  const result = useDataSource(props, {
    uid: fieldSchema['x-uid'],
    onSuccess(data) {
      form.setValues({
        [fieldSchema.name]: data?.data,
      });
      if (field?.componentProps?.pagination === false) {
        return;
      }
      field.componentProps.pagination = field.componentProps.pagination || {};
      if (data?.meta?.count) {
        field.componentProps.pagination.total = data?.meta?.count;
      }
      field.componentProps.pagination.current = data?.meta?.page || 1;
      field.componentProps.pagination.pageSize = data?.meta?.pageSize || 10;
    },
  });
  return (
    <AsyncDataProvider value={result}>
      <FormContext.Provider value={form}>
        <FieldContext.Provider value={f}>
          <ArrayTable {...props} loading={result?.loading} pagination={usePaginationProps(props, result)} />
        </FieldContext.Provider>
      </FormContext.Provider>
    </AsyncDataProvider>
  );
});

VoidTable.mixin = ArrayTable.mixin;

ArrayTable.mixin(VoidTable);
