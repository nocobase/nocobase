/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useUpdate } from 'ahooks';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useCollection, useCollectionRecordData } from '../data-source';
import { useCollectionParentRecord } from '../data-source/collection-record/CollectionRecordProvider';
import { withDynamicSchemaProps } from '../hoc/withDynamicSchemaProps';
import { useDetailsWithPaginationBlockParams } from '../modules/blocks/data-blocks/details-multi/hooks/useDetailsWithPaginationBlockParams';
import { RecordProvider } from '../record-provider';
import { useDesignable } from '../schema-component';
import { CurrentRecordContextProvider } from '../schema-settings/VariableInput/hooks/useRecordVariable';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { TemplateBlockProvider } from './TemplateBlockProvider';

/**
 * @internal
 */
export const DetailsBlockContext = createContext<any>({});
DetailsBlockContext.displayName = 'DetailsBlockContext';

const InternalDetailsBlockProvider = (props) => {
  const { action, readPretty } = props;
  const field = useField<any>();
  const form = useMemo(
    () =>
      createForm({
        readPretty,
      }),
    [readPretty],
  );
  const collection = useCollection();
  const { resource, service } = useBlockRequestContext();
  const parentRecord = useCollectionParentRecord();
  const currentRecord = (action === 'list' ? service?.data?.data?.[0] : service?.data?.data) || {};
  const formBlockRef = useRef();
  const detailsBLockValue = useMemo(() => {
    return {
      action,
      form,
      field,
      service,
      resource,
      formBlockRef,
    };
  }, [action, field, form, resource, service]);

  field.loaded = true;

  return (
    <CurrentRecordContextProvider recordData={currentRecord} collectionName={collection?.name}>
      <DetailsBlockContext.Provider value={detailsBLockValue}>
        <div ref={formBlockRef}>
          <RecordProvider isNew={false} record={currentRecord} parent={parentRecord?.data}>
            {props.children}
          </RecordProvider>
        </div>
      </DetailsBlockContext.Provider>
    </CurrentRecordContextProvider>
  );
};

/**
 * @internal
 * 用于兼容旧版本的 schema，当不需要兼容时可直接移除该方法
 * @param props
 * @returns
 */
const useCompatDetailsBlockParams = (props) => {
  const fieldSchema = useFieldSchema();

  let params,
    parseVariableLoading = false;
  // 1. 新版本的 schema 存在 x-use-decorator-props 属性
  if (fieldSchema['x-use-decorator-props']) {
    params = props?.params;
    parseVariableLoading = props?.parseVariableLoading;
  } else {
    // 2. 旧版本的 schema 不存在 x-use-decorator-props 属性
    // 因为 schema 中是否存在 x-use-decorator-props 是固定不变的，所以这里可以使用 hooks
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const parsedParams = useDetailsWithPaginationBlockParams(props);
    params = parsedParams.params;
    parseVariableLoading = parsedParams.parseVariableLoading;
  }

  return { params, parseVariableLoading };
};

export const DetailsBlockProvider = withDynamicSchemaProps((props) => {
  const { params, parseVariableLoading } = useCompatDetailsBlockParams(props);
  const record = useCollectionRecordData();
  const { association, action } = props;
  const { __collection } = record || {};
  const { designable } = useDesignable();
  const collectionName = props.collection;
  let detailFlag = true;
  if (!designable && __collection && action === 'get' && !association) {
    detailFlag = __collection === collectionName;
  }

  const refresh = useUpdate();

  if (!detailFlag || parseVariableLoading) {
    return null;
  }

  return (
    <TemplateBlockProvider onTemplateLoaded={refresh}>
      <BlockProvider name="details" {...props} params={params}>
        <InternalDetailsBlockProvider {...props} />
      </BlockProvider>
    </TemplateBlockProvider>
  );
});

/**
 * @internal
 */
export const useDetailsBlockContext = () => {
  return useContext(DetailsBlockContext);
};

/**
 * @deprecated
 * use `useDetailsWithPaginationProps` or `useDetailsProps` instead
 * @returns
 */
export const useDetailsBlockProps = () => {
  const ctx = useDetailsBlockContext();
  useEffect(() => {
    if (!ctx.service.loading) {
      const data = ctx.action === 'list' ? ctx.service?.data?.data?.[0] : ctx.service?.data?.data;
      ctx.form
        .reset()
        .then(() => {
          ctx.form.setInitialValues(data || {});
          ctx.form.setValues(data || {});

          // Using `ctx.form.setValues(data || {});` here may cause an internal infinite loop in Formily
        })
        .catch(console.error);
    }
  }, [ctx.action, ctx.form, ctx.service?.data?.data, ctx.service.loading]);
  return {
    form: ctx.form,
  };
};
