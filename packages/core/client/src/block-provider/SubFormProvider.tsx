import { createForm, onFormValuesChange } from '@formily/core';
import { useField } from '@formily/react';
import { autorun } from '@formily/reactive';
import { forEach } from '@nocobase/utils/client';
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
      const data = formBlockCtx?.form?.values[fieldName] || {};
      // 先清空表单值，再赋值，避免当值为空时，表单未被清空
      form.reset();
      forEach(data, (value, key) => {
        if (value) {
          form.values[key] = value;
        }
      });
    });

    return dispose;
  }, []);

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
