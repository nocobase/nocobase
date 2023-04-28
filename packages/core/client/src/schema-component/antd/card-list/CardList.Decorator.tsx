import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BlockProvider, useBlockRequestContext } from '../../../block-provider';
import { useRecord } from '../../../record-provider';

export const CardListBlockContext = createContext<any>({});

const InternalCardListBlockProvider = (props) => {
  const field = useField<any>();
  const { resource, service } = useBlockRequestContext();
  return (
    <CardListBlockContext.Provider
      value={{
        field,
        service,
        resource,
        columnCount: props.columnCount,
      }}
    >
      {props.children}
    </CardListBlockContext.Provider>
  );
};

export const CardListBlockProvider = (props) => {
  return (
    <BlockProvider {...props}>
      <InternalCardListBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useCardListBlockContext = () => {
  return useContext(CardListBlockContext);
};

export const useCardListItemProps = () => {
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
