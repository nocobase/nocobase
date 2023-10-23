import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import { Spin } from 'antd';
import _ from 'lodash';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { RecordProvider, useRecord } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useParsedFilter } from './hooks';

export const DetailsBlockContext = createContext<any>({});

const InternalDetailsBlockProvider = (props) => {
  const { action, readPretty } = props;
  const field = useField<any>();
  const form = useMemo(
    () =>
      createForm({
        readPretty,
      }),
    [],
  );
  const { resource, service } = useBlockRequestContext();
  const record = useRecord();
  const currentRecord = service?.data?.data?.[0] || {};
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
    currentRecord: { ...currentRecord, __parent: record, __collectionName: props.collection },
  });
  useEffect(() => {
    if (!_.isEmpty(filter)) {
      service?.run({ ...service?.params?.[0], filter });
    }
  }, [JSON.stringify(filter)]);

  if (service.loading && !field.loaded) {
    return <Spin />;
  }
  field.loaded = true;

  return (
    <DetailsBlockContext.Provider value={detailsBLockValue}>
      <RecordProvider record={currentRecord}>{props.children}</RecordProvider>
    </DetailsBlockContext.Provider>
  );
};

export const DetailsBlockProvider = (props) => {
  return (
    <BlockProvider data-testid="details-block" {...props}>
      <InternalDetailsBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useDetailsBlockContext = () => {
  return useContext(DetailsBlockContext);
};

export const useDetailsBlockProps = () => {
  const ctx = useDetailsBlockContext();
  useEffect(() => {
    if (!ctx.service.loading) {
      ctx.form
        .reset()
        .then(() => {
          ctx.form.setValues(ctx.service?.data?.data?.[0] || {});
        })
        .catch(console.error);
    }
  }, [ctx.service.loading]);
  return {
    form: ctx.form,
  };
};
