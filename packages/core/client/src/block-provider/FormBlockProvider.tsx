import { createForm } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { RecordProvider, useRecord } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { useDesignable } from '../schema-component';
import { useCollectionManager } from '../collection-manager';

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
        <RecordProvider record={service?.data?.data}>
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
