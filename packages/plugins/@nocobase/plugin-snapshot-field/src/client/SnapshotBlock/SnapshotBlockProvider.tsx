import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import {
  BlockAssociationContext,
  BlockRequestContext_deprecated,
  BlockResourceContext,
  CollectionManagerProvider,
  FormBlockContext,
  MaybeCollectionProvider,
  RecordProvider,
  useBlockRequestContext,
  useBlockResource,
  useCollectionManager_deprecated,
  useDesignable,
  useRecord,
  useResource,
} from '@nocobase/client';
import { Spin } from 'antd';
import React, { useMemo, useRef } from 'react';

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

const BlockRequestProvider_deprecated = (props) => {
  const field = useField();
  const resource = useBlockResource();
  const service = {
    loading: false,
    data: {
      data: useRecord(),
    },
  };
  const __parent = useBlockRequestContext();
  return (
    <BlockRequestContext_deprecated.Provider value={{ block: props.block, props, field, service, resource, __parent }}>
      {props.children}
    </BlockRequestContext_deprecated.Provider>
  );
};

const BlockProvider = (props) => {
  const { collection, association, dataSource } = props;
  const resource = useResource(props);

  return (
    <CollectionManagerProvider dataSource={dataSource}>
      <MaybeCollectionProvider collection={collection}>
        <BlockAssociationContext.Provider value={association}>
          <BlockResourceContext.Provider value={resource}>
            <BlockRequestProvider_deprecated {...props}>{props.children}</BlockRequestProvider_deprecated>
          </BlockResourceContext.Provider>
        </BlockAssociationContext.Provider>
      </MaybeCollectionProvider>
    </CollectionManagerProvider>
  );
};

export const SnapshotBlockProvider = (props) => {
  const record = useRecord();
  const { __tableName } = record;
  const { getInheritCollections } = useCollectionManager_deprecated(props.dataSource);
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
