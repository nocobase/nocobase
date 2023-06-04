import { createForm } from '@formily/core';
import { FormContext, useField } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { FormLayout } from '@formily/antd';
import { useAssociationNames } from '../../../block-provider/hooks';
import { BlockProvider, useBlockRequestContext } from '../../../block-provider';

export const ListBlockContext = createContext<any>({});

const InternalListBlockProvider = (props) => {
  const { resource, service } = useBlockRequestContext();

  const field = useField();
  const form = useMemo(() => {
    return createForm({
      readPretty: true,
    });
  }, []);

  useEffect(() => {
    if (!service?.loading) {
      form.setValuesIn(field.address.concat('list').toString(), service?.data?.data);
    }
  }, [service?.data?.data, service?.loading]);

  return (
    <ListBlockContext.Provider
      value={{
        service,
        resource,
      }}
    >
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'}>{props.children}</FormLayout>
      </FormContext.Provider>
    </ListBlockContext.Provider>
  );
};

export const ListBlockProvider = (props) => {
  const params = { ...props.params };
  const { collection } = props;
  const { appends } = useAssociationNames(collection);
  if (!Object.keys(params).includes('appends')) {
    params['appends'] = appends;
  }

  return (
    <BlockProvider {...props} params={params}>
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
