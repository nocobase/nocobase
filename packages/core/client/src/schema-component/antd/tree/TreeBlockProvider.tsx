import { ArrayField, createForm } from '@formily/core';
import { FormContext, useField } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { BlockProvider, useBlockRequestContext } from '../../../block-provider';

export const TreeBlockContext = createContext<any>({});

const InternalTreeBlockProvider = (props) => {
  const { params, fieldNames } = props;
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  if (service.loading) {
    return <Spin />;
  }
  return (
    <TreeBlockContext.Provider
      value={{
        field,
        service,
        resource,
        params,
        fieldNames,
      }}
    >
      {props.children}
    </TreeBlockContext.Provider>
  );
};

export const TreeBlockProvider = (props) => {
  const params = { ...props.params };
  const form = useMemo(() => createForm(), []);

  return (
    <FormContext.Provider value={form}>
      <BlockProvider {...props} params={params}>
        <InternalTreeBlockProvider {...props} params={params} />
      </BlockProvider>
    </FormContext.Provider>
  );
};

export const useTreeBlockContext = () => {
  return useContext(TreeBlockContext);
};

export const useTreeBlockProps = () => {
  const field = useField<ArrayField>();
  const ctx = useTreeBlockContext();
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = ctx?.service?.data?.data;
      field.data = field.data || {};
      field.data.selectedRowKeys = ctx?.field?.data?.selectedRowKeys;
    }
  }, [ctx?.service?.loading]);
  return {
    fieldNames: ctx.fieldNames,
  };
};
