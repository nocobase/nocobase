import { createForm } from '@formily/core';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import {
  BlockRequestContext,
  CollectionProvider,
  FormActiveFieldsProvider,
  FormBlockContext,
  FormV2,
  RecordProvider,
  useAPIClient,
  useAssociationNames,
  useDesignable,
  useRecord,
} from '@nocobase/client';
import React, { useContext, useMemo, useRef } from 'react';

export function FormBlockProvider(props) {
  const userJob = useRecord();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const formBlockRef = useRef(null);
  const { getAssociationAppends } = useAssociationNames();
  const { appends, updateAssociationValues } = getAssociationAppends();
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

  const params = useMemo(() => {
    return {
      appends,
      ...props.params,
    };
  }, [appends, props.params]);
  const service = useMemo(() => {
    return {
      loading: false,
      data: {
        data: values,
      },
    };
  }, [values]);
  const api = useAPIClient();
  const resource = api.resource(props.collection);
  const __parent = useContext(BlockRequestContext);

  const formBlockValue = useMemo(() => {
    return {
      params,
      form,
      field,
      service,
      updateAssociationValues,
      formBlockRef,
    };
  }, [field, form, params, service, updateAssociationValues]);

  return !userJob.status || values ? (
    <CollectionProvider collection={props.collection}>
      <RecordProvider record={values} parent={false}>
        <FormActiveFieldsProvider name="form">
          <BlockRequestContext.Provider value={{ block: 'form', props, field, service, resource, __parent }}>
            <FormBlockContext.Provider value={formBlockValue}>
              <Component {...field.componentProps}>
                <FormV2.Templates style={{ marginBottom: 18 }} form={form} />
                <div ref={formBlockRef}>
                  <RecursionField schema={fieldSchema} onlyRenderProperties />
                </div>
              </Component>
            </FormBlockContext.Provider>
          </BlockRequestContext.Provider>
        </FormActiveFieldsProvider>
      </RecordProvider>
    </CollectionProvider>
  ) : null;
}
