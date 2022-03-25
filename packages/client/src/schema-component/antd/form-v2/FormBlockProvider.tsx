import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useMemo } from 'react';
import { BlockProvider, useBlockResource, useResourceAction } from '../../../block-provider';

export const FormBlockContext = createContext<any>({});

const InternalFormBlockProvider = (props) => {
  const field = useField();
  const resource = useBlockResource();
  const form = useMemo(() => createForm(), []);
  const service = useResourceAction(
    { ...props, resource },
    {
      onSuccess(data) {
        form.setInitialValues(data?.data);
      },
    },
  );
  if (service.loading) {
    return <Spin />;
  }
  return (
    <FormBlockContext.Provider
      value={{
        form,
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
  return {
    form: ctx.form,
  };
};
