import { createForm } from '@formily/core';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useCollection_deprecated } from '../collection-manager';
import { CollectionRecord, useCollectionParentRecordData, useCollectionRecord } from '../data-source';
import { RecordProvider, useRecord } from '../record-provider';
import { useActionContext, useDesignable } from '../schema-component';
import { Templates as DataTemplateSelect } from '../schema-component/antd/form-v2/Templates';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { TemplateBlockProvider } from './TemplateBlockProvider';
import { FormActiveFieldsProvider } from './hooks/useFormActiveFields';
import { withDynamicSchemaProps } from '../application/hoc/withDynamicSchemaProps';

export const FormBlockContext = createContext<{
  form?: any;
  type?: 'update' | 'create';
  action?: string;
  field?: any;
  service?: any;
  resource?: any;
  updateAssociationValues?: any;
  formBlockRef?: any;
  collectionName?: string;
  params?: any;
  formRecord?: CollectionRecord;
  [key: string]: any;
}>({});
FormBlockContext.displayName = 'FormBlockContext';

const InternalFormBlockProvider = (props) => {
  const ctx = useFormBlockContext();
  const { action, readPretty, params, collection } = props;
  const field = useField();
  const form = useMemo(
    () =>
      createForm({
        readPretty,
      }),
    [readPretty],
  );
  const { resource, service, updateAssociationValues } = useBlockRequestContext();
  const formBlockRef = useRef();
  const record = useCollectionRecord();
  const formBlockValue: any = useMemo(() => {
    return {
      ...ctx,
      params,
      action,
      form,
      // update 表示是表单编辑区块，create 表示是表单新增区块
      type: action === 'get' ? 'update' : 'create',
      field,
      service,
      resource,
      updateAssociationValues,
      formBlockRef,
      collectionName: collection,
      formRecord: record,
    };
  }, [action, collection, ctx, field, form, params, record, resource, service, updateAssociationValues]);

  if (service.loading && Object.keys(form?.initialValues)?.length === 0 && action) {
    return <Spin />;
  }

  return (
    <FormBlockContext.Provider value={formBlockValue}>
      <RecordProvider isNew={record?.isNew} parent={record?.parentRecord?.data} record={record?.data}>
        <div ref={formBlockRef}>
          <RenderChildrenWithDataTemplates form={form} />
        </div>
      </RecordProvider>
    </FormBlockContext.Provider>
  );
};

/**
 * 获取表单区块的类型：update 表示是表单编辑区块，create 表示是表单新增区块
 * @returns
 */
export const useFormBlockType = () => {
  const ctx = useFormBlockContext() || {};
  return { type: ctx.type } as { type: 'update' | 'create' };
};

export const useIsDetailBlock = () => {
  const ctx = useFormBlockContext();
  const { fieldSchema } = useActionContext();
  return ctx.type !== 'create' && fieldSchema?.['x-acl-action'] !== 'create' && fieldSchema?.['x-action'] !== 'create';
};

export const FormBlockProvider = withDynamicSchemaProps((props) => {
  const record = useRecord();
  const parentRecordData = useCollectionParentRecordData();
  const { collection, isCusomeizeCreate } = props;
  const { __collection } = record;
  const currentCollection = useCollection_deprecated();
  const { designable } = useDesignable();
  const isDetailBlock = useIsDetailBlock();
  let detailFlag = false;
  if (isDetailBlock) {
    detailFlag = true;
    if (!designable && __collection) {
      detailFlag = __collection === collection;
    }
  }
  const createFlag =
    (currentCollection.name === (collection?.name || collection) && !isDetailBlock) || !currentCollection.name;

  if (!detailFlag && !createFlag && !isCusomeizeCreate) {
    return null;
  }

  return (
    <TemplateBlockProvider>
      <BlockProvider name={props.name || 'form'} {...props} block={'form'} parentRecord={parentRecordData}>
        <FormActiveFieldsProvider name="form">
          <InternalFormBlockProvider {...props} />
        </FormActiveFieldsProvider>
      </BlockProvider>
    </TemplateBlockProvider>
  );
});

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
        field.value = new Proxy({ ...record?.__parent }, {});
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
