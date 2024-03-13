import React, { createContext, useContext } from 'react';
import { useCollection_deprecated } from '../collection-manager';
import { CollectionRecord, CollectionRecordProvider } from '../data-source';
import { useCurrentUserContext } from '../user';

export const RecordContext_deprecated = createContext({});
RecordContext_deprecated.displayName = 'RecordContext_deprecated';
export const RecordIndexContext = createContext(null);
RecordIndexContext.displayName = 'RecordIndexContext';

/**
 * @deprecated use `CollectionRecordProvider` instead
 */
export const RecordProvider: React.FC<{
  record: any;
  parent?: CollectionRecord | object;
  isNew?: boolean;
  collectionName?: string;
}> = (props) => {
  const { record, children, parent, isNew } = props;
  const { name: __collectionName } = useCollection_deprecated();
  const value = { ...record };
  value['__parent'] = parent instanceof CollectionRecord ? parent.data : parent;
  value['__collectionName'] = __collectionName;
  return (
    <RecordContext_deprecated.Provider value={value}>
      <CollectionRecordProvider isNew={isNew} record={record} parentRecord={parent}>
        {children}
      </CollectionRecordProvider>
    </RecordContext_deprecated.Provider>
  );
};

export const RecordSimpleProvider: React.FC<{ value: Record<string, any>; children: React.ReactNode }> = (props) => {
  return <RecordContext_deprecated.Provider {...props} />;
};

export const RecordIndexProvider: React.FC<{ index: any }> = (props) => {
  const { index, children } = props;
  return <RecordIndexContext.Provider value={index}>{children}</RecordIndexContext.Provider>;
};

/**
 * @deprecated use `useCollectionRecord` instead
 */
export function useRecord<D = any>() {
  return useContext(RecordContext_deprecated) as D;
}

export function useRecordIndex() {
  return useContext(RecordIndexContext);
}

export const useRecordIsOwn = () => {
  const record = useRecord();
  const ctx = useCurrentUserContext();
  if (!record?.createdById) {
    return false;
  }
  return record?.createdById === ctx?.data?.data?.id;
};
