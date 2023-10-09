import { createForm } from '@formily/core';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import { isEmpty } from 'lodash';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useCollection } from '../collection-manager';
import { RecordProvider, useRecord } from '../record-provider';
import { useActionContext, useDesignable } from '../schema-component';
import { Templates as DataTemplateSelect } from '../schema-component/antd/form-v2/Templates';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { FormActiveFieldsProvider } from './hooks';

export const FormBlockContext = createContext<any>({});

const InternalFormBlockProvider = (props) => {
  const { action, readPretty, params, association } = props;
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
  const record = useRecord();
  if (service.loading && Object.keys(form?.initialValues)?.length === 0 && action) {
    return <Spin />;
  }

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
      {association ? associationBlock() : normalBlock()}
    </FormBlockContext.Provider>
  );

  function normalBlock(): React.ReactNode {
    return readPretty ? (
      <RecordProvider parent={isEmpty(record?.__parent) ? record : record?.__parent} record={service?.data?.data}>
        <div ref={formBlockRef}>
          <RenderChildrenWithDataTemplates form={form} />
        </div>
      </RecordProvider>
    ) : (
      <div ref={formBlockRef}>
        <RenderChildrenWithDataTemplates form={form} />
      </div>
    );
  }

  // 这里的 Form 区块是新增区块，所以其字段是可以设置默认值的。又因为是否可以设置默认值是由 record 是否为空来决定的，
  // 所以在这里需要将 record 设置为空，这样就可以设置默认值了。相关代码：https://github.com/nocobase/nocobase/blob/fa3127e467bcb3a2425eedfb06fc110cc6eb7f1e/packages/core/client/src/schema-settings/hooks/useIsAllowToSetDefaultValue.tsx#L117-L122
  //
  // 如何添加关系区块的 Form 区块：
  // 1. 点击 Table 行的查看按钮；
  // 2. 弹出的 Drawer 中可以添加关系区块；
  // 3. 选择对多字段，点击 Form 区块；
  function associationBlock(): React.ReactNode {
    return readPretty ? (
      <RecordProvider parent={isEmpty(record?.__parent) ? record : record?.__parent} record={service?.data?.data}>
        <div ref={formBlockRef}>
          <RenderChildrenWithDataTemplates form={form} />
        </div>
      </RecordProvider>
    ) : (
      <RecordProvider parent={isEmpty(record?.__parent) ? record : record?.__parent} record={{}}>
        <div ref={formBlockRef}>
          <RenderChildrenWithDataTemplates form={form} />
        </div>
      </RecordProvider>
    );
  }
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
  const { collection, isCusomeizeCreate } = props;
  const { __collection } = record;
  const currentCollection = useCollection();
  const { designable } = useDesignable();
  const isEmptyRecord = useIsEmptyRecord();
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
    (detailFlag || createFlag || isCusomeizeCreate) && (
      <BlockProvider data-testid={props['data-testid'] || 'form-block'} {...props} block={'form'}>
        <FormActiveFieldsProvider name="form">
          <InternalFormBlockProvider {...props} />
        </FormActiveFieldsProvider>
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
