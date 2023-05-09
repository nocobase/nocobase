import { createForm } from '@formily/core';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { isEmpty } from 'lodash';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useCollection } from '../collection-manager';
import { RecordProvider, useRecord } from '../record-provider';
import { useActionContext, useDesignable } from '../schema-component';
import { Templates as DataTemplateSelect } from '../schema-component/antd/form-v2/Templates';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useAssociationNames } from './hooks';

export const FormBlockContext = createContext<any>({});

const InternalFormBlockProvider = (props) => {
  const { action, readPretty, params, updateAssociationValues } = props;
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
  const record = useRecord();
  // if (service.loading) {
  //   return <Spin />;
  // }
  return (
    <FormBlockContext.Provider
      value={{
        params,
        action,
        form,
        field,
        service,
        resource,
        updateAssociationValues,
        formBlockRef,
      }}
    >
      {readPretty ? (
        <RecordProvider parent={isEmpty(record?.__parent) ? record : record?.__parent} record={service?.data?.data}>
          <div ref={formBlockRef}>
            <RenderChildrenWithDataTemplates form={form} />
          </div>
        </RecordProvider>
      ) : (
        <div ref={formBlockRef}>
          <RenderChildrenWithDataTemplates form={form} />
        </div>
      )}
    </FormBlockContext.Provider>
  );
};

export const useIsEmptyRecord = () => {
  const record = useRecord();
  const keys = Object.keys(record);
  if (keys.includes('__parent')) {
    return keys.length > 1;
  }
  return keys.length > 0;
};

export const FormBlockProvider = (props) => {
  const record = useRecord();
  const { collection } = props;
  const { __collection } = record;
  const params = { ...props.params };
  const currentCollection = useCollection();
  const { designable } = useDesignable();
  const isEmptyRecord = useIsEmptyRecord();
  const { appends, updateAssociationValues } = useAssociationNames(collection);
  if (!Object.keys(params).includes('appends')) {
    params['appends'] = appends;
  }
  let detailFlag = false;
  if (isEmptyRecord) {
    detailFlag = true;
    if (!designable && __collection) {
      detailFlag = __collection === collection;
    }
  }
  const createFlag =
    (currentCollection.name === (collection?.name || collection) && !isEmptyRecord) || !currentCollection.name;
  return (
    (detailFlag || createFlag) && (
      <BlockProvider {...props} block={'form'} params={params}>
        <InternalFormBlockProvider {...props} params={params} updateAssociationValues={updateAssociationValues} />
      </BlockProvider>
    )
  );
};

export const useFormBlockContext = () => {
  return useContext(FormBlockContext);
};

export const useFormBlockProps = () => {
  const ctx = useFormBlockContext();
  const record = useRecord();
  const { fieldSchema } = useActionContext();
  const addChild = fieldSchema?.['x-component-props']?.addChild;
  useEffect(() => {
    if (addChild) {
      ctx.form?.query('parent').take((field) => {
        field.disabled = true;
        field.value = new Proxy({ ...record }, {});
      });
    }
  });

  useEffect(() => {
    if (!ctx?.service?.loading) {
      ctx.form?.setInitialValues(ctx.service?.data?.data);
    }
  }, [ctx?.service?.loading]);
  return {
    form: ctx.form,
  };
};

const RenderChildrenWithDataTemplates = ({ form }) => {
  const FieldSchema = useFieldSchema();
  const { findComponent } = useDesignable();
  const field = useField();
  const Component = findComponent(field.component?.[0]) || React.Fragment;

  return (
    <Component {...field.componentProps}>
      <DataTemplateSelect style={{ marginBottom: 18 }} form={form} />
      <RecursionField schema={FieldSchema} onlyRenderProperties />
    </Component>
  );
};

export const findFormBlock = (schema: Schema) => {
  while (schema) {
    if (schema['x-decorator'] === 'FormBlockProvider') {
      return schema;
    }
    schema = schema.parent;
  }
  return null;
};
