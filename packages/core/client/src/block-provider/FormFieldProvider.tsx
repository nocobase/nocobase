import { createForm, onFieldReact, onFormInputChange, onFormValuesChange } from '@formily/core';
import { ArrayField, Field, ObjectField } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { RecordProvider } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useFormBlockContext } from './FormBlockProvider';

export const FormFieldContext = createContext<any>({});

const InternalFormFieldProvider = (props) => {
  const { action, readPretty, fieldName } = props;
  const formBlockCtx = useFormBlockContext();
  
  if (!formBlockCtx?.updateAssociationValues?.includes(fieldName)) {
    formBlockCtx?.updateAssociationValues?.push(fieldName);
  }
  
  const field = useField();

  const form = useMemo(
    () =>
      createForm({
        effects() {
          onFormValuesChange((form) => {
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

  console.log('InternalFormFieldProvider', fieldName);

  return (
    <RecordProvider record={service?.data?.data}>
      <FormFieldContext.Provider
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
      </FormFieldContext.Provider>
    </RecordProvider>
    
  );
}

export const WithoutFormFieldResource = createContext(null);

export const FormFieldProvider = (props) => {
  console.log('FormFieldProvider', props);
  return (
    <WithoutFormFieldResource.Provider value={false}>
      <BlockProvider block={'FormField'} {...props}>
        <InternalFormFieldProvider {...props} />
      </BlockProvider>
    </WithoutFormFieldResource.Provider>
  )
}

export const useFormFieldContext = () => {
  return useContext(FormFieldContext);
};

export const useFormFieldProps = () => {
  const ctx = useFormFieldContext();
  useEffect(() => {
    ctx?.form?.setInitialValues(ctx.service?.data?.data);
  }, []);
  return {
    form: ctx.form,
  };

}