import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useMemo } from 'react';
import { BlockProvider, ResourceContext, useResourceAction } from './BlockProvider';

export const FormBlockContext = createContext<any>({});

const InternalFormBlockProvider = (props) => {
  const field = useField();
  const resource = useContext(ResourceContext);
  const service = useResourceAction({ ...props, resource });
  if (service.loading) {
    return <Spin />;
  }
  return (
    <FormBlockContext.Provider
      value={{
        field,
        service,
        resource,
      }}
    >
      {props.children}
    </FormBlockContext.Provider>
  );
};

export const FormBlockProvider = (props) => {
  return (
    <BlockProvider {...props}>
      <InternalFormBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useFormBlockContext = () => {
  return useContext(FormBlockContext);
};

export const useFormBlockProps = () => {
  const ctx = useFormBlockContext();
  const form = useMemo(
    () =>
      createForm({
        initialValues: ctx?.service?.data?.data,
      }),
    [],
  );
  return {
    form,
  };
};
