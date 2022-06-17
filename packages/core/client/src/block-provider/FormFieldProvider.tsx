import { createForm, onFieldReact, onFormInputChange, onFormValuesChange } from '@formily/core';
import { ArrayField, Field, ObjectField } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { APIClient } from '../api-client';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useFormBlockContext } from './FormBlockProvider';

export const FormFieldContext = createContext<any>({});

const InternalFormFieldProvider = (props) => {
  const { action, readPretty, fieldName } = props;
  const formBlockCtx = useFormBlockContext();
  
  if (!formBlockCtx.updateAssociationValues.includes(fieldName)) {
    formBlockCtx.updateAssociationValues.push(fieldName);
  }
  
  const field = useField();
  const fieldSchema = useFieldSchema();
  console.log('InternalFormFieldProvider', field, fieldSchema);

  const form = useMemo(
    () =>
      createForm({
        effects() {
          onFormValuesChange((form) => {
            console.log('onFormValuesChange', form.values, formBlockCtx.form.values, props, fieldName);
            formBlockCtx.form.setValuesIn(fieldName, form.values);
            console.log('onFormValuesChange1', form.values, formBlockCtx.form.values, props);
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
  console.log('InternalFormFieldProvider', field, props);

  return (
    <FormFieldContext.Provider
      value={{
        action,
        form,
        field,
        service,
        resource,
      }}
    >
      {props.children}
    </FormFieldContext.Provider>
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
  // const field = useField<ObjectField>();
  const ctx = useFormFieldContext();

  let values = ctx.service?.data?.data;
  // const association = fieldSchema['x-component-props']?.['target'];
  // if (association) {
  //   values = values[association];
  // }
  console.log('useFormFieldProps', values, ctx);
  useEffect(() => {
    ctx.form.setInitialValues(values);
  }, []);
  return {
    form: ctx.form,
  };

}