import { createForm, onFormValuesChange } from '@formily/core';
import { useField } from '@formily/react';
import { autorun } from '@formily/reactive';
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

  // 当使用数据模板时，会 formBlockCtx.form.values 会被整体赋值，这时候需要同步到 form.values
  useEffect(() => {
    const dispose = autorun(() => {
      form.values = formBlockCtx?.form?.values[fieldName] || form.values;
    });

    return dispose;
  }, []);

  const { resource, service } = useBlockRequestContext();
  if (service.loading) {
    return <Spin />;
  }

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
};

export const WithoutFormFieldResource = createContext(null);

export const FormFieldProvider = (props) => {
  return (
    <WithoutFormFieldResource.Provider value={false}>
      <BlockProvider block={'FormField'} {...props}>
        <InternalFormFieldProvider {...props} />
      </BlockProvider>
    </WithoutFormFieldResource.Provider>
  );
};

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
};
