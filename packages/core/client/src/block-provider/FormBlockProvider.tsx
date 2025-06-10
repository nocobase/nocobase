/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm, Form } from '@formily/core';
import { Schema, useField } from '@formily/react';
import { useUpdate } from 'ahooks';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import {
  CollectionRecord,
  useCollectionManager,
  useCollectionParentRecordData,
  useCollectionRecord,
  useCollectionRecordData,
} from '../data-source';
import { withDynamicSchemaProps } from '../hoc/withDynamicSchemaProps';
import { useTreeParentRecord } from '../modules/blocks/data-blocks/table/TreeRecordProvider';
import { RecordProvider } from '../record-provider';
import { useActionContext, useDesignable } from '../schema-component';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { TemplateBlockProvider } from './TemplateBlockProvider';
import { FormActiveFieldsProvider } from './hooks/useFormActiveFields';

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
  const cm = useCollectionManager();
  const ctx = useFormBlockContext();
  const { action, readPretty, params, collection, association } = props;
  const field = useField();
  const form = useMemo(
    () =>
      createForm({
        validateFirst: true,
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
      collectionName: collection || cm.getCollectionField(association)?.target,
      formRecord: record,
    };
  }, [
    action,
    association,
    cm,
    collection,
    ctx,
    field,
    form,
    params,
    record,
    resource,
    service,
    updateAssociationValues,
  ]);

  return (
    <FormBlockContext.Provider value={formBlockValue}>
      <RecordProvider isNew={record?.isNew} parent={record?.parentRecord?.data} record={record?.data}>
        <div ref={formBlockRef}>{props.children}</div>
      </RecordProvider>
    </FormBlockContext.Provider>
  );
};

/**
 * @internal
 * 获取表单区块的类型：update 表示是表单编辑区块，create 表示是表单新增区块
 * @returns
 */
export const useFormBlockType = () => {
  const ctx = useFormBlockContext() || {};
  const res = useMemo(() => {
    return { type: ctx.type } as { type: 'update' | 'create' };
  }, [ctx.type]);

  return res;
};

export const useIsDetailBlock = () => {
  const ctx = useFormBlockContext();
  const { fieldSchema } = useActionContext();
  return ctx.type !== 'create' && fieldSchema?.['x-acl-action'] !== 'create' && fieldSchema?.['x-action'] !== 'create';
};

export const FormBlockProvider = withDynamicSchemaProps((props) => {
  const parentRecordData = useCollectionParentRecordData();
  const { parentRecord, action } = props;
  const record = useCollectionRecordData();
  const { association } = props;
  const cm = useCollectionManager();
  const { __collection } = record || {};
  const { designable } = useDesignable();
  const collection = props.collection || cm.getCollection(association).name;

  const refresh = useUpdate();

  if (!designable && __collection && action) {
    if (__collection !== collection) {
      return null;
    }
  }
  return (
    <TemplateBlockProvider onTemplateLoaded={refresh}>
      <BlockProvider
        name={props.name || 'form'}
        {...props}
        block={'form'}
        parentRecord={parentRecord || parentRecordData}
      >
        <FormActiveFieldsProvider name="form">
          <InternalFormBlockProvider {...props} />
        </FormActiveFieldsProvider>
      </BlockProvider>
    </TemplateBlockProvider>
  );
});

/**
 * @internal
 * @returns
 */
export const useFormBlockContext = () => {
  return useContext(FormBlockContext);
};

/**
 * @internal
 */
export const useFormBlockProps = () => {
  const ctx = useFormBlockContext();
  const treeParentRecord = useTreeParentRecord();

  useEffect(() => {
    if (treeParentRecord) {
      ctx.form?.query('parent').take((field) => {
        field.disabled = true;
        field.value = treeParentRecord;
      });
    }
  });

  useEffect(() => {
    const form: Form = ctx.form;

    if (!form || ctx.service?.loading) {
      return;
    }

    form.setInitialValues(ctx.service?.data?.data);
  }, [ctx.form, ctx.service?.data?.data, ctx.service?.loading]);
  return {
    form: ctx.form,
  };
};

/**
 * @internal
 */
export const findFormBlock = (schema: Schema) => {
  while (schema) {
    if (schema['x-decorator'] === 'FormBlockProvider') {
      return schema;
    }
    if (schema['x-component'] === 'AssociationField.Selector') {
      return null;
    }
    schema = schema.parent;
  }
  return null;
};
