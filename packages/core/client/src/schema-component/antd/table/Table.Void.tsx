import { createForm, Field } from '@formily/core';
import { FieldContext, FormContext, observer, useField, useFieldSchema } from '@formily/react';
import { Options, Result } from 'ahooks/lib/useRequest/src/types';
import { TablePaginationConfig, TableProps } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useMemo } from 'react';
import { AsyncDataProvider, useAsyncData, useRequest } from '../../../';
import { useAttach } from '../../hooks';
import { TableArray } from './Table.Array';

type TableVoidProps = TableProps<any> & {
  request?: any;
  useSelectedRowKeys?: any;
  useDataSource?: (
    options?: Options<any, any> & { uid?: string },
    props?: any,
  ) => Result<any, any> & { state?: any; setState?: any };
};

const usePaginationProps = (props: TableProps<any> & { request?: any }, service): TablePaginationConfig | false => {
  if (props.pagination === false) {
    return false;
  }
  const pagination: TablePaginationConfig = props.pagination || {};
  if (props?.request?.params?.pageSize) {
    pagination.defaultPageSize = props?.request?.params?.pageSize;
  }
  if (!pagination.total && service?.data?.meta) {
    const { count, page, pageSize } = service.data.meta;
    pagination.total = count;
    pagination.current = page;
    pagination.pageSize = pageSize;
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

const useDef = (options, props) => {
  return useRequest(useRequestProps(props), options);
};

const useDefSelectedRowKeys = () => {
  const result = useAsyncData();
  return [result?.state?.selectedRowKeys, (selectedRowKeys) => result?.setState?.({ selectedRowKeys })];
};

export const TableVoid: React.FC<TableVoidProps> = observer((props) => {
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
    },
    props,
  );
  return (
    <AsyncDataProvider value={result}>
      <FormContext.Provider value={form}>
        <FieldContext.Provider value={f}>
          <TableArray
            {...props}
            rowKey={rowKey}
            useSelectedRowKeys={useSelectedRowKeys}
            loading={result?.loading}
            pagination={usePaginationProps(props, result)}
          />
        </FieldContext.Provider>
      </FormContext.Provider>
    </AsyncDataProvider>
  );
});
