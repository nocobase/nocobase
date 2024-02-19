import React, { createContext, useContext } from 'react';
import { useCollection_deprecated } from '../collection-manager';
import { useCurrentUserContext } from '../user';

export const RecordContext_deprecated = createContext({});
export const RecordIndexContext = createContext(null);

export const RecordProvider_deprecated: React.FC<{ record: any; parent?: any; collectionName?: string }> = (props) => {
  const { record, children, collectionName, parent = false } = props;
  const { name: __collectionName } = useCollection_deprecated();
  const __parent = useContext(RecordContext_deprecated);
  const value = { ...record };
  value['__parent'] = parent ? parent : __parent;
  value['__collectionName'] = collectionName || __collectionName;
  return <RecordContext_deprecated.Provider value={value}>{children}</RecordContext_deprecated.Provider>;
};

export const RecordSimpleProvider: React.FC<{ value: Record<string, any>; children: React.ReactNode }> = (props) => {
  return <RecordContext_deprecated.Provider {...props} />;
};

export const RecordIndexProvider: React.FC<{ index: any }> = (props) => {
  const { index, children } = props;
  return <RecordIndexContext.Provider value={index}>{children}</RecordIndexContext.Provider>;
};

export function useRecord_deprecated<D = any>() {
  return useContext(RecordContext_deprecated) as D;
}

export function useRecordIndex() {
  return useContext(RecordIndexContext);
}

export const useRecordIsOwn = () => {
  const record = useRecord_deprecated();
  const ctx = useCurrentUserContext();
  if (!record?.createdById) {
    return false;
  }
  return record?.createdById === ctx?.data?.data?.id;
};
