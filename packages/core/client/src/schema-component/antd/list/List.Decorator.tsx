import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { BlockProvider, useBlockRequestContext } from '../../../block-provider';
import { useRecord } from '../../../record-provider';

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

export const useListItemProps = () => {
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
