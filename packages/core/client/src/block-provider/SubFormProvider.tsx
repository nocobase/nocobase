import { createForm, onFormValuesChange } from '@formily/core';
import { useField, useForm } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { RecordProvider } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useFormBlockContext } from './FormBlockProvider';

export const SubFormContext = createContext<any>({});

const InternalSubFormProvider = (props) => {
  const { action, readPretty, fieldName } = props;
  const formBlockCtx = useFormBlockContext();

  if (!formBlockCtx?.updateAssociationValues?.includes(fieldName)) {
    formBlockCtx?.updateAssociationValues?.push(fieldName);
  }

  const field = useField();
  const parentForm = useForm();
  const form = useMemo(
    () =>
      createForm({
        effects() {
          onFormValuesChange((form) => {
            parentForm.setValuesIn(fieldName, form.values);
            formBlockCtx?.form?.setValuesIn(fieldName, form.values);
          });
        },
        readPretty,
      }),
    [],
  );

  const { resource, service } = useBlockRequestContext();
  if (service.loading) {
    return <Spin />;
  }

  return (
    <RecordProvider record={service?.data?.data}>
      <SubFormContext.Provider
        value={{
          action,
          form,
          field,
          service,
          resource,
          fieldName,
        }}
      >
        {props.children}
      </SubFormContext.Provider>
    </RecordProvider>
  );
};

export const WithoutSubFormResource = createContext(null);

export const SubFormProvider = (props) => {
  return (
    <WithoutSubFormResource.Provider value={false}>
      <BlockProvider block={'SubForm'} {...props}>
        <InternalSubFormProvider {...props} />
      </BlockProvider>
    </WithoutSubFormResource.Provider>
  );
};

export const useSubFormContext = () => {
  return useContext(SubFormContext);
};

export const useSubFormProps = () => {
  const ctx = useSubFormContext();
  useEffect(() => {
    ctx?.form?.setInitialValues(ctx.service?.data?.data);
  }, []);
  return {
    form: ctx.form,
  };
};
