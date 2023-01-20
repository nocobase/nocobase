import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import isEmpty from 'lodash/isEmpty';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useCollectionManager } from '../collection-manager';
import { RecordProvider, useRecord } from '../record-provider';
import { useDesignable } from '../schema-component';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { Spin } from '../spin';

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
  const { __tableName } = record;
  const { getInheritCollections } = useCollectionManager();
  const inheritCollections = getInheritCollections(__tableName);
  const { designable } = useDesignable();
  const flag =
    !designable && __tableName && !inheritCollections.includes(props.collection) && __tableName !== props.collection;
  return (
    !flag && (
      <BlockProvider {...props}>
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
