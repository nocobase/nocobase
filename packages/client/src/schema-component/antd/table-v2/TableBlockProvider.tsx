import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import React, { createContext, useContext, useEffect } from 'react';
import { BlockProvider, useBlockResource, useResourceAction } from '../../../block-provider';

export const TableBlockContext = createContext<any>({});

const InternalTableBlockProvider = (props) => {
  const { params = {}, showIndex, dragSort } = props;
  const field = useField();
  const resource = useBlockResource();
  const service = useResourceAction({ ...props, resource });
  // if (service.loading) {
  //   return <Spin />;
  // }
  return (
    <TableBlockContext.Provider
      value={{
        field,
        service,
        resource,
        params,
        showIndex,
        dragSort,
      }}
    >
      {props.children}
    </TableBlockContext.Provider>
  );
};

export const TableBlockProvider = (props) => {
  return (
    <BlockProvider {...props}>
      <InternalTableBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useTableBlockContext = () => {
  return useContext(TableBlockContext);
};

export const useTableBlockProps = () => {
  const field = useField<ArrayField>();
  const ctx = useTableBlockContext();
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = ctx?.service?.data?.data;
      field.data = field.data || {};
      field.data.selectedRowKeys = ctx?.field?.data?.selectedRowKeys;
      field.componentProps.pagination = field.componentProps.pagination || {};
      field.componentProps.pagination.pageSize = ctx?.service?.data?.meta?.pageSize;
      field.componentProps.pagination.total = ctx?.service?.data?.meta?.count;
      field.componentProps.pagination.current = ctx?.service?.data?.meta?.page;
    }
    field.loading = ctx?.service?.loading;
  }, [ctx?.service?.loading]);
  return {
    showIndex: ctx.showIndex,
    dragSort: ctx.dragSort,
    pagination:
      ctx?.params?.paginate !== false
        ? {
            defaultCurrent: ctx?.params?.page || 1,
            defaultPageSize: ctx?.params?.pageSize,
          }
        : false,
    onRowSelectionChange(selectedRowKeys) {
      ctx.field.data = ctx?.field?.data || {};
      ctx.field.data.selectedRowKeys = selectedRowKeys;
    },
    onChange({ current, pageSize }) {
      ctx.service.run({ page: current, pageSize });
    },
  };
};
