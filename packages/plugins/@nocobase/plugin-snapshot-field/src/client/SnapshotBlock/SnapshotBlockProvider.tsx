import { createForm } from '@formily/core';
import { useField } from '@formily/react';
import {
  BlockAssociationContext,
  BlockRequestContext,
  BlockResourceContext,
  CollectionDataSourceProvider,
  FormBlockContext,
  MaybeCollectionProvider,
  RecordProvider,
  useBlockRequestContext,
  useBlockResource,
  useCollectionManager,
  useDataBlockRequestV2,
  useDataBlockResourceV2,
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
  const service = useDataBlockRequestV2();
  const resource = useDataBlockResourceV2();
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

const BlockRequestProvider = (props) => {
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
    <BlockRequestContext.Provider value={{ block: props.block, props, field, service, resource, __parent }}>
      {props.children}
    </BlockRequestContext.Provider>
  );
};

const BlockProvider = (props) => {
  const { collection, association, dataSource } = props;
  const resource = useResource(props);

  return (
    <CollectionDataSourceProvider dataSource={dataSource}>
      <MaybeCollectionProvider collection={collection}>
        <BlockAssociationContext.Provider value={association}>
          <BlockResourceContext.Provider value={resource}>
            <BlockRequestProvider {...props}>{props.children}</BlockRequestProvider>
          </BlockResourceContext.Provider>
        </BlockAssociationContext.Provider>
      </MaybeCollectionProvider>
    </CollectionDataSourceProvider>
  );
};

export const SnapshotBlockProvider = (props) => {
  const record = useRecord();
  const { __tableName } = record;
  const { getInheritCollections } = useCollectionManager(props.dataSource);
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
