import { createForm } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import isEmpty from 'lodash/isEmpty';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useCollection, useCollectionManager } from '../collection-manager';
import { RecordProvider, useRecord } from '../record-provider';
import { useActionContext, useDesignable } from '../schema-component';
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

export const useIsEmptyRecord = () => {
  const record = useRecord();
  const keys = Object.keys(record);
  if (keys.includes('__parent')) {
    return keys.length > 1;
  }
  return keys.length > 0;
};

export const FormBlockProvider = (props) => {
  const record = useRecord();
  const { collection, resource, association } = props;
  const { __collection, __parent } = record;
  const currentCollection = useCollection();
  const { getInheritCollections, getCollectionJoinField, getCollection } = useCollectionManager();

  const { designable } = useDesignable();
  const isEmptyRecord = useIsEmptyRecord();
  let detailFlag = false;
  if (isEmptyRecord) {
    detailFlag = true;
    if (!designable && __collection) {
      detailFlag = __collection === collection;
    }
  }
  const createFlag =
    (currentCollection.name === (collection?.name || collection) && !isEmptyRecord) || !currentCollection.name;
  let relationFlag = false;
  if (Object.keys(record).length > 0 && resource.includes('.')) {
    relationFlag = true;
    if (!designable) {
      const viewOwnRelation = [__collection, __parent?.__collection].includes(resource?.split('.')?.[0]);
      if (viewOwnRelation) {
        relationFlag = true;
      } else {
        const childCollection = getCollection(__collection || __parent?.__collection);
        const collectionField = getCollectionJoinField(association);
        const flag = childCollection.fields.find((v) => v.name === collectionField.name);
        const inheritCollections = getInheritCollections(__parent?.__collection || __collection);
        relationFlag = !flag && inheritCollections.includes(resource?.split('.')?.[0]);
      }
    }
  }
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
  const record = useRecord();
  const { fieldSchema } = useActionContext();
  const addChild = fieldSchema?.['x-component-props']?.addChild;
  useEffect(() => {
    if (addChild) {
      ctx.form?.query('parent').take((field) => {
        field.disabled = true;
        field.value = new Proxy({ ...record }, {});
      });
    }
  });

  useEffect(() => {
    ctx.form?.setInitialValues(ctx.service?.data?.data);
  }, []);
  return {
    form: ctx.form,
  };
};
