import { createForm } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { RecordProvider } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useDesignable } from '../schema-component';
import { findParent } from './hooks';

export const FormBlockContext = createContext<any>({});

const InternalFormBlockProvider = (props) => {
  const { action, readPretty } = props;
  const field = useField();
  const form = useMemo(
    () =>
      createForm({
        readPretty,
      }),
    [],
  );
  const { resource, service } = useBlockRequestContext();
  const formBlockRef = useRef();
  if (service.loading) {
    return <Spin />;
  }
  return (
    <FormBlockContext.Provider
      value={{
        action,
        form,
        field,
        service,
        resource,
        updateAssociationValues: [],
        formBlockRef,
      }}
    >
      {readPretty ? (
        <RecordProvider record={service?.data?.data}>
          <div ref={formBlockRef}>{props.children}</div>
        </RecordProvider>
      ) : (
        <div ref={formBlockRef}>{props.children}</div>
      )}
    </FormBlockContext.Provider>
  );
};

export const FormBlockProvider = (props) => {
  const { designable } = useDesignable();
  console.log(designable);
  const fieldSchema = useFieldSchema();
  if (!designable) {
    const targetParentSchema = findParent(fieldSchema);
    targetParentSchema['x-hidden'] = true;
    console.log(targetParentSchema);
  }
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
  useEffect(() => {
    ctx.form.setInitialValues(ctx.service?.data?.data);
  }, []);
  return {
    form: ctx.form,
  };
};
