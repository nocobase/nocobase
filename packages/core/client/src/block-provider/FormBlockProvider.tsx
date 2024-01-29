import { createForm } from '@formily/core';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import _, { isEmpty } from 'lodash';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useDataBlockPropsV2, useDataBlockRequestV2, useDataBlockResourceV2, useRecordV2 } from '../application';
import { withDynamicSchemaProps } from '../application/hoc';
import { useCollection } from '../collection-manager';
import { RecordProvider, useRecord } from '../record-provider';
import { useActionContext, useDesignable } from '../schema-component';
import { Templates as DataTemplateSelect } from '../schema-component/antd/form-v2/Templates';
import { BlockProvider, BlockProviderV2, useBlockRequestContext, useFilterByTk } from './BlockProvider';
import { TemplateBlockProvider } from './TemplateBlockProvider';
import { FormActiveFieldsProvider } from './hooks';
import { useCommonParamsOfBlock } from './hooks/useCommonParamsOfBlock';

export const FormBlockContext = createContext<any>({});

const InternalFormBlockProvider = (props) => {
  const ctx = useFormBlockContext();
  const { action, readPretty, params, association, collection } = props;
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
  const formBlockValue = useMemo(() => {
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
    };
  }, [action, field, form, params, resource, service, updateAssociationValues]);

  if (service.loading && Object.keys(form?.initialValues)?.length === 0 && action) {
    return <Spin />;
  }
  let content = (
    <div ref={formBlockRef}>
      <RenderChildrenWithDataTemplates form={form} />
    </div>
  );
  if (readPretty) {
    content = (
      <RecordProvider parent={isEmpty(record?.__parent) ? record : record?.__parent} record={service?.data?.data}>
        {content}
      </RecordProvider>
    );
  } else if (
    formBlockValue.type === 'create' &&
    // 关系表单区块的 record 应该是空的，因为其是一个创建数据的表单；
    !_.isEmpty(_.omit(record, ['__parent', '__collectionName'])) &&
    // association 不为空，说明是关系区块
    association
  ) {
    content = (
      <RecordProvider parent={record} record={{}}>
        {content}
      </RecordProvider>
    );
  }

  return <FormBlockContext.Provider value={formBlockValue}>{content}</FormBlockContext.Provider>;
};

const InternalFormBlockProviderV2 = (props) => {
  const { action, readPretty, params, collection } = props;
  const ctx = useFormBlockContext();
  const field = useField();
  const form = useMemo(
    () =>
      createForm({
        readPretty,
      }),
    [readPretty],
  );
  const service = useDataBlockRequestV2();
  const resource = useDataBlockResourceV2();
  const { updateAssociationValues } = useDataBlockPropsV2();
  const formBlockRef = useRef();
  const formBlockValue = useMemo(() => {
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
    };
  }, [action, collection, ctx, field, form, params, resource, service, updateAssociationValues]);

  if (service.loading && Object.keys(form?.initialValues)?.length === 0 && action) {
    return <Spin />;
  }

  return (
    <FormBlockContext.Provider value={formBlockValue}>
      <div ref={formBlockRef}>
        <RenderChildrenWithDataTemplates form={form} />
      </div>
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

export const FormBlockProvider = (props) => {
  const record = useRecord();
  const { collection, isCusomeizeCreate } = props;
  const { __collection } = record;
  const currentCollection = useCollection();
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
      <BlockProvider name={props.name || 'form'} {...props} block={'form'}>
        <FormActiveFieldsProvider name="form">
          <InternalFormBlockProvider {...props} />
        </FormActiveFieldsProvider>
      </BlockProvider>
    </TemplateBlockProvider>
  );
};

export const FormBlockProviderV2 = withDynamicSchemaProps((props) => {
  return (
    <BlockProviderV2 {...props} blockType="form">
      <TemplateBlockProvider>
        <FormActiveFieldsProvider name="form">
          <InternalFormBlockProviderV2 {...props} />
        </FormActiveFieldsProvider>
      </TemplateBlockProvider>
    </BlockProviderV2>
  );
});

export const useFormBlockContext = () => {
  return useContext(FormBlockContext);
};

export const useFormBlockProps = () => {
  const ctx = useFormBlockContext();
  const recordV2 = useRecordV2();
  const { fieldSchema } = useActionContext();
  const addChild = fieldSchema?.['x-component-props']?.addChild;
  useEffect(() => {
    if (addChild) {
      ctx.form?.query('parent').take((field) => {
        field.disabled = true;
        field.value = new Proxy({ ...recordV2?.parentRecord?.data }, {});
      });
    }
  });

  useEffect(() => {
    if (ctx.service?.data?.data) {
      ctx.form?.setInitialValues(ctx.service.data.data);
    }
  }, [ctx.service?.data?.data]);
  return {
    form: ctx.form,
  };
};

export const useFormDataBlockProps = (props: any = {}) => {
  const filterByTk = useFilterByTk({ association: props?.association });
  const { params, updateAssociationValues } = useCommonParamsOfBlock(props);

  return {
    params,
    updateAssociationValues,
    filterByTk,
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
