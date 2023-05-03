import { createForm } from '@formily/core';
import { useField, useForm } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BlockProvider, useBlockRequestContext } from '../../../block-provider';
import { useRecord } from '../../../record-provider';
import { FormLayout } from '@formily/antd';

export const CardListBlockContext = createContext<any>({});

const InternalCardListBlockProvider = (props) => {
  const { resource, service } = useBlockRequestContext();
  const form = useForm();

  useEffect(() => {
    if (!service?.loading) {
      form.setValuesIn('list', service?.data?.data);
    }
  }, [service?.data?.data, service?.loading]);

  return (
    <CardListBlockContext.Provider
      value={{
        service,
        resource,
        columnCount: props.columnCount,
      }}
    >
      <FormLayout layout={'vertical'}>{props.children}</FormLayout>
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
  return {};
};
