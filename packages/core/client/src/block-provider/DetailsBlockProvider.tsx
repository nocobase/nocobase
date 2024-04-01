import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import { Spin } from 'antd';
import _ from 'lodash';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useCollectionParentRecord } from '../data-source/collection-record/CollectionRecordProvider';
import { RecordProvider } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useParsedFilter } from './hooks';
import { withDynamicSchemaProps } from '../application/hoc/withDynamicSchemaProps';
import { TemplateBlockProvider } from './TemplateBlockProvider';

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

  const { filter } = useParsedFilter({
    filterOption: service?.params?.[0]?.filter,
  });
  useEffect(() => {
    if (!_.isEmpty(filter) && !service.loading) {
      service?.run({ ...service?.params?.[0], filter });
    }
  }, [JSON.stringify(filter)]);

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

export const DetailsBlockProvider = withDynamicSchemaProps((props) => {
  return (
    <TemplateBlockProvider>
      <BlockProvider name="details" {...props}>
        <InternalDetailsBlockProvider {...props} />
      </BlockProvider>
    </TemplateBlockProvider>
  );
});

/**
 * @deprecated
 */
export const useDetailsBlockContext = () => {
  return useContext(DetailsBlockContext);
};

/**
 * @deprecated
 * 即将废弃，请用 useDetailsWithPaginationProps 或者 useDetailsProps
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
