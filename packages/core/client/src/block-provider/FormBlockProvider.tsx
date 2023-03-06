import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import { Spin } from 'antd';
import isEmpty from 'lodash/isEmpty';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useCollection } from '../collection-manager';
import { RecordProvider, useRecord } from '../record-provider';
import { useDesignable } from '../schema-component';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';

export const FormBlockContext = createContext<any>({});

const InternalFormBlockProvider = (props) => {
  const { action, readPretty } = props;
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
  if (service.loading) {
    return <Spin />;
  }
  return (
    <FormBlockContext.Provider
      value={{
        action,
        form,
        field,
        service,
        resource,
        updateAssociationValues: [],
        formBlockRef,
      }}
    >
      {readPretty ? (
        <RecordProvider parent={isEmpty(record?.__parent) ? record : record?.__parent} record={service?.data?.data}>
          <div ref={formBlockRef}>{props.children}</div>
        </RecordProvider>
      ) : (
        <div ref={formBlockRef}>{props.children}</div>
      )}
    </FormBlockContext.Provider>
  );
};

export const FormBlockProvider = (props) => {
  const record = useRecord();
  const { collection, resource } = props;
  const { __collection, __parent } = record;
  const currentCollection = useCollection();
  const { designable } = useDesignable();
  let detailFlag = false;
  if (Object.keys(record).length > 0 && Object.keys(__parent).length === 0) {
    detailFlag = true;
    if (!designable && __collection) {
      detailFlag = __collection === collection;
    }
  }
  const createFlag = (currentCollection.name === collection && !Object.keys(record).length) || !currentCollection.name;
  const relationFlag =
    (Object.keys(record).length > 0 && designable) ||
    [__collection, __parent?.__collection].includes(resource?.split('.')?.[0]);
  return (
    (detailFlag || createFlag || relationFlag) && (
      <BlockProvider {...props} block={'form'}>
        <InternalFormBlockProvider {...props} />
      </BlockProvider>
    )
  );
};

export const useFormBlockContext = () => {
  return useContext(FormBlockContext);
};

export const useFormBlockProps = () => {
  const ctx = useFormBlockContext();
  useEffect(() => {
    ctx.form.setInitialValues(ctx.service?.data?.data);
  }, []);
  return {
    form: ctx.form,
  };
};
