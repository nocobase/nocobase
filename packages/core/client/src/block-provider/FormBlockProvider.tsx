import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import { Spin } from 'antd';
import isEmpty from 'lodash/isEmpty';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useCollection } from '../collection-manager';
import { RecordProvider, useRecord } from '../record-provider';
import { useDesignable } from '../schema-component';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useActionContext } from '../schema-component';

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
  const { collection } = props;
  const { __collection } = record;
  const currentCollection = useCollection();
  const { designable } = useDesignable();
  let detailFlag = false;
  if (Object.keys(record).length > 0) {
    detailFlag = true;
    if (!designable && __collection) {
      detailFlag = __collection === collection;
    }
  }
  const createFlag = (currentCollection.name === collection && !Object.keys(record).length) || !currentCollection.name;
  return (
    (detailFlag || createFlag) && (
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
  const record = useRecord();
  const { fieldSchema } = useActionContext();
  const { addChild } = fieldSchema?.['x-component-props']||{};
  useEffect(() => {
    if (addChild) {
      ctx.form.query('parent').take((field) => {
        field.disabled = true;
        field.value = new Proxy({ ...record }, {});
      });
    }
  });

  useEffect(() => {
    ctx.form.setInitialValues(ctx.service?.data?.data);
  }, []);
  return {
    form: ctx.form,
  };
};
