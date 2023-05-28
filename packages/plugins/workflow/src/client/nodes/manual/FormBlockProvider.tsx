import React, { useRef, useMemo } from 'react';
import { createForm } from '@formily/core';
import { useFieldSchema, useField, RecursionField } from '@formily/react';
import {
  CollectionProvider,
  FormBlockContext,
  FormV2,
  RecordProvider,
  useAssociationNames,
  useDesignable,
  useRecord,
} from '@nocobase/client';

export function FormBlockProvider(props) {
  const userJob = useRecord();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const formBlockRef = useRef(null);
  const { appends, updateAssociationValues } = useAssociationNames(props.collection);
  const [formKey] = Object.keys(fieldSchema.toJSON().properties ?? {});
  const values = userJob?.result?.[formKey];

  const { findComponent } = useDesignable();
  const Component = findComponent(field.component?.[0]) || React.Fragment;

  const form = useMemo(
    () =>
      createForm({
        initialValues: values,
      }),
    [values],
  );

  const params = {
    appends,
    ...props.params,
  };
  const service = {
    loading: false,
    data: {
      data: values,
    },
  };

  return (
    <CollectionProvider collection={props.collection}>
      <RecordProvider record={values} parent={false}>
        <FormBlockContext.Provider
          value={{
            params,
            form,
            field,
            service,
            updateAssociationValues,
            formBlockRef,
          }}
        >
          <Component {...field.componentProps}>
            <FormV2.Templates style={{ marginBottom: 18 }} form={form} />
            <div ref={formBlockRef}>
              <RecursionField schema={fieldSchema} onlyRenderProperties />
            </div>
          </Component>
        </FormBlockContext.Provider>
      </RecordProvider>
    </CollectionProvider>
  );
}
