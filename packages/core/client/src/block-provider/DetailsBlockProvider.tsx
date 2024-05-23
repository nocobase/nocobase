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
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useCollectionManager_deprecated } from '../collection-manager';
import { useCollectionRecordData } from '../data-source';
import { useCollectionParentRecord } from '../data-source/collection-record/CollectionRecordProvider';
import { withDynamicSchemaProps } from '../hoc/withDynamicSchemaProps';
import { useDetailsWithPaginationBlockParams } from '../modules/blocks/data-blocks/details-multi/hooks/useDetailsWithPaginationBlockParams';
import { RecordProvider } from '../record-provider';
import { useDesignable } from '../schema-component';
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

  if (service.loading && !field.loaded) {
    return <Spin />;
  }
  field.loaded = true;

  return (
    <DetailsBlockContext.Provider value={detailsBLockValue}>
      <div ref={formBlockRef}>
        <RecordProvider isNew={false} record={currentRecord} parent={parentRecord?.data}>
          {props.children}
        </RecordProvider>
      </div>
    </DetailsBlockContext.Provider>
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

  let params;
  // 1. 新版本的 schema 存在 x-use-decorator-props 属性
  if (fieldSchema['x-use-decorator-props']) {
    params = props?.params;
  } else {
    // 2. 旧版本的 schema 不存在 x-use-decorator-props 属性
    // 因为 schema 中是否存在 x-use-decorator-props 是固定不变的，所以这里可以使用 hooks
    // eslint-disable-next-line react-hooks/rules-of-hooks
    params = useDetailsWithPaginationBlockParams(props);
  }

  return params;
};

export const DetailsBlockProvider = withDynamicSchemaProps((props) => {
  const params = useCompatDetailsBlockParams(props);
  const record = useCollectionRecordData();
  const { association, dataSource } = props;
  const { getCollection } = useCollectionManager_deprecated(dataSource);
  const { __collection } = record || {};
  const { designable } = useDesignable();
  const collection = props.collection || getCollection(association, dataSource).name;
  let detailFlag = true;
  if (!designable && __collection) {
    detailFlag = __collection === collection;
  }

  if (!detailFlag) {
    return null;
  }

  return (
    <TemplateBlockProvider>
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
          ctx.form.setValues(data || {});
        })
        .catch(console.error);
    }
  }, [ctx.action, ctx.form, ctx.service?.data?.data, ctx.service.loading]);
  return {
    form: ctx.form,
  };
};
