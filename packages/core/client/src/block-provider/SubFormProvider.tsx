import { createForm, onFormValuesChange } from '@formily/core';
import { useField, useForm, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { RecordProvider } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useFormBlockContext } from './FormBlockProvider';
import { useCollectionManager, useCollection } from '../collection-manager';
import { isArray } from 'lodash';

export const SubFormContext = createContext<any>({});

const InternalSubFormProvider = (props) => {
  const { action, readPretty, fieldName } = props;
  const formBlockCtx = useFormBlockContext();

  if (!formBlockCtx?.updateAssociationValues?.includes(fieldName)) {
    formBlockCtx?.updateAssociationValues?.push(fieldName);
  }
  const field = useField();
  const parentForm = useForm();
  const { getCollectionField } = useCollectionManager();
  const collectionField = getCollectionField(props.association);
  const form = useMemo(
    () =>
      createForm({
        effects() {
          onFormValuesChange((form) => {
            if (['oho', 'obo'].includes(collectionField.interface)) {
              parentForm.setValuesIn(fieldName, form.values);
              formBlockCtx?.form?.setValuesIn(fieldName, form.values);
            } else {
              console.log(parentForm.values)
              console.log(form.values)
              // const fieldValue = parentForm.values[fieldName];
              // const values = isArray(fieldValue) ? fieldValue : [fieldValue];
              // values.push(form.values);
              // console.log(values);
              // parentForm.setValuesIn(fieldName, values);
            }
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
