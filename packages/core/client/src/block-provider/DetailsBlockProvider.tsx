import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { RecordProvider } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';

export const DetailsBlockContext = createContext<any>({});

const InternalDetailsBlockProvider = (props) => {
  const { action, readPretty } = props;
  const field = useField<any>();
  const form = useMemo(
    () =>
      createForm({
        readPretty,
      }),
    [],
  );
  const { resource, service } = useBlockRequestContext();
  if (service.loading && !field.loaded) {
    return <Spin />;
  }
  field.loaded = true;
  return (
    <DetailsBlockContext.Provider
      value={{
        action,
        form,
        field,
        service,
        resource,
      }}
    >
      <RecordProvider record={service?.data?.data?.[0] || {}}>{props.children}</RecordProvider>
    </DetailsBlockContext.Provider>
  );
};

export const DetailsBlockProvider = (props) => {
  return (
    <BlockProvider data-testid="details-block" {...props}>
      <InternalDetailsBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useDetailsBlockContext = () => {
  return useContext(DetailsBlockContext);
};

export const useDetailsBlockProps = () => {
  const ctx = useDetailsBlockContext();
  useEffect(() => {
    if (!ctx.service.loading) {
      ctx.form.reset().then(() => {
        ctx.form.setValues(ctx.service?.data?.data?.[0] || {});
      });
    }
  }, [ctx.service.loading]);
  return {
    form: ctx.form,
  };
};
