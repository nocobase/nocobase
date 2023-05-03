import { createForm } from '@formily/core';
import { FormContext, useField, useFieldSchema, useForm } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BlockProvider, useBlockRequestContext } from '../../../block-provider';
import { useRecord } from '../../../record-provider';
import { FormV2 } from '../form-v2';
import { FormLayout } from '@formily/antd';

export const ListBlockContext = createContext<any>({});

const InternalListBlockProvider = (props) => {
  const { resource, service } = useBlockRequestContext();
  const form = useForm();
  useEffect(() => {
    if (!service?.loading) {
      form.setValuesIn('list', service?.data?.data);
    }
  }, [service?.data?.data, service?.loading]);

  return (
    <ListBlockContext.Provider
      value={{
        service,
        resource,
      }}
    >
      <FormLayout layout={'vertical'}>{props.children}</FormLayout>
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
  return {};
};
