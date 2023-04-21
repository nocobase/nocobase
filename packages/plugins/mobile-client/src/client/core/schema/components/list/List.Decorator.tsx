import { createForm } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { BlockProvider, RecordProvider, useBlockRequestContext, useRecord } from '@nocobase/client';
import { ArrayField } from '@nocobase/database';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo } from 'react';

export const ListBlockContext = createContext<any>({});

const InternalListBlockProvider = (props) => {
  const field = useField<any>();
  const { resource, service } = useBlockRequestContext();
  return (
    <ListBlockContext.Provider
      value={{
        field,
        service,
        resource,
      }}
    >
      {props.children}
    </ListBlockContext.Provider>
  );
};

export const ListBlockProvider = (props) => {
  return (
    <BlockProvider {...props}>
      <InternalListBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useListBlockContext = () => {
  return useContext(ListBlockContext);
};

export const useListItemBlockProps = () => {
  const form = useMemo(
    () =>
      createForm({
        readPretty: true,
      }),
    [],
  );
  const record = useRecord();
  useEffect(() => {
    form.setValues(record);
  }, [form, record]);

  return {
    form,
    disabled: false,
  };
};

export const useListBlockProps = () => {
  return {};
};
