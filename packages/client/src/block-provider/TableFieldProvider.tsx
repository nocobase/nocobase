import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import React, { createContext, useContext, useEffect } from 'react';
import { BlockProvider, useBlockResource, useResourceAction } from './BlockProvider';

export const TableFieldContext = createContext<any>({});

const InternalTableFieldProvider = (props) => {
  const { params = {}, showIndex, dragSort } = props;
  const field = useField();
  const resource = useBlockResource();
  const service = useResourceAction({ ...props, resource });
  // if (service.loading) {
  //   return <Spin />;
  // }
  return (
    <TableFieldContext.Provider
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
    </TableFieldContext.Provider>
  );
};

export const TableFieldProvider = (props) => {
  return (
    <BlockProvider {...props}>
      <InternalTableFieldProvider {...props} />
    </BlockProvider>
  );
};

export const useTableFieldContext = () => {
  return useContext(TableFieldContext);
};

export const useTableFieldProps = () => {
  const field = useField<ArrayField>();
  const ctx = useTableFieldContext();
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = ctx?.service?.data?.data;
      field.data = field.data || {};
      field.data.selectedRowKeys = ctx?.field?.data?.selectedRowKeys;
    }
  }, [ctx?.service?.loading]);
  return {
    loading: ctx?.service?.loading,
    showIndex: ctx.showIndex,
    dragSort: ctx.dragSort,
    pagination: false,
    onRowSelectionChange(selectedRowKeys) {
      ctx.field.data = ctx?.field?.data || {};
      ctx.field.data.selectedRowKeys = selectedRowKeys;
    },
    onChange({ current, pageSize }) {
      ctx.service.run({ page: current, pageSize });
    },
  };
};
