import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import { Spin } from 'antd';
import _ from 'lodash';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useCollectionParentRecord } from '../data-source/collection-record/CollectionRecordProvider';
import { RecordProvider } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useParsedFilter } from './hooks';

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
  const detailsBLockValue = useMemo(() => {
    return {
      action,
      form,
      field,
      service,
      resource,
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
      <RecordProvider isNew={false} record={currentRecord} parent={parentRecord?.data}>
        {props.children}
      </RecordProvider>
    </DetailsBlockContext.Provider>
  );
};

export const DetailsBlockProvider = (props) => {
  return (
    <BlockProvider name="details" {...props}>
      <InternalDetailsBlockProvider {...props} />
    </BlockProvider>
  );
};

/**
 * @deprecated
 */
export const useDetailsBlockContext = () => {
  return useContext(DetailsBlockContext);
};

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
