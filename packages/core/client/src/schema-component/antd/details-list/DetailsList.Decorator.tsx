import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import { BlockProvider, useBlockRequestContext, useRecord } from '@nocobase/client';
import React, { createContext, useContext, useEffect, useMemo } from 'react';

export const DetailsListBlockContext = createContext<any>({});

const InternalDetailsListBlockProvider = (props) => {
  const field = useField<any>();
  const { resource, service } = useBlockRequestContext();
  return (
    <DetailsListBlockContext.Provider
      value={{
        field,
        service,
        resource,
      }}
    >
      {props.children}
    </DetailsListBlockContext.Provider>
  );
};

export const DetailsListBlockProvider = (props) => {
  return (
    <BlockProvider {...props}>
      <InternalDetailsListBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useDetailsListBlockContext = () => {
  return useContext(DetailsListBlockContext);
};

export const useDetailsListItemProps = () => {
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
